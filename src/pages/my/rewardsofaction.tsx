'use client';

import React, { useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useActionRewardsByAccountByActionIdByRounds } from '@/src/hooks/contracts/useLOVE20MintViewer';
import { useActionInfo } from '@/src/hooks/contracts/useLOVE20Submit';
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Join';
import { useMintActionReward } from '@/src/hooks/contracts/useLOVE20Mint';
import { useHandleContractError } from '@/src/lib/errorUtils';
import { useActionsExtensionInfo } from '@/src/hooks/composite/useActionsExtensionInfo';
import { useExtensionActionRewardsByRounds } from '@/src/hooks/composite/useExtensionActionRewardsByRounds';

// my components
import Header from '@/src/components/Header';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import { Button } from '@/components/ui/button';
import { ExtensionRewardsList } from '@/src/components/My/ExtensionRewardsList';

// utils
import { formatTokenAmount, formatRoundForDisplay } from '@/src/lib/format';
import { setActionRewardNeedMinted } from '@/src/lib/actionRewardNotice';

const REWARDS_PER_PAGE = BigInt(20);

const ActRewardsPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  // 修复：等待路由准备完成后再解析参数
  // 这解决了页面刷新时路由参数未准备好的问题
  const actionId = router.isReady && typeof id === 'string' && id.trim() !== '' ? BigInt(id) : undefined;

  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // 获取当前轮次
  const { currentRound, isPending: isLoadingCurrentRound, error: errorCurrentRound } = useCurrentRound();

  // 分页状态
  const [startRound, setStartRound] = useState<bigint>(BigInt(0));
  const [endRound, setEndRound] = useState<bigint>(BigInt(0));
  const [hasMoreRewards, setHasMoreRewards] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // 引入参考元素，用于无限滚动加载
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 获取行动详情
  const {
    actionInfo,
    isPending: isLoadingActionInfo,
    error: errorActionInfo,
  } = useActionInfo(token?.address as `0x${string}`, actionId);

  // 获取行动扩展信息
  const {
    extensionInfos,
    isPending: isLoadingExtension,
    error: errorExtension,
  } = useActionsExtensionInfo({
    tokenAddress: token?.address as `0x${string}`,
    actionIds: actionId !== undefined ? [actionId] : [],
  });

  const extensionInfo = useMemo(() => {
    return extensionInfos.length > 0 ? extensionInfos[0] : undefined;
  }, [extensionInfos]);

  const isExtensionAction = extensionInfo?.isExtension || false;

  // 获取普通行动激励数据 - 只在初始化完成后且非扩展行动时调用
  const {
    rewards: rawCoreRewards,
    isPending: isLoadingCoreRewards,
    error: errorLoadingCoreRewards,
  } = useActionRewardsByAccountByActionIdByRounds(
    isInitialized && token?.address && !isExtensionAction ? (token.address as `0x${string}`) : ('0x0' as `0x${string}`),
    isInitialized && account && !isExtensionAction ? (account as `0x${string}`) : ('0x0' as `0x${string}`),
    isInitialized && !isExtensionAction ? actionId || BigInt(0) : BigInt(0),
    isInitialized && !isExtensionAction ? startRound : BigInt(0),
    isInitialized && !isExtensionAction ? endRound : BigInt(0),
  );

  // 获取扩展行动激励数据 - 只在初始化完成后且是扩展行动时调用
  const {
    rewards: rawExtensionRewards,
    isPending: isLoadingExtensionRewards,
    error: errorLoadingExtensionRewards,
  } = useExtensionActionRewardsByRounds({
    extensionAddress: extensionInfo?.extensionAddress,
    factoryAddress: extensionInfo?.factoryAddress,
    startRound: isInitialized ? startRound : BigInt(0),
    endRound: isInitialized ? endRound : BigInt(0),
    enabled: isInitialized && isExtensionAction,
  });

  // 使用 useMemo 稳定 rewards 引用，避免无限重新渲染
  const coreRewards = useMemo(() => {
    return rawCoreRewards || [];
  }, [rawCoreRewards]);

  const extensionRewards = useMemo(() => {
    return rawExtensionRewards || [];
  }, [rawExtensionRewards]);

  // 合并加载状态和错误
  const isLoadingRewards = isExtensionAction ? isLoadingExtensionRewards : isLoadingCoreRewards;
  const errorLoadingRewards = isExtensionAction ? errorLoadingExtensionRewards : errorLoadingCoreRewards;

  // 铸造行动激励
  const { mintActionReward, isPending, isConfirming, isConfirmed, writeError } = useMintActionReward();
  const [mintingTarget, setMintingTarget] = useState<{ actionId: bigint; round: bigint } | null>(null);

  // 本地状态缓存激励数据，避免翻页时数据闪烁
  const [coreRewardList, setCoreRewardList] = useState<typeof coreRewards>([]);
  const [extensionRewardList, setExtensionRewardList] = useState<typeof extensionRewards>([]);

  // 初始化分页范围（只执行一次）
  useEffect(() => {
    if (actionInfo && token && currentRound !== undefined && !isInitialized) {
      const actionEndRound = currentRound > 2 ? currentRound - BigInt(2) : BigInt(0);
      const actionStartRound = actionEndRound > BigInt(20) ? actionEndRound - BigInt(20) : BigInt(0);
      setStartRound(actionStartRound);
      setEndRound(actionEndRound);
      setIsInitialized(true);
    }
  }, [actionInfo, token, currentRound, isInitialized]);

  // 根据当前起始轮次判断是否还有更多可以加载（按轮次边界判断）
  useEffect(() => {
    if (!token || !isInitialized) return;
    const minRound = BigInt(0);
    setHasMoreRewards(startRound > minRound);
  }, [startRound, token, isInitialized]);

  // 更新本地普通激励列表
  useEffect(() => {
    if (!isInitialized || isExtensionAction) return;

    if (coreRewards && coreRewards.length > 0) {
      const sortedRewards = [...coreRewards].sort((a, b) => (a.round < b.round ? 1 : a.round > b.round ? -1 : 0));
      setCoreRewardList(sortedRewards);
    } else {
      setCoreRewardList([]);
    }
  }, [coreRewards, isInitialized, isExtensionAction]);

  // 更新本地扩展激励列表
  useEffect(() => {
    if (!isInitialized || !isExtensionAction) return;

    if (extensionRewards && extensionRewards.length > 0) {
      const sortedRewards = [...extensionRewards].sort((a, b) => (a.round < b.round ? 1 : a.round > b.round ? -1 : 0));
      setExtensionRewardList(sortedRewards);
    } else {
      setExtensionRewardList([]);
    }
  }, [extensionRewards, isInitialized, isExtensionAction]);

  // 铸造成功处理（仅用于普通行动）
  useEffect(() => {
    if (isConfirmed && !isExtensionAction) {
      // 更新本地状态中对应的铸造状态
      if (mintingTarget) {
        setCoreRewardList((prev) =>
          prev.map((item) => (item.round === mintingTarget.round ? { ...item, isMinted: true } : item)),
        );
      }
      toast.success('铸造成功');
      if (typeof window !== 'undefined' && token?.address && account) {
        setActionRewardNeedMinted(account, token.address, false);
      }
    }
  }, [isConfirmed, token, account, mintingTarget, isExtensionAction]);

  // 处理普通行动铸造
  const handleClaim = async (round: bigint, actionId: bigint) => {
    if (token?.address && account) {
      setMintingTarget({ actionId, round });
      await mintActionReward(token.address, round, actionId);
    }
  };

  // 处理扩展行动铸造成功（由子组件回调）
  const handleExtensionMintSuccess = useCallback(
    (round: bigint) => {
      setExtensionRewardList((prev) => prev.map((item) => (item.round === round ? { ...item, isMinted: true } : item)));
      if (typeof window !== 'undefined' && token?.address && account) {
        setActionRewardNeedMinted(account, token.address, false);
      }
    },
    [token, account],
  );

  // 无限滚动加载更多激励：当滚动到底部时更新 startRound
  const loadMoreRewards = useCallback(() => {
    if (!token) return;
    const minRound = BigInt(0);

    setStartRound((prev) => {
      if (prev > minRound) {
        const newStart = prev - REWARDS_PER_PAGE >= minRound ? prev - REWARDS_PER_PAGE : minRound;
        return newStart;
      }
      return prev;
    });
  }, [token]);

  // 使用 IntersectionObserver 监控底部 sentinel 元素
  useEffect(() => {
    if (!loadMoreRef.current || !isInitialized) return;
    const target = loadMoreRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!isLoadingRewards && hasMoreRewards) {
              loadMoreRewards();
            }
          }
        });
      },
      { root: null, rootMargin: '200px', threshold: 0 },
    );
    observer.observe(target);
    return () => {
      observer.unobserve(target);
      observer.disconnect();
    };
  }, [loadMoreRewards, isLoadingRewards, hasMoreRewards, isInitialized]);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorActionInfo) handleContractError(errorActionInfo, 'actionInfo');
    if (errorCurrentRound) handleContractError(errorCurrentRound, 'currentRound');
    if (errorExtension) handleContractError(errorExtension, 'extensionCenter');
    if (errorLoadingRewards) handleContractError(errorLoadingRewards, 'dataViewer');
    if (writeError) handleContractError(writeError, 'mint');
  }, [errorActionInfo, errorCurrentRound, errorExtension, errorLoadingRewards, writeError, handleContractError]);

  // 如果路由未准备好，显示加载状态
  if (!router.isReady) {
    return (
      <>
        <Header title="行动激励" showBackButton={true} />
        <main className="flex-grow">
          <LoadingIcon />
        </main>
      </>
    );
  }

  // 如果路由已准备好但没有有效的 actionId，显示错误
  if (actionId === undefined) {
    return (
      <>
        <Header title="行动激励" showBackButton={true} />
        <main className="flex-grow">
          <div className="flex flex-col space-y-6 p-4">
            <div className="text-center text-red-500 py-4">缺少行动ID参数</div>
          </div>
        </main>
      </>
    );
  }

  // 获取扩展行动的类型名称
  const getExtensionTypeName = (): string => {
    if (!extensionInfo?.isExtension || !extensionInfo.factoryAddress) return '';
    const EXTENSION_FACTORY_STAKELP = process.env
      .NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_FACTORY_STAKELP as `0x${string}`;
    if (extensionInfo.factoryAddress.toLowerCase() === EXTENSION_FACTORY_STAKELP?.toLowerCase()) {
      return '质押LP行动';
    }
    return '扩展行动';
  };

  return (
    <>
      <Header title="行动激励" showBackButton={true} />
      <main className="flex-grow">
        {!token || isLoadingActionInfo || isLoadingCurrentRound || isLoadingExtension ? (
          <LoadingIcon />
        ) : (
          <div className="flex flex-col space-y-6 p-4">
            <LeftTitle title="铸造行动激励：" />

            {/* 行动详情 */}
            {actionInfo && (
              <div className="">
                <div className="flex items-center mb-3">
                  <div className="flex items-baseline mr-2">
                    <span className="text-greyscale-500">No.</span>
                    <span className="text-secondary text-xl font-bold mr-2">{String(actionInfo.head.id)}</span>
                    <span className="font-bold text-greyscale-800">{actionInfo.body.title}</span>
                    {isExtensionAction && (
                      <span className="ml-2 text-xs bg-secondary/10 text-secondary px-2 py-1 rounded">
                        {getExtensionTypeName()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 激励列表 */}
            {isExtensionAction ? (
              // 扩展行动激励列表
              extensionInfo?.extensionAddress && extensionInfo?.factoryAddress ? (
                <ExtensionRewardsList
                  extensionAddress={extensionInfo.extensionAddress}
                  factoryAddress={extensionInfo.factoryAddress}
                  rewards={extensionRewardList}
                  tokenData={token}
                  onMintSuccess={handleExtensionMintSuccess}
                />
              ) : (
                <div className="text-center text-sm text-gray-500 py-4">无法加载扩展行动信息</div>
              )
            ) : (
              // 普通行动激励列表
              <table className="table w-full table-auto">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th>轮次</th>
                    <th className="text-center">可铸造激励</th>
                    <th className="text-center">结果</th>
                  </tr>
                </thead>
                <tbody>
                  {coreRewardList.length === 0 && !isLoadingRewards ? (
                    <tr>
                      <td colSpan={3} className="text-center text-sm text-gray-500 py-4">
                        该行动在指定轮次范围内没有获得激励
                      </td>
                    </tr>
                  ) : (
                    coreRewardList.map((item, index) => (
                      <tr
                        key={`${actionId}-${item.round.toString()}`}
                        className={index === coreRewardList.length - 1 ? 'border-none' : 'border-b border-gray-100'}
                      >
                        <td>{formatRoundForDisplay(item.round, token).toString()}</td>
                        <td className="text-center">{formatTokenAmount(item.reward || BigInt(0))}</td>
                        <td className="text-center">
                          {item.reward > BigInt(0) && !item.isMinted ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-secondary border-secondary"
                              onClick={() => handleClaim(item.round, BigInt(actionId))}
                              disabled={isPending || isConfirming}
                            >
                              铸造
                            </Button>
                          ) : item.isMinted ? (
                            <span className="text-greyscale-500">已铸造</span>
                          ) : (
                            <span className="text-greyscale-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* 加载更多指示器 */}
            <div ref={loadMoreRef} className="h-12 flex justify-center items-center">
              {isLoadingRewards ? (
                <LoadingIcon />
              ) : hasMoreRewards ? (
                <span className="text-sm text-gray-500">上滑加载更多...</span>
              ) : (
                <span className="text-sm text-gray-500">没有更多激励</span>
              )}
            </div>
          </div>
        )}
        <LoadingOverlay isLoading={isPending || isConfirming} text={isPending ? '提交交易...' : '确认交易...'} />
      </main>
    </>
  );
};

export default ActRewardsPage;

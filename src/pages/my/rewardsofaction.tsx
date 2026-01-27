'use client';

import React, { useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my hooks
import { useActionInfo } from '@/src/hooks/contracts/useLOVE20Submit';
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Join';
import { useHandleContractError } from '@/src/lib/errorUtils';
import { useActionRewardsByRounds } from '@/src/hooks/composite/useActionRewardsByRounds';

// my components
import Header from '@/src/components/Header';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import { ActionRewardsList } from '@/src/components/My/ActionRewardsList';

// 扩展类型配置
import { ExtensionType } from '@/src/config/extensionConfig';

// 扩展行动激励列表组件
import { GroupActionRewardsList } from '@/src/components/Extension/Plugins/Group/GroupActionRewardsList';
import { LpActionRewardsList } from '@/src/components/Extension/Plugins/Lp/LpActionRewardsList';
import { GroupServiceRewardsList } from '@/src/components/Extension/Plugins/GroupService/GroupServiceRewardsList';

const REWARDS_PER_PAGE = BigInt(20);

const ActRewardsPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const actionId = router.isReady && typeof id === 'string' && id.trim() !== '' ? BigInt(id) : undefined;

  const { token } = useContext(TokenContext) || {};

  // 获取当前轮次
  const { currentRound, isPending: isLoadingCurrentRound, error: errorCurrentRound } = useCurrentRound();

  // 分页状态
  const [startRound, setStartRound] = useState<bigint>(BigInt(0));
  const [endRound, setEndRound] = useState<bigint>(BigInt(0));
  const [hasMoreRewards, setHasMoreRewards] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // 引入参考元素，用于无限滚动加载
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 铸造状态管理
  const [isMinting, setIsMinting] = useState(false);
  const [mintingMessage, setMintingMessage] = useState('');

  // 获取行动详情
  const {
    actionInfo,
    isPending: isLoadingActionInfo,
    error: errorActionInfo,
  } = useActionInfo(token?.address as `0x${string}`, actionId);

  // 获取行动激励数据（自动判断普通/扩展行动）
  const {
    extensionInfo,
    rewards,
    isLoadingRewards,
    errorRewards,
    isExtensionAction,
    isLoadingExtensionInfo,
    errorExtensionInfo,
    refetch: refetchRewards,
  } = useActionRewardsByRounds({
    tokenAddress: token?.address as `0x${string}`,
    actionInfo,
    startRound,
    endRound,
    enabled: isInitialized,
  });

  // 本地状态缓存激励数据，避免翻页时数据闪烁
  const [rewardList, setRewardList] = useState<typeof rewards>([]);

  // 当 actionId 改变时，重置所有状态
  useEffect(() => {
    if (actionId !== undefined) {
      setIsInitialized(false);
      setStartRound(BigInt(0));
      setEndRound(BigInt(0));
      setHasMoreRewards(true);
      setRewardList([]);
    }
  }, [actionId]);

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

  // 更新本地激励列表（追加新数据、去重、排序）
  useEffect(() => {
    if (!isInitialized) return;

    if (rewards && rewards.length > 0) {
      const sortedRewards = [...rewards].sort((a, b) => (a.round < b.round ? 1 : a.round > b.round ? -1 : 0));

      // 追加新数据，避免重复
      setRewardList((prev) => {
        // 创建已存在的轮次集合
        const existingRounds = new Set(prev.map((item) => item.round.toString()));
        // 过滤出新的激励数据
        const newRewards = sortedRewards.filter((item) => !existingRounds.has(item.round.toString()));
        // 合并并重新排序
        const merged = [...prev, ...newRewards];
        return merged.sort((a, b) => (a.round < b.round ? 1 : a.round > b.round ? -1 : 0));
      });
    }
  }, [rewards, isInitialized]);

  // 铸造回调函数
  const handleMintStart = useCallback(() => {
    setIsMinting(true);
    setMintingMessage('提交交易...');
  }, []);

  const handleMintEnd = useCallback(() => {
    setIsMinting(false);
    setMintingMessage('');
  }, []);

  // 处理铸造成功（由子组件回调）
  const handleMintSuccess = useCallback(
    (round: bigint) => {
      // 更新本地状态
      setRewardList((prev) => prev.map((item) => (item.round === round ? { ...item, isMinted: true } : item)));
      // 刷新底层数据，确保缓存更新
      if (refetchRewards) {
        refetchRewards();
      }
    },
    [refetchRewards],
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
    if (errorExtensionInfo) handleContractError(errorExtensionInfo, 'extensionCenter');
    if (errorRewards) handleContractError(errorRewards, 'dataViewer');
  }, [errorActionInfo, errorCurrentRound, errorExtensionInfo, errorRewards, handleContractError]);

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

  return (
    <>
      <Header title="行动激励" showBackButton={true} />
      <main className="flex-grow">
        {!token || isLoadingActionInfo || isLoadingCurrentRound || isLoadingExtensionInfo ? (
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
                  </div>
                </div>
              </div>
            )}

            {/* 激励列表 - 根据行动类型渲染不同组件 */}
            {isExtensionAction ? (
              // 扩展行动激励列表 - 根据扩展类型渲染不同组件
              extensionInfo?.extension ? (
                extensionInfo?.factory?.type === ExtensionType.GROUP_ACTION ? (
                  // 链群行动：显示得分列
                  <GroupActionRewardsList
                    rewards={rewardList}
                    extensionAddress={extensionInfo.extension}
                    tokenData={token}
                    actionId={actionId}
                    onMintStart={handleMintStart}
                    onMintEnd={handleMintEnd}
                    onMintSuccess={handleMintSuccess}
                    isLoading={isLoadingRewards}
                  />
                ) : extensionInfo?.factory?.type === ExtensionType.LP ? (
                  // LP行动：显示溢出激励列
                  <LpActionRewardsList
                    rewards={rewardList}
                    extensionAddress={extensionInfo.extension}
                    tokenData={token}
                    actionId={actionId}
                    onMintStart={handleMintStart}
                    onMintEnd={handleMintEnd}
                    onMintSuccess={handleMintSuccess}
                    isLoading={isLoadingRewards}
                  />
                ) : extensionInfo?.factory?.type === ExtensionType.GROUP_SERVICE ? (
                  // 链群服务行动：激励可点击跳转到公示页
                  <GroupServiceRewardsList
                    rewards={rewardList}
                    extensionAddress={extensionInfo.extension}
                    tokenData={token}
                    actionId={actionId!}
                    tokenSymbol={token?.symbol || ''}
                    onMintStart={handleMintStart}
                    onMintEnd={handleMintEnd}
                    onMintSuccess={handleMintSuccess}
                    isLoading={isLoadingRewards}
                  />
                ) : (
                  // 未知扩展类型
                  <div className="text-center text-sm text-gray-500 py-4">
                    暂不支持此扩展类型的激励展示
                  </div>
                )
              ) : (
                <div className="text-center text-sm text-gray-500 py-4">无法加载扩展行动信息</div>
              )
            ) : (
              // 普通行动激励列表
              <ActionRewardsList
                rewards={rewardList}
                tokenAddress={token?.address as `0x${string}`}
                actionId={actionId}
                tokenData={token}
                onMintStart={handleMintStart}
                onMintEnd={handleMintEnd}
                onMintSuccess={handleMintSuccess}
                isLoading={isLoadingRewards}
              />
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
        <LoadingOverlay isLoading={isMinting} text={mintingMessage} />
      </main>
    </>
  );
};

export default ActRewardsPage;

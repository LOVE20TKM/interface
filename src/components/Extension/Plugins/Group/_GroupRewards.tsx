// components/Extension/Plugins/Group/_GroupRewards.tsx
// 链群历史激励记录

'use client';

// React
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';

// Next.js
import { useRouter } from 'next/router';
import Link from 'next/link';

// 第三方库
import { ChevronRight, ChevronDown } from 'lucide-react';

// 类型
import { ActionInfo } from '@/src/types/love20types';
import { AccountRewardRecord } from '@/src/hooks/extension/plugins/group/composite/useGroupAccountsRewardOfRound';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Verify';
import { useAccountsByGroupIdCount } from '@/src/hooks/extension/plugins/group/contracts/useGroupJoin';
import { useGroupAccountsRewardOfPage } from '@/src/hooks/extension/plugins/group/composite/useGroupAccountsRewardOfPage';
import { useGroupSummaryOfRound } from '@/src/hooks/extension/plugins/group/composite/useGroupSummaryOfRound';
import { useDistrustRateByGroupId } from '@/src/hooks/extension/plugins/group/contracts/useGroupVerify';
import { useVerifiedAccountCount } from '@/src/hooks/extension/plugins/group/contracts/useGroupVerify';

// 复合 hooks
import { useVerificationInfos } from '@/src/hooks/composite/useVerificationInfos';

// 工具函数
import { formatPercentage, formatTokenAmount, formatUnits } from '@/src/lib/format';
import { LinkIfUrl } from '@/src/lib/stringUtils';

// 组件
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import AlertBox from '@/src/components/Common/AlertBox';
import ChangeRound from '@/src/components/Common/ChangeRound';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

interface GroupRewardsProps {
  extensionAddress: `0x${string}`;
  groupId: bigint;
  actionId: bigint;
  actionInfo: ActionInfo;
}

const _GroupRewards: React.FC<GroupRewardsProps> = ({ extensionAddress, groupId, actionId, actionInfo }) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};

  // 获取当前轮次
  const { currentRound, isPending: isPendingRound, error: errorRound } = useCurrentRound();

  // 从URL获取round参数
  const { round: urlRound } = router.query;
  const [selectedRound, setSelectedRound] = useState<bigint>(currentRound - BigInt(1) || BigInt(1));

  // 初始化轮次状态
  useEffect(() => {
    if (urlRound && !isNaN(Number(urlRound))) {
      const urlRoundBigInt = BigInt(urlRound as string);
      if (currentRound && urlRoundBigInt < currentRound) {
        setSelectedRound(urlRoundBigInt);
      }
    } else if (currentRound && currentRound > BigInt(0)) {
      setSelectedRound(currentRound - BigInt(1));
    }
  }, [urlRound, currentRound]);

  // 分页常量
  const PAGE_SIZE = 20;

  // 获取指定轮次的已验证账户数量
  const {
    verifiedAccountCount,
    isPending: isPendingVerifiedAccountCount,
    error: errorVerifiedAccountCount,
  } = useVerifiedAccountCount(extensionAddress, selectedRound, groupId);

  // 获取账户总数（用于分页）
  const {
    count: totalCount,
    isPending: isPendingCount,
    error: errorCount,
  } = useAccountsByGroupIdCount(extensionAddress, selectedRound, groupId);

  // 分页状态
  const [allRecords, setAllRecords] = useState<AccountRewardRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFirstPageLoaded, setIsFirstPageLoaded] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // 计算当前页的索引范围
  const startIndex = BigInt(currentPage * PAGE_SIZE);
  const endIndex = totalCount
    ? startIndex + BigInt(PAGE_SIZE) > totalCount
      ? totalCount
      : startIndex + BigInt(PAGE_SIZE)
    : BigInt(0);

  // 分页获取当前页的账户奖励数据
  const {
    pageRecords,
    isPending: isPagePending,
    error: pageError,
  } = useGroupAccountsRewardOfPage({
    extensionAddress,
    round: selectedRound,
    groupId,
    startIndex,
    endIndex,
    enabled: !!totalCount && totalCount > BigInt(0) && startIndex < totalCount,
  });

  // 获取汇总数据（总激励、总得分、总参与代币数）
  const {
    totalReward,
    totalFinalScore,
    totalJoinedAmount,
    isPending: isPendingSummary,
    error: errorSummary,
  } = useGroupSummaryOfRound({
    extensionAddress,
    round: selectedRound,
    groupId,
  });

  // 获取指定轮次的链群不信任率（用于顶部警告）
  const {
    distrustRate,
    isPending: isPendingWarningRates,
    error: errorWarningRates,
  } = useDistrustRateByGroupId(extensionAddress, selectedRound, groupId);

  // 数据累积：将新页数据追加到 allRecords
  useEffect(() => {
    if (pageRecords && pageRecords.length > 0) {
      setAllRecords((prev) => {
        const existingAddresses = new Set(prev.map((r) => r.account.toLowerCase()));
        const newRecords = pageRecords.filter((r) => !existingAddresses.has(r.account.toLowerCase()));
        return [...prev, ...newRecords];
      });

      if (currentPage === 0) {
        setIsFirstPageLoaded(true);
      }

      // 检查是否还有更多数据
      if (totalCount && endIndex >= totalCount) {
        setHasMore(false);
      }
    }
  }, [pageRecords]);

  // 轮次切换时重置分页状态
  useEffect(() => {
    setAllRecords([]);
    setCurrentPage(0);
    setHasMore(true);
    setIsFirstPageLoaded(false);
  }, [selectedRound]);

  // 无限滚动：IntersectionObserver
  useEffect(() => {
    if (!isFirstPageLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isPagePending) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 },
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isPagePending, isFirstPageLoaded, currentPage]);

  // 从已加载记录中提取账户地址列表（用于批量获取验证信息）
  const accounts = useMemo(() => {
    return allRecords.map((record) => record.account);
  }, [allRecords]);

  // 批量获取验证信息
  const {
    verificationInfos,
    isPending: isPendingVerificationInfos,
    error: errorVerificationInfos,
  } = useVerificationInfos({
    tokenAddress: token?.address,
    actionId,
    accounts,
    verificationKeys: actionInfo?.body.verificationKeys || [],
    round: selectedRound,
    enabled: !!token?.address && !!actionInfo && accounts.length > 0,
  });

  // 展开/收起状态
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (address: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(address)) {
      newExpanded.delete(address);
    } else {
      newExpanded.add(address);
    }
    setExpandedRows(newExpanded);
  };

  // 是否有验证信息可展示
  const hasVerificationKeys = actionInfo?.body.verificationKeys && actionInfo.body.verificationKeys.length > 0;

  // 错误处理

  const handleChangedRound = (round: number) => {
    const newRound = BigInt(round);
    setSelectedRound(newRound);

    // 更新URL参数
    const currentQuery = { ...router.query };
    currentQuery.round = newRound.toString();

    router.push(
      {
        pathname: router.pathname,
        query: currentQuery,
      },
      undefined,
      { shallow: true },
    );
  };

  // 显示整页加载状态
  const isInitialLoading =
    isPendingRound ||
    !currentRound ||
    isPendingCount ||
    (currentPage === 0 && isPagePending && allRecords.length === 0);

  if (isInitialLoading) {
    return (
      <div className="bg-white rounded-lg p-8">
        <div className="flex flex-col items-center py-8">
          <LoadingIcon />
          <p className="mt-4 text-gray-600">加载激励记录...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <div>Token信息加载中...</div>;
  }

  // 计算展示数据（不排序，按链上顺序显示）
  const combinedData = allRecords.map((record, index) => {
    const totalRecordReward = record.mintReward;

    return {
      account: record.account,
      joinedAmount: record.joinedAmount,
      joinedRound: record.joinedRound,
      originScore: record.originScore,
      finalScore: record.finalScore,
      mintReward: record.mintReward,
      totalReward: totalRecordReward,
      trialProvider: record.trialProvider,
      globalIndex: index, // 链上索引，用于验证状态判断
    };
  });

  return (
    <div className="relative pb-4">
      {selectedRound === BigInt(0) && (
        <div className="flex items-center justify-center">
          <div className="text-center text-sm text-greyscale-500">暂无激励数据</div>
        </div>
      )}
      <div className="flex items-center">
        {selectedRound > 0 && (
          <>
            <LeftTitle title={`第 ${selectedRound.toString()} 轮`} />
            <span className="text-sm text-greyscale-500 ml-2">(</span>
            <ChangeRound
              currentRound={currentRound - BigInt(1) || BigInt(0)}
              maxRound={currentRound + BigInt(1)}
              handleChangedRound={handleChangedRound}
            />
            <span className="text-sm text-greyscale-500">)</span>
          </>
        )}
      </div>

      {/* 警告：所选轮次不信任率 */}
      {(() => {
        if (selectedRound <= BigInt(0)) return null;
        if (isPendingWarningRates) return null;

        const distrustRatePercent = distrustRate !== undefined ? parseFloat(formatUnits(distrustRate)) * 100 : 0;

        if (distrustRatePercent <= 0) return null;

        const actionIdForLink = typeof router.query.actionId === 'string' ? router.query.actionId : undefined;
        const symbolForLink = token?.symbol || (typeof router.query.symbol === 'string' ? router.query.symbol : '');
        const distrustHref = actionIdForLink
          ? `/action/info/?symbol=${encodeURIComponent(
              symbolForLink,
            )}&id=${actionIdForLink}&tab=public&tab2=distrust&round=${selectedRound.toString()}`
          : undefined;

        return (
          <div className="my-3">
            <AlertBox
              type="error"
              message={
                <div className="space-y-1 text-red-600">
                  <div>
                    {distrustHref ? (
                      <Link href={distrustHref} className="underline underline-offset-2 hover:text-red-700">
                        本链群第 {selectedRound.toString()} 轮，被投不信任票，不信任率
                        {formatPercentage(distrustRatePercent)}
                      </Link>
                    ) : (
                      <>
                        本链群第 {selectedRound.toString()} 轮，被投不信任票，不信任率
                        {formatPercentage(distrustRatePercent)}
                      </>
                    )}
                  </div>
                </div>
              }
            />
          </div>
        );
      })()}

      {/* 错误状态 */}
      {(pageError || errorCount) && (
        <div className="alert alert-error">
          <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>加载激励数据失败</span>
        </div>
      )}

      {/* 激励详情列表 */}
      {!pageError &&
        !errorCount &&
        selectedRound > 0 &&
        (totalCount !== undefined && totalCount === BigInt(0) ? (
          <div className="text-center text-sm text-greyscale-400 p-4">该轮次没有地址记录</div>
        ) : combinedData.length > 0 ? (
          <table className="table w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pl-0 pr-[2px] w-[1%] whitespace-nowrap text-center"> </th>
                <th className="pl-0 pr-1 text-left">成员 / 加入轮次</th>
                <th className="px-1 text-right">参与代币</th>
                <th className="px-1 text-right">得分</th>
                <th className="px-1 text-right">激励</th>
              </tr>
            </thead>
            <tbody>
              {combinedData.map((item, index) => {
                // 判断是否为体验用户
                const isTrialUser =
                  item.trialProvider &&
                  item.trialProvider !== '0x0000000000000000000000000000000000000000' &&
                  item.trialProvider !== '0x0';
                // 判断是否显示未生成
                const shouldShowNotGenerated = selectedRound >= currentRound;
                // 判断是否显示未验证（使用原始索引，不破坏验证逻辑）
                const shouldShowNotVerified =
                  selectedRound > currentRound ||
                  (selectedRound === currentRound &&
                    verifiedAccountCount !== undefined &&
                    item.globalIndex >= Number(verifiedAccountCount));

                const isExpanded = expandedRows.has(item.account);
                const verificationInfo = verificationInfos?.find(
                  (v) => v.account.toLowerCase() === item.account.toLowerCase(),
                );

                return (
                  <React.Fragment key={`${item.account}-${index}`}>
                    <tr className="border-b border-gray-100">
                      <td className="pl-0 pr-[4px] w-[1%] whitespace-nowrap text-center text-greyscale-400 tabular-nums">
                        {hasVerificationKeys && (
                          <button
                            onClick={() => toggleRow(item.account)}
                            className="text-greyscale-400 hover:text-greyscale-600"
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        )}
                        {index + 1}
                      </td>
                      <td className="pl-0 pr-1">
                        <div className="flex items-center gap-2">
                          <AddressWithCopyButton address={item.account} showCopyButton={true} />
                        </div>
                        <div className="text-xs text-greyscale-400 mt-0.5">
                          第{item.joinedRound.toString()}轮
                          {isTrialUser && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded">体验</span>
                          )}
                        </div>
                      </td>
                      <td className="px-1 text-right">
                        <div className="font-mono">{formatTokenAmount(item.joinedAmount)}</div>
                      </td>
                      <td className="px-1 text-right">
                        {shouldShowNotVerified ? (
                          <div className="text-greyscale-500">未验证</div>
                        ) : (
                          <div className="font-mono">{Number(item.originScore).toString()}</div>
                        )}
                      </td>
                      <td className="px-1 text-right">
                        {shouldShowNotGenerated ? (
                          <div className="text-greyscale-500">未生成</div>
                        ) : (
                          <div className="font-mono text-secondary">{formatTokenAmount(item.totalReward)}</div>
                        )}
                        {/* <div className="text-xs text-greyscale-500">{item.rewardPercentage.toFixed(2)}%</div> */}
                      </td>
                    </tr>

                    {/* 展开的验证信息行 */}
                    {hasVerificationKeys && verificationInfo && isExpanded && (
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <td></td>
                        <td colSpan={5} className="px-1 py-3">
                          <div className="text-sm text-greyscale-600">
                            <div className="text-xs text-greyscale-400 mb-2">验证信息:</div>
                            {actionInfo.body.verificationKeys.map((key, i) => (
                              <div key={i} className="mb-1">
                                <span className="text-greyscale-500">{key}:</span>{' '}
                                <LinkIfUrl text={verificationInfo.infos[i] || ''} />
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        ) : null)}

      {/* 无限滚动触发器 */}
      {hasMore && (
        <div ref={observerTarget} className="flex justify-center py-4">
          {isPagePending && <LoadingIcon />}
        </div>
      )}

      {/* 已加载全部数据后显示汇总 */}
      {!hasMore && allRecords.length > 0 && (
        <table className="table w-full">
          <tbody>
            <tr className="border-t-1 border-gray-300">
              <td className="pl-0 pr-[1px] w-[1%] whitespace-nowrap text-center text-greyscale-400">-</td>
              <td className="pl-0 pr-1 text-left">合计</td>
              <td className="px-1 text-right">
                <div className="font-mono">{formatTokenAmount(totalJoinedAmount)}</div>
              </td>
              <td className="px-1 text-right text-greyscale-400">-</td>
              <td className="px-1 text-right">
                {selectedRound >= currentRound ? (
                  <div className="text-greyscale-500">未生成</div>
                ) : (
                  <div className="font-mono">{formatTokenAmount(totalReward)}</div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
};

export default _GroupRewards;

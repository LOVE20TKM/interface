// components/Extension/Plugins/Group/_GroupRewards.tsx
// 链群历史激励记录

'use client';

// React
import React, { useContext, useEffect, useState } from 'react';

// Next.js
import { useRouter } from 'next/router';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Verify';
import { useGroupAccountsRewardOfRound } from '@/src/hooks/extension/plugins/group/composite/useGroupAccountsRewardOfRound';
import { useVerifiedAccountCount } from '@/src/hooks/extension/plugins/group/contracts/useGroupVerify';

// 工具函数
import { useContractError } from '@/src/errors/useContractError';
import { formatTokenAmount } from '@/src/lib/format';

// 组件
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import ChangeRound from '@/src/components/Common/ChangeRound';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

interface GroupRewardsProps {
  extensionAddress: `0x${string}`;
  groupId: bigint;
}

const _GroupRewards: React.FC<GroupRewardsProps> = ({ extensionAddress, groupId }) => {
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

  // 获取指定轮次的已验证账户数量
  const {
    verifiedAccountCount,
    isPending: isPendingVerifiedAccountCount,
    error: errorVerifiedAccountCount,
  } = useVerifiedAccountCount(extensionAddress, selectedRound, groupId);

  // 获取指定轮次的激励记录
  const {
    accountRewardRecords,
    isPending: isPendingRecords,
    error: errorRecords,
  } = useGroupAccountsRewardOfRound({
    extensionAddress: extensionAddress as `0x${string}`,
    round: selectedRound,
    groupId,
  });

  // 错误处理
  const { handleError } = useContractError();
  useEffect(() => {
    if (errorRound) handleError(errorRound);
    if (errorRecords) handleError(errorRecords);
    if (errorVerifiedAccountCount) handleError(errorVerifiedAccountCount);
  }, [errorRound, errorRecords, errorVerifiedAccountCount, handleError]);

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
    (isPendingRecords && accountRewardRecords === undefined) ||
    (isPendingVerifiedAccountCount && accountRewardRecords === undefined);

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

  // 计算总激励
  const totalReward = accountRewardRecords?.reduce((sum, item) => sum + item.reward, BigInt(0)) || BigInt(0);

  // 计算总 finalScore（用于计算百分比）
  const totalFinalScore =
    accountRewardRecords?.reduce((sum, scoreInfo) => sum + scoreInfo.finalScore, BigInt(0)) || BigInt(0);

  // 计算总参与代币数（用于汇总行）
  const totalJoinedAmount =
    accountRewardRecords?.reduce((sum, item) => sum + item.joinedAmount, BigInt(0)) || BigInt(0);

  // 计算展示数据
  const combinedData =
    accountRewardRecords
      ?.map((record, originalIndex) => {
        const rewardPercentage = totalReward > BigInt(0) ? (Number(record.reward) / Number(totalReward)) * 100 : 0;
        const finalScorePercentage =
          totalFinalScore > BigInt(0) ? (Number(record.finalScore) / Number(totalFinalScore)) * 100 : 0;

        return {
          account: record.account,
          joinedAmount: record.joinedAmount,
          joinedRound: record.joinedRound,
          originScore: record.originScore,
          finalScore: record.finalScore,
          finalScorePercentage,
          reward: record.reward,
          rewardPercentage,
          trialProvider: record.trialProvider,
          originalIndex, // 保存原始索引，用于验证状态判断
        };
      })
      .sort((a, b) => {
        // 按 finalScore 从大到小排序
        if (a.finalScore > b.finalScore) return -1;
        if (a.finalScore < b.finalScore) return 1;
        return 0;
      }) || [];

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

      {/* 加载状态 */}
      {isPendingRecords && (
        <div className="flex justify-center py-8">
          <LoadingIcon />
        </div>
      )}

      {/* 错误状态 */}
      {errorRecords && (
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
      {!isPendingRecords &&
        !errorRecords &&
        selectedRound > 0 &&
        (combinedData.length === 0 ? (
          <div className="text-center text-sm text-greyscale-400 p-4">该轮次没有地址记录</div>
        ) : (
          <table className="table w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-1 text-left">成员 / 加入轮次</th>
                <th className="px-1 text-right">得分 / 代币数×原始得分</th>
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
                    item.originalIndex >= Number(verifiedAccountCount));

                return (
                  <tr key={`${item.account}-${index}`} className="border-b border-gray-100">
                    <td className="px-1">
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
                      {shouldShowNotVerified ? (
                        <div className="text-greyscale-500">未验证</div>
                      ) : (
                        <>
                          <div className="font-mono text-secondary">{formatTokenAmount(item.finalScore)}</div>
                          {/* <div className="text-xs text-greyscale-500">{item.finalScorePercentage.toFixed(2)}%</div> */}
                          <div className="mt-0 text-xs text-greyscale-400">
                            <span className="font-mono">{formatTokenAmount(item.joinedAmount)}</span>
                            <span className="mx-1">×</span>
                            <span>{Number(item.originScore).toString()}</span>
                          </div>
                        </>
                      )}
                    </td>
                    <td className="px-1 text-right">
                      {shouldShowNotGenerated ? (
                        <div className="text-greyscale-500">未生成</div>
                      ) : (
                        <div className="font-mono text-secondary">{formatTokenAmount(item.reward)}</div>
                      )}
                      {/* <div className="text-xs text-greyscale-500">{item.rewardPercentage.toFixed(2)}%</div> */}
                    </td>
                  </tr>
                );
              })}
              {/* 汇总行 */}
              <tr className="border-t-1 border-gray-300">
                <td className="px-1 text-left">合计</td>
                <td className="px-1 text-right">
                  <div className="font-mono">{formatTokenAmount(totalFinalScore)}</div>
                  {/* <div className="text-xs text-greyscale-500">100.00%</div> */}
                  <div className="mt-0 text-xs text-greyscale-400">
                    <span className="font-mono">{formatTokenAmount(totalJoinedAmount)}</span>
                  </div>
                </td>
                <td className="px-1 text-right">
                  {selectedRound >= currentRound ? (
                    <div className="text-greyscale-500">未生成</div>
                  ) : (
                    <div className="font-mono">{formatTokenAmount(totalReward)}</div>
                  )}
                  {/* <div className="text-xs text-greyscale-500">100.00%</div> */}
                </td>
              </tr>
            </tbody>
          </table>
        ))}
    </div>
  );
};

export default _GroupRewards;

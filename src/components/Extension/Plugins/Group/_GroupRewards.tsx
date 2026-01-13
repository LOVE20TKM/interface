// components/Extension/Plugins/Group/_GroupRewards.tsx
// 链群历史激励记录

'use client';

// React
import React, { useContext, useEffect, useState } from 'react';

// Next.js
import { useRouter } from 'next/router';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Verify';
import {
  useGroupAccountsJoinedAmountOfRound,
  useGroupAccountsRewardOfRound,
  useGroupScoresOfRound,
} from '@/src/hooks/extension/plugins/group/composite';

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
      setSelectedRound(BigInt(urlRound as string));
    } else if (currentRound && currentRound > BigInt(0)) {
      setSelectedRound(currentRound - BigInt(1));
    }
  }, [urlRound, currentRound]);

  // 获取指定轮次的激励记录
  const {
    accountRewards,
    isPending: isPendingRewards,
    error: errorRewards,
  } = useGroupAccountsRewardOfRound({
    extensionAddress: extensionAddress as `0x${string}`,
    round: selectedRound,
    groupId,
  });

  // 获取打分记录
  const {
    accountScores,
    isPending: isPendingScores,
    error: errorScores,
  } = useGroupScoresOfRound({
    extensionAddress: extensionAddress as `0x${string}`,
    round: selectedRound,
    groupId,
  });

  // 获取参与代币数明细
  const {
    accountJoinedAmounts,
    isPending: isPendingAmounts,
    error: errorAmounts,
  } = useGroupAccountsJoinedAmountOfRound({
    extensionAddress: extensionAddress as `0x${string}`,
    round: selectedRound,
    groupId,
  });

  // 错误处理
  const { handleError } = useContractError();
  useEffect(() => {
    if (errorRound) handleError(errorRound);
    if (errorRewards) handleError(errorRewards);
    if (errorScores) handleError(errorScores);
    if (errorAmounts) handleError(errorAmounts);
  }, [errorRound, errorRewards, errorScores, errorAmounts, handleError]);

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

  // 只有在初次加载且还没有数据时才显示整页加载状态
  if (isPendingRound) {
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

  // 创建地图来快速查找数据
  const amountMap = new Map<string, bigint>();
  if (accountJoinedAmounts) {
    accountJoinedAmounts.forEach((item) => {
      amountMap.set(item.account.toLowerCase(), item.joinedAmount);
    });
  }

  const scoreInfoMap = new Map<string, { originScore: bigint; finalScore: bigint }>();
  if (accountScores) {
    accountScores.forEach((scoreInfo) => {
      scoreInfoMap.set(scoreInfo.account.toLowerCase(), {
        originScore: scoreInfo.originScore,
        finalScore: scoreInfo.finalScore,
      });
    });
  }

  // 计算总激励
  const totalReward = accountRewards?.reduce((sum, item) => sum + item.reward, BigInt(0)) || BigInt(0);

  // 计算总 finalScore（用于计算百分比）
  const totalFinalScore = accountScores?.reduce((sum, scoreInfo) => sum + scoreInfo.finalScore, BigInt(0)) || BigInt(0);

  // 计算总参与代币数（用于汇总行）
  const totalJoinedAmount =
    accountJoinedAmounts?.reduce((sum, item) => sum + item.joinedAmount, BigInt(0)) || BigInt(0);

  // 合并数据：为每个激励记录添加参与代币数和得分信息
  const combinedData =
    accountRewards?.map((accountReward) => {
      const accountLower = accountReward.account.toLowerCase();
      const joinedAmount = amountMap.get(accountLower) || BigInt(0);
      const scoreInfo = scoreInfoMap.get(accountLower) || { originScore: BigInt(0), finalScore: BigInt(0) };
      const rewardPercentage = totalReward > BigInt(0) ? (Number(accountReward.reward) / Number(totalReward)) * 100 : 0;
      const finalScorePercentage =
        totalFinalScore > BigInt(0) ? (Number(scoreInfo.finalScore) / Number(totalFinalScore)) * 100 : 0;

      return {
        account: accountReward.account,
        joinedAmount,
        originScore: scoreInfo.originScore,
        finalScore: scoreInfo.finalScore,
        finalScorePercentage,
        reward: accountReward.reward,
        rewardPercentage,
      };
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
            <LeftTitle title={`第 ${selectedRound.toString()} 轮激励结果`} />
            <span className="text-sm text-greyscale-500 ml-2">(</span>
            <ChangeRound currentRound={currentRound - BigInt(1) || BigInt(0)} handleChangedRound={handleChangedRound} />
            <span className="text-sm text-greyscale-500">)</span>
          </>
        )}
      </div>

      {/* 加载状态 */}
      {(isPendingRewards || isPendingScores || isPendingAmounts) && (
        <div className="flex justify-center py-8">
          <LoadingIcon />
        </div>
      )}

      {/* 错误状态 */}
      {(errorRewards || errorScores || errorAmounts) && (
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
      {!isPendingRewards &&
        !isPendingScores &&
        !isPendingAmounts &&
        !errorRewards &&
        !errorScores &&
        !errorAmounts &&
        selectedRound > 0 &&
        (combinedData.length === 0 ? (
          <div className="text-center text-sm text-greyscale-400 p-4">该轮次暂无激励记录</div>
        ) : (
          <table className="table w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-1 text-left">成员地址</th>
                <th className="px-1 text-right">得分(代币数×原始得分)</th>
                <th className="px-1 text-right">激励(占比)</th>
              </tr>
            </thead>
            <tbody>
              {combinedData.map((item, index) => (
                <tr key={`${item.account}-${index}`} className="border-b border-gray-100">
                  <td className="px-1">
                    <AddressWithCopyButton address={item.account} showCopyButton={true} />
                  </td>
                  <td className="px-1 text-right">
                    <div className="font-mono text-secondary">{formatTokenAmount(item.finalScore)}</div>
                    {/* <div className="text-xs text-greyscale-500">{item.finalScorePercentage.toFixed(2)}%</div> */}
                    <div className="mt-0 text-xs text-greyscale-400">
                      <span className="font-mono">{formatTokenAmount(item.joinedAmount)}</span>
                      <span className="mx-1">×</span>
                      <span>{Number(item.originScore).toString()}</span>
                    </div>
                  </td>
                  <td className="px-1 text-right">
                    <div className="font-mono text-secondary">{formatTokenAmount(item.reward)}</div>
                    {/* <div className="text-xs text-greyscale-500">{item.rewardPercentage.toFixed(2)}%</div> */}
                  </td>
                </tr>
              ))}
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
                  <div className="font-mono">{formatTokenAmount(totalReward)}</div>
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

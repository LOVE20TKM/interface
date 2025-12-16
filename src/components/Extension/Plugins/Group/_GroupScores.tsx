// components/Extension/Plugins/Group/_GroupScores.tsx
// 链群历史打分记录

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
  useGroupScoresOfRound,
} from '@/src/hooks/extension/plugins/group/composite';

// 工具函数
import { useHandleContractError } from '@/src/lib/errorUtils';
import { formatPercentage, formatTokenAmount } from '@/src/lib/format';

// 组件
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import ChangeRound from '@/src/components/Common/ChangeRound';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';

interface GroupScoresProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
  groupId: bigint;
}

const _GroupScores: React.FC<GroupScoresProps> = ({ actionId, actionInfo, extensionAddress, groupId }) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};

  // 获取当前轮次
  const { currentRound, isPending: isPendingRound, error: errorRound } = useCurrentRound();

  // 从URL获取round参数
  const { round: urlRound } = router.query;
  const [selectedRound, setSelectedRound] = useState<bigint>(currentRound || BigInt(1));

  // 初始化轮次状态
  useEffect(() => {
    if (urlRound && !isNaN(Number(urlRound))) {
      setSelectedRound(BigInt(urlRound as string));
    } else if (currentRound) {
      setSelectedRound(currentRound);
    }
  }, [urlRound, currentRound]);

  // 获取指定轮次的打分记录
  const {
    accountScores,
    isPending: isPendingScores,
    error: errorScores,
  } = useGroupScoresOfRound({
    extensionAddress,
    round: selectedRound,
    groupId,
  });

  // 获取参与代币数明细
  const {
    accountJoinedAmounts,
    isPending: isPendingAmounts,
    error: errorAmounts,
  } = useGroupAccountsJoinedAmountOfRound({
    extensionAddress,
    round: selectedRound,
    groupId,
  });

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorRound) handleContractError(errorRound, 'vote');
    if (errorScores) handleContractError(errorScores, 'extension');
    if (errorAmounts) handleContractError(errorAmounts, 'extension');
  }, [errorRound, errorScores, errorAmounts, handleContractError]);

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
          <p className="mt-4 text-gray-600">加载打分记录...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <div>Token信息加载中...</div>;
  }

  // 创建一个地图来快速查找参与代币数
  const amountMap = new Map<string, bigint>();
  if (accountJoinedAmounts) {
    accountJoinedAmounts.forEach((item) => {
      amountMap.set(item.account.toLowerCase(), item.joinedAmount);
    });
  }

  // 合并数据：为每个账户添加参与代币数和得分
  const combinedData =
    accountScores?.map((scoreInfo) => ({
      account: scoreInfo.account,
      originScore: scoreInfo.originScore,
      finalScore: scoreInfo.finalScore,
      joinedAmount: amountMap.get(scoreInfo.account.toLowerCase()) || BigInt(0),
    })) || [];

  return (
    <div className="relative pb-4">
      {selectedRound === BigInt(0) && (
        <div className="flex items-center justify-center">
          <div className="text-center text-sm text-greyscale-500">暂无打分数据</div>
        </div>
      )}
      <div className="flex items-center">
        {selectedRound > 0 && (
          <>
            <LeftTitle title={`第 ${selectedRound.toString()} 轮打分结果`} />
            <span className="text-sm text-greyscale-500 ml-2">(</span>
            <ChangeRound currentRound={currentRound || BigInt(0)} handleChangedRound={handleChangedRound} />
            <span className="text-sm text-greyscale-500">)</span>
          </>
        )}
      </div>

      {/* 加载状态 */}
      {(isPendingScores || isPendingAmounts) && (
        <div className="flex justify-center py-8">
          <LoadingIcon />
        </div>
      )}

      {/* 错误状态 */}
      {(errorScores || errorAmounts) && (
        <div className="alert alert-error">
          <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>加载打分数据失败</span>
        </div>
      )}

      {/* 打分详情列表 */}
      {!isPendingScores &&
        !isPendingAmounts &&
        !errorScores &&
        !errorAmounts &&
        selectedRound > 0 &&
        (combinedData.length === 0 ? (
          <div className="text-center text-sm text-greyscale-400 p-4">该轮次暂无打分记录</div>
        ) : (
          <table className="table w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-1 text-left">成员地址</th>
                <th className="px-1 text-right">参与币数 / 原始打分</th>
                <th className="px-1 text-right">最终打分</th>
              </tr>
            </thead>
            <tbody>
              {combinedData.map((item, index) => (
                <tr key={`${item.account}-${index}`} className="border-b border-gray-100">
                  <td className="px-1">
                    <AddressWithCopyButton address={item.account} showCopyButton={true} />
                  </td>
                  <td className="px-1 text-right font-mono">
                    {formatTokenAmount(item.joinedAmount)}/{Number(item.originScore).toString()}
                  </td>
                  <td className="px-1 text-right text-greyscale-700 font-mono ">
                    {formatTokenAmount(item.finalScore)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
    </div>
  );
};

export default _GroupScores;

// components/Extension/Plugins/Group/_GroupRewardTab.tsx
// 激励公示Tab - 展示一个行动下所有链群的激励

'use client';

// React
import React, { useContext, useEffect, useMemo, useState } from 'react';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import { useCurrentRound as useVerifyCurrentRound } from '@/src/hooks/contracts/useLOVE20Verify';
import { useGroupsRewardOfAction } from '@/src/hooks/extension/plugins/group/composite/useGroupsRewardOfAction';

// 工具函数
import { useContractError } from '@/src/errors/useContractError';
import { formatTokenAmount } from '@/src/lib/format';

// 组件
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LeftTitle from '@/src/components/Common/LeftTitle';
import ChangeRound from '@/src/components/Common/ChangeRound';

interface GroupRewardTabProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
}

const _GroupRewardTab: React.FC<GroupRewardTabProps> = ({ actionId, actionInfo, extensionAddress }) => {
  const { token } = useContext(TokenContext) || {};

  // 获取当前轮次
  const { currentRound, isPending: isPendingRound, error: errorRound } = useVerifyCurrentRound();

  // 轮次选择状态
  const [selectedRound, setSelectedRound] = useState<bigint>(BigInt(0));

  // 初始化选中轮次为当前轮次
  useEffect(() => {
    if (currentRound && currentRound > BigInt(1)) {
      setSelectedRound(currentRound - BigInt(1));
    }
  }, [currentRound]);

  // 获取链群激励数据
  const { groupRewards, isPending, error } = useGroupsRewardOfAction({
    tokenAddress: token?.address as `0x${string}`,
    actionId,
    round: selectedRound > BigInt(0) ? selectedRound : undefined,
    extensionAddress,
  });

  // 按激励从高到低排序
  const sortedGroupRewards = useMemo(() => {
    if (!groupRewards || groupRewards.length === 0) return [];

    return [...groupRewards].sort((a, b) => {
      const rewardA = a.reward ?? BigInt(0);
      const rewardB = b.reward ?? BigInt(0);
      // 从高到低排序
      if (rewardA > rewardB) return -1;
      if (rewardA < rewardB) return 1;
      return 0;
    });
  }, [groupRewards]);

  // 错误处理
  const { handleError } = useContractError();
  useEffect(() => {
    if (error) handleError(error);
    if (errorRound) handleError(errorRound);
  }, [error, errorRound, handleError]);

  // 处理轮次切换
  const handleChangedRound = (round: number) => {
    setSelectedRound(BigInt(round));
  };

  // 只有在真正加载中且还没有数据时才显示加载状态
  if (
    (isPending || isPendingRound) &&
    (!sortedGroupRewards || sortedGroupRewards.length === 0 || selectedRound === BigInt(0))
  ) {
    return (
      <div className="flex flex-col items-center py-8">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载激励数据...</p>
      </div>
    );
  }

  return (
    <div>
      {/* 标题和轮次切换 */}
      <div className="flex items-center">
        <LeftTitle title={`第 ${selectedRound?.toString() || '0'} 轮激励`} />
        <span className="text-sm text-greyscale-500 ml-2">(</span>
        <ChangeRound currentRound={currentRound - BigInt(1) || BigInt(0)} handleChangedRound={handleChangedRound} />
        <span className="text-sm text-greyscale-500">)</span>
      </div>

      {/* 激励列表 */}
      {!sortedGroupRewards || sortedGroupRewards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-2">暂无记录</p>
          <p className="text-sm text-gray-400">该轮次内没有链群激励数据</p>
        </div>
      ) : (
        <div className="overflow-x-auto mt-4">
          <table className="table w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-1 text-left">No.</th>
                <th className="px-8 text-left">链群</th>
                <th className="px-1 text-center">激励</th>
              </tr>
            </thead>
            <tbody>
              {sortedGroupRewards.map((item, index) => (
                <tr key={item.groupId.toString()} className="border-b border-gray-100">
                  <td className="px-1 text-greyscale-400">{index + 1}</td>
                  <td className="px-1">
                    <div className="flex items-center">
                      <span className="text-gray-500 text-xs">#</span>
                      <span className="text-sm font-medium ml-1">{item.groupId.toString()}</span>
                      {item.groupName && <span className="text-sm text-gray-800 ml-2">{item.groupName}</span>}
                    </div>
                  </td>
                  <td className="px-1 text-center">
                    <div className="font-mono text-secondary">
                      {item.reward !== undefined ? formatTokenAmount(item.reward) : '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default _GroupRewardTab;

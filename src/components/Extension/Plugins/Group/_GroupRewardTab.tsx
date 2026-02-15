// components/Extension/Plugins/Group/_GroupRewardTab.tsx
// 激励公示Tab - 展示一个行动下所有链群的激励

'use client';

// React
import React, { useContext, useEffect, useMemo, useState } from 'react';

// Next.js
import Link from 'next/link';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import { useCurrentRound as useVerifyCurrentRound } from '@/src/hooks/contracts/useLOVE20Verify';
import { useGroupsRewardOfAction } from '@/src/hooks/extension/plugins/group/composite/useGroupsRewardOfAction';
import { useDistrustVotesOfRound } from '@/src/hooks/extension/plugins/group/composite/useDistrustVotesOfRound';

// 工具函数
import { useContractError } from '@/src/errors/useContractError';
import { formatPercentage, formatTokenAmount } from '@/src/lib/format';

// 组件
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LeftTitle from '@/src/components/Common/LeftTitle';
import ChangeRound from '@/src/components/Common/ChangeRound';

interface GroupRewardTabProps {
  actionId: bigint;
  extensionAddress: `0x${string}`;
}

const _GroupRewardTab: React.FC<GroupRewardTabProps> = ({ actionId, extensionAddress }) => {
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
    round: selectedRound > BigInt(0) ? selectedRound : undefined,
    extensionAddress,
  });

  // 获取不信任投票数据
  const {
    distrustVotes: distrustVotesData,
    isPending: isPendingDistrust,
    error: errorDistrust,
  } = useDistrustVotesOfRound({
    actionId,
    extensionAddress,
    tokenAddress: token?.address as `0x${string}`,
    round: selectedRound > BigInt(0) ? selectedRound : undefined,
  });

  // 创建不信任投票数据的 Map，按 groupId 映射
  const distrustVotesMap = useMemo(() => {
    const map = new Map<bigint, { distrustVotes: bigint; distrustRatio: number }>();
    if (!distrustVotesData || distrustVotesData.length === 0) return map;

    // 将按 groupOwner 分组的数据展开为按 groupId 分组
    distrustVotesData.forEach((item) => {
      item.groupIds.forEach((groupId) => {
        map.set(groupId, {
          distrustVotes: item.distrustVotes,
          distrustRatio: item.distrustRatio,
        });
      });
    });

    return map;
  }, [distrustVotesData]);

  // 按激励从高到低排序，并合并不信任投票数据
  const sortedGroupRewards = useMemo(() => {
    if (!groupRewards || groupRewards.length === 0) return [];

    return [...groupRewards]
      .map((item) => {
        // 合并不信任投票数据
        const distrustData = distrustVotesMap.get(item.groupId);
        return {
          ...item,
          distrustVotes: distrustData?.distrustVotes,
          distrustRatio: distrustData?.distrustRatio,
        };
      })
      .sort((a, b) => {
        const rewardA = a.reward ?? BigInt(0);
        const rewardB = b.reward ?? BigInt(0);
        // 从高到低排序
        if (rewardA > rewardB) return -1;
        if (rewardA < rewardB) return 1;
        return 0;
      });
  }, [groupRewards, distrustVotesMap]);

  // 错误处理
  const { handleError } = useContractError();
  useEffect(() => {
    if (error) handleError(error);
    if (errorRound) handleError(errorRound);
    if (errorDistrust) handleError(errorDistrust);
  }, [error, errorRound, errorDistrust, handleError]);

  // 处理轮次切换
  const handleChangedRound = (round: number) => {
    setSelectedRound(BigInt(round));
  };

  // 只有在真正加载中且还没有数据时才显示加载状态
  // 1. 还在获取轮次且未选择轮次时显示加载
  // 2. 或者已选择轮次且正在获取激励数据或不信任投票数据时显示加载
  if (
    (isPendingRound && selectedRound === BigInt(0)) ||
    (selectedRound > BigInt(0) && (isPending || isPendingDistrust))
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
          <p className="text-gray-500 mb-2">该轮次没有激励数据</p>
        </div>
      ) : (
        <div className="overflow-x-auto mt-4">
          <table className="table w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-1 text-left hidden md:table-cell">No</th>
                <th className="px-1 text-left">
                  <div className="">
                    <span>链群</span>
                    <span className="md:hidden text-xs text-gray-500 mt-1">/参与代币</span>
                  </div>
                </th>
                <th className="px-1 text-center hidden md:table-cell">参与代币</th>
                <th className="px-1 text-center">不信任率</th>
                <th className="px-1 text-center">激励总数</th>
              </tr>
            </thead>
            <tbody>
              {sortedGroupRewards.map((item, index) => (
                <tr key={item.groupId.toString()} className="border-b border-gray-100">
                  <td className="px-1 text-greyscale-400 hidden md:table-cell">{index + 1}</td>
                  <td className="px-1 text-left">
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <span className="text-gray-500 text-xs">#</span>
                        <span className="text-sm font-medium">{item.groupId.toString()}</span>
                        {item.groupName && <span className="text-sm text-gray-800 ml-1">{item.groupName}</span>}
                      </div>
                      {/* 手机上显示参与代币 */}
                      <div className="md:hidden mt-1">
                        <div className="font-mono text-secondary text-xs">
                          {item.joinedAmount !== undefined ? formatTokenAmount(item.joinedAmount) : '-'}
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* 电脑上显示参与代币 */}
                  <td className="px-1 text-center hidden md:table-cell">
                    <div className="font-mono text-secondary">
                      {item.joinedAmount !== undefined ? formatTokenAmount(item.joinedAmount) : '-'}
                    </div>
                  </td>
                  <td className="px-1 text-center">
                    <div className="font-mono text-secondary">
                      {item.distrustRatio !== undefined ? (
                        <span className="text-red-500">-{formatPercentage(item.distrustRatio * 100)}</span>
                      ) : (
                        <>-</>
                      )}
                    </div>
                  </td>
                  <td className="px-1 text-center">
                    <div className="font-mono text-secondary">
                      {(() => {
                        const rewardText = item.reward !== undefined ? formatTokenAmount(item.reward) : '-';
                        const tokenSymbol = token?.symbol;
                        const canNavigate =
                          item.reward !== undefined &&
                          item.reward !== BigInt(0) &&
                          typeof tokenSymbol === 'string' &&
                          tokenSymbol.length > 0;

                        if (!canNavigate) return <span>{rewardText}</span>;

                        const href = `/extension/group/?groupId=${item.groupId.toString()}&actionId=${actionId.toString()}&symbol=${
                          token?.symbol
                        }&tab=rewards`;

                        return (
                          <Link href={href} className="underline underline-offset-2 hover:text-secondary/80">
                            {rewardText}
                          </Link>
                        );
                      })()}
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

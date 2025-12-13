// components/Extension/Plugins/Group/_GroupRewards.tsx
// 链群历史激励记录

'use client';

import React, { useContext, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TokenContext } from '@/src/contexts/TokenContext';
import { ActionInfo } from '@/src/types/love20types';
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Vote';
import { useGroupAccountsRewardOfRound } from '@/src/hooks/extension/plugins/group/composite';
import { useHandleContractError } from '@/src/lib/errorUtils';
import { formatTokenAmount } from '@/src/lib/format';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LeftTitle from '@/src/components/Common/LeftTitle';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';

interface GroupRewardsProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
  groupId: bigint;
}

const _GroupRewards: React.FC<GroupRewardsProps> = ({ actionId, actionInfo, extensionAddress, groupId }) => {
  const { token } = useContext(TokenContext) || {};

  // 获取当前轮次
  const { currentRound, isPending: isPendingRound, error: errorRound } = useCurrentRound();

  // 状态：是否展开
  const [isExpanded, setIsExpanded] = useState(false);

  // 获取最近5轮激励记录
  const {
    rewardRecords,
    isPending: isPendingRewards,
    error: errorRewards,
  } = useGroupAccountsRewardOfRound({
    extensionAddress,
    tokenAddress: token?.address as `0x${string}`,
    actionId,
    round: currentRound,
    groupId,
    lastNRounds: 5,
  });

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorRound) handleContractError(errorRound, 'vote');
    if (errorRewards) handleContractError(errorRewards, 'extension');
  }, [errorRound, errorRewards, handleContractError]);

  if (isPendingRound || isPendingRewards) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col items-center py-8">
          <LoadingIcon />
          <p className="mt-4 text-gray-600">加载激励记录...</p>
        </div>
      </div>
    );
  }

  const hasRewards = rewardRecords && rewardRecords.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="space-y-4">
        {/* 标题和展开按钮 */}
        <div className="flex items-center justify-between">
          <LeftTitle title="历史激励记录" />
          {hasRewards && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-600"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  收起
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  展开
                </>
              )}
            </Button>
          )}
        </div>

        {!hasRewards ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">暂无激励记录</p>
            <p className="text-sm text-gray-400">最近5轮内没有激励记录</p>
          </div>
        ) : (
          <>
            {/* 预览模式：只显示最近一轮 */}
            {!isExpanded && rewardRecords[0] && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    第 {rewardRecords[0].round.toString()} 轮
                  </span>
                  <span className="text-lg font-bold text-secondary">
                    {formatTokenAmount(rewardRecords[0].totalReward, 2)} {token?.symbol}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {rewardRecords[0].accounts.length} 人获得激励
                </div>
              </div>
            )}

            {/* 展开模式：显示所有记录 */}
            {isExpanded && (
              <div className="space-y-3">
                {rewardRecords.map((record) => (
                  <div key={record.round.toString()} className="border border-gray-200 rounded-lg p-4">
                    {/* 轮次和总激励 */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        第 {record.round.toString()} 轮
                      </span>
                      <div className="text-right">
                        <div className="text-lg font-bold text-secondary">
                          {formatTokenAmount(record.totalReward, 2)}
                        </div>
                        <div className="text-xs text-gray-500">{token?.symbol}</div>
                      </div>
                    </div>

                    {/* 激励明细列表 */}
                    <div className="space-y-2">
                      {record.accounts.map((accountReward, index) => (
                        <div
                          key={`${accountReward.account}-${index}`}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex-1">
                            <AddressWithCopyButton address={accountReward.account} showCopyButton={true} />
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-sm font-medium text-gray-800">
                              {formatTokenAmount(accountReward.reward, 2)}
                            </div>
                            <div className="text-xs text-gray-500">{token?.symbol}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 统计信息 */}
                    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                      共 {record.accounts.length} 人获得激励，总计{' '}
                      {formatTokenAmount(record.totalReward, 2)} {token?.symbol}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 说明 */}
        <div className="mt-4 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
          <div className="font-medium text-gray-700 mb-1">💡 关于激励</div>
          <div className="space-y-1 text-gray-600">
            <div>• 激励按参与者的代币数量和链群打分分配</div>
            <div>• 链群打分越高，参与者获得的激励越多</div>
            <div>• 最多显示最近5轮的激励记录</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default _GroupRewards;

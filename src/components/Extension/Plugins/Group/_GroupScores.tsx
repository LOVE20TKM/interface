// components/Extension/Plugins/Group/_GroupScores.tsx
// 链群历史打分记录

'use client';

import React, { useContext, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TokenContext } from '@/src/contexts/TokenContext';
import { ActionInfo } from '@/src/types/love20types';
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Vote';
import { useGroupScoresOfRound } from '@/src/hooks/extension/plugins/group/composite';
import { useHandleContractError } from '@/src/lib/errorUtils';
import { formatPercentage } from '@/src/lib/format';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LeftTitle from '@/src/components/Common/LeftTitle';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';

interface GroupScoresProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
  groupId: bigint;
}

const _GroupScores: React.FC<GroupScoresProps> = ({ actionId, actionInfo, extensionAddress, groupId }) => {
  const { token } = useContext(TokenContext) || {};

  // 获取当前轮次
  const { currentRound, isPending: isPendingRound, error: errorRound } = useCurrentRound();

  // 状态：是否展开
  const [isExpanded, setIsExpanded] = useState(false);

  // 获取最近5轮打分记录
  const {
    groupScores,
    isPending: isPendingScores,
    error: errorScores,
  } = useGroupScoresOfRound({
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
    if (errorScores) handleContractError(errorScores, 'extension');
  }, [errorRound, errorScores, handleContractError]);

  if (isPendingRound || isPendingScores) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col items-center py-8">
          <LoadingIcon />
          <p className="mt-4 text-gray-600">加载打分记录...</p>
        </div>
      </div>
    );
  }

  const hasScores = groupScores && groupScores.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="space-y-4">
        {/* 标题和展开按钮 */}
        <div className="flex items-center justify-between">
          <LeftTitle title="历史打分记录" />
          {hasScores && (
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

        {!hasScores ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">暂无打分记录</p>
            <p className="text-sm text-gray-400">最近5轮内没有打分记录</p>
          </div>
        ) : (
          <>
            {/* 预览模式：只显示最近一轮 */}
            {!isExpanded && groupScores[0] && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    第 {groupScores[0].round.toString()} 轮
                  </span>
                  <span className="text-lg font-bold text-secondary">
                    {formatPercentage(groupScores[0].averageScore)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {groupScores[0].verifiers.length} 位治理者打分
                </div>
              </div>
            )}

            {/* 展开模式：显示所有记录 */}
            {isExpanded && (
              <div className="space-y-3">
                {groupScores.map((scoreRecord) => (
                  <div
                    key={scoreRecord.round.toString()}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    {/* 轮次和平均分 */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        第 {scoreRecord.round.toString()} 轮
                      </span>
                      <span className="text-lg font-bold text-secondary">
                        {formatPercentage(scoreRecord.averageScore)}
                      </span>
                    </div>

                    {/* 打分者列表 */}
                    <div className="space-y-2">
                      {scoreRecord.verifiers.map((verifier, index) => (
                        <div
                          key={`${verifier.verifier}-${index}`}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex-1">
                            <AddressWithCopyButton address={verifier.verifier} showCopyButton={true} />
                          </div>
                          <div className="text-sm font-medium text-gray-800 ml-4">
                            {formatPercentage(verifier.score)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 统计信息 */}
                    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                      {scoreRecord.verifiers.length} 位治理者打分
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 说明 */}
        <div className="mt-4 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
          <div className="font-medium text-gray-700 mb-1">💡 关于打分</div>
          <div className="space-y-1 text-gray-600">
            <div>• 治理者根据链群的验证情况进行打分</div>
            <div>• 平均分越高，链群获得的激励越多</div>
            <div>• 最多显示最近5轮的打分记录</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default _GroupScores;

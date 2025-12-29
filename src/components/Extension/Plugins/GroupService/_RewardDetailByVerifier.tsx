'use client';

import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useRouter } from 'next/router';

// my hooks
import { useContractError } from '@/src/errors/useContractError';
import { useRewardDetailByVerifier } from '@/src/hooks/extension/plugins/group-service/composite/useRewardDetailByVerifier';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

// my components
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import ChangeRound from '@/src/components/Common/ChangeRound';
import LeftTitle from '@/src/components/Common/LeftTitle';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import { Button } from '@/components/ui/button';
import _RewardDistributionByGroupDialog from './_RewardDistributionByGroupDialog';

// my funcs
import { formatTokenAmount } from '@/src/lib/format';

interface _RewardDetailByVerifierProps {
  /** 扩展合约地址 */
  extensionAddress: `0x${string}` | undefined;
  /** Token 地址 */
  tokenAddress: `0x${string}` | undefined;
  /** 服务者地址 */
  verifier: `0x${string}`;
  /** 当前加入轮次 */
  currentJoinRound: bigint;
  /** 返回按钮回调 */
  onBack?: () => void;
}

/**
 * 服务者激励明细组件
 *
 * 功能：
 * - 展示某服务者在特定轮次的所有行动/链群激励情况
 * - 按行动分组，每个行动包含多个链群的激励数据
 * - 支持轮次切换
 * - 点击分配激励可查看二次分配明细
 */
const _RewardDetailByVerifier: React.FC<_RewardDetailByVerifierProps> = ({
  extensionAddress,
  tokenAddress,
  verifier,
  currentJoinRound,
  onBack,
}) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const [selectedRound, setSelectedRound] = useState(BigInt(0));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<
    | {
        actionId: bigint;
        actionTitle: string;
        groupId: bigint;
        groupName: string | undefined;
      }
    | undefined
  >(undefined);

  // 从URL获取round参数
  const { round: urlRound } = router.query;

  // 初始化轮次状态 (默认为上一轮)
  useEffect(() => {
    if (urlRound && !isNaN(Number(urlRound))) {
      setSelectedRound(BigInt(urlRound as string));
    } else if (token && currentJoinRound - BigInt(token.initialStakeRound) >= BigInt(2)) {
      // 默认为上一轮
      setSelectedRound(currentJoinRound - BigInt(2));
    }
  }, [urlRound, currentJoinRound, token]);

  // 获取服务者激励明细数据
  const { actionRewards, isPending, error } = useRewardDetailByVerifier({
    extensionAddress,
    tokenAddress,
    round: selectedRound > BigInt(0) ? selectedRound : undefined,
    verifier,
  });

  // 错误处理
  const { handleError } = useContractError();
  useEffect(() => {
    if (error) {
      handleError(error);
    }
  }, [error, handleError]);

  // 处理轮次切换
  const handleChangedRound = (round: number) => {
    const newRound = BigInt(round);
    setSelectedRound(newRound);

    // 更新URL参数并添加到历史记录
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

  // 处理查看分配明细
  const handleViewDistribution = (
    actionId: bigint,
    actionTitle: string,
    groupId: bigint,
    groupName: string | undefined,
  ) => {
    setSelectedGroup({ actionId, actionTitle, groupId, groupName });
    setDialogOpen(true);
  };

  return (
    <div className="relative pb-4">
      {/* 标题与轮次切换 */}
      {selectedRound === BigInt(0) && (
        <div className="flex items-center justify-center">
          <div className="text-center text-sm text-greyscale-500">暂无激励结果</div>
        </div>
      )}

      <div className="mb-4">
        {selectedRound > 0 && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <LeftTitle title={`第 ${selectedRound.toString()} 轮服务者激励`} />
              <span className="text-sm text-greyscale-500 ml-2">(</span>
              <ChangeRound currentRound={currentJoinRound - BigInt(2)} handleChangedRound={handleChangedRound} />
              <span className="text-sm text-greyscale-500">)</span>
            </div>
            {onBack && (
              <button onClick={onBack} className="text-sm text-secondary hover:underline cursor-pointer">
                返回&gt;&gt;
              </button>
            )}
          </div>
        )}

        {/* 服务者地址 */}
        <div className="flex items-center mb-4 bg-gray-50 px-3 py-2 rounded">
          <span className="text-sm text-greyscale-500 mr-2">服务者:</span>
          <AddressWithCopyButton address={verifier} showCopyButton={true} />
        </div>
      </div>

      {/* 数据展示区 */}
      {isPending ? (
        <div className="flex justify-center items-center h-40">
          <LoadingIcon />
        </div>
      ) : !actionRewards || actionRewards.length === 0 ? (
        selectedRound > BigInt(0) && (
          <div className="text-center text-sm text-greyscale-400 p-8 border rounded-lg bg-gray-50">
            本轮暂无激励数据
          </div>
        )
      ) : (
        <div className="space-y-6">
          {actionRewards.map((actionReward) => (
            <div key={actionReward.actionId.toString()} className="">
              {/* 行动标题 */}
              <div className="flex items-baseline mb-3">
                <span className="text-greyscale-400 text-sm">{`No.`}</span>
                <span className="text-secondary text-xl font-bold mr-2">{String(actionReward.actionId)}</span>
                <span className="font-bold text-greyscale-800">{actionReward.actionTitle}</span>
              </div>

              {/* 链群激励表格 */}
              {actionReward.groupRewards.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">该行动下暂无链群激励</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-2 py-2 text-left text-sm">链群</th>
                        <th className="px-2 py-2 text-right text-sm">链群铸币量</th>
                        <th className="px-2 py-2 text-right text-sm">激励(服务者/二次分配)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actionReward.groupRewards.map((groupReward) => {
                        const totalReward = groupReward.ownerAmount + groupReward.distributedAmount;
                        return (
                          <tr key={groupReward.groupId.toString()} className="border-b border-gray-100">
                            <td className="px-1 py-2">
                              <div className="text-gray-800">
                                <span className="text-gray-500 text-xs">#</span>
                                <span className="text-secondary text-base font-semibold">
                                  {groupReward.groupId.toString()}
                                </span>{' '}
                                <span className="text-sm">
                                  {groupReward.groupName || `链群 #${groupReward.groupId}`}
                                </span>
                              </div>
                            </td>
                            <td className="px-1 py-2 text-right">
                              <div className="font-mono text-sm">{formatTokenAmount(groupReward.totalGenerated)}</div>
                            </td>
                            <td className="px-1 py-2 text-right">
                              <div className="space-y-0.5">
                                {/* 第一行：激励总数 */}
                                {groupReward.hasRecipients ? (
                                  <Button
                                    variant="link"
                                    className="font-mono text-sm text-secondary p-0 h-auto underline"
                                    size="sm"
                                    onClick={() =>
                                      handleViewDistribution(
                                        actionReward.actionId,
                                        actionReward.actionTitle,
                                        groupReward.groupId,
                                        groupReward.groupName,
                                      )
                                    }
                                  >
                                    {formatTokenAmount(totalReward)}
                                  </Button>
                                ) : (
                                  <div className="font-mono text-sm text-secondary">
                                    {formatTokenAmount(totalReward)}
                                  </div>
                                )}
                                {/* 第二行：(服务者激励/二次分配激励) */}
                                <div className="text-greyscale-500 text-sm">
                                  ({formatTokenAmount(groupReward.ownerAmount)}&nbsp;/&nbsp;
                                  {formatTokenAmount(groupReward.distributedAmount)})
                                </div>
                                {/* 第三行：(服务者激励百分比/二次分配激励百分比) */}
                                {totalReward > BigInt(0) && (
                                  <div className="text-greyscale-400 text-xs">
                                    ({((Number(groupReward.ownerAmount) * 100) / Number(totalReward)).toFixed(0)}%/
                                    {((Number(groupReward.distributedAmount) * 100) / Number(totalReward)).toFixed(0)}%)
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {/* 汇总行 */}
                      <tr className="bg-gray-50 font-semibold">
                        <td className="px-2 py-2 text-left">汇总</td>
                        <td className="px-2 py-2 text-right">
                          <div className="font-mono text-sm">
                            {formatTokenAmount(
                              actionReward.groupRewards.reduce((sum, g) => sum + g.totalGenerated, BigInt(0)),
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-right">
                          {(() => {
                            const totalOwnerAmount = actionReward.groupRewards.reduce(
                              (sum, g) => sum + g.ownerAmount,
                              BigInt(0),
                            );
                            const totalDistributedAmount = actionReward.groupRewards.reduce(
                              (sum, g) => sum + g.distributedAmount,
                              BigInt(0),
                            );
                            const totalRewardSum = totalOwnerAmount + totalDistributedAmount;
                            return (
                              <div className="space-y-0.5">
                                {/* 第一行：激励总数汇总 */}
                                <div className="font-mono text-sm text-secondary">
                                  {formatTokenAmount(totalRewardSum)}
                                </div>
                                {/* 第二行：(服务者激励/二次分配激励) */}
                                <div className="text-greyscale-500 text-sm">
                                  ({formatTokenAmount(totalOwnerAmount)}&nbsp;/&nbsp;
                                  {formatTokenAmount(totalDistributedAmount)})
                                </div>
                                {/* 第三行：(服务者激励百分比/二次分配激励百分比) */}
                                {totalRewardSum > BigInt(0) && (
                                  <div className="text-greyscale-400 text-xs">
                                    ({((Number(totalOwnerAmount) * 100) / Number(totalRewardSum)).toFixed(0)}%/
                                    {((Number(totalDistributedAmount) * 100) / Number(totalRewardSum)).toFixed(0)}%)
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 二次分配明细 Dialog */}
      {selectedGroup && (
        <_RewardDistributionByGroupDialog
          extensionAddress={extensionAddress}
          tokenAddress={tokenAddress}
          verifier={verifier}
          round={selectedRound > BigInt(0) ? selectedRound : undefined}
          actionId={selectedGroup.actionId}
          actionTitle={selectedGroup.actionTitle}
          groupId={selectedGroup.groupId}
          groupName={selectedGroup.groupName}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  );
};

export default _RewardDetailByVerifier;

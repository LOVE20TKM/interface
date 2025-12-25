// components/Extension/Plugins/Group/_GroupDistrustInfoOfRound.tsx
// 不信任票信息（支持轮次切换）

'use client';

// React
import React, { useContext, useEffect, useMemo, useState } from 'react';

// 第三方库
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAccount } from 'wagmi';

// UI 组件
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import {
  useCurrentRound as useVerifyCurrentRound,
  useScoreByVerifierByActionId,
} from '@/src/hooks/contracts/useLOVE20Verify';
import {
  useDistrustVotesOfCurrentRound,
  useDistrustVotesOfRound,
  useDistrustVotesOfGroupOwner,
} from '@/src/hooks/extension/plugins/group/composite';
import { useDistrustVotesByVoterByGroupOwner } from '@/src/hooks/extension/plugins/group/contracts/useLOVE20GroupDistrust';
import { useGroupNamesWithCache } from '@/src/hooks/extension/base/composite/useGroupNamesWithCache';

// 工具函数
import { useContractError } from '@/src/errors/useContractError';
import { formatTokenAmount, formatPercentage } from '@/src/lib/format';

// 组件
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LeftTitle from '@/src/components/Common/LeftTitle';
import ChangeRound from '@/src/components/Common/ChangeRound';

interface GroupDistrustInfoOfRoundProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
  onStartVote: () => void;
}

const _GroupDistrustInfoOfRound: React.FC<GroupDistrustInfoOfRoundProps> = ({
  actionId,
  actionInfo,
  extensionAddress,
  onStartVote,
}) => {
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // 获取当前轮次
  const { currentRound, isPending: isPendingRound, error: errorRound } = useVerifyCurrentRound();

  // 轮次选择状态
  const [selectedRound, setSelectedRound] = useState<bigint>(BigInt(0));

  // 初始化选中轮次为当前轮次
  useEffect(() => {
    if (currentRound && currentRound > BigInt(0)) {
      setSelectedRound(currentRound);
    }
  }, [currentRound]);

  // 判断是否为当前轮次
  const isCurrentRound = useMemo(() => {
    return selectedRound === currentRound && currentRound !== undefined;
  }, [selectedRound, currentRound]);

  // 获取当前轮不信任投票（仅当前轮次使用）
  const {
    distrustVotes: currentDistrustVotes,
    isPending: isPendingCurrent,
    error: errorCurrent,
  } = useDistrustVotesOfCurrentRound({
    extensionAddress,
    tokenAddress: token?.address as `0x${string}`,
    actionId,
    round: isCurrentRound ? currentRound : undefined,
  });

  // 获取历史轮次不信任投票（仅历史轮次使用）
  const {
    distrustVotes: historyDistrustVotes,
    isPending: isPendingHistory,
    error: errorHistory,
  } = useDistrustVotesOfRound({
    extensionAddress,
    tokenAddress: token?.address as `0x${string}`,
    actionId,
    round: !isCurrentRound && selectedRound > BigInt(0) ? selectedRound : undefined,
  });

  // 根据是否当前轮次选择数据源
  const distrustVotes = isCurrentRound ? currentDistrustVotes : historyDistrustVotes;
  const isPending = isCurrentRound ? isPendingCurrent : isPendingHistory;
  const error = isCurrentRound ? errorCurrent : errorHistory;

  // 获取我的验证票数（仅当前轮次需要）
  const {
    scoreByVerifierByActionId: myVerifyVotes,
    isPending: isPendingVerify,
    error: errorVerify,
  } = useScoreByVerifierByActionId(
    token?.address as `0x${string}`,
    isCurrentRound ? currentRound || BigInt(0) : BigInt(0),
    account as `0x${string}`,
    actionId,
  );

  // 获取已投不信任票数（仅当前轮次需要）
  const firstGroupOwner = distrustVotes?.[0]?.groupOwner;
  const {
    votes: alreadyVotedAmount,
    isPending: isPendingAlreadyVoted,
    error: errorAlreadyVoted,
  } = useDistrustVotesByVoterByGroupOwner(
    token?.address as `0x${string}`,
    actionId,
    isCurrentRound ? currentRound || BigInt(0) : BigInt(0),
    account as `0x${string}`,
    isCurrentRound && firstGroupOwner ? firstGroupOwner : '0x0000000000000000000000000000000000000000',
  );

  // 计算剩余可投不信任票数（仅当前轮次需要）
  const remainingVotes = useMemo(() => {
    if (!isCurrentRound) return BigInt(0);
    if (
      myVerifyVotes === undefined ||
      myVerifyVotes === null ||
      alreadyVotedAmount === undefined ||
      alreadyVotedAmount === null
    ) {
      return BigInt(0);
    }
    const remaining = myVerifyVotes - alreadyVotedAmount;
    return remaining > BigInt(0) ? remaining : BigInt(0);
  }, [isCurrentRound, myVerifyVotes, alreadyVotedAmount]);

  // 提取所有唯一的 groupIds 用于批量查询 groupName
  const allGroupIds = useMemo(() => {
    if (!distrustVotes) return [];
    const ids = new Set<bigint>();
    distrustVotes.forEach((vote) => {
      vote.groupIds.forEach((id) => ids.add(id));
    });
    return Array.from(ids);
  }, [distrustVotes]);

  // 批量获取 groupName
  const { groupNameMap } = useGroupNamesWithCache({
    groupIds: allGroupIds.length > 0 ? allGroupIds : undefined,
  });

  // 弹窗状态
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<{
    address: `0x${string}`;
    groupIds: bigint[];
  } | null>(null);

  // 获取选中服务者的详细投票信息
  const {
    voterDistrusts,
    isPending: isPendingDetail,
    error: errorDetail,
  } = useDistrustVotesOfGroupOwner({
    extensionAddress,
    tokenAddress: token?.address as `0x${string}`,
    actionId,
    round: selectedRound,
    groupOwner: selectedOwner?.address,
  });

  // 错误处理
  const { handleError } = useContractError();
  useEffect(() => {
    if (error) handleError(error);
    if (errorDetail) handleError(errorDetail);
    if (errorRound) handleError(errorRound);
    if (errorVerify) handleError(errorVerify);
    if (errorAlreadyVoted) handleError(errorAlreadyVoted);
  }, [error, errorDetail, errorRound, errorVerify, errorAlreadyVoted, handleError]);

  // 处理轮次切换
  const handleChangedRound = (round: number) => {
    setSelectedRound(BigInt(round));
  };

  // 处理点击行
  const handleRowClick = (owner: `0x${string}`, groupIds: bigint[]) => {
    setSelectedOwner({ address: owner, groupIds });
    setIsDialogOpen(true);
  };

  // 关闭弹窗
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedOwner(null);
  };

  // 处理点击投票按钮
  const handleStartVote = () => {
    // 检查钱包连接
    if (!account) {
      toast.error('请先连接钱包');
      return;
    }

    // 检查是否有验证票
    if (!myVerifyVotes || myVerifyVotes === BigInt(0)) {
      toast.error('只有投治理票给本行动，并完成"验证"的治理者才能投不信任票');
      return;
    }

    // 检查是否已经投完所有票（这里只检查对第一个服务者的投票，作为权限判断）
    // 实际上用户可能对不同服务者投不同的票，这里只是简单检查
    const hasVotedAll = remainingVotes <= BigInt(100000);
    if (hasVotedAll && firstGroupOwner) {
      toast.error('您已投完所有不信任票');
      return;
    }

    // 权限检查通过，跳转到投票页面
    onStartVote();
  };

  // 只有在真正加载中且还没有数据时才显示加载状态
  if ((isPending || isPendingRound) && (!distrustVotes || selectedRound === BigInt(0))) {
    return (
      <div className="flex flex-col items-center py-8">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载不信任投票数据...</p>
      </div>
    );
  }

  return (
    <>
      <div>
        {/* 标题和投票按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <LeftTitle title={`第 ${selectedRound?.toString() || '0'} 轮不信任票`} />
            <span className="text-sm text-greyscale-500 ml-2">(</span>
            <ChangeRound currentRound={currentRound || BigInt(0)} handleChangedRound={handleChangedRound} />
            <span className="text-sm text-greyscale-500">)</span>
          </div>
          {/* 只有当前轮次才显示投票按钮 */}
          {isCurrentRound && (
            <Link href="#" onClick={handleStartVote} className="text-sm text-secondary hover:text-secondary/80 ml-2">
              投不信任票 &gt;&gt;
            </Link>
          )}
        </div>

        {/* 不信任投票列表 */}
        {!distrustVotes || distrustVotes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">暂无记录</p>
            <p className="text-sm text-gray-400">该验证轮内没有不信任投票</p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {/* 表头 */}
            <div className="grid grid-cols-12 gap-2 px-2 py-2 bg-gray-100 rounded text-sm font-medium text-gray-700">
              <div className="col-span-8">服务者信息 / 链群</div>
              <div className="col-span-3 text-center">不信任率</div>
              <div className="col-span-1"></div>
            </div>

            {/* 列表项 */}
            {distrustVotes.map((vote, index) => (
              <div
                key={`${vote.groupOwner}-${index}`}
                onClick={() => handleRowClick(vote.groupOwner, vote.groupIds)}
                className="grid grid-cols-12 gap-2 border border-gray-200 rounded-lg p-2 hover:border-secondary hover:bg-secondary/5 cursor-pointer transition-all items-center"
              >
                {/* 服务者地址 */}
                <div className="col-span-8">
                  <div className="">
                    <AddressWithCopyButton address={vote.groupOwner} showCopyButton={true} />
                  </div>
                  <div className="flex flex-wrap gap-x-2 gap-y-1">
                    {vote.groupIds.length > 0 ? (
                      vote.groupIds.map((id, idx) => {
                        const name = groupNameMap.get(id);
                        return (
                          <span key={id.toString()} className="inline-flex items-center">
                            {name ? (
                              <>
                                <span className="text-gray-500 text-xs">#</span>
                                <span className="text-sm">{id.toString()}</span>
                                <span className="text-xs text-gray-800 pl-1">{name}</span>
                              </>
                            ) : (
                              <span className="text-xs text-gray-600">#{id.toString()}</span>
                            )}
                            {idx < vote.groupIds.length - 1 && <span className="text-gray-400">,</span>}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-xs text-gray-600">-</span>
                    )}
                  </div>
                </div>

                {/* 不信任率 */}
                <div className="col-span-3 text-center">
                  <div className="flex flex-col items-center">
                    <span
                      className={`font-medium ${
                        vote.distrustRatio > 0.5
                          ? 'text-red-600'
                          : vote.distrustRatio > 0.2
                          ? 'text-orange-600'
                          : 'text-gray-800'
                      }`}
                    >
                      {formatPercentage(vote.distrustRatio * 100.0)}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({formatTokenAmount(vote.distrustVotes)}/{formatTokenAmount(vote.totalVerifyVotes)})
                    </span>
                  </div>
                </div>

                {/* 右侧箭头 */}
                <div className="col-span-1 flex justify-end">
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 说明 */}
        <div className="mt-6 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
          <div className="font-medium text-gray-700 mb-1">💡 小贴士</div>
          <div className="space-y-1 text-gray-600">
            <div>• “投票”给本行动，并完成"验证"的治理者，可对链群服务者投不信任票</div>
            <div>• 不信任率越高，该服务者管理的链群获得的激励越少</div>
          </div>
        </div>
      </div>

      {/* 详情弹窗 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>第 {selectedRound?.toString() || '0'} 轮不信任投票明细</DialogTitle>
          </DialogHeader>

          {isPendingDetail ? (
            <div className="flex flex-col items-center py-8">
              <LoadingIcon />
              <p className="mt-4 text-gray-600">加载投票详情...</p>
            </div>
          ) : !voterDistrusts || voterDistrusts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无投票详情</div>
          ) : (
            <div className="space-y-2">
              {/* 服务者信息 */}
              {selectedOwner && (
                <div className="text-sm text-gray-600">
                  对服务者：
                  <AddressWithCopyButton address={selectedOwner.address} />
                </div>
              )}

              {/* 投票者列表表头 */}
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-100 rounded text-xs font-medium text-gray-700">
                  <div className="col-span-5">投票来源地址</div>
                  <div className="col-span-3 text-center">不信任票</div>
                  <div className="col-span-4 text-center">不信任程度</div>
                </div>

                {/* 投票者列表 */}
                {voterDistrusts.map((voter, index) => (
                  <div key={`${voter.voter}-${index}`} className="border border-gray-200 rounded-lg p-3">
                    <div className="grid grid-cols-12 gap-2 items-center mb-2">
                      {/* 投票地址 */}
                      <div className="col-span-5">
                        <AddressWithCopyButton address={voter.voter} showCopyButton={true} />
                      </div>

                      {/* 不信任票 */}
                      <div className="col-span-3 text-center text-sm text-gray-600">
                        {formatTokenAmount(voter.distrustVotes)}
                      </div>

                      {/* 不信任程度 */}
                      <div className="col-span-4 text-center">
                        <span
                          className={`text-sm font-medium ${
                            voter.distrustRatio > 0.5
                              ? 'text-red-600'
                              : voter.distrustRatio > 0
                              ? 'text-orange-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {formatPercentage(voter.distrustRatio * 100.0)}
                        </span>
                      </div>
                    </div>

                    {/* 原因 */}
                    {voter.reason && (
                      <div className="text-xs text-gray-600 mt-2 pl-2 border-l-2 border-gray-200">
                        <span className="font-medium">原因: </span>
                        {voter.reason}
                      </div>
                    )}

                    {/* 验证票信息 */}
                    <div className="text-xs text-gray-400 mt-1">验证票: {formatTokenAmount(voter.verifyVotes)}</div>
                  </div>
                ))}
              </div>

              {/* 关闭按钮 */}
              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={handleCloseDialog}>
                  关闭
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default _GroupDistrustInfoOfRound;

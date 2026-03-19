// components/Extension/Plugins/Group/_GroupDistrustInfoOfRound.tsx
// 不信任票信息（支持轮次切换）

'use client';

// React
import React, { useContext, useEffect, useMemo, useState } from 'react';

// 第三方库
import Link from 'next/link';
import { useRouter } from 'next/router';
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
import { useDistrustVotesOfRound } from '@/src/hooks/extension/plugins/group/composite/useDistrustVotesOfRound';
import { useDistrustVotesOfGroupOwner } from '@/src/hooks/extension/plugins/group/composite/useDistrustVotesOfGroupOwner';
import { useGroupNamesWithCache } from '@/src/hooks/extension/base/composite/useGroupNamesWithCache';

// 工具函数
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
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const { address: account } = useAccount();

  // 获取当前轮次
  const { currentRound, isPending: isPendingRound, error: errorRound } = useVerifyCurrentRound();

  // 从URL获取round参数
  const { round: urlRound } = router.query;

  // 轮次选择状态
  const [selectedRound, setSelectedRound] = useState<bigint>(BigInt(0));

  // 初始化选中轮次：优先使用URL参数，否则使用当前轮次
  useEffect(() => {
    if (urlRound && !isNaN(Number(urlRound))) {
      setSelectedRound(BigInt(urlRound as string));
    } else if (currentRound && currentRound > BigInt(0)) {
      setSelectedRound(currentRound);
    }
  }, [urlRound, currentRound]);

  // 判断是否为当前轮次
  const isCurrentRound = useMemo(() => {
    return selectedRound === currentRound && currentRound !== undefined;
  }, [selectedRound, currentRound]);

  // 使用 useDistrustVotesOfRound 获取不信任投票
  const { distrustVotes, isPending, error } = useDistrustVotesOfRound({
    actionId,
    extensionAddress,
    tokenAddress: token?.address as `0x${string}`,
    round: selectedRound > BigInt(0) ? selectedRound : undefined,
  });

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

  // 处理轮次切换
  const handleChangedRound = (round: number) => {
    setSelectedRound(BigInt(round));
    // 同时更新URL参数
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, round: round.toString() },
      },
      undefined,
      { shallow: true },
    );
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
            <LeftTitle title={`第 ${selectedRound?.toString() || '0'} 轮`} />
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
            <p className="text-gray-500 mb-2">该验证轮，没有不信任投票</p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="table w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-8 text-left">服务者 / 验证的链群</th>
                  <th className="px-1 text-center">不信任率</th>
                  <th className="px-1"></th>
                </tr>
              </thead>
              <tbody>
                {distrustVotes.map((vote, index) => (
                  <tr
                    key={`${vote.groupOwner}-${index}`}
                    onClick={() => handleRowClick(vote.groupOwner, vote.groupIds)}
                    className="border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-all"
                  >
                    {/* 服务者地址 */}
                    <td className="px-1">
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
                                    <span className="text-sm font-medium ml-1">{id.toString()}</span>
                                    <span className="text-sm text-gray-800 ml-2">{name}</span>
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
                    </td>

                    {/* 不信任率 */}
                    <td className="px-1 text-center">
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
                          ({formatTokenAmount(vote.distrustVotes)}/{formatTokenAmount(vote.totalVotes)})
                        </span>
                      </div>
                    </td>

                    {/* 右侧箭头 */}
                    <td className="px-1">
                      <div className="flex justify-end">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 说明 */}
        <div className="mt-6 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
          <div className="font-medium text-gray-700 mb-1">💡 小贴士</div>
          <div className="space-y-1 text-gray-600">
            <div>• “投票”给本行动、并完成"验证"的治理者，可以投不信任票；</div>
            <div>• 不信任票越多，该服务者的链群获得激励越少；</div>
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
                <div className="text-sm text-gray-600 text-center">
                  服务者：
                  <AddressWithCopyButton address={selectedOwner.address} />
                </div>
              )}

              {/* 投票者列表 */}
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-8 text-left">投票来源地址</th>
                      <th className="px-1 text-center">所投不信任票</th>
                      <th className="px-1 text-center">不信任程度</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voterDistrusts.map((voter, index) => (
                      <React.Fragment key={`${voter.voter}-${index}`}>
                        <tr className="border-none pb-0">
                          {/* 投票地址 */}
                          <td className="px-1 pb-0">
                            <AddressWithCopyButton address={voter.voter} showCopyButton={true} />
                          </td>

                          {/* 不信任票 */}
                          <td className="px-1 pb-0 text-center text-sm text-gray-600">
                            {formatTokenAmount(voter.distrustVotes)}
                          </td>

                          {/* 不信任程度 */}
                          <td className="px-1 pb-0 text-center">
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
                          </td>
                        </tr>
                        {/* 原因和验证票信息 */}
                        {(voter.reason || voter.verifyVotes) && (
                          <tr className="border-b border-gray-100">
                            <td colSpan={3} className="px-1 pt-0 pb-2">
                              {voter.reason && (
                                <div className="text-xs text-gray-600 mb-1 pl-2 border-l-2 border-gray-200">
                                  <span className="font-medium">原因: </span>
                                  {voter.reason}
                                </div>
                              )}
                              <div className="text-xs text-gray-400">
                                总验证票: {formatTokenAmount(voter.verifyVotes)}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
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

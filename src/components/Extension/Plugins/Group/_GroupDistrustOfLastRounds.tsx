// components/Extension/Plugins/Group/_GroupDistrustOfLastRounds.tsx
// 最近n轮不信任投票列表

'use client';

import React, { useContext, useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TokenContext } from '@/src/contexts/TokenContext';
import { ActionInfo } from '@/src/types/love20types';
import {
  useDistrustVotesOfLastRounds,
  useDistrustVotesOfGroupOwner,
} from '@/src/hooks/extension/plugins/group/composite';
import { useHandleContractError } from '@/src/lib/errorUtils';
import { formatPercentage } from '@/src/lib/format';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LeftTitle from '@/src/components/Common/LeftTitle';
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';

interface GroupDistrustOfLastRoundsProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
  onStartVote: () => void;
}

const _GroupDistrustOfLastRounds: React.FC<GroupDistrustOfLastRoundsProps> = ({
  actionId,
  actionInfo,
  extensionAddress,
  onStartVote,
}) => {
  const { token } = useContext(TokenContext) || {};

  // 获取最近5轮不信任投票
  const {
    distrustVotes,
    currentRound,
    isPending,
    error,
  } = useDistrustVotesOfLastRounds({
    extensionAddress,
    tokenAddress: token?.address as `0x${string}`,
    lastNRounds: 5,
  });

  // 弹窗状态
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<{
    address: `0x${string}`;
    round: bigint;
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
    round: selectedOwner?.round,
    groupOwner: selectedOwner?.address,
  });

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (error) handleContractError(error, 'extension');
    if (errorDetail) handleContractError(errorDetail, 'extension');
  }, [error, errorDetail, handleContractError]);

  // 处理点击行
  const handleRowClick = (owner: `0x${string}`, round: bigint) => {
    setSelectedOwner({ address: owner, round });
    setIsDialogOpen(true);
  };

  // 关闭弹窗
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedOwner(null);
  };

  // 只有在真正加载中且还没有数据时才显示加载状态
  if (isPending && !distrustVotes) {
    return (
      <div className="flex flex-col items-center py-8">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载不信任投票数据...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* 标题和投票按钮 */}
        <div className="flex items-center justify-between">
          <LeftTitle title="最近5轮不信任票" />
          <Button variant="link" onClick={onStartVote} className="text-secondary p-0 h-auto">
            投票 &gt;&gt;
          </Button>
        </div>

        {/* 不信任投票列表 */}
        {!distrustVotes || distrustVotes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">暂无不信任投票记录</p>
            <p className="text-sm text-gray-400">最近5轮内没有不信任投票</p>
          </div>
        ) : (
          <div className="space-y-3">
            {distrustVotes.map((vote, index) => (
              <div
                key={`${vote.round}-${vote.groupOwner}-${index}`}
                onClick={() => handleRowClick(vote.groupOwner, vote.round)}
                className="border border-gray-200 rounded-lg p-4 hover:border-secondary hover:bg-secondary/5 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {/* 服务者地址 */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-500">服务者:</span>
                      <AddressWithCopyButton address={vote.groupOwner} showCopyButton={true} />
                    </div>

                    {/* 不信任率 */}
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">不信任率: </span>
                        <span
                          className={`font-medium ${
                            vote.distrustRatio > 0.5
                              ? 'text-red-600'
                              : vote.distrustRatio > 0.2
                              ? 'text-orange-600'
                              : 'text-gray-800'
                          }`}
                        >
                          {formatPercentage(vote.distrustRatio)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        ({vote.distrustVotes.toString()}/{vote.totalVerifyVotes.toString()})
                      </div>
                    </div>

                    {/* 轮次 */}
                    <div className="text-xs text-gray-500 mt-1">第 {vote.round.toString()} 轮</div>
                  </div>

                  {/* 右侧箭头 */}
                  <div className="ml-4">
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 说明 */}
        <div className="mt-6 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
          <div className="font-medium text-gray-700 mb-1">💡 关于不信任投票</div>
          <div className="space-y-1 text-gray-600">
            <div>• 治理者可以对作弊或违规的链群服务者投不信任票</div>
            <div>• 不信任率越高，该服务者管理的链群获得的激励越少</div>
            <div>• 点击查看详细投票记录</div>
          </div>
        </div>
      </div>

      {/* 详情弹窗 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>不信任投票详情</DialogTitle>
          </DialogHeader>

          {isPendingDetail ? (
            <div className="flex flex-col items-center py-8">
              <LoadingIcon />
              <p className="mt-4 text-gray-600">加载投票详情...</p>
            </div>
          ) : !voterDistrusts || voterDistrusts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无投票详情</div>
          ) : (
            <div className="space-y-4">
              {/* 服务者信息 */}
              {selectedOwner && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">服务者地址</div>
                  <AddressWithCopyButton address={selectedOwner.address} />
                  <div className="text-xs text-gray-500 mt-1">第 {selectedOwner.round.toString()} 轮</div>
                </div>
              )}

              {/* 投票者列表 */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">投票明细</div>
                {voterDistrusts.map((voter, index) => (
                  <div
                    key={`${voter.voter}-${index}`}
                    className="border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <AddressWithCopyButton address={voter.voter} showCopyButton={true} />
                      <span
                        className={`text-sm font-medium ${
                          voter.distrustRatio > 0.5
                            ? 'text-red-600'
                            : voter.distrustRatio > 0
                            ? 'text-orange-600'
                            : 'text-gray-500'
                        }`}
                      >
                        {formatPercentage(voter.distrustRatio)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>
                        不信任票: {voter.distrustVotes.toString()} / 验证票: {voter.verifyVotes.toString()}
                      </div>
                      {voter.reason && (
                        <div className="text-gray-600 mt-1">
                          <span className="font-medium">原因: </span>
                          {voter.reason}
                        </div>
                      )}
                    </div>
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

export default _GroupDistrustOfLastRounds;

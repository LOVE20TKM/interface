// components/Extension/Plugins/Group/_GroupDistrustInfoOfCurrentRound.tsx
// 当前验证轮不信任票信息

'use client';

// React
import React, { useContext, useEffect, useState } from 'react';

// 第三方库
import { ChevronRight } from 'lucide-react';

// UI 组件
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import { useCurrentRound as useVerifyCurrentRound } from '@/src/hooks/contracts/useLOVE20Verify';
import {
  useDistrustVotesOfCurrentRound,
  useDistrustVotesOfGroupOwner,
} from '@/src/hooks/extension/plugins/group/composite';

// 工具函数
import { useHandleContractError } from '@/src/lib/errorUtils';
import { formatTokenAmount, formatPercentage } from '@/src/lib/format';

// 组件
import AddressWithCopyButton from '@/src/components/Common/AddressWithCopyButton';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LeftTitle from '@/src/components/Common/LeftTitle';
import RoundLite from '@/src/components/Common/RoundLite';

interface GroupDistrustInfoOfCurrentRoundProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
  onStartVote: () => void;
}

const _GroupDistrustInfoOfCurrentRound: React.FC<GroupDistrustInfoOfCurrentRoundProps> = ({
  actionId,
  actionInfo,
  extensionAddress,
  onStartVote,
}) => {
  const { token } = useContext(TokenContext) || {};

  // 获取当前轮次
  const { currentRound, isPending: isPendingRound, error: errorRound } = useVerifyCurrentRound();

  // 获取当前轮不信任投票
  const { distrustVotes, isPending, error } = useDistrustVotesOfCurrentRound({
    extensionAddress,
    tokenAddress: token?.address as `0x${string}`,
    actionId,
    round: currentRound,
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
    round: currentRound,
    groupOwner: selectedOwner?.address,
  });

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (error) handleContractError(error, 'extension');
    if (errorDetail) handleContractError(errorDetail, 'extension');
    if (errorRound) handleContractError(errorRound, 'verify');
  }, [error, errorDetail, errorRound, handleContractError]);

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

  // 只有在真正加载中且还没有数据时才显示加载状态
  if ((isPending || isPendingRound) && (!distrustVotes || !currentRound)) {
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
          <LeftTitle title="当前轮不信任票" />
          <Button variant="link" onClick={onStartVote} className="text-secondary p-0 h-auto">
            投票 &gt;&gt;
          </Button>
        </div>
        <div className="flex justify-left">
          <RoundLite currentRound={currentRound || BigInt(0)} roundType="verify" />
        </div>

        {/* 不信任投票列表 */}
        {!distrustVotes || distrustVotes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">暂无不信任投票记录</p>
            <p className="text-sm text-gray-400">当前验证轮内没有不信任投票</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 表头 */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-100 rounded text-sm font-medium text-gray-700">
              <div className="col-span-5">服务者地址</div>
              <div className="col-span-3 text-center">服务者链群</div>
              <div className="col-span-3 text-center">不信任率</div>
              <div className="col-span-1"></div>
            </div>

            {/* 列表项 */}
            {distrustVotes.map((vote, index) => (
              <div
                key={`${vote.groupOwner}-${index}`}
                onClick={() => handleRowClick(vote.groupOwner, vote.groupIds)}
                className="grid grid-cols-12 gap-2 border border-gray-200 rounded-lg p-4 hover:border-secondary hover:bg-secondary/5 cursor-pointer transition-all items-center"
              >
                {/* 服务者地址 */}
                <div className="col-span-5">
                  <AddressWithCopyButton address={vote.groupOwner} showCopyButton={true} />
                </div>

                {/* 服务者链群列表 */}
                <div className="col-span-3 text-center">
                  <span className="text-sm text-gray-600">
                    {vote.groupIds.length > 0 ? vote.groupIds.map((id) => `#${id}`).join(', ') : '-'}
                  </span>
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
                  <div className="text-xs text-gray-500 mt-2">
                    服务链群: {selectedOwner.groupIds.map((id) => `#${id}`).join(', ')}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">第 {currentRound?.toString() || '0'} 轮</div>
                </div>
              )}

              {/* 投票者列表表头 */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">投票明细</div>
                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-100 rounded text-xs font-medium text-gray-700">
                  <div className="col-span-5">投票地址</div>
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

export default _GroupDistrustInfoOfCurrentRound;

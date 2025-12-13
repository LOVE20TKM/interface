// components/Extension/Plugins/Group/_ManagerTab.tsx
// 链群管理Tab

'use client';

import React, { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ChevronRight, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TokenContext } from '@/src/contexts/TokenContext';
import { ActionInfo } from '@/src/types/love20types';
import {
  useExpandableInfo,
  useActiveGroupIdsByOwner,
  useGroupInfo,
} from '@/src/hooks/extension/plugins/group/contracts/useLOVE20GroupManager';
import { useGroupManagerAddress, useTokenAddress } from '@/src/hooks/extension/plugins/group/contracts';
import { useExtensionGroupDetail } from '@/src/hooks/extension/plugins/group/composite';
import { useGroupNameOf } from '@/src/hooks/extension/base/contracts/useLOVE20Group';
import { useHandleContractError } from '@/src/lib/errorUtils';
import { formatTokenAmount, formatPercentage } from '@/src/lib/format';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import LeftTitle from '@/src/components/Common/LeftTitle';

interface ManagerTabProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
  account: `0x${string}` | undefined;
}

const _ManagerTab: React.FC<ManagerTabProps> = ({ actionId, actionInfo, extensionAddress, account }) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};

  // 获取 GroupManager 合约地址和 tokenAddress
  const { groupManagerAddress, isPending: isPendingGroupManager } = useGroupManagerAddress(
    extensionAddress as `0x${string}`,
  );
  const { tokenAddress, isPending: isPendingTokenAddress } = useTokenAddress(extensionAddress as `0x${string}`);

  // 获取服务者的可扩展信息
  const {
    currentCapacity,
    maxCapacity,
    currentStake,
    maxStake,
    additionalStakeAllowed,
    isPending: isPendingExpandable,
    error: errorExpandable,
  } = useExpandableInfo(
    tokenAddress as `0x${string}`,
    actionId,
    account as `0x${string}`,
  );

  // 获取服务者的活跃链群ID列表
  const {
    activeGroupIds,
    isPending: isPendingGroupIds,
    error: errorGroupIds,
  } = useActiveGroupIdsByOwner(
    tokenAddress as `0x${string}`,
    actionId,
    account as `0x${string}`,
  );

  // 管理面板弹窗
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<bigint | null>(null);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorExpandable) handleContractError(errorExpandable, 'extension');
    if (errorGroupIds) handleContractError(errorGroupIds, 'extension');
  }, [errorExpandable, errorGroupIds, handleContractError]);

  // 打开管理面板
  const handleManageClick = (groupId: bigint) => {
    setSelectedGroupId(groupId);
    setIsDialogOpen(true);
  };

  // 跳转到操作页面
  const handleNavigateToOp = (op: string) => {
    if (!selectedGroupId) return;
    setIsDialogOpen(false);
    router.push(`/extension/group_op?actionId=${actionId}&groupId=${selectedGroupId.toString()}&op=${op}`);
  };

  if (!account) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">请先连接钱包</p>
      </div>
    );
  }

  // 计算总的加载状态
  // 如果前置条件（groupManagerAddress 和 tokenAddress）还在加载，返回 true
  if (isPendingGroupManager || isPendingTokenAddress) {
    return (
      <div className="flex flex-col items-center py-8">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载管理数据...</p>
      </div>
    );
  }

  // 如果前置条件不满足，但已经加载完成，说明没有 groupManager 或 tokenAddress，返回空状态
  if (!groupManagerAddress || !tokenAddress) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-2">无法获取链群管理信息</p>
      </div>
    );
  }

  // 如果前置条件满足，检查其他数据的加载状态
  const isPending = isPendingExpandable || isPendingGroupIds;

  if (isPending) {
    return (
      <div className="flex flex-col items-center py-8">
        <LoadingIcon />
        <p className="mt-4 text-gray-600">加载管理数据...</p>
      </div>
    );
  }

  // 如果前置条件不满足，但已经加载完成，说明没有 groupManager 或 tokenAddress，返回空状态
  if (!groupManagerAddress || !tokenAddress) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-2">无法获取链群管理信息</p>
      </div>
    );
  }

  // 检查是否是服务者
  const isOwner = activeGroupIds && activeGroupIds.length > 0;

  if (!isOwner) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-2">您还不是链群服务者</p>
        <p className="text-sm text-gray-400">激活链群后即可成为服务者</p>
      </div>
    );
  }

  // 计算百分比
  const capacityRatio =
    maxCapacity && maxCapacity > BigInt(0) ? Number(currentCapacity || BigInt(0)) / Number(maxCapacity) : 0;
  const stakeRatio = maxStake && maxStake > BigInt(0) ? Number(currentStake || BigInt(0)) / Number(maxStake) : 0;

  return (
    <>
      <div className="space-y-6">
        {/* 服务者数据 */}
        <div>
          <LeftTitle title="服务者数据" />
          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* 最大容量 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-gray-600 mb-1">最大容量</div>
              <div className="text-xl font-bold text-blue-800">{formatTokenAmount(maxCapacity || BigInt(0), 2)}</div>
              <div className="text-xs text-blue-600 mt-1">{token?.symbol}</div>
            </div>

            {/* 当前容量 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="text-sm text-gray-600 mb-1">当前容量</div>
              <div className="text-xl font-bold text-green-800">
                {formatTokenAmount(currentCapacity || BigInt(0), 2)}
              </div>
              <div className="text-xs text-green-600 mt-1">{formatPercentage(capacityRatio)}</div>
            </div>

            {/* 最大质押 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="text-sm text-gray-600 mb-1">最大质押</div>
              <div className="text-xl font-bold text-purple-800">{formatTokenAmount(maxStake || BigInt(0), 2)}</div>
              <div className="text-xs text-purple-600 mt-1">{token?.symbol}</div>
            </div>

            {/* 当前质押 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <div className="text-sm text-gray-600 mb-1">当前质押</div>
              <div className="text-xl font-bold text-orange-800">{formatTokenAmount(currentStake || BigInt(0), 2)}</div>
              <div className="text-xs text-orange-600 mt-1">{formatPercentage(stakeRatio)}</div>
            </div>
          </div>

          {/* 还可以质押 */}
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
            <span className="text-gray-600">还可以质押: </span>
            <span className="font-medium text-secondary">
              {formatTokenAmount(additionalStakeAllowed || BigInt(0), 2)} {token?.symbol}
            </span>
          </div>
        </div>

        {/* 我的链群列表 */}
        <div>
          <LeftTitle title={`我的链群 (${activeGroupIds?.length || 0})`} />

          {activeGroupIds && activeGroupIds.length > 0 ? (
            <div className="space-y-3 mt-4">
              {activeGroupIds.map((groupId) => (
                <GroupItem
                  key={groupId.toString()}
                  extensionAddress={extensionAddress}
                  actionId={actionId}
                  groupId={groupId}
                  onManageClick={handleManageClick}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">暂无链群</div>
          )}
        </div>

        {/* 说明 */}
        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2">
          <div className="font-medium text-gray-700 mb-1">💡 管理说明</div>
          <div className="space-y-1 text-gray-600">
            <div>• 容量上限取决于您的治理票占比和质押量</div>
            <div>• 可以追加质押来增加容量上限</div>
            <div>• 点击"管理"按钮可以进行验证打分、追加质押等操作</div>
          </div>
        </div>
      </div>

      {/* 管理面板弹窗 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>链群管理</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Button variant="outline" className="w-full justify-start" onClick={() => handleNavigateToOp('verify')}>
              <Settings className="w-4 h-4 mr-2" />
              链群打分
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => handleNavigateToOp('expand')}>
              <Settings className="w-4 h-4 mr-2" />
              追加质押
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => handleNavigateToOp('update')}>
              <Settings className="w-4 h-4 mr-2" />
              更新信息
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleNavigateToOp('set_delegated')}
            >
              <Settings className="w-4 h-4 mr-2" />
              设置打分代理
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700"
              onClick={() => handleNavigateToOp('deactivate')}
            >
              <Settings className="w-4 h-4 mr-2" />
              关闭链群
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// 链群项组件
interface GroupItemProps {
  extensionAddress: `0x${string}`;
  actionId: bigint;
  groupId: bigint;
  onManageClick: (groupId: bigint) => void;
}

const GroupItem: React.FC<GroupItemProps> = ({ extensionAddress, actionId, groupId, onManageClick }) => {
  const { token } = useContext(TokenContext) || {};

  // 获取链群信息
  const { capacity, stakedAmount, isPending, error } = useGroupInfo(
    token?.address as `0x${string}`,
    actionId,
    groupId,
  );

  // 获取链群详情（用于获取 totalJoinedAmount）
  const { groupDetail, isPending: isPendingDetail } = useExtensionGroupDetail({
    extensionAddress,
    groupId,
  });

  // 获取链群名称
  const { groupName, isPending: isPendingName } = useGroupNameOf(groupId);

  if (isPending || isPendingName || isPendingDetail) {
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="text-sm text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!capacity || !stakedAmount || !groupDetail) return null;

  const capacityRatio = capacity > BigInt(0) ? Number(groupDetail.totalJoinedAmount) / Number(capacity) : 0;

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-secondary hover:bg-secondary/5 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-semibold text-gray-800 mb-2">
            #{groupId.toString()} {groupName}
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>
              <span className="text-gray-500">容量: </span>
              <span className="font-medium">
                {formatTokenAmount(groupDetail.totalJoinedAmount, 2)} / {formatTokenAmount(capacity, 2)} {token?.symbol}
              </span>
              <span className="text-xs text-gray-500 ml-2">({formatPercentage(capacityRatio)})</span>
            </div>
            <div>
              <span className="text-gray-500">质押: </span>
              <span className="font-medium">
                {formatTokenAmount(stakedAmount, 2)} {token?.symbol}
              </span>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => onManageClick(groupId)} className="ml-4">
          管理
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default _ManagerTab;

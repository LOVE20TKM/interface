// components/Extension/Plugins/Group/_ManagerTab.tsx
// 链群管理Tab

'use client';

// React
import React, { useContext, useEffect, useState } from 'react';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';

// hooks
import { useExtensionGroupsOfAccount } from '@/src/hooks/extension/plugins/group/composite';
import { useGroupManagerAddress, useTokenAddress } from '@/src/hooks/extension/plugins/group/contracts';
import {
  useActiveGroupIdsByOwner,
  useExpandableInfo,
} from '@/src/hooks/extension/plugins/group/contracts/useLOVE20GroupManager';

// 工具函数
import { useHandleContractError } from '@/src/lib/errorUtils';

// 组件
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import _GroupManagementDialog from './_GroupManagementDialog';
import _ManagerDataPanel from './_ManagerDataPanel';
import _MyGroups from './_MyGroups';

interface ManagerTabProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
  account: `0x${string}` | undefined;
}

const _ManagerTab: React.FC<ManagerTabProps> = ({ actionId, actionInfo, extensionAddress, account }) => {
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
  } = useExpandableInfo(tokenAddress as `0x${string}`, actionId, account as `0x${string}`);

  // 获取服务者的活跃链群ID列表
  const {
    activeGroupIds,
    isPending: isPendingGroupIds,
    error: errorGroupIds,
  } = useActiveGroupIdsByOwner(tokenAddress as `0x${string}`, actionId, account as `0x${string}`);

  // 获取账号的所有链群数据（只调用一次，数据通过 props 传递给子组件）
  const {
    groups,
    isPending: isGroupsPending,
    error: groupsError,
  } = useExtensionGroupsOfAccount({
    extensionAddress,
    actionId,
    account,
  });

  // 管理面板弹窗
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<bigint | null>(null);

  // 错误处理
  const { handleContractError } = useHandleContractError();
  useEffect(() => {
    if (errorExpandable) handleContractError(errorExpandable, 'extension');
    if (errorGroupIds) handleContractError(errorGroupIds, 'extension');
    if (groupsError) handleContractError(groupsError, 'extension');
  }, [errorExpandable, errorGroupIds, groupsError, handleContractError]);

  // 打开管理面板
  const handleManageClick = (groupId: bigint) => {
    setSelectedGroupId(groupId);
    setIsDialogOpen(true);
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
  const isPending = isPendingExpandable || isPendingGroupIds || isGroupsPending;

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

  return (
    <>
      <div>
        {/* 服务者数据面板 */}
        <_ManagerDataPanel
          groups={groups}
          currentCapacity={currentCapacity}
          maxCapacity={maxCapacity}
          currentStake={currentStake}
          maxStake={maxStake}
        />

        {/* 我的链群列表 */}
        <_MyGroups groups={groups} actionId={actionId} onManageClick={handleManageClick} />

        {/* 说明 */}
        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded mt-6 px-3 py-2">
          <div className="font-medium text-gray-700 mb-1">💡 小贴士</div>
          <div className="space-y-1 text-gray-600">
            <div>• 容量上限取决于您的治理票占比和质押量</div>
            <div>• 可以追加质押来增加容量上限</div>
            <div>• 点击"管理"按钮可以进行验证打分、追加质押等操作</div>
          </div>
        </div>
      </div>

      {/* 管理面板弹窗 */}
      {selectedGroupId && (
        <_GroupManagementDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          actionId={actionId}
          groupId={selectedGroupId}
          showViewGroup={true}
        />
      )}
    </>
  );
};

export default _ManagerTab;

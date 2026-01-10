// components/Extension/Plugins/Group/_ManagerTab.tsx
// 链群管理Tab

'use client';

// React
import React, { useEffect, useState } from 'react';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// hooks
import { useExtensionGroupsOfAccount } from '@/src/hooks/extension/plugins/group/composite/useExtensionGroupsOfAccount';
import { useMaxVerifyCapacityByOwner } from '@/src/hooks/extension/plugins/group/contracts/useGroupManager';

// 工具函数
import { useContractError } from '@/src/errors/useContractError';

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
  // 获取服务者的最大容量上限
  const {
    maxVerifyCapacity,
    isPending: isPendingMaxCapacity,
    error: errorMaxCapacity,
  } = useMaxVerifyCapacityByOwner(extensionAddress, account as `0x${string}`);

  // 获取账号的所有链群数据（只调用一次，数据通过 props 传递给子组件）
  const {
    groups,
    isPending: isGroupsPending,
    error: groupsError,
  } = useExtensionGroupsOfAccount({
    extensionAddress,
    account,
  });

  // 管理面板弹窗
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<bigint | null>(null);

  // 错误处理
  const { handleError } = useContractError();
  useEffect(() => {
    if (errorMaxCapacity) handleError(errorMaxCapacity);

    if (groupsError) handleError(groupsError);
  }, [errorMaxCapacity, groupsError, handleError]);

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

  if (isGroupsPending) {
    return (
      <div className="flex flex-col items-center py-8">
        <LoadingIcon />
      </div>
    );
  }

  // 检查是否是服务者
  const isOwner = groups && groups.length > 0;

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
        <_ManagerDataPanel groups={groups} maxVerifyCapacity={maxVerifyCapacity} />

        {/* 我的链群列表 */}
        <_MyGroups groups={groups} actionId={actionId} onManageClick={handleManageClick} />

        {/* 说明 */}
        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded mt-6 px-3 py-2">
          <div className="font-medium text-gray-700 mb-1">💡 小贴士</div>
          <div className="space-y-1 text-gray-600">
            <div>• 您的最大可验证容量 = 已铸造代币量 × 您的治理票占比 × 验证容量系数</div>
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

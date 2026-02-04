// components/Extension/Plugins/Group/_ManagerTab.tsx
// 链群管理Tab

'use client';

// React
import React, { useEffect } from 'react';

// Next.js
import Link from 'next/link';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// hooks
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Join';
import { useExtensionGroupsOfAccount } from '@/src/hooks/extension/plugins/group/composite/useExtensionGroupsOfAccount';

// 工具函数
import { useContractError } from '@/src/errors/useContractError';

// 组件
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import { Button } from '@/components/ui/button';
// import _ManagerDataPanel from './_ManagerDataPanel';
import _MyGroups from './_MyGroups';

interface ManagerTabProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
  account: `0x${string}` | undefined;
}

const _ManagerTab: React.FC<ManagerTabProps> = ({ actionId, actionInfo, extensionAddress, account }) => {
  // 获取当前加入轮次
  const { currentRound } = useCurrentRound();

  // 获取账号的所有链群数据（只调用一次，数据通过 props 传递给子组件）
  const {
    groups,
    isPending: isGroupsPending,
    error: groupsError,
  } = useExtensionGroupsOfAccount({
    extensionAddress,
    account,
    round: currentRound,
  });

  // 错误处理
  const { handleError } = useContractError();
  useEffect(() => {
    if (groupsError) handleError(groupsError);
  }, [groupsError, handleError]);

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
      <div className="text-center py-10">
        <p className="text-gray-500 mb-6">您还不是链群服务者</p>
        <Button variant="outline" asChild className="w-1/2 text-secondary border-secondary">
          <Link href={`/extension/group_op/?actionId=${actionId}&op=activate`}>去激活链群 &gt;&gt;</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* 服务者数据面板 */}
      {/* <_ManagerDataPanel groups={groups} /> */}

      {/* 我的链群列表 */}
      <_MyGroups groups={groups} actionId={actionId} />
    </div>
  );
};

export default _ManagerTab;

// components/Extension/Plugins/Group/GroupJoinPanel.tsx
// 加入链群行动面板（三步流程）

'use client';

// React
import React, { useContext } from 'react';

// Next.js
import { useRouter } from 'next/router';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 上下文
import { TokenContext } from '@/src/contexts/TokenContext';
import { TrialModeProvider } from '@/src/contexts/TrialModeContext';

// 组件
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import _GroupJoinSelect from './_GroupJoinSelect';
import _GroupJoinSubmit from './_GroupJoinSubmit';
import _GroupUpdateVerificationInfo from './_GroupUpdateVerificationInfo';

interface GroupJoinPanelProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
}

const GroupJoinPanel: React.FC<GroupJoinPanelProps> = ({ actionId, actionInfo, extensionAddress }) => {
  const router = useRouter();
  const { token } = useContext(TokenContext) || {};
  const { tab, groupId } = router.query;

  // 解析 groupId
  const groupIdBigInt = groupId && typeof groupId === 'string' ? BigInt(groupId) : undefined;

  // 根据 tab 参数决定显示哪个步骤
  // tab 没有或为 'select' 时显示第一步
  // tab 为 'join' 时显示第二步
  // tab 为 'update_verification_info' 时显示第三步

  if (!token) {
    return <LoadingIcon />;
  }

  // 包装 TrialModeProvider 以支持体验模式
  return (
    <TrialModeProvider extensionAddress={extensionAddress} groupId={groupIdBigInt}>
      {tab === 'join' && groupId ? (
        <_GroupJoinSubmit
          actionId={actionId}
          actionInfo={actionInfo}
          extensionAddress={extensionAddress}
          groupId={BigInt(groupId as string)}
        />
      ) : tab === 'update_verification_info' && groupId ? (
        <_GroupUpdateVerificationInfo
          actionId={actionId}
          actionInfo={actionInfo}
          extensionAddress={extensionAddress}
          groupId={BigInt(groupId as string)}
        />
      ) : (
        // 默认显示第一步：选择链群
        <_GroupJoinSelect actionId={actionId} actionInfo={actionInfo} extensionAddress={extensionAddress} />
      )}
    </TrialModeProvider>
  );
};

export default GroupJoinPanel;

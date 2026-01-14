// components/Extension/Plugins/Group/_GroupDistrustTab.tsx
// 不信任投票Tab - 状态管理和路由

'use client';

// React
import React, { useState } from 'react';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 组件
import _GroupDistrustInfoOfRound from './_GroupDistrustInfoOfRound';
import _GroupDistrustVoteSelect from './_GroupDistrustVoteSelect';
import _GroupDistrustVoteSubmit from './_GroupDistrustVoteSubmit';

interface GroupDistrustTabProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
}

type ViewMode = 'list' | 'select' | 'submit';

const _GroupDistrustTab: React.FC<GroupDistrustTabProps> = ({ actionId, actionInfo, extensionAddress }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedGroupOwner, setSelectedGroupOwner] = useState<`0x${string}` | undefined>();

  // 处理开始投票
  const handleStartVote = () => {
    setViewMode('select');
  };

  // 处理选择服务者
  const handleSelectOwner = (owner: `0x${string}`) => {
    setSelectedGroupOwner(owner);
    setViewMode('submit');
  };

  // 处理取消
  const handleCancel = () => {
    setViewMode('list');
    setSelectedGroupOwner(undefined);
  };

  // 处理投票成功
  const handleVoteSuccess = () => {
    setViewMode('list');
    setSelectedGroupOwner(undefined);
  };

  // 根据状态显示不同组件
  if (viewMode === 'submit' && selectedGroupOwner) {
    return (
      <_GroupDistrustVoteSubmit
        actionId={actionId}
        actionInfo={actionInfo}
        extensionAddress={extensionAddress}
        groupOwner={selectedGroupOwner}
        onCancel={handleCancel}
        onSuccess={handleVoteSuccess}
      />
    );
  }

  if (viewMode === 'select') {
    return (
      <_GroupDistrustVoteSelect
        extensionAddress={extensionAddress}
        onSelectOwner={handleSelectOwner}
        onCancel={handleCancel}
      />
    );
  }

  // 默认显示不信任投票列表（支持轮次切换）
  return (
    <_GroupDistrustInfoOfRound
      actionId={actionId}
      actionInfo={actionInfo}
      extensionAddress={extensionAddress}
      onStartVote={handleStartVote}
    />
  );
};

export default _GroupDistrustTab;

// components/Extension/Plugins/Group/GroupActionPublicTabs.tsx
// 行动公示组件 - 主Tab容器

'use client';

// React
import React, { useState } from 'react';

// 第三方库
import { useAccount } from 'wagmi';

// UI 组件
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 组件
import _GroupDistrustTab from './_GroupDistrustTab';
import _GroupsTab from './_GroupsTab';
import _ManagerTab from './_ManagerTab';

interface GroupActionPublicTabsProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
}

const GroupActionPublicTabs: React.FC<GroupActionPublicTabsProps> = ({ actionId, actionInfo, extensionAddress }) => {
  const { address: account } = useAccount();
  const [activeTab, setActiveTab] = useState<string>('groups');

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="groups">链群列表</TabsTrigger>
          <TabsTrigger value="distrust">不信任投票</TabsTrigger>
          <TabsTrigger value="manager">链群管理</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="mt-0">
          <_GroupsTab actionId={actionId} actionInfo={actionInfo} extensionAddress={extensionAddress} />
        </TabsContent>

        <TabsContent value="distrust" className="mt-0">
          <_GroupDistrustTab actionId={actionId} actionInfo={actionInfo} extensionAddress={extensionAddress} />
        </TabsContent>

        <TabsContent value="manager" className="mt-0">
          <_ManagerTab
            actionId={actionId}
            actionInfo={actionInfo}
            extensionAddress={extensionAddress}
            account={account}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GroupActionPublicTabs;

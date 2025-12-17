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
  const [activeTab, setActiveTab] = useState<string>('groups');

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 bg-muted rounded-lg p-1 mb-4 mx-16">
          <TabsTrigger value="groups">链群</TabsTrigger>
          <TabsTrigger value="distrust">不信任投票</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="mt-0">
          <_GroupsTab actionId={actionId} actionInfo={actionInfo} extensionAddress={extensionAddress} />
        </TabsContent>

        <TabsContent value="distrust" className="mt-0">
          <_GroupDistrustTab actionId={actionId} actionInfo={actionInfo} extensionAddress={extensionAddress} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GroupActionPublicTabs;

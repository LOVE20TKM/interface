// components/Extension/Plugins/Group/GroupActionPublicTabs.tsx
// 行动公示组件 - 主Tab容器

'use client';

// React
import React, { useState, useEffect } from 'react';

// 第三方库
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';

// UI 组件
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 类型
import { ActionInfo } from '@/src/types/love20types';

// 组件
import _GroupDistrustTab from './_GroupDistrustTab';
import _GroupsTab from './_GroupsTab';
import _ManagerTab from './_ManagerTab';
import _GroupRewardTab from './_GroupRewardTab';

interface GroupActionPublicTabsProps {
  actionId: bigint;
  actionInfo: ActionInfo;
  extensionAddress: `0x${string}`;
}

type GroupSubTab = 'groups' | 'distrust' | 'reward';

const GroupActionPublicTabs: React.FC<GroupActionPublicTabsProps> = ({ actionId, actionInfo, extensionAddress }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<GroupSubTab>('groups');

  // 从URL获取tab2参数
  const { tab2 } = router.query;

  // 初始化子tab状态
  useEffect(() => {
    if (tab2 && ['groups', 'distrust', 'reward'].includes(tab2 as string)) {
      setActiveTab(tab2 as GroupSubTab);
    }
  }, [tab2]);

  // 处理子tab切换
  const handleSubTabChange = (tabKey: string) => {
    const validTabKey = tabKey as GroupSubTab;
    setActiveTab(validTabKey);
    // 更新URL参数并添加到历史记录
    const currentQuery = { ...router.query };
    currentQuery.tab2 = validTabKey;

    router.push(
      {
        pathname: router.pathname,
        query: currentQuery,
      },
      undefined,
      { shallow: true },
    );
  };

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={handleSubTabChange} className="w-full">
        <TabsList className="grid grid-cols-3 bg-muted rounded-lg p-1 mb-4 mx-8">
          <TabsTrigger value="groups" className="px-6">
            链群
          </TabsTrigger>
          <TabsTrigger value="distrust" className="px-6">
            不信任票
          </TabsTrigger>
          <TabsTrigger value="reward" className="px-6">
            激励公示
          </TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="mt-0">
          <_GroupsTab actionId={actionId} actionInfo={actionInfo} extensionAddress={extensionAddress} />
        </TabsContent>

        <TabsContent value="distrust" className="mt-0">
          <_GroupDistrustTab actionId={actionId} actionInfo={actionInfo} extensionAddress={extensionAddress} />
        </TabsContent>

        <TabsContent value="reward" className="mt-0">
          <_GroupRewardTab extensionAddress={extensionAddress} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GroupActionPublicTabs;

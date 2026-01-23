'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

// UI 组件
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import _GroupTrialAccountsWaiting from '@/src/components/Extension/Plugins/Group/_GroupTrialAccountsWaiting';
import _GroupTrialAccountsJoined from '@/src/components/Extension/Plugins/Group/_GroupTrialAccountsJoined';

type TrialTab = 'waiting' | 'joined';

interface GroupTrialProps {
  extensionAddress: `0x${string}`;
  groupId: bigint;
  actionId: bigint;
}

const _GroupTrial: React.FC<GroupTrialProps> = ({ extensionAddress, groupId, actionId }) => {
  const router = useRouter();
  const { trialTab } = router.query;
  const [activeTab, setActiveTab] = useState<TrialTab>('waiting');

  useEffect(() => {
    if (trialTab && ['waiting', 'joined'].includes(trialTab as string)) {
      setActiveTab(trialTab as TrialTab);
    }
  }, [trialTab]);

  // 处理tab切换
  const handleTabChange = (tabKey: string) => {
    const validTabKey = tabKey as TrialTab;
    setActiveTab(validTabKey);
    // 更新URL参数并添加到历史记录
    const currentQuery = { ...router.query };
    currentQuery.trialTab = validTabKey;
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
    <div className="w-full mt-4">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-2 bg-muted rounded-lg p-1 mb-4 mx-8">
          <TabsTrigger value="waiting" className="px-6">
            待使用
          </TabsTrigger>
          <TabsTrigger value="joined" className="px-6">
            体验中
          </TabsTrigger>
        </TabsList>

        <TabsContent value="waiting" className="mt-0">
          <_GroupTrialAccountsWaiting extensionAddress={extensionAddress} groupId={groupId} actionId={actionId} />
        </TabsContent>

        <TabsContent value="joined" className="mt-0">
          <_GroupTrialAccountsJoined extensionAddress={extensionAddress} groupId={groupId} actionId={actionId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default _GroupTrial;

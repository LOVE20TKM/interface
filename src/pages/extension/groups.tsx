/**
 * 链群 NFT 管理页面
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';

// UI components
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// my components
import Header from '@/src/components/Header';
import MyGroups from '@/src/components/Extension/Base/Group/MyGroups';
import MintGroup from '@/src/components/Extension/Base/Group/MintGroup';

// my hooks
import { useMyGroups } from '@/src/hooks/extension/base/composite/useMyGroups';

type GroupTab = 'my' | 'mint';

export default function GroupPage() {
  const router = useRouter();
  const { address: account } = useAccount();
  const [activeTab, setActiveTab] = useState<GroupTab>('my');

  // 获取用户拥有的 NFT 数量
  const { balance, isPending } = useMyGroups(account);

  // 根据是否拥有 NFT 来设置默认 tab
  useEffect(() => {
    if (!isPending && balance !== undefined) {
      // 如果没有 NFT，默认显示"铸造"
      if (balance === BigInt(0)) {
        setActiveTab('mint');
      } else {
        setActiveTab('my');
      }
    }
  }, [balance, isPending]);

  // 从 URL 获取 tab 参数
  useEffect(() => {
    const { tab } = router.query;
    if (tab && ['my', 'mint'].includes(tab as string)) {
      setActiveTab(tab as GroupTab);
    }
  }, [router.query]);

  // 处理 tab 切换
  const handleTabChange = (tabValue: string) => {
    const tab = tabValue as GroupTab;
    setActiveTab(tab);

    // 更新 URL 参数
    const currentQuery = { ...router.query };
    currentQuery.tab = tab;

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
    <>
      <Header title="链群ID管理" showBackButton={true} />
      <main className="flex-grow px-3 sm:px-0">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full max-w-2xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mt-2 min-w-0">
            <TabsTrigger value="my" className="min-w-0 truncate">
              我的
            </TabsTrigger>
            <TabsTrigger value="mint" className="min-w-0 truncate">
              铸造
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my">
            <MyGroups />
          </TabsContent>

          <TabsContent value="mint">
            <MintGroup />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}

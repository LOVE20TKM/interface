'use client';

import { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { HelpCircle } from 'lucide-react';

// UI components
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// my components
import Header from '@/src/components/Header';
import SwapPanel from '@/src/components/Dex/Swap';
import LiquidityPanel from '@/src/components/Dex/Liquidity';
import LiquidityQueryPanel from '@/src/components/Dex/LiquidityQuery';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

type DexTab = 'swap' | 'liquidity' | 'liquidity-query';

export default function DexPage() {
  const router = useRouter();
  const { token: currentToken } = useContext(TokenContext) || {};
  const [activeTab, setActiveTab] = useState<DexTab>('swap');

  // 从URL获取tab参数
  useEffect(() => {
    const { tab } = router.query;
    if (tab && ['swap', 'liquidity', 'liquidity-query'].includes(tab as string)) {
      setActiveTab(tab as DexTab);
    }
  }, [router.query]);

  // 处理tab切换
  const handleTabChange = (tabValue: string) => {
    const tab = tabValue as DexTab;
    setActiveTab(tab);

    // 更新URL参数
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
      <Header title="交易中心" />
      <main className="flex-grow px-3 sm:px-0">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full max-w-2xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-6 min-w-0">
            <TabsTrigger value="swap" className="min-w-0 truncate">
              兑换
            </TabsTrigger>
            <TabsTrigger value="liquidity" className="min-w-0 truncate">
              流动性添加
            </TabsTrigger>
            <TabsTrigger value="liquidity-query" className="min-w-0 truncate">
              流动性查询
            </TabsTrigger>
          </TabsList>

          <TabsContent value="swap">
            <SwapPanel showCurrentToken={!!currentToken && !!currentToken.hasEnded} />

            <div className="bg-green-50/30 border-l-4 border-l-green-50 rounded-r-lg p-4 mb-8 text-sm mt-0 mx-3 sm:mx-6">
              <div className="flex items-center gap-2 text-base font-bold text-green-800 pb-2">
                <HelpCircle className="w-4 h-4" />
                小贴士
              </div>
              <div className="text-base font-bold text-green-700 pt-2 pb-1">费用说明：</div>
              <div className="text-sm text-green-700">手续费为 0.3%，滑点上限为 0.5%</div>
              <div className="text-base font-bold text-green-700 pt-2 pb-1">交易协议：</div>
              <div className="text-sm text-green-700">本交易功能基于 Uniswap V2 协议实现，合约代码为官方最新版本</div>
            </div>
          </TabsContent>

          <TabsContent value="liquidity">
            <LiquidityPanel />

            <div className="bg-green-50/30 border-l-4 border-l-green-50 rounded-r-lg p-4 mb-8 text-sm mt-0 mx-3 sm:mx-6">
              <div className="flex items-center gap-2 text-base font-bold text-green-800 pb-2">
                <HelpCircle className="w-4 h-4" />
                小贴士
              </div>
              <div className="text-base font-bold text-green-700 pt-2 pb-1">添加流动性：</div>
              <div className="text-sm text-green-700">提供流动性，可获得交易手续费分成(手续费为 0.3%)</div>
              <div className="text-base font-bold text-green-700 pt-2 pb-1">LP代币：</div>
              <div className="text-sm text-green-700">添加流动性后将获得 LP 代币，代表您在流动性池中的份额</div>
              <div className="text-base font-bold text-green-700 pt-2 pb-1">交易协议：</div>
              <div className="text-sm text-green-700">本交易功能基于 Uniswap V2 协议实现，合约代码为官方最新版本</div>
            </div>
          </TabsContent>

          <TabsContent value="liquidity-query">
            <LiquidityQueryPanel />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}

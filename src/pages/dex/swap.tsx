'use client';

import { useContext } from 'react';
import { HelpCircle } from 'lucide-react';

// my components
import Header from '@/src/components/Header';
import SwapPanel from '@/src/components/Dex/Swap';

// my contexts
import { TokenContext } from '@/src/contexts/TokenContext';

export default function SwapPage() {
  const { token: currentToken } = useContext(TokenContext) || {};

  return (
    <>
      <Header title="兑换代币" />
      <main className="flex-grow">
        <SwapPanel showCurrentToken={!!currentToken && !!currentToken.hasEnded} />
        <div className="bg-status-info-soft border-l-4 border-l-status-info-border rounded-r-lg p-4 mb-8 text-sm mt-0 m-6">
          <div className="flex items-center gap-2 text-base font-bold text-status-info pb-2">
            <HelpCircle className="w-4 h-4" />
            提示
          </div>
          <div className="text-base font-bold text-status-info pt-2 pb-1">交易协议：</div>
          <div className="text-sm text-status-info">本交易功能基于 Uniswap V2 协议实现，合约代码为官方最新版本</div>

          <div className="text-base font-bold text-status-info pt-2 pb-1">费用说明：</div>
          <div className="text-sm text-status-info">手续费为 0.3%，滑点上限为 0.5%</div>
        </div>
      </main>
    </>
  );
}

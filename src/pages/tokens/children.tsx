'use client';

import Header from '@/src/components/Header';
import TokenList from '@/src/components/Token/TokenList';
import { ArrowUpLeft } from 'lucide-react';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import { useContext } from 'react';
import { TokenContext } from '@/src/contexts/TokenContext';
import { NavigationUtils } from '@/src/lib/navigationUtils';

export default function Tokens() {
  const { token: currentToken } = useContext(TokenContext) || {};
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const rootParentTokenSymbol = process.env.NEXT_PUBLIC_FIRST_PARENT_TOKEN_SYMBOL || 'TKM20';
  const parentTokenSymbol = currentToken?.parentTokenSymbol;
  const hasReturnParentToken = Boolean(
    currentToken?.parentTokenAddress &&
      currentToken.parentTokenAddress !== '0x0000000000000000000000000000000000000000' &&
      parentTokenSymbol &&
      parentTokenSymbol !== rootParentTokenSymbol,
  );
  return (
    <>
      <Header title="代币列表" showBackButton={true} />
      <main className="flex-grow">
        <header className="flex justify-between items-center m-4">
          <h1 className="text-lg font-bold">{currentToken?.symbol ?? '当前代币'} 的子币列表</h1>
        </header>
        {currentToken?.address ? <TokenList parentTokenAddress={currentToken.address} /> : <LoadingIcon />}
        {hasReturnParentToken && parentTokenSymbol && (
          <button
            type="button"
            onClick={() =>
              NavigationUtils.redirectWithOverlay(
                `${basePath}/acting/?symbol=${parentTokenSymbol}`,
                '正在返回父币...',
              )
            }
            className="mx-4 mb-4 flex items-center justify-between rounded-lg border border-greyscale-200 bg-white px-4 py-3 text-sm font-medium text-greyscale-700 transition-colors hover:bg-greyscale-50"
          >
            <span className="inline-flex min-w-0 items-center gap-2">
              <ArrowUpLeft className="h-4 w-4 shrink-0 text-greyscale-500" />
              <span>返回父币</span>
            </span>
            <span className="ml-3 shrink-0 font-mono text-greyscale-500">{parentTokenSymbol}</span>
          </button>
        )}
      </main>
    </>
  );
}

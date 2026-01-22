'use client';

import Header from '@/src/components/Header';
import TokenList from '@/src/components/Token/TokenList';
import { useContext } from 'react';
import { TokenContext } from '@/src/contexts/TokenContext';

export default function Tokens() {
  const { token: currentToken, setToken } = useContext(TokenContext) || {};
  return (
    <>
      <Header title="代币列表" showBackButton={true} />
      <main className="flex-grow">
        <header className="flex justify-between items-center m-4">
          <h1 className="text-lg font-bold">{currentToken?.symbol} 的子币列表</h1>
        </header>
        <TokenList parentTokenAddress={currentToken?.address} />
      </main>
    </>
  );
}

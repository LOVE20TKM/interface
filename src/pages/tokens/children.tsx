'use client';

import Header from '@/src/components/Header';
import TokenList from '@/src/components/Token/TokenList';
import LoadingIcon from '@/src/components/Common/LoadingIcon';
import { useContext } from 'react';
import { TokenContext } from '@/src/contexts/TokenContext';

export default function Tokens() {
  const { token: currentToken } = useContext(TokenContext) || {};
  return (
    <>
      <Header title="代币列表" showBackButton={true} />
      <main className="flex-grow">
        <header className="flex justify-between items-center m-4">
          <h1 className="text-lg font-bold">{currentToken?.symbol ?? '当前代币'} 的子币列表</h1>
        </header>
        {currentToken?.address ? <TokenList parentTokenAddress={currentToken.address} /> : <LoadingIcon />}
      </main>
    </>
  );
}

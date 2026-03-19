'use client';
// src/components/Header.tsx

import Head from 'next/head';
import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { WalletButton } from '@/src/components/WalletButton';
import { Button } from '@/components/ui/button';
import { useAccount, useChainId } from 'wagmi';
import { useError } from '@/src/contexts/ErrorContext';
import { TokenContext } from '../contexts/TokenContext';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  backUrl?: string;
}

const Header: React.FC<HeaderProps> = ({ title, showBackButton = false, backUrl = '' }) => {
  const { address, status } = useAccount();
  const chainId = useChainId();
  const chainName = process.env.NEXT_PUBLIC_CHAIN_NAME ?? process.env.NEXT_PUBLIC_CHAIN;
  const { setError } = useError();
  const { token } = useContext(TokenContext) || {};
  const router = useRouter();

  // 钱包网络检测逻辑
  useEffect(() => {
    if (status !== 'connected') return; // 避免钱包尚未完成注入/授权时误判
    if (address && !chainId) {
      setError({ name: '钱包网络错误', message: `请切换到 ${chainName} 网络` });
    } else {
      setError(null);
    }
  }, [address, chainId, status, chainName, setError]);

  // 返回上一页处理函数
  const handleGoBack = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  // 兼容旧版浏览器的标题处理
  const pageTitle = token && token.symbol ? token.symbol : 'LOVE20';
  const metaName = token && token.symbol ? `${title} - ${token.symbol}` : title;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name={metaName} content="A Web3 DApp for LOVE20 token management" />
      </Head>

      <header className="flex justify-between items-center py-2 px-4">
        <div className="flex items-center">
          {(showBackButton || backUrl !== '') && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoBack}
              className="flex items-center space-x-2 px-3 py-1 text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
              title="返回上一页"
            >
              <span className="text-sm font-medium">&lt;&nbsp;返回</span>
            </Button>
          )}
        </div>
        <WalletButton />
      </header>

    </>
  );
};

export default Header;

'use client';
// src/components/Header.tsx

import Head from 'next/head';
import React, { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { WalletButton } from '@/src/components/WalletButton';
import { ErrorAlert } from '@/src/components/Common/ErrorAlert';
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

  // 记录上一次检测到的网络错误时间
  const [lastNetworkErrorTime, setLastNetworkErrorTime] = useState<number>(0);
  // 是否已经执行了刷新
  const [hasRefreshed, setHasRefreshed] = useState<boolean>(false);

  // 监听连接事件和错误
  useEffect(() => {
    // 在组件挂载时检查是否是自动刷新后的页面
    const wasAutoRefreshed = localStorage.getItem('networkAutoRefreshed');
    if (wasAutoRefreshed) {
      localStorage.removeItem('networkAutoRefreshed');
    }

    // 监听错误
    const handleError = (error: any) => {
      console.error('handleError:', error);

      // 特别检测 "f is not a function" 错误
      if (
        error &&
        error.message &&
        (error.message.includes('f is not a function') ||
          (error.message.includes('User rejected') && error.message.includes('Details:')))
      ) {
        const currentTime = Date.now();
        // 只有在最近30秒内没有自动刷新过才执行刷新
        if (currentTime - lastNetworkErrorTime > 30000 && !hasRefreshed) {
          setLastNetworkErrorTime(currentTime);
          setHasRefreshed(true);

          setTimeout(() => {
            localStorage.setItem('networkAutoRefreshed', 'true');
            window.location.reload();
          }, 2000);
        }
      }
    };

    // 使用 window.addEventListener 捕获全局错误
    window.addEventListener('error', (event) => {
      if (event.error && typeof event.error === 'object') {
        handleError(event.error);
      }
    });

    // 使用 window.onerror 捕获全局错误
    const originalOnError = window.onerror;
    window.onerror = function (message, source, lineno, colno, error) {
      handleError(error);
      return originalOnError ? originalOnError(message, source, lineno, colno, error) : false;
    };

    // 使用 Promise 捕获未处理的 Promise 错误
    window.addEventListener('unhandledrejection', (event) => {
      console.log('unhandledrejection:', event);
      handleError(event.reason);
    });

    return () => {
      // 清理事件监听器
      window.onerror = originalOnError;
      window.removeEventListener('unhandledrejection', (event) => {
        handleError(event.reason);
      });
    };
  }, [lastNetworkErrorTime, hasRefreshed]);

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

      <div className="px-4">
        <ErrorAlert />
      </div>
    </>
  );
};

export default Header;

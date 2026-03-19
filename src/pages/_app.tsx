import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import type { AppProps } from 'next/app';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import { config } from '@/src/wagmi';
import { ErrorProvider, useError } from '@/src/contexts/ErrorContext';
import { TokenProvider } from '@/src/contexts/TokenContext';
import { AppSidebar } from '@/src/components/Common/AppSidebar';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import ActionRewardNotifier from '@/src/components/Common/ActionRewardNotifier';
import GasBalanceNotifier from '@/src/components/Common/GasBalanceNotifier';
import { ErrorAlert } from '@/src/components/Common/ErrorAlert';
import { AppErrorBoundary } from '../components/Common/AppErrorBoundary';
import Footer from '@/src/components/Footer';
import { BottomNavigation } from '@/src/components/Common/BottomNavigation';
import { usePageRecovery } from '@/src/hooks/usePageRecovery';
import { extractErrorMessage, isUserCancellation, parseContractError } from '@/src/errors/contractErrorParser';
import * as Sentry from '@sentry/nextjs';

import 'core-js/stable';
import 'regenerator-runtime/runtime';

import '../styles/globals.css';

const initVConsole = () => {
  if (typeof window !== 'undefined') {
    // check saved debug value
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('debug');
    if (debugParam == 'true' || debugParam == 'false') {
      localStorage.setItem('debug', debugParam);
    }

    // check debug value
    const debugValue = localStorage.getItem('debug');
    if (debugValue === 'true') {
      import('vconsole').then((VConsole) => {
        const vConsole = new VConsole.default();
      });
    }
  }
};

const client = new QueryClient();

// 动态导入所有Web3相关组件，禁用SSR
const WagmiProvider = dynamic(() => import('wagmi').then((mod) => mod.WagmiProvider), {
  ssr: false,
});

// 创建一个客户端包装器组件
const ClientWrapper = dynamic(() => Promise.resolve(({ children }: { children: React.ReactNode }) => <>{children}</>), {
  ssr: false,
});

const GLOBAL_RUNTIME_ERROR_PATTERNS = [
  /^TypeError:/i,
  /^ReferenceError:/i,
  /^RangeError:/i,
  /^SyntaxError:/i,
  /^Error:/i,
  /Cannot read (?:properties|property)/i,
  /Maximum update depth exceeded/i,
  /Hydration failed/i,
  /Rendered more hooks than during the previous render/i,
];

const CONTRACT_ERROR_PATTERNS = [
  /execution reverted/i,
  /reverted with/i,
  /custom error/i,
  /insufficient funds/i,
  /failed to estimate gas/i,
  /cannot estimate gas/i,
  /rpc/i,
  /call exception/i,
  /0x[a-fA-F0-9]{8}/,
  /ERC20:/i,
  /User rejected/i,
  /User denied/i,
];

const isLikelyRuntimeError = (message: string) => GLOBAL_RUNTIME_ERROR_PATTERNS.some((pattern) => pattern.test(message));

const isLikelyContractError = (message: string) => CONTRACT_ERROR_PATTERNS.some((pattern) => pattern.test(message));

const buildGlobalErrorInfo = (error: unknown, fallbackName: string) => {
  const rawMessage = extractErrorMessage(error);

  if (isUserCancellation(rawMessage)) {
    return null;
  }

  if (!rawMessage || isLikelyRuntimeError(rawMessage)) {
    return {
      name: fallbackName,
      message: '页面发生异常，请刷新后重试',
    };
  }

  if (isLikelyContractError(rawMessage)) {
    const parsedError = parseContractError(error);
    if (parsedError) {
      return parsedError;
    }
  }

  return {
    name: fallbackName,
    message: rawMessage,
  };
};

const GlobalErrorBridge = () => {
  const { setError } = useError();

  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      const errorInfo = buildGlobalErrorInfo(event.error ?? event.message, '运行时错误');
      if (!errorInfo) return;
      setError(errorInfo);

      try {
        Sentry.captureException(event.error ?? new Error(event.message || errorInfo.message), {
          level: 'error',
          tags: {
            source: 'window.error',
          },
          extra: {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        });
      } catch (captureError) {
        console.warn('Sentry capture failed:', captureError);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorInfo = buildGlobalErrorInfo(event.reason, '异步错误');
      if (!errorInfo) return;
      setError(errorInfo);

      try {
        Sentry.captureException(event.reason instanceof Error ? event.reason : new Error(errorInfo.message), {
          level: 'error',
          tags: {
            source: 'window.unhandledrejection',
          },
          extra: {
            rawReason: extractErrorMessage(event.reason),
          },
        });
      } catch (captureError) {
        console.warn('Sentry capture failed:', captureError);
      }
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [setError]);

  return null;
};

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [navLoading, setNavLoading] = useState(false);

  // iOS钱包环境页面恢复功能
  usePageRecovery();

  useEffect(() => {
    setMounted(true);
    initVConsole();

    // 初始化客户端安全措施
    if (typeof window !== 'undefined') {
      import('@/src/lib/clientSecurity').then(({ initializeClientSecurity }) => {
        initializeClientSecurity();
      });
    }
  }, []);

  // 路由切换时显示全局加载遮罩
  useEffect(() => {
    const handleStart = (url: string) => {
      // 检查是否是外部链接跳转
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const isExternalRedirect = window.sessionStorage.getItem('love20_external_link_redirect');
        if (isExternalRedirect) {
          // 如果是外部链接跳转，不显示加载状态
          return;
        }
      }
      setNavLoading(true);
    };

    const handleDone = () => {
      setNavLoading(false);
      // 清除外部链接跳转标记
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem('love20_external_link_redirect');
      }
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleDone);
    router.events.on('routeChangeError', handleDone);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleDone);
      router.events.off('routeChangeError', handleDone);
    };
  }, [router.events]);

  // 处理页面可见性变化，清理可能残留的加载状态
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // 页面重新可见时，检查并清理加载状态
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.sessionStorage) {
            const isExternalRedirect = window.sessionStorage.getItem('love20_external_link_redirect');
            if (isExternalRedirect) {
              setNavLoading(false);
              window.sessionStorage.removeItem('love20_external_link_redirect');
            }
          }
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 在服务端或客户端未完成挂载时显示loading
  if (!mounted) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'hsl(var(--background))',
          zIndex: 9999,
          margin: 0,
          padding: 0,
        }}
      >
        <div
          style={{
            fontSize: '1.125rem',
            color: 'hsl(var(--foreground))',
            textAlign: 'center',
            padding: '0 1rem',
          }}
        >
          加载中...
        </div>
      </div>
    );
  }

  return (
    <ClientWrapper>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <LoadingOverlay isLoading={navLoading} text="网络加载中..." />
      <WagmiProvider config={config}>
        <QueryClientProvider client={client}>
          <ErrorProvider>
            <GlobalErrorBridge />
            <TokenProvider>
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="min-w-0">
                  <div className="min-h-screen bg-background flex flex-col pb-16 md:pb-0">
                    <Toaster
                      position="top-center"
                      toastOptions={{
                        style: {
                          background: '#000000',
                          color: '#FFFFFF',
                        },
                      }}
                    />
                    <div className="px-4 pt-4">
                      <ErrorAlert />
                    </div>
                    <GasBalanceNotifier />
                    <ActionRewardNotifier />
                    <AppErrorBoundary key={router.asPath}>
                      <Component {...pageProps} />
                    </AppErrorBoundary>
                    <Footer />
                    <BottomNavigation />
                  </div>
                </SidebarInset>
              </SidebarProvider>
            </TokenProvider>
          </ErrorProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ClientWrapper>
  );
}

export default MyApp;

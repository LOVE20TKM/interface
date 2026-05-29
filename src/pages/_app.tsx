import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import type { AppProps } from 'next/app';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

import { config } from '@/src/wagmi';
import { ErrorProvider, useError } from '@/src/contexts/ErrorContext';
import { GroupChatSyncProvider } from '@/src/contexts/GroupChatSyncContext';
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
import { extractErrorMessage } from '@/src/errors/contractErrorParser';
import { buildGlobalErrorInfo } from '@/src/errors/globalErrorInfo';
import { takeRouteLoadingSuppression } from '@/src/lib/routeLoading';
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
const NAV_LOADING_DELAY_MS = 240;

// 动态导入所有Web3相关组件，禁用SSR
const WagmiProvider = dynamic(() => import('wagmi').then((mod) => mod.WagmiProvider), {
  ssr: false,
});

// 创建一个客户端包装器组件
const ClientWrapper = dynamic(() => Promise.resolve(({ children }: { children: React.ReactNode }) => <>{children}</>), {
  ssr: false,
});

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
  const navLoadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isChatRoomPage = router.pathname === '/chat/room';
  const hideFooter = isChatRoomPage;

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
    const clearNavLoadingTimer = () => {
      if (navLoadingTimerRef.current) {
        clearTimeout(navLoadingTimerRef.current);
        navLoadingTimerRef.current = null;
      }
    };
    const stopNavLoading = () => {
      clearNavLoadingTimer();
      setNavLoading(false);
    };

    const handleStart = (url: string) => {
      stopNavLoading();
      if (takeRouteLoadingSuppression(url)) {
        return;
      }
      navLoadingTimerRef.current = setTimeout(() => {
        setNavLoading(true);
        navLoadingTimerRef.current = null;
      }, NAV_LOADING_DELAY_MS);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', stopNavLoading);
    router.events.on('routeChangeError', stopNavLoading);

    return () => {
      clearNavLoadingTimer();
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', stopNavLoading);
      router.events.off('routeChangeError', stopNavLoading);
    };
  }, [router.events]);

  useEffect(() => {
    if (!mounted) return;
    if (navLoadingTimerRef.current) {
      clearTimeout(navLoadingTimerRef.current);
      navLoadingTimerRef.current = null;
    }
    setNavLoading(false);
  }, [mounted, router.asPath]);

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
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <LoadingOverlay isLoading={navLoading} text="网络加载中..." />
      <WagmiProvider config={config}>
        <QueryClientProvider client={client}>
          <ErrorProvider>
            <GlobalErrorBridge />
            <GroupChatSyncProvider>
              <TokenProvider>
                <SidebarProvider>
                  <AppSidebar />
                  <SidebarInset className={cn('min-w-0', isChatRoomPage && 'h-svh min-h-0 overflow-hidden')}>
                    <div
                      className={cn(
                        'bg-background flex flex-col',
                        isChatRoomPage
                          ? 'h-svh min-h-0 overflow-hidden pb-0'
                          : 'min-h-screen pb-[var(--bottom-navigation-height)] md:pb-0',
                      )}
                    >
                      <Toaster
                        position="top-center"
                        toastOptions={{
                          style: {
                            background: '#000000',
                            color: '#FFFFFF',
                          },
                        }}
                      />
                      {!isChatRoomPage && (
                        <div className="px-4 pt-4">
                          <ErrorAlert />
                        </div>
                      )}
                      {!isChatRoomPage && <GasBalanceNotifier />}
                      {!isChatRoomPage && <ActionRewardNotifier />}
                      <AppErrorBoundary key={router.asPath}>
                        <Component {...pageProps} />
                      </AppErrorBoundary>
                      {!hideFooter && <Footer />}
                      <BottomNavigation />
                    </div>
                  </SidebarInset>
                </SidebarProvider>
              </TokenProvider>
            </GroupChatSyncProvider>
          </ErrorProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ClientWrapper>
  );
}

export default MyApp;

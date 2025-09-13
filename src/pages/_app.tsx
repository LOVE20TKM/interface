import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import type { AppProps } from 'next/app';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import { config } from '@/src/wagmi';
import { ErrorProvider } from '@/src/contexts/ErrorContext';
import { TokenProvider } from '@/src/contexts/TokenContext';
import { AppSidebar } from '@/src/components/Common/AppSidebar';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay';
import ActionRewardNotifier from '@/src/components/Common/ActionRewardNotifier';
import Footer from '@/src/components/Footer';
import { BottomNavigation } from '@/src/components/Common/BottomNavigation';

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

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [navLoading, setNavLoading] = useState(false);

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
    const handleStart = () => setNavLoading(true);
    const handleDone = () => setNavLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleDone);
    router.events.on('routeChangeError', handleDone);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleDone);
      router.events.off('routeChangeError', handleDone);
    };
  }, [router.events]);

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
      <LoadingOverlay isLoading={navLoading} text="网络加载中..." />
      <WagmiProvider config={config}>
        <QueryClientProvider client={client}>
          <TokenProvider>
            <SidebarProvider>
              <ErrorProvider>
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
                    <ActionRewardNotifier />
                    <Component {...pageProps} />
                    <Footer />
                    <BottomNavigation />
                  </div>
                </SidebarInset>
              </ErrorProvider>
            </SidebarProvider>
          </TokenProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ClientWrapper>
  );
}

export default MyApp;

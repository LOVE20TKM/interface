// src/contexts/TokenContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useTokenDetailBySymbol } from '@/src/hooks/contracts/useLOVE20TokenViewer';
import { isClient } from '@/src/lib/clientUtils';

// 定义 Token 类型
export interface Token {
  name: string;
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  hasEnded: boolean; //发射是否结束
  parentTokenAddress: `0x${string}`;
  parentTokenSymbol: string;
  parentTokenName: string;
  slTokenAddress: `0x${string}`;
  stTokenAddress: `0x${string}`;
  uniswapV2PairAddress: `0x${string}`;
  initialStakeRound: number;
}

// 定义 Context 的类型
export interface TokenContextType {
  token: Token | null;
  setToken: (token: Token) => void;
  clearToken: () => void;
}

// 创建 Context
export const TokenContext = createContext<TokenContextType | undefined>(undefined);

// 定义 Provider 的 Props 类型
interface TokenProviderProps {
  children: ReactNode;
}

// localstorage key
const CURRENT_TOKEN_KEY = (process.env.NEXT_PUBLIC_BASE_PATH || '') + '_currentToken';
const APP_VERSION_KEY = (process.env.NEXT_PUBLIC_BASE_PATH || '') + '_appVersion';

export const TokenProvider: React.FC<TokenProviderProps> = ({ children }) => {
  const router = useRouter();
  const [token, setToken] = useState<Token | null>(null);
  const [symbolToGetDetail, setSymbolToGetDetail] = useState<string | undefined>(undefined);
  const [isProviderReady, setIsProviderReady] = useState(false);
  const currentAppVersion = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';

  // 确保 Provider 准备就绪
  useEffect(() => {
    setIsProviderReady(true);
  }, []);

  const checkAndClearCache = () => {
    // 确保在客户端环境下执行
    if (!isClient()) return false;

    try {
      const storedVersion = localStorage.getItem(APP_VERSION_KEY);

      if (storedVersion !== currentAppVersion) {
        console.log(`currentAppVersion: ${storedVersion || 'null'} -> ${currentAppVersion} ...`);
        localStorage.clear();
        localStorage.setItem(APP_VERSION_KEY, currentAppVersion);
        return true;
      }
      return false;
    } catch (error) {
      console.error('ERROR checkAndClearCache:', error);
      return false;
    }
  };

  // 初始化时检查版本并清理缓存
  useEffect(() => {
    checkAndClearCache();
  }, []);

  // 使用 useEffect 来记录日志，避免在渲染过程中执行
  useEffect(() => {
    console.log('token', token);
  }, [token]);

  useEffect(() => {
    console.log('router.query.symbol', router.query.symbol);
  }, [router.query.symbol]);

  // Step 1. 获取当前token symbol: 从动态路由获取 symbol
  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const tokenSymbol = router.query.symbol as string;
    // symbol是首字母是大写，所以小写字母开头是path或page名称
    const ifNoSymbol = !tokenSymbol || tokenSymbol.charAt(0) === tokenSymbol.charAt(0).toLowerCase();

    try {
      const cacheCleared = checkAndClearCache();

      // 优先从本地缓存恢复（无论是否有 symbol，只要缓存可用）
      if (!cacheCleared && isClient()) {
        try {
          const storedToken = localStorage.getItem(CURRENT_TOKEN_KEY);
          if (storedToken) {
            const parsed = JSON.parse(storedToken);
            if (!parsed) return;
            const cachedToken = { ...parsed };
            delete cachedToken.voteOriginBlocks;
            // 情况1：无 symbol，则直接沿用最近一次的 token
            // 情况2：有 symbol，且与缓存一致，则直接使用缓存
            if (ifNoSymbol || (cachedToken && cachedToken.symbol === tokenSymbol)) {
              setToken(cachedToken);
              setSymbolToGetDetail(cachedToken.symbol || process.env.NEXT_PUBLIC_FIRST_TOKEN_SYMBOL || '');
              return; // 先使用缓存渲染，随后通过 symbolToGetDetail 刷新链上状态
            }
          }
        } catch (error) {
          console.error('Failed to load token from localStorage:', error);
        }
      }

      // 从 路由symbol 加载 token（当token发生变化时也会重新加载）
      if (tokenSymbol && tokenSymbol.length > 0 && !ifNoSymbol) {
        setSymbolToGetDetail(tokenSymbol as string); //有指定token
      } else {
        // 没有指定 symbol 时，不再主动清空 token；
        // 若没有缓存，则回退到默认 token（通过环境变量配置）
        setSymbolToGetDetail(process.env.NEXT_PUBLIC_FIRST_TOKEN_SYMBOL || '');
      }
    } catch (error) {
      console.error('Failed to load token from localStorage:', error);
    }
  }, [router.isReady, router.query.symbol]);

  // Step 3. 如果localstorage没有token缓存，则从合约获取 token 信息
  const shouldFetchTokenDetail = isProviderReady && !!symbolToGetDetail;
  const {
    token: tokenInfoBySymbol,
    launchInfo: launchInfoBySymbol,
    error: errorBySymbol,
  } = useTokenDetailBySymbol(shouldFetchTokenDetail ? symbolToGetDetail : '');

  // 合约返回成功，更新 token
  useEffect(() => {
    if (tokenInfoBySymbol && launchInfoBySymbol) {
      setToken({
        name: tokenInfoBySymbol.name,
        symbol: tokenInfoBySymbol.symbol,
        address: tokenInfoBySymbol.tokenAddress,
        decimals: Number(tokenInfoBySymbol.decimals),
        hasEnded: launchInfoBySymbol.hasEnded,
        parentTokenAddress: launchInfoBySymbol.parentTokenAddress,
        parentTokenName: tokenInfoBySymbol.parentTokenName,
        parentTokenSymbol: tokenInfoBySymbol.parentTokenSymbol,
        slTokenAddress: tokenInfoBySymbol.slAddress,
        stTokenAddress: tokenInfoBySymbol.stAddress,
        uniswapV2PairAddress: tokenInfoBySymbol.uniswapV2PairAddress,
        initialStakeRound: Number(tokenInfoBySymbol.initialStakeRound),
      } as Token);
    }
  }, [tokenInfoBySymbol, launchInfoBySymbol]);

  // 合约返回错误
  useEffect(() => {
    if (errorBySymbol) {
      console.error('useTokenDetailBySymbol error:', errorBySymbol);
    }
  }, [errorBySymbol]);

  // Step 4. 当 token 变化时，更新 Local Storage
  useEffect(() => {
    if (!isClient()) return;

    try {
      if (token) {
        localStorage.setItem(CURRENT_TOKEN_KEY, JSON.stringify(token));
      }
    } catch (error) {
      console.error('Failed to save token to localStorage:', error);
    }
  }, [token]);

  // 监听 storage 事件以同步多个标签页
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === CURRENT_TOKEN_KEY) {
        if (event.newValue) {
          setToken(JSON.parse(event.newValue));
        } else {
          setToken(null);
        }
      } else if (event.key === APP_VERSION_KEY) {
        if (event.newValue !== event.oldValue) {
          clearToken();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const clearToken = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CURRENT_TOKEN_KEY);
      setToken(null);
      console.log('clearToken~~~~');
    }
  };

  return <TokenContext.Provider value={{ token, setToken, clearToken }}>{children}</TokenContext.Provider>;
};

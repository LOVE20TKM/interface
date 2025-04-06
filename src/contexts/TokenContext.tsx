// src/contexts/TokenContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useTokenDetailBySymbol } from '@/src/hooks/contracts/useLOVE20DataViewer';
import { useOriginBlocks } from '@/src/hooks/contracts/useLOVE20Vote';

// 定义 Token 类型
export interface Token {
  name: string;
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  hasEnded: boolean; //发射是否结束
  parentTokenAddress: `0x${string}`;
  parentTokenSymbol: string;
  slTokenAddress: `0x${string}`;
  stTokenAddress: `0x${string}`;
  initialStakeRound: number;
  voteOriginBlocks: number;
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

export const TokenProvider: React.FC<TokenProviderProps> = ({ children }) => {
  const router = useRouter();
  const [token, setToken] = useState<Token | null>(null);
  const [symbolToGetDetail, setSymbolToGetDetail] = useState<string | undefined>(undefined);

  // Step 1. 获取当前token symbol: 从动态路由获取 symbol
  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    initTokenBySymbol(router.query.symbol as string);
  }, [router.isReady, router.query.symbol]);

  // Step 2. 根据 symbol 初始化 token，逻辑：
  // (1)如果localstorage有该tokenSymbol缓存，直接从缓存中加载（不设置symbolToGetDetail）
  // (2)否则设置symbolToGetDetail，用hook从合约获取token信息
  const initTokenBySymbol = (tokenSymbol: string) => {
    // symbol是首字母是大写，所以小写字母开头是path或page名称
    const ifNoSymbol = !tokenSymbol || tokenSymbol.charAt(0) === tokenSymbol.charAt(0).toLowerCase();

    try {
      if (ifNoSymbol) {
        // 没有指定token时, 清掉 localStorage。这个是解决协议地址变化，导致token缓存出错。回头看看可不可以优化。
        localStorage.removeItem('currentToken');
      } else {
        // 从 Local Storage 加载 token
        const storedToken = localStorage.getItem('currentToken');
        if (storedToken && JSON.parse(storedToken)) {
          const _token = JSON.parse(storedToken);
          if (ifNoSymbol || tokenSymbol === _token.symbol) {
            setToken(_token);
            return;
          }
        }
      }

      // 从 路由symbol 加载 token
      if (tokenSymbol && tokenSymbol.length > 0 && !ifNoSymbol) {
        setSymbolToGetDetail(tokenSymbol as string); //有指定token
      } else {
        setSymbolToGetDetail(process.env.NEXT_PUBLIC_FIRST_TOKEN_SYMBOL || ''); //没有指定token时,用默认token
      }
    } catch (error) {
      console.error('Failed to load token from localStorage:', error);
    }
  };

  // Step 3. 如果localstorage没有token缓存，则从合约获取 token 信息
  const {
    token: tokenInfoBySymbol,
    launchInfo: launchInfoBySymbol,
    error: errorBySymbol,
  } = useTokenDetailBySymbol(symbolToGetDetail as string);

  // 合约返回成功，更新 token
  useEffect(() => {
    if (tokenInfoBySymbol && launchInfoBySymbol) {
      setToken(
        (prevToken) =>
          ({
            ...(prevToken || {}),
            name: tokenInfoBySymbol.name,
            symbol: tokenInfoBySymbol.symbol,
            address: tokenInfoBySymbol.tokenAddress,
            decimals: Number(tokenInfoBySymbol.decimals),
            hasEnded: launchInfoBySymbol.hasEnded,
            parentTokenAddress: launchInfoBySymbol.parentTokenAddress,
            parentTokenSymbol: tokenInfoBySymbol.parentTokenSymbol,
            slTokenAddress: tokenInfoBySymbol.slAddress,
            stTokenAddress: tokenInfoBySymbol.stAddress,
            initialStakeRound: Number(tokenInfoBySymbol.initialStakeRound),
            voteOriginBlocks: prevToken === null ? 0 : prevToken.voteOriginBlocks,
          } as Token),
      );
    }
  }, [tokenInfoBySymbol, launchInfoBySymbol]);

  // 合约返回错误
  useEffect(() => {
    if (errorBySymbol) {
      console.error('useTokenDetailBySymbol error:', errorBySymbol);
    }
  }, [errorBySymbol]);

  // Step 4. 获取投票轮开始区块
  const { originBlocks } = useOriginBlocks(!!token && !token.voteOriginBlocks);
  useEffect(() => {
    if (originBlocks) {
      setToken(
        (prevToken) =>
          ({
            ...(prevToken || {}),
            voteOriginBlocks: originBlocks ? Number(originBlocks) : 0,
          } as Token),
      );
    }
  }, [originBlocks]);

  // Step 5. 当 token 变化时，更新 Local Storage
  useEffect(() => {
    try {
      if (token) {
        localStorage.setItem('currentToken', JSON.stringify(token));
      }
    } catch (error) {
      console.error('Failed to save token to localStorage:', error);
    }
  }, [token]);

  // 监听 storage 事件以同步多个标签页
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'currentToken') {
        if (event.newValue) {
          setToken(JSON.parse(event.newValue));
        } else {
          setToken(null);
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
      localStorage.removeItem('currentToken');
      setToken(null);
      console.log('clearToken~~~~');
    }
  };

  return <TokenContext.Provider value={{ token, setToken, clearToken }}>{children}</TokenContext.Provider>;
};

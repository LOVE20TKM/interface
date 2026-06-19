'use client';

import React, { useState, useRef, useEffect, useLayoutEffect, useContext } from 'react';
import { useAccount, useBalance, useConnect, useDisconnect, useChainId } from 'wagmi';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Wallet, Copy, LogOut, ChevronDown, Check, Loader2, ArrowUpLeft, List, Pin, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { config } from '@/src/wagmi';
import { isTukeWallet } from '@/src/lib/tukeWalletUtils';
import { formatTokenAmount } from '@/src/lib/format';
import { useError } from '@/src/contexts/ErrorContext';
import { Token, TokenContext } from '@/src/contexts/TokenContext';
import { isGroupDefaultsEnabled, useDefaultGroupOf } from '@/src/hooks/extension/base/contracts/useGroupDefaults';
import { useIsOnTargetChain } from '@/src/hooks/useIsOnTargetChain';
import { NavigationUtils } from '@/src/lib/navigationUtils';
import { useChildTokensCount } from '@/src/hooks/contracts/useLOVE20Launch';
import { getDefaultTokenSwitchPathname, getTokenSwitchRule } from '@/src/config/tokenSwitchRoutes';

interface WalletButtonProps {
  className?: string;
}

const PINNED_TOKEN_LIMIT = 5;
const RECENT_TOKEN_LIMIT = 3;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const RECENT_TOKENS_KEY = (process.env.NEXT_PUBLIC_BASE_PATH || '') + '_recentTokens';

type RecentToken = Pick<
  Token,
  | 'name'
  | 'symbol'
  | 'address'
  | 'hasEnded'
  | 'parentTokenAddress'
  | 'parentTokenSymbol'
  | 'parentTokenName'
> & {
  pinned: boolean;
  lastVisitedAt: number;
};

const isValidRecentToken = (value: unknown): value is RecentToken => {
  const item = value as Partial<RecentToken>;
  return (
    !!item &&
    typeof item === 'object' &&
    typeof item.symbol === 'string' &&
    item.symbol.length > 0 &&
    typeof item.address === 'string' &&
    item.address.startsWith('0x')
  );
};

const sortAndLimitRecentTokens = (items: RecentToken[]) => {
  const bySymbol = new Map<string, RecentToken>();

  items.forEach((item) => {
    const previous = bySymbol.get(item.symbol);
    if (!previous || item.lastVisitedAt >= previous.lastVisitedAt) {
      bySymbol.set(item.symbol, {
        ...previous,
        ...item,
        pinned: Boolean(previous?.pinned || item.pinned),
      });
    }
  });

  const sorted = Array.from(bySymbol.values()).sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.lastVisitedAt - a.lastVisitedAt;
  });

  const pinned = sorted.filter((item) => item.pinned).slice(0, PINNED_TOKEN_LIMIT);
  const recent = sorted.filter((item) => !item.pinned).slice(0, RECENT_TOKEN_LIMIT);

  return [...pinned, ...recent];
};

const readRecentTokens = (): RecentToken[] => {
  try {
    const raw = localStorage.getItem(RECENT_TOKENS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return sortAndLimitRecentTokens(parsed.filter(isValidRecentToken));
  } catch (error) {
    console.error('读取最近代币失败:', error);
    return [];
  }
};

const saveRecentTokens = (tokens: RecentToken[]) => {
  try {
    localStorage.setItem(RECENT_TOKENS_KEY, JSON.stringify(sortAndLimitRecentTokens(tokens)));
  } catch (error) {
    console.error('保存最近代币失败:', error);
  }
};

const snapshotRecentToken = (token: Token, previous?: RecentToken): RecentToken => ({
  name: token.name,
  symbol: token.symbol,
  address: token.address,
  hasEnded: token.hasEnded,
  parentTokenAddress: token.parentTokenAddress,
  parentTokenSymbol: token.parentTokenSymbol,
  parentTokenName: token.parentTokenName,
  pinned: Boolean(previous?.pinned),
  lastVisitedAt: Date.now(),
});

const upsertRecentToken = (items: RecentToken[], token: Token) => {
  const previous = items.find((item) => item.symbol === token.symbol);
  return sortAndLimitRecentTokens([
    snapshotRecentToken(token, previous),
    ...items.filter((item) => item.symbol !== token.symbol),
  ]);
};

export function WalletButton({ className }: WalletButtonProps = {}) {
  const router = useRouter();
  const tokenContext = useContext(TokenContext);
  const token = tokenContext?.token;
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const chainId = useChainId();
  const targetChainId = config.chains[0]?.id;
  const isOnTargetChain = useIsOnTargetChain();
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { data: balance, error: balanceError } = useBalance({
    address,
    chainId,
  });
  const { connect, connectors, error: connectError, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);
  const [walletChainId, setWalletChainId] = useState<number | null>(null);
  const [isNetworkMismatch, setIsNetworkMismatch] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [ethereumReady, setEthereumReady] = useState(typeof window !== 'undefined' && !!window.ethereum);
  const [isCheckingEthereum, setIsCheckingEthereum] = useState(typeof window !== 'undefined' && !window.ethereum);
  const [recentTokens, setRecentTokens] = useState<RecentToken[]>([]);
  const [isTokenMenuOpen, setIsTokenMenuOpen] = useState(false);
  const { setError } = useError();
  const { defaultGroupId, defaultGroupName, hasDefaultGroup } = useDefaultGroupOf(
    address,
    isGroupDefaultsEnabled && isConnected && isOnTargetChain,
  );
  const shouldReadChildTokens = !!token?.address && token.address !== ZERO_ADDRESS && isOnTargetChain;
  const { childTokenNum } = useChildTokensCount(token?.address, shouldReadChildTokens);

  // 跟踪组件是否已挂载，避免在渲染期间更新状态
  const mountedRef = useRef(false);

  // 获取注入式连接器
  const injectedConnector = connectors.find((c) => c.id === 'injected') ?? connectors[0];
  const chainName = process.env.NEXT_PUBLIC_CHAIN_NAME ?? process.env.NEXT_PUBLIC_CHAIN;

  // 检测钱包当前网络
  const detectWalletNetwork = async () => {
    // 检查组件是否已挂载，避免在卸载后更新状态
    if (!mountedRef.current) return null;
    if (typeof window === 'undefined' || !window.ethereum) return null;

    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const numericChainId = parseInt(chainId, 16);

      // 再次检查组件是否仍然挂载
      if (!mountedRef.current) return null;

      setWalletChainId(numericChainId);

      // 检查网络是否匹配
      const isMismatch = targetChainId ? numericChainId !== targetChainId : false;
      setIsNetworkMismatch(isMismatch);

      return numericChainId;
    } catch (error) {
      console.error('检测钱包网络失败:', error);
      return null;
    }
  };

  // 网络切换函数
  const switchToValidNetwork = async (targetChainId: number) => {
    if (!targetChainId) {
      toast.error('未配置目标网络');
      return false;
    }

    // 检查组件是否已挂载
    if (!mountedRef.current) return false;

    try {
      setIsSwitchingNetwork(true);

      if (!window.ethereum) {
        toast.error('未找到钱包');
        return false;
      }

      const targetChain = config.chains[0];
      if (!targetChain) {
        toast.error('未配置目标网络');
        return false;
      }

      const validChainId = '0x' + targetChainId.toString(16);
      console.log('切换到网络:', targetChainId, validChainId);

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: validChainId }],
      });

      // 检查组件是否仍然挂载
      if (!mountedRef.current) return false;

      toast.success(`已连接到 ${chainName}`);

      // 重新检测网络
      await detectWalletNetwork();
      return true;
    } catch (error: any) {
      // 检查组件是否仍然挂载
      if (!mountedRef.current) return false;

      console.log('网络切换错误:', error);

      // 链未添加到钱包，尝试添加
      if (error.code === 4902 || error.code === -32603) {
        try {
          const targetChain = config.chains[0];
          const addParams = {
            chainId: '0x' + targetChainId.toString(16),
            chainName: chainName,
            nativeCurrency: targetChain.nativeCurrency,
            rpcUrls: targetChain.rpcUrls.default.http,
            blockExplorerUrls: targetChain.blockExplorers ? [targetChain.blockExplorers.default.url] : undefined,
          };

          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [addParams],
          });

          // 检查组件是否仍然挂载
          if (!mountedRef.current) return false;

          toast.success(`已添加并连接到 ${chainName}`);

          // 重新检测网络
          await detectWalletNetwork();
          return true;
        } catch (addError: any) {
          // 检查组件是否仍然挂载
          if (!mountedRef.current) return false;

          console.error('添加网络失败:', addError);
          toast.error(`添加网络失败: ${addError.message || '未知错误'}`);
          return false;
        }
      } else if (error.code === 4001) {
        toast.error('用户取消了网络切换');
        return false;
      } else {
        toast.error(`网络切换失败: ${error.message || '未知错误'}`);
        return false;
      }
    } finally {
      // 只在组件仍然挂载时更新状态
      if (mountedRef.current) {
        setIsSwitchingNetwork(false);
      }
    }
  };

  // 处理网络切换
  const handleSwitchNetwork = async () => {
    if (!targetChainId) {
      toast.error('未配置目标网络');
      return;
    }

    await switchToValidNetwork(targetChainId);
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-6)}`;
  };

  const handleConnect = async () => {
    try {
      // 安全检查：确保在客户端环境
      if (typeof window === 'undefined') {
        toast.error('请在浏览器中操作');
        return;
      }

      if (isCheckingEthereum) {
        toast.error('钱包正在加载中，请稍后重试');
        return;
      }

      if (!window.ethereum) {
        toast.error('未检测到钱包，请先安装或打开钱包');
        return;
      }

      if (!injectedConnector) {
        toast.error('未找到可用的钱包连接器');
        return;
      }

      // 防止重复连接
      if (isPending || isConnecting) {
        toast.error('连接请求正在处理中，请稍候');
        return;
      }

      // 执行连接
      connect({ connector: injectedConnector });
    } catch (error: any) {
      console.error('连接钱包失败:', error);

      // 详细的错误处理
      if (error?.name === 'UserRejectedRequestError') {
        toast.error('用户取消了连接请求');
      } else if (error?.message?.includes('Connector not found')) {
        toast.error('未找到钱包，请确保已安装并解锁钱包');
      } else {
        toast.error('连接钱包失败，请重试');
      }
    }
  };

  const handleDisconnect = () => {
    try {
      disconnect();
    } catch (error) {
      console.error('断开连接失败:', error);
      toast.error('断开连接失败');
    }
  };

  const handleCopyAddress = (text: string, result: boolean) => {
    if (result) {
      setCopied(true);
      toast.success('地址已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('复制失败');
    }
  };

  const routeSymbol = typeof router.query.symbol === 'string' ? router.query.symbol : undefined;
  const isRouteTokenSymbol = !!routeSymbol && routeSymbol.charAt(0) !== routeSymbol.charAt(0).toLowerCase();
  const displayTokenSymbol = isRouteTokenSymbol ? routeSymbol : token?.symbol || 'TOKEN';
  const isTokenSymbolPending = isRouteTokenSymbol && token?.symbol !== routeSymbol;

  const handleTokenMenuOpenChange = (open: boolean) => {
    setIsTokenMenuOpen(isTokenSymbolPending ? false : open);
  };

  const myLove20NftHref = `${basePath}/group/groupids/`;
  const tokenInfoHref = token?.symbol ? `${basePath}/token/?symbol=${token.symbol}` : '';
  const childTokensHref = token?.symbol ? `${basePath}/tokens/children/?symbol=${token.symbol}` : '';
  const rootParentTokenSymbol = process.env.NEXT_PUBLIC_FIRST_PARENT_TOKEN_SYMBOL || 'TKM20';
  const hasReturnParentToken = Boolean(
    token?.parentTokenAddress &&
      token.parentTokenAddress !== ZERO_ADDRESS &&
      token.parentTokenSymbol &&
      token.parentTokenSymbol !== rootParentTokenSymbol,
  );
  const parentTokenHref = hasReturnParentToken ? `${basePath}/acting/?symbol=${token?.parentTokenSymbol}` : '';
  const isTokenInfoDisabled = isTokenSymbolPending || !tokenInfoHref;
  const isChildTokensDisabled = isTokenSymbolPending || !childTokensHref || !isOnTargetChain || childTokenNum === BigInt(0);
  const isReturnParentDisabled = isTokenSymbolPending || !parentTokenHref;
  const nativeBalanceValue = balance ? formatTokenAmount(balance.value) : '0';
  const nativeBalanceSymbol = balance?.symbol || process.env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL || 'TKM';

  const goToRecentToken = (recentToken: RecentToken) => {
    setIsTokenMenuOpen(false);

    const rule = getTokenSwitchRule(router.pathname);
    const shouldStay = rule?.mode === 'stay';
    const pathname = rule?.mode === 'redirect' ? rule.to : shouldStay ? router.pathname : getDefaultTokenSwitchPathname(recentToken.hasEnded);

    router.replace(
      {
        pathname,
        query: shouldStay ? { ...router.query, symbol: recentToken.symbol } : { symbol: recentToken.symbol },
      },
      undefined,
      { shallow: shouldStay, scroll: false },
    );
  };

  const toggleRecentTokenPinned = (symbol: string) => {
    const target = recentTokens.find((item) => item.symbol === symbol);
    if (!target) return;

    const isPinning = !target.pinned;
    const pinnedCount = recentTokens.filter((item) => item.pinned).length;
    if (isPinning && pinnedCount >= PINNED_TOKEN_LIMIT) {
      toast.error(`最多锚定 ${PINNED_TOKEN_LIMIT} 个代币`);
      return;
    }

    setRecentTokens((prev) => {
      const next = sortAndLimitRecentTokens(
        prev.map((item) =>
          item.symbol === symbol
            ? {
                ...item,
                pinned: !item.pinned,
                lastVisitedAt: Date.now(),
              }
            : item,
        ),
      );
      saveRecentTokens(next);
      return next;
    });
  };

  const goToChildTokensPage = () => {
    if (isChildTokensDisabled) {
      toast.error(childTokenNum === BigInt(0) ? '当前代币暂无子币' : '当前代币尚未加载');
      return;
    }

    NavigationUtils.redirectWithOverlay(childTokensHref, '正在打开子币列表...');
  };

  const goToTokenInfoPage = () => {
    if (isTokenInfoDisabled) {
      toast.error('当前代币尚未加载');
      return;
    }

    NavigationUtils.redirectWithOverlay(tokenInfoHref, '正在打开代币信息...');
  };

  const goToParentTokenPage = () => {
    if (isReturnParentDisabled) {
      toast.error('当前代币没有可返回的父币');
      return;
    }

    NavigationUtils.redirectWithOverlay(parentTokenHref, '正在返回父币...');
  };

  const goToMyLove20NftPage = () => {
    NavigationUtils.redirectWithOverlay(myLove20NftHref, '正在打开我的NFT...');
  };

  useEffect(() => {
    setRecentTokens(readRecentTokens());
  }, []);

  useEffect(() => {
    if (isTokenSymbolPending) {
      setIsTokenMenuOpen(false);
    }
  }, [isTokenSymbolPending]);

  useEffect(() => {
    if (!token?.symbol || !token.address || token.address === ZERO_ADDRESS) return;

    setRecentTokens((prev) => {
      const next = upsertRecentToken(prev, token);
      saveRecentTokens(next);
      return next;
    });
  }, [
    token?.address,
    token?.hasEnded,
    token?.name,
    token?.parentTokenAddress,
    token?.parentTokenName,
    token?.parentTokenSymbol,
    token?.symbol,
  ]);

  // 处理连接错误
  React.useEffect(() => {
    if (!mountedRef.current) return;

    if (connectError) {
      // 延迟显示错误，确保在渲染完成后执行
      const timeoutId = setTimeout(() => {
        if (!mountedRef.current) return;

        if (connectError.message.includes('User rejected')) {
          toast.error('用户取消了连接请求');
        } else if (connectError.message.includes('already pending')) {
          toast.error('已有连接请求在处理中');
        } else {
          toast.error('连接失败: ' + connectError.message);
        }
      }, 0);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [connectError]);

  useEffect(() => {
    if (balanceError) {
      setError({
        name: '余额查询失败',
        message: '无法读取钱包余额，请检查网络后重试',
      });
    }
  }, [balanceError, setError]);

  // 监听连接成功事件并切换网络
  const prevConnectedRef = useRef(isConnected);
  useEffect(() => {
    // 检查组件是否已挂载
    if (!mountedRef.current) {
      prevConnectedRef.current = isConnected;
      return;
    }

    const handleNetworkCheck = async () => {
      // 只在从未连接变为已连接时处理
      if (!prevConnectedRef.current && isConnected && address) {
        // 再次检查组件是否仍然挂载
        if (!mountedRef.current) return;

        if (chainId) {
          const chainName = process.env.NEXT_PUBLIC_CHAIN_NAME || config.chains[0]?.name || '目标网络';
          const switched = await switchToValidNetwork(chainId);

          // 检查组件是否仍然挂载
          if (!mountedRef.current) return;

          if (!switched) {
            toast.error(`网络切换失败，请手动切换到${chainName}`);
          }
        }
      }
    };

    // 延迟执行，确保在渲染完成后执行
    const timeoutId = setTimeout(() => {
      if (!isTukeWallet() && mountedRef.current) {
        handleNetworkCheck();
      }
    }, 0);

    prevConnectedRef.current = isConnected;

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isConnected, address, chainId]);

  // 标记组件已挂载
  useLayoutEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 监听钱包网络变化
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    if (!mountedRef.current) return;

    const handleChainChanged = async (chainId: string) => {
      // 检查组件是否仍然挂载
      if (!mountedRef.current) return;

      console.log('钱包网络已切换:', chainId);
      const numericChainId = parseInt(chainId, 16);
      setWalletChainId(numericChainId);

      // 检查网络是否匹配
      const isMismatch = targetChainId ? numericChainId !== targetChainId : false;
      setIsNetworkMismatch(isMismatch);

      if (isMismatch) {
        toast.error(`网络不匹配，请及时切换`);
      }
    };

    const handleAccountsChanged = async (accounts: string[]) => {
      // 检查组件是否仍然挂载
      if (!mountedRef.current) return;

      console.log('钱包账户已切换:', accounts);
      if (accounts.length === 0) {
        // 某些钱包 WebView 在特定域名下可能发出虚假的空账户事件
        // 二次确认：主动查询 eth_accounts 验证是否真的断开
        try {
          const currentAccounts = await window.ethereum?.request({ method: 'eth_accounts' });
          if (currentAccounts && currentAccounts.length > 0) {
            console.log('accountsChanged 收到空数组，但 eth_accounts 仍有账户，忽略此事件');
            return;
          }
        } catch (e) {
          console.warn('二次确认 eth_accounts 失败:', e);
        }
        // 确认确实断开了
        disconnect();
        setWalletChainId(null);
        setIsNetworkMismatch(false);
      } else {
        // 账户切换 - 检查地址是否真的变化了
        const newAddress = accounts[0]?.toLowerCase();
        const currentAddress = address?.toLowerCase();

        if (newAddress && newAddress !== currentAddress) {
          // 地址确实变化了，显示提示
          toast.success(`账户已切换: ${shortenAddress(accounts[0])}`);
        }

        // 重新检测网络（wagmi 会自动更新账户状态）
        await detectWalletNetwork();
      }
    };

    // 添加事件监听器
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('accountsChanged', handleAccountsChanged);

    // 延迟初始网络检测，确保在渲染完成后执行
    // 使用 setTimeout 将状态更新推迟到下一个事件循环
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    if (isConnected && mountedRef.current) {
      timeoutId = setTimeout(() => {
        if (mountedRef.current) {
          detectWalletNetwork();
        }
      }, 0);
    }

    return () => {
      // 清理定时器
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // 清理事件监听器
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [isConnected, targetChainId]);

  // 异步检测钱包注入（兼容 TUKE 等 WebView 钱包注入延迟）
  useEffect(() => {
    if (ethereumReady || !isCheckingEthereum) return;
    if (typeof window === 'undefined') return;

    // 方式1: 监听 ethereum#initialized 事件
    const handler = () => {
      if (window.ethereum) {
        setEthereumReady(true);
        setIsCheckingEthereum(false);
      }
    };
    window.addEventListener('ethereum#initialized', handler);

    // 方式2: 轮询兜底，最多等 5 秒（20×250ms）
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.ethereum) {
        setEthereumReady(true);
        setIsCheckingEthereum(false);
        clearInterval(interval);
      }
      if (attempts >= 20) {
        setIsCheckingEthereum(false);
        clearInterval(interval);
      }
    }, 250);

    return () => {
      window.removeEventListener('ethereum#initialized', handler);
      clearInterval(interval);
    };
  }, [ethereumReady, isCheckingEthereum]);

  // 加载状态
  const isLoading = isConnecting || isReconnecting || isPending;
  const visibleRecentTokens = recentTokens.filter((recentToken) => recentToken.symbol !== token?.symbol);

  // 如果网络不匹配，显示网络错误按钮
  if (isConnected && isNetworkMismatch) {
    return (
      <Button
        onClick={handleSwitchNetwork}
        disabled={isSwitchingNetwork}
        className={cn(
          'bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200',
          className,
        )}
      >
        {isSwitchingNetwork ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            切换网络中...
          </>
        ) : (
          <>网络错误，请切换</>
        )}
      </Button>
    );
  }

  if (!isConnected) {
    return (
      <Button
        onClick={handleConnect}
        disabled={isLoading}
        className={cn(
          'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200',
          className,
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            连接中...
          </>
        ) : isCheckingEthereum ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            检测钱包中...
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4 mr-2" />
            连接钱包
          </>
        )}
      </Button>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex min-h-[48px] w-fit min-w-0 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border bg-white/60 backdrop-blur-sm transition-all duration-200 hover:border-blue-300 sm:max-w-[360px]',
        className,
      )}
    >
      <DropdownMenu open={isTokenSymbolPending ? false : isTokenMenuOpen} onOpenChange={handleTokenMenuOpenChange}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={isTokenSymbolPending}
            aria-busy={isTokenSymbolPending}
            className="flex min-h-[48px] max-w-[145px] shrink-0 items-center border-r border-gray-200 px-3 py-1.5 text-left transition-colors hover:bg-blue-50/50 focus-visible:bg-blue-50/50 focus-visible:outline-none disabled:cursor-wait disabled:hover:bg-transparent"
            title={isTokenSymbolPending ? '正在切换代币' : '最近访问代币'}
          >
            <span className="inline-flex h-8 min-w-0 max-w-full items-center justify-center gap-1.5 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 px-2.5 text-sm font-bold text-white">
              <span className="truncate">{displayTokenSymbol}</span>
              {isTokenSymbolPending && <Loader2 className="h-3 w-3 shrink-0 animate-spin" />}
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="rounded-md border p-0.5 shadow-lg"
          style={{ width: '10rem', minWidth: '10rem' }}
        >
          <div className="px-2 py-1 text-xs font-medium text-gray-500">最近访问</div>
          <div className="space-y-1">
            {visibleRecentTokens.length > 0 ? (
              visibleRecentTokens.map((recentToken) => {
                return (
                  <div
                    key={recentToken.symbol}
                    className="flex min-w-0 items-center gap-0.5 rounded-md transition-colors hover:bg-gray-50"
                  >
                    <DropdownMenuItem
                      className="flex min-h-12 min-w-0 flex-1 items-center rounded-md px-2 py-2.5 text-left focus:bg-gray-50 focus:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      onSelect={() => goToRecentToken(recentToken)}
                      title={recentToken.symbol}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate font-mono text-sm font-medium text-gray-900">
                            {recentToken.symbol}
                          </span>
                        </span>
                      </span>
                    </DropdownMenuItem>
                    <button
                      type="button"
                      className={cn(
                        'mr-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-white hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300',
                        recentToken.pinned && 'text-blue-600',
                      )}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        toggleRecentTokenPinned(recentToken.symbol);
                      }}
                      title={recentToken.pinned ? '取消锚定' : '锚定代币'}
                      aria-label={recentToken.pinned ? `取消锚定 ${recentToken.symbol}` : `锚定 ${recentToken.symbol}`}
                    >
                      <Pin className={cn('h-4 w-4', recentToken.pinned && 'fill-current')} />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="px-2 py-3 text-center text-sm text-gray-400">暂无其他访问记录</div>
            )}
          </div>

          <DropdownMenuSeparator className="my-1" />

          <DropdownMenuItem
            disabled={isTokenInfoDisabled}
            onClick={goToTokenInfoPage}
            className="min-h-12 rounded-md px-2 py-2.5 text-sm text-gray-700 focus:bg-gray-50 focus:text-gray-900"
          >
            <Info className="mr-1.5 h-4 w-4 text-gray-500" />
            <span className="min-w-0 flex-1">代币信息</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={isChildTokensDisabled}
            onClick={goToChildTokensPage}
            className="min-h-12 rounded-md px-2 py-2.5 text-sm text-gray-700 focus:bg-gray-50 focus:text-gray-900"
          >
            <List className="mr-1.5 h-4 w-4 text-gray-500" />
            <span className="min-w-0 flex-1">子币列表</span>
            {childTokenNum !== undefined && (
              <span className="ml-auto text-xs text-gray-400">{childTokenNum.toString()}</span>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={isReturnParentDisabled}
            onClick={goToParentTokenPage}
            className="min-h-12 rounded-md px-2 py-2.5 text-sm text-gray-700 focus:bg-gray-50 focus:text-gray-900"
          >
            <ArrowUpLeft className="mr-1.5 h-4 w-4 text-gray-500" />
            <span className="min-w-0 flex-1">返回父币</span>
            {hasReturnParentToken && token?.parentTokenSymbol && (
              <span className="ml-auto max-w-[96px] truncate font-mono text-xs text-gray-400">
                {token.parentTokenSymbol}
              </span>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="grid min-h-[48px] min-w-0 grid-cols-[minmax(0,1fr)_16px] grid-rows-2 items-center gap-x-2 gap-y-0.5 px-3 py-1.5 text-left transition-colors hover:bg-blue-50/40 focus-visible:bg-blue-50/40 focus-visible:outline-none sm:min-w-[190px]"
            title="钱包"
          >
            <div className="col-start-1 row-start-1 flex min-w-0 items-center justify-end gap-2">
              <span className="min-w-0 truncate font-mono text-[13px] font-medium leading-none text-gray-900">
                {address ? shortenAddress(address) : ''}
              </span>
              {walletChainId && targetChainId && walletChainId !== targetChainId && (
                <span className="inline-flex shrink-0 items-center rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-medium leading-none text-red-500">
                  网络不匹配
                </span>
              )}
            </div>

            <div className="col-start-1 row-start-2 flex min-w-0 items-center justify-end text-xs leading-none">
              {hasDefaultGroup ? (
                <span className="inline-flex min-w-0 max-w-full items-baseline justify-end gap-1.5 text-right">
                  <span className="min-w-0 truncate font-medium text-gray-600">{defaultGroupName || '...'}</span>
                </span>
              ) : (
                <span className="text-gray-400">未关联 NFT</span>
              )}
            </div>

            <ChevronDown className="col-start-2 row-span-2 h-4 w-4 shrink-0 self-center text-gray-500" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64 rounded-xl border p-2 shadow-xl">
        <div className="px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">钱包地址</span>
            {address && (
              // @ts-ignore
              <CopyToClipboard text={address} onCopy={handleCopyAddress}>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      复制
                    </>
                  )}
                </Button>
              </CopyToClipboard>
            )}
          </div>
          <p className="mt-1 font-mono text-xs text-gray-600 break-all">{address}</p>
        </div>

        <DropdownMenuSeparator className="my-1" />

        <div className="px-3 py-1">
          {isGroupDefaultsEnabled &&
            (hasDefaultGroup ? (
              <button
                type="button"
                className="-mx-1 flex w-[calc(100%+0.5rem)] min-w-0 items-center justify-between gap-2 rounded-md px-1 py-2 text-left transition-colors hover:bg-gray-50"
                onClick={goToMyLove20NftPage}
                title="前往我的NFT"
              >
                <span className="inline-flex min-w-0 flex-1 items-baseline gap-1.5">
                  <span className="min-w-0 truncate text-xs font-medium text-gray-800">{defaultGroupName || '...'}</span>
                </span>
                <span className="shrink-0 text-[11px] text-gray-400">查看NFT</span>
              </button>
            ) : (
              <button
                type="button"
                className="-mx-1 flex w-[calc(100%+0.5rem)] items-center justify-between gap-2 rounded-md px-1 py-2 text-left transition-colors hover:bg-gray-50"
                onClick={goToMyLove20NftPage}
                title="前往我的NFT"
              >
                <span className="text-xs text-gray-500">未关联 NFT</span>
                <span className="text-xs font-medium text-secondary">去设置</span>
              </button>
            ))}
          <div className={cn('flex w-full items-center justify-between gap-2 py-2', isGroupDefaultsEnabled && 'mt-1 border-t border-gray-100')}>
            <span className="text-xs text-gray-500">{nativeBalanceSymbol} 余额</span>
            <span className="min-w-0 truncate text-right text-xs font-medium text-gray-800">{nativeBalanceValue}</span>
          </div>
        </div>

        <DropdownMenuItem
          onClick={handleDisconnect}
          className="rounded-lg text-base text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-3" />
          断开连接
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  );
}

// 为了兼容性，同时导出 default
export default WalletButton;

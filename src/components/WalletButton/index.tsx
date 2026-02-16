'use client';

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useAccount, useBalance, useConnect, useDisconnect, useChainId } from 'wagmi';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Wallet, Copy, LogOut, ChevronDown, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { config } from '@/src/wagmi';
import { isTukeWallet } from '@/src/lib/tukeWalletUtils';
import { formatTokenAmount } from '@/src/lib/format';

interface WalletButtonProps {
  className?: string;
}

export function WalletButton({ className }: WalletButtonProps = {}) {
  const chainId = useChainId();
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { data: balance } = useBalance({
    address,
    chainId,
  });
  const { connect, connectors, error: connectError, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);
  const [walletChainId, setWalletChainId] = useState<number | null>(null);
  const [isNetworkMismatch, setIsNetworkMismatch] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

  // 跟踪组件是否已挂载，避免在渲染期间更新状态
  const mountedRef = useRef(false);

  // 获取注入式连接器
  const injectedConnector = connectors.find((c) => c.id === 'injected');
  const chainName = process.env.NEXT_PUBLIC_CHAIN_NAME ?? process.env.NEXT_PUBLIC_CHAIN;
  const targetChainId = config.chains[0]?.id;

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

      // 检查是否有注入式钱包
      if (!window.ethereum) {
        toast.error('请安装 MetaMask 或使用支持的钱包浏览器');
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
        // 用户断开连接 - 主动断开 wagmi 连接
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

  // 安全检查：确保注入式钱包可用
  useEffect(() => {
    const checkWalletAvailability = () => {
      if (typeof window !== 'undefined' && !window.ethereum) {
        console.warn('未检测到注入式钱包');
      }
    };

    // 延迟检查，给钱包扩展加载时间
    const timer = setTimeout(checkWalletAvailability, 1000);

    return () => clearTimeout(timer);
  }, []);

  // 加载状态
  const isLoading = isConnecting || isReconnecting || isPending;

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-auto px-3 py-1.5 rounded-xl border hover:border-blue-300 transition-all duration-200 bg-white/50 backdrop-blur-sm',
            className,
          )}
        >
          <div className="flex items-center">
            <Avatar className="w-8 h-8 mr-3">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold">
                {address ? address.slice(2, 4).toUpperCase() : 'W'}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col items-start min-w-0 mr-2">
              <div className="flex items-center">
                <span className="font-mono text-sm font-medium text-gray-900 mr-2">
                  {address ? shortenAddress(address) : ''}
                </span>
                {walletChainId && targetChainId && walletChainId !== targetChainId && (
                  <span className="text-xs text-red-500 font-medium">网络不匹配</span>
                )}
              </div>
              <div className="flex items-center text-xs text-gray-600">
                <span className="font-semibold">
                  {balance ? formatTokenAmount(balance.value) : '0'} {balance?.symbol || 'ETH'}
                </span>
              </div>
            </div>

            <ChevronDown className="w-4 h-4 text-gray-500" />
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl shadow-xl border">
        <div className="px-3 py-2 mb-2 bg-gray-50 rounded-lg">
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
          <p className="font-mono text-xs text-gray-600 mt-1 break-all">{address}</p>
        </div>

        <DropdownMenuItem
          onClick={handleDisconnect}
          className="rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-3" />
          断开连接
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 为了兼容性，同时导出 default
export default WalletButton;

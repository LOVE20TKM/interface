'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAccount, useBalance, useConnect, useDisconnect, useChainId } from 'wagmi';
import { formatEther } from 'viem';
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

  // 获取注入式连接器
  const injectedConnector = connectors.find((c) => c.id === 'injected');
  const chainName = process.env.NEXT_PUBLIC_CHAIN_NAME ?? process.env.NEXT_PUBLIC_CHAIN;

  // 网络切换函数
  const switchToValidNetwork = async (targetChainId: number) => {
    try {
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

      toast.success(`已成功连接到 ${chainName} 网络`);

      return true;
    } catch (error: any) {
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

          toast.success(`已添加并切换到 ${chainName} 网络`);
          return true;
        } catch (addError: any) {
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
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 格式化余额显示
  const formatBalance = (bal: bigint | undefined) => {
    if (!bal) return '0';
    const value = formatEther(bal);
    const num = parseFloat(value);
    if (num === 0) return '0';
    if (num < 0.0001) return '<0.0001';
    if (num < 1) return num.toFixed(4);
    if (num < 100) return num.toFixed(2);
    return num.toFixed(0);
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
      toast.success('已断开钱包连接');
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
    if (connectError) {
      if (connectError.message.includes('User rejected')) {
        toast.error('用户取消了连接请求');
      } else if (connectError.message.includes('already pending')) {
        toast.error('已有连接请求在处理中');
      } else {
        toast.error('连接失败: ' + connectError.message);
      }
    }
  }, [connectError]);

  // 监听连接成功事件并切换网络
  const prevConnectedRef = useRef(isConnected);
  useEffect(() => {
    const handleNetworkCheck = async () => {
      // 只在从未连接变为已连接时处理
      if (!prevConnectedRef.current && isConnected && address) {
        if (chainId) {
          const chainName = process.env.NEXT_PUBLIC_CHAIN_NAME || config.chains[0]?.name || '目标网络';
          const switched = await switchToValidNetwork(chainId);
          if (!switched) {
            toast.error(`网络切换失败，请手动切换到${chainName}`);
          }
        }
      }
    };

    handleNetworkCheck();
    prevConnectedRef.current = isConnected;
  }, [isConnected, address]);

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
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold">
                {address ? address.slice(2, 4).toUpperCase() : 'W'}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col items-start min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium text-gray-900">
                  {address ? shortenAddress(address) : ''}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="font-semibold">
                  {balance ? formatBalance(balance.value) : '0'} {balance?.symbol || 'ETH'}
                </span>
              </div>
            </div>

            <ChevronDown className="w-4 h-4 text-gray-500 ml-2" />
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

'use client';

import { useState } from 'react';
import { Loader2, CirclePlus } from 'lucide-react';
import { useAccount, useWalletClient } from 'wagmi';
import toast from 'react-hot-toast';
import { isTukeWallet } from '@/src/lib/tukeWalletUtils';

interface AddToMetamaskProps {
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  tokenImage?: string;
  isUniswapV2Lp?: boolean;
}

export default function AddToMetamask({
  tokenAddress,
  tokenSymbol,
  tokenDecimals,
  tokenImage,
  isUniswapV2Lp = false,
}: AddToMetamaskProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const walletTokenSymbol = isUniswapV2Lp ? 'UNI-V2' : tokenSymbol;

  const addToken = async () => {
    if (!isConnected) {
      alert('请先连接你的钱包');
      return;
    }
    setIsAdding(true);
    try {
      if (!walletClient) {
        alert('无法获取钱包客户端');
        return;
      }

      const wasAdded = await walletClient.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: walletTokenSymbol,
            decimals: tokenDecimals,
            image: tokenImage,
          },
        },
      });

      if (wasAdded) {
        toast.success('代币已成功添加到 MetaMask 钱包');
      } else {
        toast.error('用户拒绝添加代币');
      }
    } catch (error) {
      console.error('添加代币失败:', error);
      toast.error('添加代币失败，请检查控制台以获取更多信息');
    } finally {
      setIsAdding(false);
    }
  };

  if (walletTokenSymbol.length > 11) {
    return null;
  }

  // 如果是 Tuke 钱包，不显示添加按钮
  if (isTukeWallet()) {
    return null;
  }

  return (
    <button
      onClick={addToken}
      disabled={isAdding}
      className="flex items-center justify-center p-1 rounded focus:outline-none active:bg-gray-200 md:hover:bg-gray-200"
      style={{
        WebkitTapHighlightColor: 'transparent',
        WebkitAppearance: 'none',
        appearance: 'none',
        background: 'transparent',
        backgroundColor: 'transparent',
        border: 'none',
        outline: 'none',
      }}
    >
      {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <CirclePlus className="h-4 w-4 text-greyscale-500" />}
    </button>
  );
}

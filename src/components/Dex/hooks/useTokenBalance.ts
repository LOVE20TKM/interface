import { useEffect } from 'react';
import { useBalance } from 'wagmi';
import { useBalanceOf } from '@/src/hooks/contracts/useLOVE20Token';
import { useError } from '@/src/contexts/ErrorContext';
import { TokenConfig } from '../utils/swapTypes';

export const useTokenBalance = (tokenConfig: TokenConfig, account: `0x${string}` | undefined) => {
  const { setError } = useError();

  // 原生代币使用 useBalance
  const { data: nativeBalance, isLoading: isLoadingNative, error: nativeBalanceError } = useBalance({
    address: account,
    query: {
      enabled: !!account && tokenConfig.isNative,
    },
  });

  // ERC20 代币使用 useBalanceOf
  const { balance: erc20Balance, isPending: isPendingERC20 } = useBalanceOf(
    tokenConfig.isNative ? '0x0000000000000000000000000000000000000000' : (tokenConfig.address as `0x${string}`),
    account as `0x${string}`,
  );

  useEffect(() => {
    if (nativeBalanceError) {
      setError({
        name: '余额查询失败',
        message: '无法读取原生代币余额，请检查网络后重试',
      });
    }
  }, [nativeBalanceError, setError]);

  return {
    balance: tokenConfig.isNative ? nativeBalance?.value : erc20Balance,
    isPending: tokenConfig.isNative ? isLoadingNative : isPendingERC20,
  };
};
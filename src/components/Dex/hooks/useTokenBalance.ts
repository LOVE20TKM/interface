import { useBalance } from 'wagmi';
import { useBalanceOf } from '@/src/hooks/contracts/useLOVE20Token';
import { TokenConfig } from '../utils/swapTypes';

export const useTokenBalance = (tokenConfig: TokenConfig, account: `0x${string}` | undefined) => {
  // 原生代币使用 useBalance
  const { data: nativeBalance, isLoading: isLoadingNative } = useBalance({
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

  return {
    balance: tokenConfig.isNative ? nativeBalance?.value : erc20Balance,
    isPending: tokenConfig.isNative ? isLoadingNative : isPendingERC20,
  };
};
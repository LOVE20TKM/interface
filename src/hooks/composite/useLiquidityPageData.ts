import { useMemo, useCallback } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useBalanceOf, useAllowance } from '@/src/hooks/contracts/useLOVE20Token';
import { useGetPair } from '@/src/hooks/contracts/useUniswapV2Factory';
import {
  useLPBalance,
  useGetReserves,
  useToken0,
  useToken1,
  useTotalSupply,
} from '@/src/hooks/contracts/useUniswapV2Pair';

interface TokenConfig {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  isNative: boolean;
}

interface LiquidityPageDataParams {
  baseToken: TokenConfig;
  targetToken: TokenConfig | null;
  account: `0x${string}` | undefined;
}

/**
 * 流动性页面综合数据查询hook
 * 将多个RPC调用合并，减少请求次数，提高效率
 */
export const useLiquidityPageData = ({ baseToken, targetToken, account }: LiquidityPageDataParams) => {
  const spenderAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_ROUTER as `0x${string}`;

  // 1. 获取交易对地址
  const { pairAddress, isLoading: isLoadingPair } = useGetPair(
    baseToken.address,
    targetToken?.address || '0x0000000000000000000000000000000000000000',
    !!targetToken,
  );

  // 2. 基础代币余额查询
  const {
    data: baseNativeBalance,
    isLoading: isLoadingBaseNative,
    refetch: refetchBaseNative,
  } = useBalance({
    address: account,
    query: {
      enabled: !!account && baseToken.isNative,
    },
  });

  const {
    balance: baseERC20Balance,
    isPending: isPendingBaseERC20,
    refetch: refetchBaseERC20,
  } = useBalanceOf(
    baseToken.isNative ? '0x0000000000000000000000000000000000000000' : baseToken.address,
    account as `0x${string}`,
  );

  // 3. 目标代币余额查询
  const {
    balance: targetBalance,
    isPending: isPendingTarget,
    refetch: refetchTargetBalance,
  } = useBalanceOf(targetToken?.address || '0x0000000000000000000000000000000000000000', account as `0x${string}`);

  // 4. 授权额度查询
  const { allowance: baseAllowance, isPending: isPendingBaseAllowance } = useAllowance(
    baseToken.isNative ? '0x0000000000000000000000000000000000000000' : baseToken.address,
    account as `0x${string}`,
    spenderAddress,
  );

  const { allowance: targetAllowance, isPending: isPendingTargetAllowance } = useAllowance(
    targetToken?.address || '0x0000000000000000000000000000000000000000',
    account as `0x${string}`,
    spenderAddress,
  );

  // 5. LP代币余额查询
  const { lpBalance, isLoading: isLoadingLPBalance, refetch: refetchLPBalance } = useLPBalance(pairAddress, account);

  // 6. 交易对储备量查询
  const { reserve0, reserve1, isLoading: isLoadingReserves, refetch: refetchReserves } = useGetReserves(pairAddress);

  // 7. 交易对token0和token1地址查询
  const { token0, isLoading: isLoadingToken0 } = useToken0(pairAddress);
  const { token1, isLoading: isLoadingToken1 } = useToken1(pairAddress);

  // 8. LP代币总供应量查询
  const {
    totalSupply: lpTotalSupply,
    isLoading: isLoadingTotalSupply,
    refetch: refetchTotalSupply,
  } = useTotalSupply(pairAddress);

  // 计算派生数据
  const derivedData = useMemo(() => {
    if (!pairAddress || !reserve0 || !reserve1 || !token0 || !token1 || !targetToken) {
      return {
        pairExists: false,
        baseReserve: BigInt(0),
        targetReserve: BigInt(0),
        baseTokenIsToken0: false,
      };
    }

    // 确定哪个是基础代币，哪个是目标代币
    const baseTokenIsToken0 = baseToken.address.toLowerCase() === token0.toLowerCase();
    const baseReserve = baseTokenIsToken0 ? reserve0 : reserve1;
    const targetReserve = baseTokenIsToken0 ? reserve1 : reserve0;

    return {
      pairExists: reserve0 > BigInt(0) && reserve1 > BigInt(0),
      baseReserve,
      targetReserve,
      baseTokenIsToken0,
    };
  }, [pairAddress, reserve0, reserve1, token0, token1, baseToken.address, targetToken]);

  // 合并所有loading状态
  const isLoading =
    isLoadingPair ||
    isLoadingBaseNative ||
    isPendingBaseERC20 ||
    isPendingTarget ||
    isPendingBaseAllowance ||
    isPendingTargetAllowance ||
    isLoadingLPBalance ||
    isLoadingReserves ||
    isLoadingToken0 ||
    isLoadingToken1 ||
    isLoadingTotalSupply;

  // 综合刷新函数 - 刷新所有关键数据
  const refreshLiquidityData = useCallback(async () => {
    try {
      await Promise.all([refetchLPBalance(), refetchReserves(), refetchTotalSupply(), refetchTargetBalance()]);

      // 单独刷新基础代币余额（类型不兼容，需分开处理）
      await (baseToken.isNative ? refetchBaseNative() : refetchBaseERC20());
    } catch (error) {
      console.error('刷新流动性数据失败:', error);
    }
  }, [
    refetchLPBalance,
    refetchReserves,
    refetchTotalSupply,
    refetchTargetBalance,
    refetchBaseNative,
    refetchBaseERC20,
    baseToken.isNative,
  ]);

  return {
    // 基础数据
    pairAddress,
    baseBalance: baseToken.isNative ? baseNativeBalance?.value : baseERC20Balance,
    targetBalance,
    baseAllowance: baseToken.isNative ? undefined : baseAllowance,
    targetAllowance,
    lpBalance,
    lpTotalSupply,

    // 交易对数据
    reserve0,
    reserve1,
    token0,
    token1,

    // 派生数据
    ...derivedData,

    // 状态
    isLoading,

    // 操作函数
    refreshLiquidityData,
  };
};

import { useMemo } from 'react';
import { useGetPair } from '@/src/hooks/contracts/useUniswapV2Factory';
import {
  useLPBalance,
  useGetReserves,
  useTotalSupply,
  useToken0,
  useToken1,
} from '@/src/hooks/contracts/useUniswapV2Pair';

interface TokenConfig {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  isNative: boolean;
}

interface LiquidityQueryParams {
  baseToken: TokenConfig;
  targetToken: TokenConfig | null;
  queryAddress: `0x${string}` | undefined;
}

/**
 * 流动性查询hook - 查询指定地址的LP持有量和可兑换代币数量
 */
export const useLiquidityQuery = ({ baseToken, targetToken, queryAddress }: LiquidityQueryParams) => {
  // 1. 获取交易对地址
  const { pairAddress, isLoading: isLoadingPair } = useGetPair(
    baseToken.address,
    targetToken?.address || '0x0000000000000000000000000000000000000000',
    !!targetToken && !!queryAddress,
  );

  // 2. 获取指定地址的LP余额
  const { lpBalance, isLoading: isLoadingLPBalance } = useLPBalance(pairAddress, queryAddress);

  // 3. 获取交易对储备量
  const { reserve0, reserve1, isLoading: isLoadingReserves } = useGetReserves(pairAddress);

  // 4. 获取LP总供应量
  const { totalSupply, isLoading: isLoadingTotalSupply } = useTotalSupply(pairAddress);

  // 5. 获取token0和token1地址（确定代币顺序）
  const { token0, isLoading: isLoadingToken0 } = useToken0(pairAddress);
  const { token1, isLoading: isLoadingToken1 } = useToken1(pairAddress);

  // 计算派生数据
  const liquidityData = useMemo(() => {
    // 检查基础数据是否完整（不检查lpBalance，因为它可能为0）
    if (!pairAddress || !reserve0 || !reserve1 || !totalSupply || !token0 || !token1 || !targetToken) {
      return {
        pairExists: false,
        userLPBalance: BigInt(0),
        userBaseTokenAmount: BigInt(0),
        userTargetTokenAmount: BigInt(0),
        lpSharePercentage: 0,
        baseTokenIsToken0: false,
      };
    }

    // 检查池子是否存在
    const pairExists = reserve0 > BigInt(0) && reserve1 > BigInt(0);
    if (!pairExists) {
      return {
        pairExists: false,
        userLPBalance: BigInt(0),
        userBaseTokenAmount: BigInt(0),
        userTargetTokenAmount: BigInt(0),
        lpSharePercentage: 0,
        baseTokenIsToken0: false,
      };
    }

    // 确定哪个是基础代币，哪个是目标代币
    const baseTokenIsToken0 = baseToken.address.toLowerCase() === token0.toLowerCase();
    const baseReserve = baseTokenIsToken0 ? reserve0 : reserve1;
    const targetReserve = baseTokenIsToken0 ? reserve1 : reserve0;

    // 用户的LP余额（可能为0）
    const userLPBalance = lpBalance || BigInt(0);

    // 计算用户LP份额占比
    const lpSharePercentage = totalSupply > BigInt(0) ? (Number(userLPBalance) / Number(totalSupply)) * 100 : 0;

    // 计算用户可兑换的代币数量
    const userBaseTokenAmount = totalSupply > BigInt(0) ? (userLPBalance * baseReserve) / totalSupply : BigInt(0);

    const userTargetTokenAmount = totalSupply > BigInt(0) ? (userLPBalance * targetReserve) / totalSupply : BigInt(0);

    return {
      pairExists: true,
      userLPBalance: userLPBalance,
      userBaseTokenAmount,
      userTargetTokenAmount,
      lpSharePercentage,
      baseTokenIsToken0,
      // 额外的池子信息
      poolBaseReserve: baseReserve,
      poolTargetReserve: targetReserve,
      poolTotalSupply: totalSupply,
    };
  }, [pairAddress, lpBalance, reserve0, reserve1, totalSupply, token0, token1, baseToken.address, targetToken]);

  // 合并所有loading状态
  const isLoading =
    isLoadingPair ||
    isLoadingLPBalance ||
    isLoadingReserves ||
    isLoadingTotalSupply ||
    isLoadingToken0 ||
    isLoadingToken1;

  return {
    // 基础数据
    pairAddress,

    // 计算结果
    ...liquidityData,

    // 状态
    isLoading,

    // 验证
    hasValidInput: !!queryAddress && !!targetToken,
  };
};

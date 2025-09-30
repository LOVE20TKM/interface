import { useMemo } from 'react';
import { useGetPair } from '@/src/hooks/contracts/useUniswapV2Factory';
import { useGetReserves, useTotalSupply, useToken0, useToken1 } from '@/src/hooks/contracts/useUniswapV2Pair';

interface TokenConfig {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  isNative: boolean;
}

interface PairStatsParams {
  baseToken: TokenConfig;
  targetToken: TokenConfig | null;
}

/**
 * 币对统计数据hook - 获取交易对的基础统计信息
 */
export const usePairStats = ({ baseToken, targetToken }: PairStatsParams) => {
  // 1. 获取交易对地址
  const { pairAddress, isLoading: isLoadingPair } = useGetPair(
    baseToken.address,
    targetToken?.address || '0x0000000000000000000000000000000000000000',
    !!targetToken,
  );

  // 2. 获取交易对储备量
  const { reserve0, reserve1, isLoading: isLoadingReserves } = useGetReserves(pairAddress);

  // 3. 获取LP总供应量
  const { totalSupply, isLoading: isLoadingTotalSupply } = useTotalSupply(pairAddress);

  // 4. 获取token0和token1地址（确定代币顺序）
  const { token0, isLoading: isLoadingToken0 } = useToken0(pairAddress);
  const { token1, isLoading: isLoadingToken1 } = useToken1(pairAddress);

  // 计算派生数据
  const pairStats = useMemo(() => {
    // 检查基础数据是否完整
    if (!pairAddress || !reserve0 || !reserve1 || !totalSupply || !token0 || !token1 || !targetToken) {
      return {
        pairExists: false,
        poolTotalSupply: BigInt(0),
        poolBaseReserve: BigInt(0),
        poolTargetReserve: BigInt(0),
        baseTokenIsToken0: false,
        // 价格信息
        baseToTargetPrice: BigInt(0),
        targetToBasePrice: BigInt(0),
      };
    }

    // 检查池子是否存在
    const pairExists = reserve0 > BigInt(0) && reserve1 > BigInt(0);
    if (!pairExists) {
      return {
        pairExists: false,
        poolTotalSupply: BigInt(0),
        poolBaseReserve: BigInt(0),
        poolTargetReserve: BigInt(0),
        baseTokenIsToken0: false,
        baseToTargetPrice: BigInt(0),
        targetToBasePrice: BigInt(0),
      };
    }

    // 确定哪个是基础代币，哪个是目标代币
    const baseTokenIsToken0 = baseToken.address.toLowerCase() === token0.toLowerCase();
    const baseReserve = baseTokenIsToken0 ? reserve0 : reserve1;
    const targetReserve = baseTokenIsToken0 ? reserve1 : reserve0;

    // 计算价格（1个基础代币能换多少目标代币，1个目标代币能换多少基础代币）
    const baseToTargetPrice = baseReserve > BigInt(0) ? (targetReserve * BigInt(10 ** 18)) / baseReserve : BigInt(0);

    const targetToBasePrice = targetReserve > BigInt(0) ? (baseReserve * BigInt(10 ** 18)) / targetReserve : BigInt(0);

    return {
      pairExists: true,
      poolTotalSupply: totalSupply,
      poolBaseReserve: baseReserve,
      poolTargetReserve: targetReserve,
      baseTokenIsToken0,
      baseToTargetPrice,
      targetToBasePrice,
    };
  }, [pairAddress, reserve0, reserve1, totalSupply, token0, token1, baseToken.address, targetToken]);

  // 合并所有loading状态
  const isLoading = isLoadingPair || isLoadingReserves || isLoadingTotalSupply || isLoadingToken0 || isLoadingToken1;

  return {
    // 基础数据
    pairAddress,

    // 计算结果
    ...pairStats,

    // 状态
    isLoading,

    // 验证
    hasValidTokens: !!targetToken,
  };
};

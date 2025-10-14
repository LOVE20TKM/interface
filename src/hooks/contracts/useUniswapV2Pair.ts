import { useReadContract } from 'wagmi';
import { UniswapV2PairAbi } from '@/src/abis/UniswapV2Pair';

/**
 * 获取LP代币余额
 */
export const useLPBalance = (
  pairAddress: `0x${string}` | undefined,
  account: `0x${string}` | undefined,
  refetchInterval?: number,
) => {
  const {
    data: balance,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: pairAddress,
    abi: UniswapV2PairAbi,
    functionName: 'balanceOf',
    args: [account!],
    query: {
      enabled: !!pairAddress && !!account && pairAddress !== '0x0000000000000000000000000000000000000000',
      // staleTime: 缓存策略，3秒内重复访问使用缓存数据，不发RPC请求
      // 只有主动调用 refetch() 时才会忽略缓存强制刷新
      staleTime: 3000,
      // 可选的自动轮询间隔（默认不启用，避免频繁RPC请求）
      refetchInterval: refetchInterval || false,
    },
  });

  return {
    lpBalance: balance as bigint | undefined,
    isLoading,
    error,
    refetch, // 导出refetch函数供手动刷新
  };
};

/**
 * 获取交易对储备量
 */
export const useGetReserves = (pairAddress: `0x${string}` | undefined, refetchInterval?: number) => {
  const { data, isLoading, error, refetch } = useReadContract({
    address: pairAddress,
    abi: UniswapV2PairAbi,
    functionName: 'getReserves',
    query: {
      enabled: !!pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000',
      // staleTime: 缓存策略，3秒内重复访问使用缓存数据，不发RPC请求
      // 只有主动调用 refetch() 时才会忽略缓存强制刷新
      staleTime: 3000,
      refetchInterval: refetchInterval || false,
    },
  });

  const reserves = data as [bigint, bigint, number] | undefined;

  return {
    reserve0: reserves?.[0],
    reserve1: reserves?.[1],
    blockTimestampLast: reserves?.[2],
    reserves,
    isLoading,
    error,
    refetch,
  };
};

/**
 * 获取交易对总供应量
 */
export const useTotalSupply = (pairAddress: `0x${string}` | undefined) => {
  const {
    data: totalSupply,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: pairAddress,
    abi: UniswapV2PairAbi,
    functionName: 'totalSupply',
    query: {
      enabled: !!pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000',
      // staleTime: 缓存策略，3秒内重复访问使用缓存数据，不发RPC请求
      // 只有主动调用 refetch() 时才会忽略缓存强制刷新
      staleTime: 3000,
    },
  });

  return {
    totalSupply: totalSupply as bigint | undefined,
    isLoading,
    error,
    refetch, // 导出refetch函数供手动刷新
  };
};

/**
 * 获取token0地址
 */
export const useToken0 = (pairAddress: `0x${string}` | undefined) => {
  const {
    data: token0,
    isLoading,
    error,
  } = useReadContract({
    address: pairAddress,
    abi: UniswapV2PairAbi,
    functionName: 'token0',
    query: {
      enabled: !!pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000',
    },
  });

  return {
    token0: token0 as `0x${string}` | undefined,
    isLoading,
    error,
  };
};

/**
 * 获取token1地址
 */
export const useToken1 = (pairAddress: `0x${string}` | undefined) => {
  const {
    data: token1,
    isLoading,
    error,
  } = useReadContract({
    address: pairAddress,
    abi: UniswapV2PairAbi,
    functionName: 'token1',
    query: {
      enabled: !!pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000',
    },
  });

  return {
    token1: token1 as `0x${string}` | undefined,
    isLoading,
    error,
  };
};

import { useEffect, useMemo } from 'react';
import { useChainId } from 'wagmi';
import { useGetPair } from '@/src/hooks/contracts/useUniswapV2Factory';
import { LocalCache } from '@/src/lib/LocalCache';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_FACTORY as `0x${string}`;

const buildUSDTPairCacheKey = (
  chainId: number,
  factoryAddress: `0x${string}`,
  tokenAddress: `0x${string}`,
  usdtAddress: `0x${string}`,
) => `usdt_pair:${chainId}:${factoryAddress.toLowerCase()}:${tokenAddress.toLowerCase()}:${usdtAddress.toLowerCase()}`;

/**
 * 查询任意 token 与环境中 TUSDT 的 LP pair 地址。
 * 返回的 pairAddress 会过滤零地址，不存在时统一为 undefined。
 */
export const useUSDTPairAddress = (tokenAddress: `0x${string}` | undefined) => {
  const chainId = useChainId();
  const usdtAddress = process.env.NEXT_PUBLIC_USDT_ADDRESS as `0x${string}` | undefined;
  const usdtSymbol = process.env.NEXT_PUBLIC_USDT_SYMBOL;
  const cacheKey = useMemo(() => {
    if (!chainId || !tokenAddress || !usdtAddress || !FACTORY_ADDRESS) return undefined;
    return buildUSDTPairCacheKey(chainId, FACTORY_ADDRESS, tokenAddress, usdtAddress);
  }, [chainId, tokenAddress, usdtAddress]);

  const cachedPairAddress = useMemo(() => {
    if (!cacheKey) return undefined;
    return LocalCache.get<`0x${string}`>(cacheKey) || undefined;
  }, [cacheKey]);

  const shouldQueryPair = !!tokenAddress && !!usdtAddress && !cachedPairAddress;

  const { pairAddress, isLoading, error } = useGetPair(
    tokenAddress || ZERO_ADDRESS,
    usdtAddress || ZERO_ADDRESS,
    shouldQueryPair,
  );

  const normalizedPairAddress =
    pairAddress && pairAddress !== ZERO_ADDRESS ? pairAddress : undefined;

  useEffect(() => {
    if (!cacheKey || !normalizedPairAddress) return;
    LocalCache.set(cacheKey, normalizedPairAddress);
  }, [cacheKey, normalizedPairAddress]);

  return {
    pairAddress: cachedPairAddress || normalizedPairAddress,
    usdtAddress,
    usdtSymbol,
    isLoading: !cachedPairAddress && isLoading,
    error,
  };
};

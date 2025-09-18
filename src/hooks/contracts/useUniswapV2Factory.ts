import { useReadContract } from 'wagmi';
import { UniswapV2FactoryAbi } from '@/src/abis/UniswapV2Factory';

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_FACTORY as `0x${string}`;

/**
 * 获取交易对地址
 */
export const useGetPair = (tokenA: `0x${string}`, tokenB: `0x${string}`, enabled = true) => {
  const {
    data: pairAddress,
    isLoading,
    error,
  } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: UniswapV2FactoryAbi,
    functionName: 'getPair',
    args: [tokenA, tokenB],
    query: {
      enabled: !!tokenA && !!tokenB && tokenA !== tokenB && enabled,
    },
  });

  return {
    pairAddress: pairAddress as `0x${string}` | undefined,
    isLoading,
    error,
  };
};

/**
 * 获取所有交易对数量
 */
export const useAllPairsLength = () => {
  const { data, isLoading, error } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: UniswapV2FactoryAbi,
    functionName: 'allPairsLength',
  });

  return {
    allPairsLength: data as bigint | undefined,
    isLoading,
    error,
  };
};

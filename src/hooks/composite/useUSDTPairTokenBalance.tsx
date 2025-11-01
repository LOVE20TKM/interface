import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { UniswapV2FactoryAbi } from '@/src/abis/UniswapV2Factory';
import { UniswapV2PairAbi } from '@/src/abis/UniswapV2Pair';

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_FACTORY as `0x${string}`;

/**
 * 获取 USDT-Token pair 中当前代币的质押量（储备量）
 * 使用批量 RPC 调用优化性能
 *
 * @param tokenAddress - 当前代币地址
 * @param usdtAddress - USDT地址
 * @param enabled - 是否启用查询（默认为true）
 * @returns 当前代币在 USDT pair 中的质押量
 */
export const useUSDTPairTokenBalance = (
  tokenAddress: `0x${string}` | undefined,
  usdtAddress: `0x${string}` | undefined,
  enabled = true,
) => {
  // 构建批量合约调用配置
  const contracts = useMemo(() => {
    if (!tokenAddress || !usdtAddress || !enabled) return [];

    return [
      // 1. 获取 pair 地址
      {
        address: FACTORY_ADDRESS,
        abi: UniswapV2FactoryAbi,
        functionName: 'getPair',
        args: [tokenAddress, usdtAddress],
      },
    ];
  }, [tokenAddress, usdtAddress, enabled]);

  // 第一步：获取 pair 地址
  const { data: pairData, isPending: isPendingPair } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: !!tokenAddress && !!usdtAddress && enabled && contracts.length > 0,
    },
  });

  // 从第一步结果中提取 pair 地址
  const pairAddress = useMemo(() => {
    if (!pairData || pairData.length === 0) return undefined;
    const result = pairData[0]?.result as `0x${string}` | undefined;
    // 如果 pair 不存在，factory 会返回零地址
    if (result === '0x0000000000000000000000000000000000000000') return undefined;
    return result;
  }, [pairData]);

  // 第二步：如果 pair 存在，批量获取 pair 信息
  const pairContracts = useMemo(() => {
    if (!pairAddress) return [];

    return [
      // 获取储备量
      {
        address: pairAddress,
        abi: UniswapV2PairAbi,
        functionName: 'getReserves',
      },
      // 获取 token0
      {
        address: pairAddress,
        abi: UniswapV2PairAbi,
        functionName: 'token0',
      },
      // 获取 token1
      {
        address: pairAddress,
        abi: UniswapV2PairAbi,
        functionName: 'token1',
      },
    ];
  }, [pairAddress]);

  const { data: pairInfoData, isPending: isPendingPairInfo } = useReadContracts({
    contracts: pairContracts as any,
    query: {
      enabled: !!pairAddress && pairContracts.length > 0,
    },
  });

  // 计算当前代币在 pair 中的质押量
  const result = useMemo(() => {
    // 如果 pair 不存在
    if (!pairAddress) {
      return {
        tokenBalanceInUSDTPair: BigInt(0),
        pairExists: false,
        pairAddress: undefined,
      };
    }

    // 如果 pair 信息还未加载完成
    if (!pairInfoData || pairInfoData.length < 3) {
      return {
        tokenBalanceInUSDTPair: BigInt(0),
        pairExists: true,
        pairAddress,
      };
    }

    // 解析数据
    const [reservesResult, token0Result, token1Result] = pairInfoData;

    const reserves = reservesResult?.result as [bigint, bigint, number] | undefined;
    const token0 = token0Result?.result as `0x${string}` | undefined;
    const token1 = token1Result?.result as `0x${string}` | undefined;

    // 检查数据完整性
    if (!reserves || !token0 || !token1 || !tokenAddress) {
      return {
        tokenBalanceInUSDTPair: BigInt(0),
        pairExists: true,
        pairAddress,
      };
    }

    const [reserve0, reserve1] = reserves;

    // 检查池子是否有流动性
    if (reserve0 === BigInt(0) && reserve1 === BigInt(0)) {
      return {
        tokenBalanceInUSDTPair: BigInt(0),
        pairExists: true,
        pairAddress,
      };
    }

    // 确定当前代币是 token0 还是 token1
    const tokenIsToken0 = tokenAddress.toLowerCase() === token0.toLowerCase();
    const balance = tokenIsToken0 ? reserve0 : reserve1;

    return {
      tokenBalanceInUSDTPair: balance,
      pairExists: true,
      pairAddress,
    };
  }, [pairAddress, pairInfoData, tokenAddress]);

  // 合并所有 loading 状态
  const isPending = isPendingPair || isPendingPairInfo;

  return {
    ...result,
    isPending,
  };
};

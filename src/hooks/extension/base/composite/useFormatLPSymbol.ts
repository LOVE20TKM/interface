/**
 * 格式化 LP 代币 Symbol Hook
 *
 * 功能概述：
 * 1. 如果 tokenAddress 在 tokenContext 中，直接返回原 symbol
 * 2. 否则判断是否是 LP 代币
 * 3. 如果不是 LP 代币，返回原 symbol
 * 4. 如果是 LP 代币，返回用 token0Symbol 和 token1Symbol 拼成的 symbol（格式：LP(token0Symbol,token1Symbol)）
 *
 * 使用示例：
 * ```typescript
 * const { formattedSymbol, isPending } = useFormatLPSymbol({
 *   tokenAddress: '0x...',
 *   tokenSymbol: 'USDT',
 * });
 * ```
 */

import { useMemo } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';
import { UniswapV2PairAbi } from '@/src/abis/UniswapV2Pair';
import { LOVE20TokenAbi } from '@/src/abis/LOVE20Token';
import useTokenContext from '@/src/hooks/context/useTokenContext';

// ==================== 常量定义 ====================

/** 零地址常量 */
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`;

// ==================== 类型定义 ====================

/**
 * Hook 参数接口
 */
export interface UseFormatLPSymbolParams {
  tokenAddress: `0x${string}` | undefined;
  tokenSymbol: string | undefined;
  enabled?: boolean;
}

/**
 * Hook 返回结果接口
 */
export interface UseFormatLPSymbolResult {
  formattedSymbol: string;
  isPending: boolean;
  error: Error | null;
}

// ==================== 工具函数 ====================

/**
 * 读取 symbol 结果，失败时返回 'UNKNOWN'
 */
function readSymbolOrUnknown(symbolResult: any): string {
  if (!symbolResult || symbolResult.status !== 'success') return 'UNKNOWN';
  const value = symbolResult.result;
  if (typeof value !== 'string') return 'UNKNOWN';
  const trimmed = value.trim();
  return trimmed ? trimmed : 'UNKNOWN';
}

// ==================== 主 Hook ====================

/**
 * 格式化 LP 代币 Symbol
 *
 * @param tokenAddress - 代币地址
 * @param tokenSymbol - 代币原始 symbol
 * @param enabled - 是否启用查询（默认 true）
 * @returns 格式化后的 symbol、加载状态和错误信息
 */
export const useFormatLPSymbol = ({
  tokenAddress,
  tokenSymbol,
  enabled = true,
}: UseFormatLPSymbolParams): UseFormatLPSymbolResult => {
  const { token } = useTokenContext();
  const uniswapV2FactoryAddressLower = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_FACTORY?.toLowerCase();

  // 判断 tokenAddress 是否在 tokenContext 中
  const isTokenInContext = useMemo(() => {
    if (!tokenAddress || !token?.address) return false;
    return tokenAddress.toLowerCase() === token.address.toLowerCase();
  }, [tokenAddress, token?.address]);

  // 阶段 1: 检查是否为 LP token（通过调用 factory() 方法）
  // 注意：所有 hooks 必须在条件判断之前调用，不能提前返回
  const shouldCheckLP =
    enabled && !!tokenAddress && !!uniswapV2FactoryAddressLower && !isTokenInContext && tokenAddress !== ZERO_ADDRESS;

  const {
    data: factoryData,
    isPending: isPendingFactory,
    error: errorFactory,
  } = useReadContract({
    address: tokenAddress,
    abi: UniswapV2PairAbi,
    functionName: 'factory',
    args: [],
    query: {
      enabled: shouldCheckLP,
    },
  });

  // 判断是否为 LP token
  const isLP = useMemo(() => {
    if (!shouldCheckLP || !factoryData || errorFactory) return false;
    const factoryAddress = (factoryData as string).toLowerCase();
    return factoryAddress === uniswapV2FactoryAddressLower;
  }, [factoryData, uniswapV2FactoryAddressLower, shouldCheckLP, errorFactory]);

  // 阶段 2: 如果是 LP token，读取 token0 和 token1
  const shouldReadToken0Token1 = enabled && isLP && !isPendingFactory && !errorFactory;

  const {
    data: token0Token1Data,
    isPending: isPendingToken0Token1,
    error: errorToken0Token1,
  } = useReadContracts({
    contracts: shouldReadToken0Token1
      ? [
          {
            address: tokenAddress,
            abi: UniswapV2PairAbi,
            functionName: 'token0',
            args: [],
          },
          {
            address: tokenAddress,
            abi: UniswapV2PairAbi,
            functionName: 'token1',
            args: [],
          },
        ]
      : [],
    query: {
      enabled: shouldReadToken0Token1,
    },
  });

  // 阶段 3: 读取 token0 和 token1 的 symbol
  const token0Address = useMemo(() => {
    if (!token0Token1Data?.[0]?.result) return undefined;
    return token0Token1Data[0].result as `0x${string}` | undefined;
  }, [token0Token1Data]);

  const token1Address = useMemo(() => {
    if (!token0Token1Data?.[1]?.result) return undefined;
    return token0Token1Data[1].result as `0x${string}` | undefined;
  }, [token0Token1Data]);

  const shouldReadSymbols =
    enabled && isLP && !!token0Address && !!token1Address && !isPendingToken0Token1 && !errorToken0Token1;

  const {
    data: symbolData,
    isPending: isPendingSymbol,
    error: errorSymbol,
  } = useReadContracts({
    contracts: shouldReadSymbols
      ? [
          {
            address: token0Address!,
            abi: LOVE20TokenAbi,
            functionName: 'symbol',
            args: [],
          },
          {
            address: token1Address!,
            abi: LOVE20TokenAbi,
            functionName: 'symbol',
            args: [],
          },
        ]
      : [],
    query: {
      enabled: shouldReadSymbols,
    },
  });

  // 计算格式化后的 symbol
  const formattedSymbol = useMemo(() => {
    // 如果 tokenAddress 在 tokenContext 中，直接返回原 symbol
    if (isTokenInContext) {
      return tokenSymbol || 'UNKNOWN';
    }

    // 如果未启用或没有 tokenAddress，返回原 symbol
    if (!enabled || !tokenAddress || tokenAddress === ZERO_ADDRESS) {
      return tokenSymbol || 'UNKNOWN';
    }

    // 如果未配置 UniswapV2 factory 地址，返回原 symbol
    if (!uniswapV2FactoryAddressLower) {
      return tokenSymbol || 'UNKNOWN';
    }

    // 如果正在检查 factory 或出错，返回原 symbol
    if (isPendingFactory || errorFactory) {
      return tokenSymbol || 'UNKNOWN';
    }

    // 如果不是 LP token，返回原 symbol
    if (!isLP) {
      return tokenSymbol || 'UNKNOWN';
    }

    // 如果正在读取 token0/token1 或出错，返回原 symbol
    if (isPendingToken0Token1 || errorToken0Token1) {
      return tokenSymbol || 'UNKNOWN';
    }

    // 如果正在读取 symbol 或出错，返回原 symbol
    if (isPendingSymbol || errorSymbol) {
      return tokenSymbol || 'UNKNOWN';
    }

    // 如果是 LP token，构建 LP symbol
    if (symbolData && symbolData.length >= 2) {
      const token0Symbol = readSymbolOrUnknown(symbolData[0]);
      const token1Symbol = readSymbolOrUnknown(symbolData[1]);
      return `LP(${token0Symbol},${token1Symbol})`;
    }

    // 如果无法获取 symbol，返回原 symbol
    return tokenSymbol || 'UNKNOWN';
  }, [
    isTokenInContext,
    enabled,
    tokenAddress,
    tokenSymbol,
    uniswapV2FactoryAddressLower,
    isPendingFactory,
    errorFactory,
    isLP,
    isPendingToken0Token1,
    errorToken0Token1,
    isPendingSymbol,
    errorSymbol,
    symbolData,
  ]);

  // 计算 isPending 状态
  const isPending = useMemo(() => {
    // 如果 tokenAddress 在 tokenContext 中，不需要等待
    if (isTokenInContext) {
      return false;
    }

    if (!enabled || !tokenAddress || tokenAddress === ZERO_ADDRESS) {
      return false;
    }

    if (!uniswapV2FactoryAddressLower) {
      return false;
    }

    // 等待 factory 检查
    if (isPendingFactory) return true;

    // 如果不是 LP，不需要继续等待
    if (!isLP) return false;

    // 等待 token0/token1 读取
    if (isPendingToken0Token1) return true;

    // 等待 symbol 读取
    if (isPendingSymbol) return true;

    return false;
  }, [
    isTokenInContext,
    enabled,
    tokenAddress,
    uniswapV2FactoryAddressLower,
    isPendingFactory,
    isLP,
    isPendingToken0Token1,
    isPendingSymbol,
  ]);

  const error = errorFactory || errorToken0Token1 || errorSymbol || null;

  return {
    formattedSymbol,
    isPending,
    error,
  };
};

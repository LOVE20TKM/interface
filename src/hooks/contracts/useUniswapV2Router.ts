import { useEffect, useState } from 'react';
import { useReadContract, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { simulateContract, writeContract } from '@wagmi/core';
import { encodeFunctionData } from 'viem';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';

import { config } from '@/src/wagmi';
import { UniswapV2RouterAbi } from '@/src/abis/UniswapV2Router';
import { deepLogError, logError, logWeb3Error } from '@/src/lib/debugUtils';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_ROUTER as `0x${string}`;

// =====================
// === 读取 Hooks ===
// =====================

/**
 * Hook for getAmountsOut
 */
export const useGetAmountsOut = (amountIn: bigint, path: `0x${string}`[], isEnabled = true) => {
  const { data, error, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: UniswapV2RouterAbi,
    functionName: 'getAmountsOut',
    args: [amountIn, path],
    query: {
      enabled: !!amountIn && path.length >= 2 && isEnabled,
    },
  });

  return { data, error, isLoading };
};

/**
 * Hook for getAmountsIn
 */
export const useGetAmountsIn = (amountOut: bigint, path: `0x${string}`[], isEnabled = true) => {
  const { data, error, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: UniswapV2RouterAbi,
    functionName: 'getAmountsIn',
    args: [amountOut, path],
    query: {
      enabled: !!amountOut && path.length >= 2 && isEnabled,
    },
  });

  return { data, error, isLoading };
};

// =====================
// === 写入 Hooks ===
// =====================

/**
 * Hook for swapExactTokensForTokens (统一交易处理器版本)
 * 自动兼容TUKE钱包和其他标准钱包
 */
export function useSwapExactTokensForTokens() {
  // 使用统一交易处理器
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    UniswapV2RouterAbi,
    CONTRACT_ADDRESS,
    'swapExactTokensForTokens',
  );

  // 包装swap函数，保持原有的接口
  const swap = async (
    amountIn: bigint,
    amountOutMin: bigint,
    path: `0x${string}`[],
    to: `0x${string}`,
    deadline: bigint,
  ) => {
    console.log('提交swapExactTokensForTokens交易:', { amountIn, amountOutMin, path, to, deadline, isTukeMode });
    return await execute([amountIn, amountOutMin, path, to, deadline]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('swapExactTokensForTokens tx hash:', hash);
    }
    if (error) {
      console.log('提交swapExactTokensForTokens交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    swap,
    writeData: hash,
    isWriting: isPending,
    writeError: error,
    isConfirming,
    isConfirmed,
    isTukeMode,
  };
}

/**
 * Hook for swapExactETHForTokens (统一交易处理器版本)
 * 自动兼容TUKE钱包和其他标准钱包
 */
export function useSwapExactETHForTokens() {
  // 使用统一交易处理器
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    UniswapV2RouterAbi,
    CONTRACT_ADDRESS,
    'swapExactETHForTokens',
  );

  // 包装swap函数，保持原有的接口
  const swap = async (
    amountOutMin: bigint,
    path: `0x${string}`[],
    to: `0x${string}`,
    deadline: bigint,
    value: bigint,
  ) => {
    console.log('提交swapExactETHForTokens交易:', { amountOutMin, path, to, deadline, value, isTukeMode });
    return await execute([amountOutMin, path, to, deadline], value);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('swapExactETHForTokens tx hash:', hash);
    }
    if (error) {
      console.log('提交swapExactETHForTokens交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    swap,
    writeData: hash,
    isWriting: isPending,
    writeError: error,
    isConfirming,
    isConfirmed,
    isTukeMode,
  };
}

/**
 * Hook for swapExactTokensForETH (统一交易处理器版本)
 * 自动兼容TUKE钱包和其他标准钱包
 */
export function useSwapExactTokensForETH() {
  // 使用统一交易处理器
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    UniswapV2RouterAbi,
    CONTRACT_ADDRESS,
    'swapExactTokensForETH',
  );

  // 包装swap函数，保持原有的接口
  const swap = async (
    amountIn: bigint,
    amountOutMin: bigint,
    path: `0x${string}`[],
    to: `0x${string}`,
    deadline: bigint,
  ) => {
    console.log('提交swapExactTokensForETH交易:', { amountIn, amountOutMin, path, to, deadline, isTukeMode });
    return await execute([amountIn, amountOutMin, path, to, deadline]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('swapExactTokensForETH tx hash:', hash);
    }
    if (error) {
      console.log('提交swapExactTokensForETH交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    swap,
    writeData: hash,
    isWriting: isPending,
    writeError: error,
    isConfirming,
    isConfirmed,
    isTukeMode,
  };
}

/**
 * Hook for swapExactETHForTokensDirect (统一交易处理器版本)
 * 自动兼容TUKE钱包和其他标准钱包
 * 注意：这个函数专门用于绕过simulateContract的问题
 */
export function useSwapExactETHForTokensDirect() {
  // 使用统一交易处理器
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    UniswapV2RouterAbi,
    CONTRACT_ADDRESS,
    'swapExactETHForTokens',
  );

  // 包装swap函数，保持原有的接口
  const swap = async (
    amountOutMin: bigint,
    path: `0x${string}`[],
    to: `0x${string}`,
    deadline: bigint,
    value: bigint,
  ) => {
    console.log('提交swapExactETHForTokensDirect交易:', { amountOutMin, path, to, deadline, value, isTukeMode });
    return await execute([amountOutMin, path, to, deadline], value);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('swapExactETHForTokensDirect tx hash:', hash);
    }
    if (error) {
      console.log('提交swapExactETHForTokensDirect交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    swap,
    txHash: hash,
    isWriting: isPending,
    writeError: error,
    isConfirming,
    isConfirmed,
    isTukeMode,
  };
}

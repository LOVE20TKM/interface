// hooks/contracts/useLOVE20ExtensionFactoryLp.ts

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { LOVE20ExtensionFactoryLpAbi } from '@/src/abis/LOVE20ExtensionFactoryLp';
import { safeToBigInt } from '@/src/lib/clientUtils';

// 需要在环境变量中配置这个合约地址
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_FACTORY_LP as `0x${string}`;

// =====================
// === 读取 Hook ===
// =====================

/**
 * Hook for center - 获取 ExtensionCenter 地址
 */
export const useFactoryCenter = (factoryAddress?: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: factoryAddress || CONTRACT_ADDRESS,
    abi: LOVE20ExtensionFactoryLpAbi,
    functionName: 'center',
    query: {
      enabled: !!(factoryAddress || CONTRACT_ADDRESS),
    },
  });

  return { centerAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for exists - 检查扩展是否存在
 */
export const useExtensionExists = (factoryAddress: `0x${string}`, extensionAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: factoryAddress,
    abi: LOVE20ExtensionFactoryLpAbi,
    functionName: 'exists',
    args: [extensionAddress],
    query: {
      enabled: !!factoryAddress && !!extensionAddress,
    },
  });

  return { exists: data as boolean | undefined, isPending, error };
};

/**
 * Hook for extensionParams - 获取扩展的参数
 */
export const useExtensionParams = (factoryAddress: `0x${string}`, extensionAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: factoryAddress,
    abi: LOVE20ExtensionFactoryLpAbi,
    functionName: 'extensionParams',
    args: [extensionAddress],
    query: {
      enabled: !!factoryAddress && !!extensionAddress,
    },
  });

  return {
    tokenAddress: data ? (data[0] as `0x${string}`) : undefined,
    joinTokenAddress: data ? (data[1] as `0x${string}`) : undefined,
    waitingBlocks: data ? safeToBigInt(data[2]) : undefined,
    govRatioMultiplier: data ? safeToBigInt(data[3]) : undefined,
    minGovVotes: data ? safeToBigInt(data[4]) : undefined,
    lpRatioPrecision: data ? safeToBigInt(data[5]) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for extensions - 获取所有扩展地址
 */
export const useFactoryExtensions = (factoryAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: factoryAddress,
    abi: LOVE20ExtensionFactoryLpAbi,
    functionName: 'extensions',
    query: {
      enabled: !!factoryAddress,
    },
  });

  return { extensions: data as `0x${string}`[] | undefined, isPending, error };
};

/**
 * Hook for extensionsAtIndex - 根据索引获取扩展地址
 */
export const useFactoryExtensionsAtIndex = (factoryAddress: `0x${string}`, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: factoryAddress,
    abi: LOVE20ExtensionFactoryLpAbi,
    functionName: 'extensionsAtIndex',
    args: [index],
    query: {
      enabled: !!factoryAddress && index !== undefined,
    },
  });

  return { extensionAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for extensionsCount - 获取扩展数量
 */
export const useFactoryExtensionsCount = (factoryAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: factoryAddress,
    abi: LOVE20ExtensionFactoryLpAbi,
    functionName: 'extensionsCount',
    query: {
      enabled: !!factoryAddress,
    },
  });

  return { extensionsCount: safeToBigInt(data), isPending, error };
};

// =====================
// === 写入 Hook ===
// =====================

/**
 * Hook for createExtension - 创建新的 Lp 扩展
 * @param factoryAddress 工厂合约地址，如果不提供则使用环境变量中的默认地址
 * 
 * 注意：在调用 createExtension 之前，需要先授权 1 个代币给 factory
 */
export function useCreateExtension(factoryAddress?: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionFactoryLpAbi,
    factoryAddress || CONTRACT_ADDRESS,
    'createExtension',
  );

  const createExtension = async (
    tokenAddress: `0x${string}`,
    joinTokenAddress: `0x${string}`,
    waitingBlocks: bigint,
    govRatioMultiplier: bigint,
    minGovVotes: bigint,
    lpRatioPrecision: bigint,
  ) => {
    console.log('提交 createExtension 交易:', {
      tokenAddress,
      joinTokenAddress,
      waitingBlocks,
      govRatioMultiplier,
      minGovVotes,
      lpRatioPrecision,
      isTukeMode,
    });
    return await execute([tokenAddress, joinTokenAddress, waitingBlocks, govRatioMultiplier, minGovVotes, lpRatioPrecision]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('createExtension tx hash:', hash);
    }
    if (error) {
      console.log('提交 createExtension 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    createExtension,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}



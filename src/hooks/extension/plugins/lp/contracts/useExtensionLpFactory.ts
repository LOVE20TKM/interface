// hooks/contracts/useExtensionLpFactory.ts

import { useEffect } from 'react';
import { useUniversalReadContract } from '@/src/lib/universalReadContract';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { ExtensionLpFactoryAbi } from '@/src/abis/ExtensionLpFactory';
import { safeToBigInt } from '@/src/lib/clientUtils';

// =====================
// === 读取 Hook ===
// =====================

/**
 * Hook for CENTER_ADDRESS - 获取 ExtensionCenter 地址
 */
export const useFactoryCenter = (factoryAddress: `0x${string}`) => {
  const { data, isPending, error } = useUniversalReadContract({
    address: factoryAddress,
    abi: ExtensionLpFactoryAbi,
    functionName: 'CENTER_ADDRESS',
    query: {
      enabled: !!factoryAddress,
    },
  });

  return { centerAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for exists - 检查扩展是否存在
 */
export const useExtensionExists = (factoryAddress: `0x${string}`, extensionAddress: `0x${string}`) => {
  const { data, isPending, error } = useUniversalReadContract({
    address: factoryAddress,
    abi: ExtensionLpFactoryAbi,
    functionName: 'exists',
    args: [extensionAddress],
    query: {
      enabled: !!factoryAddress && !!extensionAddress,
    },
  });

  return { exists: data as boolean | undefined, isPending, error };
};

/**
 * Hook for extensions - 获取所有扩展地址
 */
export const useFactoryExtensions = (factoryAddress: `0x${string}`) => {
  const { data, isPending, error } = useUniversalReadContract({
    address: factoryAddress,
    abi: ExtensionLpFactoryAbi,
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
  const { data, isPending, error } = useUniversalReadContract({
    address: factoryAddress,
    abi: ExtensionLpFactoryAbi,
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
  const { data, isPending, error } = useUniversalReadContract({
    address: factoryAddress,
    abi: ExtensionLpFactoryAbi,
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
 * @param factoryAddress 工厂合约地址，必须显式传入
 *
 * 注意：在调用 createExtension 之前，需要先授权 1 个代币给 factory
 */
export function useCreateExtension(factoryAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    ExtensionLpFactoryAbi,
    factoryAddress,
    'createExtension',
  );

  const createExtension = async (
    tokenAddress: `0x${string}`,
    joinTokenAddress: `0x${string}`,
    govRatioMultiplier: bigint,
    minGovRatio: bigint,
  ) => {
    console.log('提交 createExtension 交易:', {
      tokenAddress,
      joinTokenAddress,
      govRatioMultiplier,
      minGovRatio,
      isTukeMode,
    });
    return await execute([tokenAddress, joinTokenAddress, govRatioMultiplier, minGovRatio]);
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

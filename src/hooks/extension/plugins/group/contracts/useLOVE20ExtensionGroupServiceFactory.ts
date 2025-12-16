// hooks/extension/plugins/group/contracts/useLOVE20ExtensionGroupServiceFactory.ts

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { LOVE20ExtensionGroupServiceFactoryAbi } from '@/src/abis/LOVE20ExtensionGroupServiceFactory';
import { safeToBigInt } from '@/src/lib/clientUtils';

// 注意：ExtensionGroupServiceFactory 是固定地址的合约
// 需要从配置中获取合约地址

// =====================
// === 读取 Hook ===
// =====================

/**
 * Hook for center - 获取 center 合约地址
 */
export const useCenter = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupServiceFactoryAbi,
    functionName: 'center',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { centerAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for exists - 检查扩展是否存在
 */
export const useExists = (contractAddress: `0x${string}`, extension: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupServiceFactoryAbi,
    functionName: 'exists',
    args: [extension],
    query: {
      enabled: !!contractAddress && !!extension,
    },
  });

  return { exists: data as boolean | undefined, isPending, error };
};

/**
 * Hook for extensionParams - 获取扩展参数
 */
export const useExtensionParams = (contractAddress: `0x${string}`, extension: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupServiceFactoryAbi,
    functionName: 'extensionParams',
    args: [extension],
    query: {
      enabled: !!contractAddress && !!extension,
    },
  });

  const typedData = data as [string, string, bigint] | undefined;

  return {
    tokenAddress: typedData ? (typedData[0] as `0x${string}`) : undefined,
    groupActionAddress: typedData ? (typedData[1] as `0x${string}`) : undefined,
    maxRecipients: typedData ? safeToBigInt(typedData[2]) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for extensions - 获取所有扩展地址
 */
export const useExtensions = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupServiceFactoryAbi,
    functionName: 'extensions',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { extensions: data as `0x${string}`[] | undefined, isPending, error };
};

/**
 * Hook for extensionsAtIndex - 根据索引获取扩展地址
 */
export const useExtensionsAtIndex = (contractAddress: `0x${string}`, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupServiceFactoryAbi,
    functionName: 'extensionsAtIndex',
    args: [index],
    query: {
      enabled: !!contractAddress && index !== undefined,
    },
  });

  return { extension: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for extensionsCount - 获取扩展数量
 */
export const useExtensionsCount = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupServiceFactoryAbi,
    functionName: 'extensionsCount',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

// =====================
// === 写入 Hook ===
// =====================

/**
 * Hook for createExtension - 创建扩展
 *
 * 注意：在调用 createExtension 之前，需要先授权 1 个代币给 factory
 */
export function useCreateExtension(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionGroupServiceFactoryAbi,
    contractAddress,
    'createExtension',
  );

  const createExtension = async (
    tokenAddress: `0x${string}`, // 链群服务行动代币地址
    groupActionTokenAddress: `0x${string}`, // 组行动代币地址
    groupActionFactoryAddress: `0x${string}`, // 组行动工厂地址
    maxRecipients: bigint, // 链群服务激励行动 激励分配地址 上限
  ) => {
    console.log('提交 createExtension 交易:', {
      contractAddress,
      tokenAddress,
      groupActionTokenAddress,
      groupActionFactoryAddress,
      maxRecipients,
      isTukeMode,
    });
    return await execute([tokenAddress, groupActionTokenAddress, groupActionFactoryAddress, maxRecipients]);
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

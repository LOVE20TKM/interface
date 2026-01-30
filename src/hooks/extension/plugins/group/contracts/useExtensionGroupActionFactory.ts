// hooks/extension/plugins/group/contracts/useExtensionGroupActionFactory.ts

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { ExtensionGroupActionFactoryAbi } from '@/src/abis/ExtensionGroupActionFactory';
import { safeToBigInt } from '@/src/lib/clientUtils';

// 注意：ExtensionGroupActionFactory 是固定地址的合约
// 需要从配置中获取合约地址

// =====================
// === 读取 Hooks - 地址常量 ===
// =====================

/**
 * Hook for GROUP_ADDRESS - 获取组合约地址
 */
export const useGroupAddress = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupActionFactoryAbi,
    functionName: 'GROUP_ADDRESS',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { groupAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for GROUP_JOIN_ADDRESS - 获取加入合约地址
 */
export const useGroupJoinAddress = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupActionFactoryAbi,
    functionName: 'GROUP_JOIN_ADDRESS',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { groupJoinAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for GROUP_MANAGER_ADDRESS - 获取组管理器地址
 */
export const useGroupManagerAddress = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupActionFactoryAbi,
    functionName: 'GROUP_MANAGER_ADDRESS',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { groupManagerAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for GROUP_VERIFY_ADDRESS - 获取验证合约地址
 */
export const useGroupVerifyAddress = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupActionFactoryAbi,
    functionName: 'GROUP_VERIFY_ADDRESS',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { groupVerifyAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for CENTER_ADDRESS - 获取 center 合约地址
 */
export const useCenter = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupActionFactoryAbi,
    functionName: 'CENTER_ADDRESS',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { centerAddress: data as `0x${string}` | undefined, isPending, error };
};

// =====================
// === 读取 Hooks - 扩展查询 ===
// =====================

/**
 * Hook for exists - 检查扩展是否存在
 */
export const useExists = (contractAddress: `0x${string}`, extension: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupActionFactoryAbi,
    functionName: 'exists',
    args: [extension],
    query: {
      enabled: !!contractAddress && !!extension,
    },
  });

  return { exists: data as boolean | undefined, isPending, error };
};

/**
 * Hook for extensions - 获取所有扩展地址
 */
export const useExtensions = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupActionFactoryAbi,
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
    abi: ExtensionGroupActionFactoryAbi,
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
    abi: ExtensionGroupActionFactoryAbi,
    functionName: 'extensionsCount',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

// =====================
// === 写入 Hooks ===
// =====================

/**
 * Hook for createExtension - 创建扩展
 */
export function useCreateExtension(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    ExtensionGroupActionFactoryAbi,
    contractAddress,
    'createExtension',
  );

  const createExtension = async (
    tokenAddress: `0x${string}`,
    joinTokenAddress: `0x${string}`,
    activationStakeAmount: bigint,
    maxJoinAmountRatio: bigint,
    maxVerifyCapacityFactor: bigint,
  ) => {
    console.log('提交 createExtension 交易:', {
      contractAddress,
      tokenAddress,
      joinTokenAddress,
      activationStakeAmount,
      maxJoinAmountRatio,
      maxVerifyCapacityFactor,
      isTukeMode,
    });
    return await execute([
      tokenAddress,
      joinTokenAddress,
      activationStakeAmount,
      maxJoinAmountRatio,
      maxVerifyCapacityFactor,
    ]);
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

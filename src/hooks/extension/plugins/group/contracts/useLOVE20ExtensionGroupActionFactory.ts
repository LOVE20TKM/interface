// hooks/extension/plugins/group/contracts/useLOVE20ExtensionGroupActionFactory.ts

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { LOVE20ExtensionGroupActionFactoryAbi } from '@/src/abis/LOVE20ExtensionGroupActionFactory';
import { safeToBigInt } from '@/src/lib/clientUtils';

// 注意：ExtensionGroupActionFactory 是固定地址的合约
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
    abi: LOVE20ExtensionGroupActionFactoryAbi,
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
    abi: LOVE20ExtensionGroupActionFactoryAbi,
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
    abi: LOVE20ExtensionGroupActionFactoryAbi,
    functionName: 'extensionParams',
    args: [extension],
    query: {
      enabled: !!contractAddress && !!extension,
    },
  });

  return {
    tokenAddress: data ? (data.tokenAddress as `0x${string}`) : undefined,
    groupManagerAddress: data ? (data.groupManagerAddress as `0x${string}`) : undefined,
    groupDistrustAddress: data ? (data.groupDistrustAddress as `0x${string}`) : undefined,
    stakeTokenAddress: data ? (data.stakeTokenAddress as `0x${string}`) : undefined,
    minGovVoteRatioBps: data ? safeToBigInt(data.minGovVoteRatioBps) : undefined,
    capacityMultiplier: data ? safeToBigInt(data.capacityMultiplier) : undefined,
    stakingMultiplier: data ? safeToBigInt(data.stakingMultiplier) : undefined,
    maxJoinAmountMultiplier: data ? safeToBigInt(data.maxJoinAmountMultiplier) : undefined,
    minJoinAmount: data ? safeToBigInt(data.minJoinAmount) : undefined,
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
    abi: LOVE20ExtensionGroupActionFactoryAbi,
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
    abi: LOVE20ExtensionGroupActionFactoryAbi,
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
    abi: LOVE20ExtensionGroupActionFactoryAbi,
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
 */
export function useCreateExtension(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionGroupActionFactoryAbi,
    contractAddress,
    'createExtension',
  );

  const createExtension = async (
    tokenAddress: `0x${string}`,
    groupManagerAddress: `0x${string}`,
    groupDistrustAddress: `0x${string}`,
    stakeTokenAddress: `0x${string}`,
    minGovVoteRatioBps: bigint,
    capacityMultiplier: bigint,
    stakingMultiplier: bigint,
    maxJoinAmountMultiplier: bigint,
    minJoinAmount: bigint,
  ) => {
    console.log('提交 createExtension 交易:', {
      contractAddress,
      tokenAddress,
      groupManagerAddress,
      groupDistrustAddress,
      stakeTokenAddress,
      minGovVoteRatioBps,
      capacityMultiplier,
      stakingMultiplier,
      maxJoinAmountMultiplier,
      minJoinAmount,
      isTukeMode,
    });
    return await execute([
      tokenAddress,
      groupManagerAddress,
      groupDistrustAddress,
      stakeTokenAddress,
      minGovVoteRatioBps,
      capacityMultiplier,
      stakingMultiplier,
      maxJoinAmountMultiplier,
      minJoinAmount,
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

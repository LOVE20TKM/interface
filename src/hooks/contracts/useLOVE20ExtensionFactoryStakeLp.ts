// hooks/contracts/useLOVE20ExtensionFactoryStakeLp.ts

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { LOVE20ExtensionFactoryStakeLpAbi } from '@/src/abis/LOVE20ExtensionFactoryStakeLp';
import { safeToBigInt } from '@/src/lib/clientUtils';

// TODO: 需要在环境变量中配置这个合约地址
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_FACTORY_STAKELP as `0x${string}`;

// =====================
// === 读取 Hook ===
// =====================

/**
 * Hook for center - 获取 ExtensionCenter 地址
 */
export const useFactoryCenter = (factoryAddress?: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: factoryAddress || CONTRACT_ADDRESS,
    abi: LOVE20ExtensionFactoryStakeLpAbi,
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
    abi: LOVE20ExtensionFactoryStakeLpAbi,
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
    abi: LOVE20ExtensionFactoryStakeLpAbi,
    functionName: 'extensionParams',
    args: [extensionAddress],
    query: {
      enabled: !!factoryAddress && !!extensionAddress,
    },
  });

  return {
    tokenAddress: data ? (data[0] as `0x${string}`) : undefined,
    actionId: data ? safeToBigInt(data[1]) : undefined,
    anotherTokenAddress: data ? (data[2] as `0x${string}`) : undefined,
    waitingPhases: data ? safeToBigInt(data[3]) : undefined,
    govRatioMultiplier: data ? safeToBigInt(data[4]) : undefined,
    minGovVotes: data ? safeToBigInt(data[5]) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for extensions - 获取指定代币的所有扩展地址
 */
export const useFactoryExtensions = (factoryAddress: `0x${string}`, tokenAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: factoryAddress,
    abi: LOVE20ExtensionFactoryStakeLpAbi,
    functionName: 'extensions',
    args: [tokenAddress],
    query: {
      enabled: !!factoryAddress && !!tokenAddress,
    },
  });

  return { extensions: data as `0x${string}`[] | undefined, isPending, error };
};

/**
 * Hook for extensionsAtIndex - 根据索引获取扩展地址
 */
export const useFactoryExtensionsAtIndex = (
  factoryAddress: `0x${string}`,
  tokenAddress: `0x${string}`,
  index: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: factoryAddress,
    abi: LOVE20ExtensionFactoryStakeLpAbi,
    functionName: 'extensionsAtIndex',
    args: [tokenAddress, index],
    query: {
      enabled: !!factoryAddress && !!tokenAddress && index !== undefined,
    },
  });

  return { extensionAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for extensionsCount - 获取指定代币的扩展数量
 */
export const useFactoryExtensionsCount = (factoryAddress: `0x${string}`, tokenAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: factoryAddress,
    abi: LOVE20ExtensionFactoryStakeLpAbi,
    functionName: 'extensionsCount',
    args: [tokenAddress],
    query: {
      enabled: !!factoryAddress && !!tokenAddress,
    },
  });

  return { extensionsCount: safeToBigInt(data), isPending, error };
};

// =====================
// === 写入 Hook ===
// =====================

/**
 * Hook for createExtension - 创建新的 StakeLp 扩展
 * @param factoryAddress 工厂合约地址，如果不提供则使用环境变量中的默认地址
 */
export function useCreateExtension(factoryAddress?: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionFactoryStakeLpAbi,
    factoryAddress || CONTRACT_ADDRESS,
    'createExtension',
  );

  const createExtension = async (
    tokenAddress: `0x${string}`,
    actionId: bigint,
    anotherTokenAddress: `0x${string}`,
    waitingPhases: bigint,
    govRatioMultiplier: bigint,
    minGovVotes: bigint,
  ) => {
    console.log('提交 createExtension 交易:', {
      tokenAddress,
      actionId,
      anotherTokenAddress,
      waitingPhases,
      govRatioMultiplier,
      minGovVotes,
      isTukeMode,
    });
    return await execute([tokenAddress, actionId, anotherTokenAddress, waitingPhases, govRatioMultiplier, minGovVotes]);
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

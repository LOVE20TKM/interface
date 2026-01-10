// hooks/useILOVE20Extension.ts
// 通用的 ILOVE20Extension 接口 Hook
// 可用于任何继承 ILOVE20Extension 接口的扩展合约

import { useReadContract } from 'wagmi';
import { IExtensionAbi } from '@/src/abis/IExtension';
import { safeToBigInt } from '@/src/lib/clientUtils';

// =====================
// === 读取 Hook ===
// =====================

/**
 * Hook for initialized - 检查是否已初始化
 */
export const useExtensionInitialized = (extensionAddress: `0x${string}` | undefined) => {
  const { data, isPending, error } = useReadContract({
    address: extensionAddress,
    abi: IExtensionAbi,
    functionName: 'initialized',
    query: {
      enabled: !!extensionAddress,
    },
  });

  return { initialized: data as boolean | undefined, isPending, error };
};

/**
 * Hook for FACTORY_ADDRESS - 获取 factory 地址
 */
export const useExtensionFactory = (extensionAddress: `0x${string}` | undefined) => {
  const { data, isPending, error } = useReadContract({
    address: extensionAddress,
    abi: IExtensionAbi,
    functionName: 'FACTORY_ADDRESS',
    query: {
      enabled: !!extensionAddress,
    },
  });

  return { factory: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for TOKEN_ADDRESS - 获取 token 地址
 */
export const useExtensionTokenAddress = (extensionAddress: `0x${string}` | undefined) => {
  const { data, isPending, error } = useReadContract({
    address: extensionAddress,
    abi: IExtensionAbi,
    functionName: 'TOKEN_ADDRESS',
    query: {
      enabled: !!extensionAddress,
    },
  });

  return { tokenAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for actionId - 获取 action ID
 */
export const useExtensionActionId = (extensionAddress: `0x${string}` | undefined) => {
  const { data, isPending, error } = useReadContract({
    address: extensionAddress,
    abi: IExtensionAbi,
    functionName: 'actionId',
    query: {
      enabled: !!extensionAddress,
    },
  });

  return { actionId: safeToBigInt(data), isPending, error };
};

/**
 * Hook for joinedAmount - 获取总参与价值
 */
export const useJoinedAmount = (extensionAddress: `0x${string}` | undefined) => {
  const { data, isPending, error } = useReadContract({
    address: extensionAddress,
    abi: IExtensionAbi,
    functionName: 'joinedAmount',
    query: {
      enabled: !!extensionAddress,
    },
  });

  return { joinedAmount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for joinedAmountByAccount - 获取账户的参与价值
 */
export const useJoinedAmountByAccount = (
  extensionAddress: `0x${string}` | undefined,
  account: `0x${string}` | undefined,
) => {
  const { data, isPending, error } = useReadContract({
    address: extensionAddress,
    abi: IExtensionAbi,
    functionName: 'joinedAmountByAccount',
    args: account ? [account] : undefined,
    query: {
      enabled: !!extensionAddress && !!account,
    },
  });

  return { joinedAmountByAccount: safeToBigInt(data), isPending, error };
};

// =====================
// === 写入 Hook ===
// =====================

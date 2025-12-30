// hooks/useILOVE20Extension.ts
// 通用的 ILOVE20Extension 接口 Hook
// 可用于任何继承 ILOVE20Extension 接口的扩展合约

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { IExtensionAbi } from '@/src/abis/IExtension';
import { safeToBigInt } from '@/src/lib/clientUtils';

// =====================
// === 读取 Hook ===
// =====================

/**
 * Hook for center - 获取 center 地址
 */
export const useExtensionCenter = (extensionAddress: `0x${string}` | undefined) => {
  const { data, isPending, error } = useReadContract({
    address: extensionAddress,
    abi: IExtensionAbi,
    functionName: 'center',
    query: {
      enabled: !!extensionAddress,
    },
  });

  return { center: data as `0x${string}` | undefined, isPending, error };
};

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
 * Hook for factory - 获取 factory 地址
 */
export const useExtensionFactory = (extensionAddress: `0x${string}` | undefined) => {
  const { data, isPending, error } = useReadContract({
    address: extensionAddress,
    abi: IExtensionAbi,
    functionName: 'factory',
    query: {
      enabled: !!extensionAddress,
    },
  });

  return { factory: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for tokenAddress - 获取 token 地址
 */
export const useExtensionTokenAddress = (extensionAddress: `0x${string}` | undefined) => {
  const { data, isPending, error } = useReadContract({
    address: extensionAddress,
    abi: IExtensionAbi,
    functionName: 'tokenAddress',
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
 * Hook for isJoinedValueCalculated - 检查是否已计算参与价值
 */
export const useIsJoinedValueCalculated = (extensionAddress: `0x${string}` | undefined) => {
  const { data, isPending, error } = useReadContract({
    address: extensionAddress,
    abi: IExtensionAbi,
    functionName: 'isJoinedValueCalculated',
    query: {
      enabled: !!extensionAddress,
    },
  });

  return { isJoinedValueCalculated: data as boolean | undefined, isPending, error };
};

/**
 * Hook for joinedValue - 获取总参与价值
 */
export const useJoinedValue = (extensionAddress: `0x${string}` | undefined) => {
  const { data, isPending, error } = useReadContract({
    address: extensionAddress,
    abi: IExtensionAbi,
    functionName: 'joinedValue',
    query: {
      enabled: !!extensionAddress,
    },
  });

  return { joinedValue: safeToBigInt(data), isPending, error };
};

/**
 * Hook for joinedValueByAccount - 获取账户的参与价值
 */
export const useJoinedValueByAccount = (
  extensionAddress: `0x${string}` | undefined,
  account: `0x${string}` | undefined,
) => {
  const { data, isPending, error } = useReadContract({
    address: extensionAddress,
    abi: IExtensionAbi,
    functionName: 'joinedValueByAccount',
    args: account ? [account] : undefined,
    query: {
      enabled: !!extensionAddress && !!account,
    },
  });

  return { joinedValueByAccount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for rewardByAccount - 获取账户在指定轮次的奖励
 */
export const useRewardByAccount = (
  extensionAddress: `0x${string}` | undefined,
  round: bigint | undefined,
  account: `0x${string}` | undefined,
) => {
  const { data, isPending, error } = useReadContract({
    address: extensionAddress,
    abi: IExtensionAbi,
    functionName: 'rewardByAccount',
    args: round !== undefined && account ? [round, account] : undefined,
    query: {
      enabled: !!extensionAddress && round !== undefined && !!account,
    },
  });

  const typedData = data as [bigint, boolean] | undefined;

  return {
    reward: typedData?.[0],
    isMinted: typedData?.[1],
    isPending,
    error,
  };
};

/**
 * Hook for reward - 获取指定轮次的奖励
 */
export const useReward = (extensionAddress: `0x${string}` | undefined, round: bigint | undefined) => {
  const { data, isPending, error } = useReadContract({
    address: extensionAddress,
    abi: IExtensionAbi,
    functionName: 'reward',
    args: round !== undefined ? [round] : undefined,
    query: {
      enabled: !!extensionAddress && round !== undefined,
    },
  });

  return { reward: safeToBigInt(data), isPending, error };
};

// =====================
// === 写入 Hook ===
// =====================

/**
 * Hook for claimReward - 领取指定轮次的奖励
 */
export const useClaimRewardFromExtension = (extensionAddress: `0x${string}` | undefined) => {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    IExtensionAbi,
    extensionAddress!,
    'claimReward',
  );

  const claimReward = async (round: bigint) => {
    if (!extensionAddress) {
      logError('Extension address is required');
      return;
    }

    try {
      console.log('领取扩展奖励:', { extensionAddress, round, isTukeMode });
      return await execute([round]);
    } catch (err) {
      logWeb3Error(err, 'claimReward');
      throw err;
    }
  };

  useEffect(() => {
    if (hash) {
      console.log('claimReward tx hash:', hash);
    }
    if (error) {
      console.log('领取扩展奖励错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return { claimReward, isPending, isConfirming, isConfirmed, error, hash };
};

// hooks/useILOVE20Extension.ts
// 通用的 ILOVE20Extension 接口 Hook
// 可用于任何继承 ILOVE20Extension 接口的扩展合约

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { ILOVE20ExtensionAbi } from '@/src/abis/ILOVE20Extension';
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
    abi: ILOVE20ExtensionAbi,
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
    abi: ILOVE20ExtensionAbi,
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
    abi: ILOVE20ExtensionAbi,
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
    abi: ILOVE20ExtensionAbi,
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
    abi: ILOVE20ExtensionAbi,
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
    abi: ILOVE20ExtensionAbi,
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
    abi: ILOVE20ExtensionAbi,
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
    abi: ILOVE20ExtensionAbi,
    functionName: 'joinedValueByAccount',
    args: account ? [account] : undefined,
    query: {
      enabled: !!extensionAddress && !!account,
    },
  });

  return { joinedValueByAccount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for accounts - 获取所有参与账户
 */
export const useExtensionAccounts = (extensionAddress: `0x${string}` | undefined) => {
  const { data, isPending, error } = useReadContract({
    address: extensionAddress,
    abi: ILOVE20ExtensionAbi,
    functionName: 'accounts',
    query: {
      enabled: !!extensionAddress,
    },
  });

  return { accounts: data as `0x${string}`[] | undefined, isPending, error };
};

/**
 * Hook for accountsCount - 获取参与账户数量
 */
export const useExtensionAccountsCount = (extensionAddress: `0x${string}` | undefined) => {
  const { data, isPending, error } = useReadContract({
    address: extensionAddress,
    abi: ILOVE20ExtensionAbi,
    functionName: 'accountsCount',
    query: {
      enabled: !!extensionAddress,
    },
  });

  return { accountsCount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for accountsAtIndex - 根据索引获取账户
 */
export const useAccountsAtIndex = (extensionAddress: `0x${string}` | undefined, index: bigint | undefined) => {
  const { data, isPending, error } = useReadContract({
    address: extensionAddress,
    abi: ILOVE20ExtensionAbi,
    functionName: 'accountsAtIndex',
    args: index !== undefined ? [index] : undefined,
    query: {
      enabled: !!extensionAddress && index !== undefined,
    },
  });

  return { account: data as `0x${string}` | undefined, isPending, error };
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
    abi: ILOVE20ExtensionAbi,
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
export const useReward = (
  extensionAddress: `0x${string}` | undefined,
  round: bigint | undefined,
) => {
  const { data, isPending, error } = useReadContract({
    address: extensionAddress,
    abi: ILOVE20ExtensionAbi,
    functionName: 'reward',
    args: round !== undefined ? [round] : undefined,
    query: {
      enabled: !!extensionAddress && round !== undefined,
    },
  });

  return { reward: safeToBigInt(data), isPending, error };
};

/**
 * Hook for verificationInfo - 获取验证信息
 */
export const useVerificationInfo = (
  extensionAddress: `0x${string}` | undefined,
  account: `0x${string}` | undefined,
  verificationKey: string | undefined,
) => {
  const { data, isPending, error } = useReadContract({
    address: extensionAddress,
    abi: ILOVE20ExtensionAbi,
    functionName: 'verificationInfo',
    args: account && verificationKey ? [account, verificationKey] : undefined,
    query: {
      enabled: !!extensionAddress && !!account && !!verificationKey,
    },
  });

  return { verificationInfo: data as string | undefined, isPending, error };
};

/**
 * Hook for verificationInfoByRound - 获取指定轮次的验证信息
 */
export const useVerificationInfoByRound = (
  extensionAddress: `0x${string}` | undefined,
  account: `0x${string}` | undefined,
  verificationKey: string | undefined,
  round: bigint | undefined,
) => {
  const { data, isPending, error } = useReadContract({
    address: extensionAddress,
    abi: ILOVE20ExtensionAbi,
    functionName: 'verificationInfoByRound',
    args: account && verificationKey && round !== undefined ? [account, verificationKey, round] : undefined,
    query: {
      enabled: !!extensionAddress && !!account && !!verificationKey && round !== undefined,
    },
  });

  return { verificationInfo: data as string | undefined, isPending, error };
};

/**
 * Hook for verificationInfoUpdateRoundsAtIndex - 根据索引获取验证信息更新轮次
 */
export const useVerificationInfoUpdateRoundsAtIndex = (
  extensionAddress: `0x${string}` | undefined,
  account: `0x${string}` | undefined,
  verificationKey: string | undefined,
  index: bigint | undefined,
) => {
  const { data, isPending, error } = useReadContract({
    address: extensionAddress,
    abi: ILOVE20ExtensionAbi,
    functionName: 'verificationInfoUpdateRoundsAtIndex',
    args: account && verificationKey && index !== undefined ? [account, verificationKey, index] : undefined,
    query: {
      enabled: !!extensionAddress && !!account && !!verificationKey && index !== undefined,
    },
  });

  return { round: safeToBigInt(data), isPending, error };
};

/**
 * Hook for verificationInfoUpdateRoundsCount - 获取验证信息更新轮次数量
 */
export const useVerificationInfoUpdateRoundsCount = (
  extensionAddress: `0x${string}` | undefined,
  account: `0x${string}` | undefined,
  verificationKey: string | undefined,
) => {
  const { data, isPending, error } = useReadContract({
    address: extensionAddress,
    abi: ILOVE20ExtensionAbi,
    functionName: 'verificationInfoUpdateRoundsCount',
    args: account && verificationKey ? [account, verificationKey] : undefined,
    query: {
      enabled: !!extensionAddress && !!account && !!verificationKey,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

// =====================
// === 写入 Hook ===
// =====================

/**
 * Hook for claimReward - 领取指定轮次的奖励
 */
export const useClaimRewardFromExtension = (extensionAddress: `0x${string}` | undefined) => {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    ILOVE20ExtensionAbi,
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

/**
 * Hook for exit - 退出扩展
 */
export const useExitFromExtension = (extensionAddress: `0x${string}` | undefined) => {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    ILOVE20ExtensionAbi,
    extensionAddress!,
    'exit',
  );

  const exit = async () => {
    if (!extensionAddress) {
      logError('Extension address is required');
      return;
    }

    try {
      console.log('退出扩展:', { extensionAddress, isTukeMode });
      return await execute([]);
    } catch (err) {
      logWeb3Error(err, 'exit');
      throw err;
    }
  };

  useEffect(() => {
    if (hash) {
      console.log('exit tx hash:', hash);
    }
    if (error) {
      console.log('退出扩展错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return { exit, isPending, isConfirming, isConfirmed, error, hash, isTukeMode };
};

/**
 * Hook for updateVerificationInfo - 更新验证信息
 */
export const useUpdateVerificationInfoFromExtension = (extensionAddress: `0x${string}` | undefined) => {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    ILOVE20ExtensionAbi,
    extensionAddress!,
    'updateVerificationInfo',
  );

  const updateVerificationInfo = async (verificationInfos: string[]) => {
    if (!extensionAddress) {
      logError('Extension address is required');
      return;
    }

    try {
      console.log('更新验证信息:', { extensionAddress, verificationInfos, isTukeMode });
      return await execute([verificationInfos]);
    } catch (err) {
      logWeb3Error(err, 'updateVerificationInfo');
      throw err;
    }
  };

  useEffect(() => {
    if (hash) {
      console.log('updateVerificationInfo tx hash:', hash);
    }
    if (error) {
      console.log('更新验证信息错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return { updateVerificationInfo, isPending, isConfirming, isConfirmed, error, hash, isTukeMode };
};

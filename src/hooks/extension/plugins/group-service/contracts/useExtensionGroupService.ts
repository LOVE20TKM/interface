// hooks/extension/plugins/group-service/contracts/useExtensionGroupService.ts

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { ExtensionGroupServiceAbi } from '@/src/abis/ExtensionGroupService';
import { safeToBigInt } from '@/src/lib/clientUtils';

// 注意：ExtensionGroupService 是动态部署的合约，需要传入合约地址
// 与其他固定地址的合约不同

// =====================
// === 读取 Hook ===
// =====================

/**
 * Hook for PRECISION - 获取精度常量
 */
export const usePrecision = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupServiceAbi,
    functionName: 'PRECISION',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { precision: safeToBigInt(data), isPending, error };
};

/**
 * Hook for GROUP_ACTION_TOKEN_ADDRESS - 获取组行动代币地址
 */
export const useGroupActionTokenAddress = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupServiceAbi,
    functionName: 'GROUP_ACTION_TOKEN_ADDRESS',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { groupActionTokenAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for GROUP_ACTION_FACTORY_ADDRESS - 获取组行动工厂地址
 */
export const useGroupActionFactoryAddress = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupServiceAbi,
    functionName: 'GROUP_ACTION_FACTORY_ADDRESS',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { groupActionFactoryAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for FACTORY_ADDRESS - 获取工厂地址
 */
export const useFactory = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupServiceAbi,
    functionName: 'FACTORY_ADDRESS',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { factoryAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for generatedActionRewardByVerifier - 获取验证者生成的行动奖励
 */
export const useGeneratedActionRewardByVerifier = (
  contractAddress: `0x${string}`,
  round: bigint,
  verifier: `0x${string}`,
) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupServiceAbi,
    functionName: 'generatedActionRewardByVerifier',
    args: [verifier, round],
    query: {
      enabled: !!contractAddress && !!round && !!verifier,
    },
  });

  return {
    amount: safeToBigInt(data),
    isPending,
    error,
  };
};

/**
 * Hook for hasActiveGroups - 检查账户是否有活跃的组
 */
export const useHasActiveGroups = (contractAddress: `0x${string}`, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupServiceAbi,
    functionName: 'hasActiveGroups',
    args: [account],
    query: {
      enabled: !!contractAddress && !!account,
    },
  });

  return { hasActiveGroups: data as boolean | undefined, isPending, error };
};

/**
 * Hook for initialized - 检查是否已初始化
 */
export const useInitialized = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupServiceAbi,
    functionName: 'initialized',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { initialized: data as boolean | undefined, isPending, error };
};

/**
 * Hook for joinedAmount - 获取加入值
 */
export const useJoinedAmount = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupServiceAbi,
    functionName: 'joinedAmount',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { joinedAmount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for joinedAmountByAccount - 获取账户的加入值
 */
export const useJoinedAmountByAccount = (contractAddress: `0x${string}`, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupServiceAbi,
    functionName: 'joinedAmountByAccount',
    args: [account],
    query: {
      enabled: !!contractAddress && !!account,
    },
  });

  return { joinedAmountByAccount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for joinInfo - 获取账户的加入信息
 */
export const useJoinInfo = (contractAddress: `0x${string}`, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupServiceAbi,
    functionName: 'joinInfo',
    args: [account],
    query: {
      enabled: !!contractAddress && !!account,
    },
  });

  return { joinedRound: safeToBigInt(data), isPending, error };
};

/**
 * Hook for reward - 获取指定轮次的奖励
 */
export const useReward = (contractAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupServiceAbi,
    functionName: 'reward',
    args: [round],
    query: {
      enabled: !!contractAddress && !!round,
    },
  });

  return { reward: safeToBigInt(data), isPending, error };
};

/**
 * Hook for rewardByAccount - 获取账户的奖励信息
 */
export const useRewardByAccount = (contractAddress: `0x${string}`, round: bigint, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupServiceAbi,
    functionName: 'rewardByAccount',
    args: [round, account],
    query: {
      enabled: !!contractAddress && !!round && !!account,
    },
  });

  return {
    mintReward: data ? safeToBigInt(data[0]) : undefined,
    burnReward: data ? safeToBigInt(data[1]) : undefined,
    claimed: data ? (data[2] as unknown as boolean) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for rewardByRecipient - 获取指定接收者的奖励
 */
export const useRewardByRecipient = (
  contractAddress: `0x${string}`,
  round: bigint,
  verifier: `0x${string}`,
  actionId: bigint,
  groupId: bigint,
  recipient: `0x${string}`,
) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupServiceAbi,
    functionName: 'rewardByRecipient',
    args: [verifier, round, actionId, groupId, recipient],
    query: {
      enabled:
        !!contractAddress && !!round && !!verifier && actionId !== undefined && groupId !== undefined && !!recipient,
    },
  });

  return { rewardByRecipient: safeToBigInt(data), isPending, error };
};

/**
 * Hook for rewardDistribution - 获取奖励分配信息
 */
export const useRewardDistribution = (
  contractAddress: `0x${string}`,
  round: bigint,
  groupOwner: `0x${string}`,
  actionId: bigint,
  groupId: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupServiceAbi,
    functionName: 'rewardDistribution',
    args: [groupOwner, round, actionId, groupId],
    query: {
      enabled: !!contractAddress && !!round && !!groupOwner && actionId !== undefined && groupId !== undefined,
    },
  });

  return {
    addrs: data ? (data[0] as `0x${string}`[]) : undefined,
    ratios: data ? (data[1] as bigint[]) : undefined,
    amounts: data ? (data[2] as bigint[]) : undefined,
    ownerAmount: data ? safeToBigInt(data[3]) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for TOKEN_ADDRESS - 获取代币地址
 */
export const useTokenAddress = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupServiceAbi,
    functionName: 'TOKEN_ADDRESS',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { tokenAddress: data as `0x${string}` | undefined, isPending, error };
};

// =====================
// === 写入 Hook ===
// =====================

/**
 * Hook for exit - 退出
 */
export function useExit(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    ExtensionGroupServiceAbi,
    contractAddress,
    'exit',
  );

  const exit = async () => {
    console.log('提交 exit 交易:', { contractAddress, isTukeMode });
    return await execute([]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('exit tx hash:', hash);
    }
    if (error) {
      console.log('提交 exit 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    exit,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for join - 加入
 */
export function useJoin(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    ExtensionGroupServiceAbi,
    contractAddress,
    'join',
  );

  const join = async (verificationInfos: string[]) => {
    console.log('提交 join 交易:', { contractAddress, verificationInfos, isTukeMode });
    return await execute([verificationInfos]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('join tx hash:', hash);
    }
    if (error) {
      console.log('提交 join 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    join,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

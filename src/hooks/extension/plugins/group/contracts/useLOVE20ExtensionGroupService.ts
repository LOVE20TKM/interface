// hooks/extension/plugins/group/contracts/useLOVE20ExtensionGroupService.ts

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { LOVE20ExtensionGroupServiceAbi } from '@/src/abis/LOVE20ExtensionGroupService';
import { safeToBigInt } from '@/src/lib/clientUtils';

// 注意：ExtensionGroupService 是动态部署的合约，需要传入合约地址
// 与其他固定地址的合约不同

// =====================
// === 读取 Hook ===
// =====================

/**
 * Hook for BASIS_POINTS_BASE - 获取基点基数
 */
export const useBasisPointsBase = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupServiceAbi,
    functionName: 'BASIS_POINTS_BASE',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { basisPointsBase: safeToBigInt(data), isPending, error };
};

/**
 * Hook for GROUP_ACTION_TOKEN_ADDRESS - 获取组行动代币地址
 */
export const useGroupActionTokenAddress = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupServiceAbi,
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
    abi: LOVE20ExtensionGroupServiceAbi,
    functionName: 'GROUP_ACTION_FACTORY_ADDRESS',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { groupActionFactoryAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for MAX_RECIPIENTS - 获取最大接收者数量
 */
export const useMaxRecipients = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupServiceAbi,
    functionName: 'MAX_RECIPIENTS',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { maxRecipients: safeToBigInt(data), isPending, error };
};


/**
 * Hook for actionId - 获取 action ID
 */
export const useActionId = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupServiceAbi,
    functionName: 'actionId',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { actionId: safeToBigInt(data), isPending, error };
};

/**
 * Hook for center - 获取 center 合约地址
 */
export const useCenter = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupServiceAbi,
    functionName: 'center',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { centerAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for factory - 获取工厂地址
 */
export const useFactory = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupServiceAbi,
    functionName: 'factory',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { factoryAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for initialized - 检查是否已初始化
 */
export const useInitialized = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupServiceAbi,
    functionName: 'initialized',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { initialized: data as boolean | undefined, isPending, error };
};

/**
 * Hook for isJoinedValueCalculated - 检查加入值是否已计算
 */
export const useIsJoinedValueCalculated = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupServiceAbi,
    functionName: 'isJoinedValueCalculated',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { isJoinedValueCalculated: data as boolean | undefined, isPending, error };
};

/**
 * Hook for joinedValue - 获取加入值
 */
export const useJoinedValue = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupServiceAbi,
    functionName: 'joinedValue',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { joinedValue: safeToBigInt(data), isPending, error };
};

/**
 * Hook for joinedValueByAccount - 获取账户的加入值
 */
export const useJoinedValueByAccount = (contractAddress: `0x${string}`, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupServiceAbi,
    functionName: 'joinedValueByAccount',
    args: [account],
    query: {
      enabled: !!contractAddress && !!account,
    },
  });

  return { joinedValueByAccount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for joinInfo - 获取账户的加入信息
 */
export const useJoinInfo = (contractAddress: `0x${string}`, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupServiceAbi,
    functionName: 'joinInfo',
    args: [account],
    query: {
      enabled: !!contractAddress && !!account,
    },
  });

  return { joinedRound: safeToBigInt(data), isPending, error };
};

/**
 * Hook for recipients - 获取指定组所有者和轮次的接收者信息
 */
export const useRecipients = (
  contractAddress: `0x${string}`,
  groupOwner: `0x${string}`,
  round: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupServiceAbi,
    functionName: 'recipients',
    args: [groupOwner, round],
    query: {
      enabled: !!contractAddress && !!groupOwner && round !== undefined,
    },
  });

  return {
    addrs: data ? (data[0] as `0x${string}`[]) : undefined,
    basisPoints: data ? (data[1] as bigint[]) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for recipientsLatest - 获取指定组所有者的最新接收者信息
 */
export const useRecipientsLatest = (contractAddress: `0x${string}`, groupOwner: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupServiceAbi,
    functionName: 'recipientsLatest',
    args: [groupOwner],
    query: {
      enabled: !!contractAddress && !!groupOwner,
    },
  });

  return {
    addrs: data ? (data[0] as `0x${string}`[]) : undefined,
    basisPoints: data ? (data[1] as bigint[]) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for reward - 获取指定轮次的奖励
 */
export const useReward = (contractAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupServiceAbi,
    functionName: 'reward',
    args: [round],
    query: {
      enabled: !!contractAddress && round !== undefined,
    },
  });

  return { reward: safeToBigInt(data), isPending, error };
};

/**
 * Hook for rewardByAccount - 获取账户的奖励信息
 */
export const useRewardByAccount = (
  contractAddress: `0x${string}`,
  round: bigint,
  account: `0x${string}`,
) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupServiceAbi,
    functionName: 'rewardByAccount',
    args: [round, account],
    query: {
      enabled: !!contractAddress && round !== undefined && !!account,
    },
  });

  return {
    reward: data ? safeToBigInt(data[0]) : undefined,
    isMinted: data ? (data[1] as boolean) : undefined,
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
  groupOwner: `0x${string}`,
  recipient: `0x${string}`,
) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupServiceAbi,
    functionName: 'rewardByRecipient',
    args: [round, groupOwner, recipient],
    query: {
      enabled: !!contractAddress && round !== undefined && !!groupOwner && !!recipient,
    },
  });

  return { reward: safeToBigInt(data), isPending, error };
};

/**
 * Hook for rewardDistribution - 获取奖励分配信息
 */
export const useRewardDistribution = (
  contractAddress: `0x${string}`,
  round: bigint,
  groupOwner: `0x${string}`,
) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupServiceAbi,
    functionName: 'rewardDistribution',
    args: [round, groupOwner],
    query: {
      enabled: !!contractAddress && round !== undefined && !!groupOwner,
    },
  });

  return {
    addrs: data ? (data[0] as `0x${string}`[]) : undefined,
    basisPoints: data ? (data[1] as bigint[]) : undefined,
    amounts: data ? (data[2] as bigint[]) : undefined,
    ownerAmount: data ? safeToBigInt(data[3]) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for tokenAddress - 获取代币地址
 */
export const useTokenAddress = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupServiceAbi,
    functionName: 'tokenAddress',
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
 * Hook for claimReward - 领取奖励
 */
export function useClaimReward(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionGroupServiceAbi,
    contractAddress,
    'claimReward',
  );

  const claimReward = async (round: bigint) => {
    console.log('提交 claimReward 交易:', { contractAddress, round, isTukeMode });
    return await execute([round]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('claimReward tx hash:', hash);
    }
    if (error) {
      console.log('提交 claimReward 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    claimReward,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for exit - 退出
 */
export function useExit(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionGroupServiceAbi,
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
    LOVE20ExtensionGroupServiceAbi,
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

/**
 * Hook for setRecipients - 设置接收者
 */
export function useSetRecipients(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionGroupServiceAbi,
    contractAddress,
    'setRecipients',
  );

  const setRecipients = async (addrs: `0x${string}`[], basisPoints: bigint[]) => {
    console.log('提交 setRecipients 交易:', { contractAddress, addrs, basisPoints, isTukeMode });
    return await execute([addrs, basisPoints]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('setRecipients tx hash:', hash);
    }
    if (error) {
      console.log('提交 setRecipients 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    setRecipients,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}



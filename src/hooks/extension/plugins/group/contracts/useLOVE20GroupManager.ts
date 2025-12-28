// hooks/extension/plugins/group/contracts/useLOVE20GroupManager.ts

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { LOVE20GroupManagerAbi } from '@/src/abis/LOVE20GroupManager';
import { safeToBigInt } from '@/src/lib/clientUtils';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_MANAGER as `0x${string}`;

// =====================
// === 读取 Hook ===
// =====================

/**
 * Hook for CENTER_ADDRESS - 获取 center 合约地址
 */
export const useCenterAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupManagerAbi,
    functionName: 'CENTER_ADDRESS',
  });

  return { centerAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for JOIN_ADDRESS - 获取 join 合约地址
 */
export const useJoinAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupManagerAbi,
    functionName: 'JOIN_ADDRESS',
  });

  return { joinAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for STAKE_ADDRESS - 获取 stake 合约地址
 */
export const useStakeAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupManagerAbi,
    functionName: 'STAKE_ADDRESS',
  });

  return { stakeAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for GROUP_ADDRESS - 获取 group 合约地址
 */
export const useGroupAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupManagerAbi,
    functionName: 'GROUP_ADDRESS',
  });

  return { groupAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for PRECISION - 获取精度常量
 */
export const usePrecision = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupManagerAbi,
    functionName: 'PRECISION',
  });

  return { precision: safeToBigInt(data), isPending, error };
};

/**
 * Hook for activeGroupIds - 获取所有活跃组ID列表
 */
export const useActiveGroupIds = (tokenAddress: `0x${string}`, actionId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupManagerAbi,
    functionName: 'activeGroupIds',
    args: [tokenAddress, actionId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined,
    },
  });

  return { activeGroupIds: data as bigint[] | undefined, isPending, error };
};

/**
 * Hook for activeGroupIdsAtIndex - 根据索引获取活跃组ID
 */
export const useActiveGroupIdsAtIndex = (tokenAddress: `0x${string}`, actionId: bigint, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupManagerAbi,
    functionName: 'activeGroupIdsAtIndex',
    args: [tokenAddress, actionId, index],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && index !== undefined,
    },
  });

  return { groupId: safeToBigInt(data), isPending, error };
};

/**
 * Hook for activeGroupIdsByOwner - 获取指定所有者的活跃组ID列表
 */
export const useActiveGroupIdsByOwner = (tokenAddress: `0x${string}`, actionId: bigint, owner: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupManagerAbi,
    functionName: 'activeGroupIdsByOwner',
    args: [tokenAddress, actionId, owner],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && !!owner,
    },
  });

  return { activeGroupIds: data as bigint[] | undefined, isPending, error };
};

/**
 * Hook for activeGroupIdsCount - 获取活跃组ID数量
 */
export const useActiveGroupIdsCount = (tokenAddress: `0x${string}`, actionId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupManagerAbi,
    functionName: 'activeGroupIdsCount',
    args: [tokenAddress, actionId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

/**
 * Hook for calculateJoinMaxAmount - 计算最大加入数量
 */
export const useCalculateJoinMaxAmount = (tokenAddress: `0x${string}`, actionId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupManagerAbi,
    functionName: 'calculateJoinMaxAmount',
    args: [tokenAddress, actionId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined,
    },
  });

  return { maxAmount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for config - 获取配置
 */
export const useConfig = (tokenAddress: `0x${string}`, actionId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupManagerAbi,
    functionName: 'config',
    args: [tokenAddress, actionId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined,
    },
  });

  const typedData = data as [string, string, bigint, bigint, bigint] | undefined;

  return {
    stakeTokenAddress: typedData ? (typedData[0] as `0x${string}`) : undefined,
    joinTokenAddress: typedData ? (typedData[1] as `0x${string}`) : undefined,
    activationStakeAmount: typedData ? safeToBigInt(typedData[2]) : undefined,
    maxJoinAmountRatio: typedData ? safeToBigInt(typedData[3]) : undefined,
    maxVerifyCapacityFactor: typedData ? safeToBigInt(typedData[4]) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for groupInfo - 获取组信息
 */
export const useGroupInfo = (tokenAddress: `0x${string}`, actionId: bigint, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupManagerAbi,
    functionName: 'groupInfo',
    args: [tokenAddress, actionId, groupId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && groupId !== undefined,
    },
  });

  const typedData = data as [bigint, string, bigint, bigint, bigint, bigint, boolean, bigint, bigint] | undefined;

  return {
    groupId: typedData ? safeToBigInt(typedData[0]) : undefined,
    description: typedData ? typedData[1] : undefined,
    maxCapacity: typedData ? safeToBigInt(typedData[2]) : undefined,
    minJoinAmount: typedData ? safeToBigInt(typedData[3]) : undefined,
    maxJoinAmount: typedData ? safeToBigInt(typedData[4]) : undefined,
    maxAccounts: typedData ? safeToBigInt(typedData[5]) : undefined,
    isActive: typedData ? typedData[6] : undefined,
    activatedRound: typedData ? safeToBigInt(typedData[7]) : undefined,
    deactivatedRound: typedData ? safeToBigInt(typedData[8]) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for isGroupActive - 检查组是否活跃
 */
export const useIsGroupActive = (tokenAddress: `0x${string}`, actionId: bigint, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupManagerAbi,
    functionName: 'isGroupActive',
    args: [tokenAddress, actionId, groupId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && groupId !== undefined,
    },
  });

  return { isActive: data as boolean | undefined, isPending, error };
};

/**
 * Hook for maxVerifyCapacityByOwner - 获取指定所有者的最大容量
 */
export const useMaxVerifyCapacityByOwner = (tokenAddress: `0x${string}`, actionId: bigint, owner: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupManagerAbi,
    functionName: 'maxVerifyCapacityByOwner',
    args: [tokenAddress, actionId, owner],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && !!owner,
    },
  });

  return { maxVerifyCapacity: safeToBigInt(data), isPending, error };
};

/**
 * Hook for totalStaked - 获取总质押数量
 */
export const useTotalStaked = (tokenAddress: `0x${string}`, actionId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupManagerAbi,
    functionName: 'totalStaked',
    args: [tokenAddress, actionId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined,
    },
  });

  return { totalStaked: safeToBigInt(data), isPending, error };
};

/**
 * Hook for totalStakedByOwner - 获取指定所有者的总质押数量
 */
export const useTotalStakedByOwner = (tokenAddress: `0x${string}`, actionId: bigint, owner: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupManagerAbi,
    functionName: 'totalStakedByActionIdByOwner',
    args: [tokenAddress, actionId, owner],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && !!owner,
    },
  });

  return { totalStaked: safeToBigInt(data), isPending, error };
};

/**
 * Hook for actionIds - 获取所有含激活链群的行动ID列表
 */
export const useActionIds = (actionFactory: `0x${string}`, tokenAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupManagerAbi,
    functionName: 'actionIds',
    args: [actionFactory, tokenAddress],
    query: {
      enabled: !!actionFactory && !!tokenAddress,
    },
  });

  return { actionIds: data as bigint[] | undefined, isPending, error };
};

/**
 * Hook for actionIdsAtIndex - 根据索引获取行动ID
 */
export const useActionIdsAtIndex = (actionFactory: `0x${string}`, tokenAddress: `0x${string}`, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupManagerAbi,
    functionName: 'actionIdsAtIndex',
    args: [actionFactory, tokenAddress, index],
    query: {
      enabled: !!actionFactory && !!tokenAddress && index !== undefined,
    },
  });

  return { actionId: safeToBigInt(data), isPending, error };
};

/**
 * Hook for actionIdsByGroupId - 获取链群激活的行动ID列表
 */
export const useActionIdsByGroupId = (
  actionFactory: `0x${string}`,
  tokenAddress: `0x${string}`,
  groupId: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupManagerAbi,
    functionName: 'actionIdsByGroupId',
    args: [actionFactory, tokenAddress, groupId],
    query: {
      enabled: !!actionFactory && !!tokenAddress && groupId !== undefined,
    },
  });

  return { actionIds: data as bigint[] | undefined, isPending, error };
};

/**
 * Hook for actionIdsByGroupIdAtIndex - 根据链群和索引获取行动ID
 */
export const useActionIdsByGroupIdAtIndex = (
  actionFactory: `0x${string}`,
  tokenAddress: `0x${string}`,
  groupId: bigint,
  index: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupManagerAbi,
    functionName: 'actionIdsByGroupIdAtIndex',
    args: [actionFactory, tokenAddress, groupId, index],
    query: {
      enabled: !!actionFactory && !!tokenAddress && groupId !== undefined && index !== undefined,
    },
  });

  return { actionId: safeToBigInt(data), isPending, error };
};

/**
 * Hook for actionIdsCount - 获取含激活链群的行动数量
 */
export const useActionIdsCount = (actionFactory: `0x${string}`, tokenAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupManagerAbi,
    functionName: 'actionIdsCount',
    args: [actionFactory, tokenAddress],
    query: {
      enabled: !!actionFactory && !!tokenAddress,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

/**
 * Hook for actionIdsByGroupIdCount - 获取链群激活的行动数量
 */
export const useActionIdsByGroupIdCount = (
  actionFactory: `0x${string}`,
  tokenAddress: `0x${string}`,
  groupId: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupManagerAbi,
    functionName: 'actionIdsByGroupIdCount',
    args: [actionFactory, tokenAddress, groupId],
    query: {
      enabled: !!actionFactory && !!tokenAddress && groupId !== undefined,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

/**
 * Hook for votedGroupActions - 获取当轮有投票且有激活链群的行动列表
 * 返回行动ID和对应的扩展地址
 */
export const useVotedGroupActions = (actionFactory: `0x${string}`, tokenAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupManagerAbi,
    functionName: 'votedGroupActions',
    args: [actionFactory, tokenAddress, round],
    query: {
      enabled: !!actionFactory && !!tokenAddress && round !== undefined,
    },
  });

  return {
    actionIds: data ? (data[0] as bigint[]) : undefined,
    extensions: data ? (data[1] as `0x${string}`[]) : undefined,
    isPending,
    error,
  };
};

// =====================
// === 写入 Hook ===
// =====================

/**
 * Hook for activateGroup - 激活组
 */
export function useActivateGroup() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20GroupManagerAbi,
    CONTRACT_ADDRESS,
    'activateGroup',
  );

  const activateGroup = async (
    tokenAddress: `0x${string}`,
    actionId: bigint,
    groupId: bigint,
    description: string,
    maxCapacity: bigint,
    minJoinAmount: bigint,
    maxJoinAmount: bigint,
    maxAccounts: bigint,
  ) => {
    console.log('提交 activateGroup 交易:', {
      tokenAddress,
      actionId,
      groupId,
      description,
      maxCapacity,
      minJoinAmount,
      maxJoinAmount,
      maxAccounts,
      isTukeMode,
    });
    return await execute([
      tokenAddress,
      actionId,
      groupId,
      description,
      maxCapacity,
      minJoinAmount,
      maxJoinAmount,
      maxAccounts,
    ]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('activateGroup tx hash:', hash);
    }
    if (error) {
      console.log('提交 activateGroup 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    activateGroup,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for deactivateGroup - 停用组
 */
export function useDeactivateGroup() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20GroupManagerAbi,
    CONTRACT_ADDRESS,
    'deactivateGroup',
  );

  const deactivateGroup = async (tokenAddress: `0x${string}`, actionId: bigint, groupId: bigint) => {
    console.log('提交 deactivateGroup 交易:', { tokenAddress, actionId, groupId, isTukeMode });
    return await execute([tokenAddress, actionId, groupId]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('deactivateGroup tx hash:', hash);
    }
    if (error) {
      console.log('提交 deactivateGroup 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    deactivateGroup,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for setConfig - 设置配置
 */
export function useSetConfig() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20GroupManagerAbi,
    CONTRACT_ADDRESS,
    'setConfig',
  );

  const setConfig = async (
    tokenAddress: `0x${string}`,
    stakeTokenAddress: `0x${string}`,
    joinTokenAddress: `0x${string}`,
    activationStakeAmount: bigint,
    maxJoinAmountRatio: bigint,
    maxVerifyCapacityFactor: bigint,
  ) => {
    console.log('提交 setConfig 交易:', {
      tokenAddress,
      stakeTokenAddress,
      joinTokenAddress,
      activationStakeAmount,
      maxJoinAmountRatio,
      maxVerifyCapacityFactor,
      isTukeMode,
    });
    return await execute([
      tokenAddress,
      stakeTokenAddress,
      joinTokenAddress,
      activationStakeAmount,
      maxJoinAmountRatio,
      maxVerifyCapacityFactor,
    ]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('setConfig tx hash:', hash);
    }
    if (error) {
      console.log('提交 setConfig 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    setConfig,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for updateGroupInfo - 更新组信息
 */
export function useUpdateGroupInfo() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20GroupManagerAbi,
    CONTRACT_ADDRESS,
    'updateGroupInfo',
  );

  const updateGroupInfo = async (
    tokenAddress: `0x${string}`,
    actionId: bigint,
    groupId: bigint,
    newDescription: string,
    newMaxCapacity: bigint,
    newMinJoinAmount: bigint,
    newMaxJoinAmount: bigint,
    newMaxAccounts: bigint,
  ) => {
    console.log('提交 updateGroupInfo 交易:', {
      tokenAddress,
      actionId,
      groupId,
      newDescription,
      newMaxCapacity,
      newMinJoinAmount,
      newMaxJoinAmount,
      newMaxAccounts,
      isTukeMode,
    });
    return await execute([
      tokenAddress,
      actionId,
      groupId,
      newDescription,
      newMaxCapacity,
      newMinJoinAmount,
      newMaxJoinAmount,
      newMaxAccounts,
    ]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('updateGroupInfo tx hash:', hash);
    }
    if (error) {
      console.log('提交 updateGroupInfo 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    updateGroupInfo,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

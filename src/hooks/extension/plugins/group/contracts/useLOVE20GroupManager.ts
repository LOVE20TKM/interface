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

  const typedData = data as [string, bigint, bigint, bigint, bigint, bigint] | undefined;

  return {
    stakeTokenAddress: typedData ? (typedData[0] as `0x${string}`) : undefined,
    minGovVoteRatioBps: typedData ? safeToBigInt(typedData[1]) : undefined,
    capacityMultiplier: typedData ? safeToBigInt(typedData[2]) : undefined,
    stakingMultiplier: typedData ? safeToBigInt(typedData[3]) : undefined,
    maxJoinAmountMultiplier: typedData ? safeToBigInt(typedData[4]) : undefined,
    minJoinAmount: typedData ? safeToBigInt(typedData[5]) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for expandableInfo - 获取可扩展信息
 */
export const useExpandableInfo = (tokenAddress: `0x${string}`, actionId: bigint, owner: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupManagerAbi,
    functionName: 'expandableInfo',
    args: [tokenAddress, actionId, owner],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && !!owner,
    },
  });

  const typedData = data as [bigint, bigint, bigint, bigint, bigint] | undefined;

  return {
    currentCapacity: typedData ? safeToBigInt(typedData[0]) : undefined,
    maxCapacity: typedData ? safeToBigInt(typedData[1]) : undefined,
    currentStake: typedData ? safeToBigInt(typedData[2]) : undefined,
    maxStake: typedData ? safeToBigInt(typedData[3]) : undefined,
    additionalStakeAllowed: typedData ? safeToBigInt(typedData[4]) : undefined,
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
    stakedAmount: typedData ? safeToBigInt(typedData[2]) : undefined,
    capacity: typedData ? safeToBigInt(typedData[3]) : undefined,
    groupMinJoinAmount: typedData ? safeToBigInt(typedData[4]) : undefined,
    groupMaxJoinAmount: typedData ? safeToBigInt(typedData[5]) : undefined,
    isActive: typedData ? typedData[6] : undefined,
    activatedRound: typedData ? safeToBigInt(typedData[7]) : undefined,
    deactivatedRound: typedData ? safeToBigInt(typedData[8]) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for isConfigSet - 检查配置是否已设置
 */
export const useIsConfigSet = (tokenAddress: `0x${string}`, actionId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupManagerAbi,
    functionName: 'isConfigSet',
    args: [tokenAddress, actionId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined,
    },
  });

  return { isConfigSet: data as boolean | undefined, isPending, error };
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
 * Hook for maxCapacityByOwner - 获取指定所有者的最大容量
 */
export const useMaxCapacityByOwner = (tokenAddress: `0x${string}`, actionId: bigint, owner: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupManagerAbi,
    functionName: 'maxCapacityByOwner',
    args: [tokenAddress, actionId, owner],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && !!owner,
    },
  });

  return { maxCapacity: safeToBigInt(data), isPending, error };
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
    functionName: 'totalStakedByOwner',
    args: [tokenAddress, actionId, owner],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && !!owner,
    },
  });

  return { totalStaked: safeToBigInt(data), isPending, error };
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
    stakedAmount: bigint,
    groupMinJoinAmount: bigint,
    groupMaxJoinAmount: bigint,
    groupMaxAccounts: bigint,
  ) => {
    console.log('提交 activateGroup 交易:', {
      tokenAddress,
      actionId,
      groupId,
      description,
      stakedAmount,
      groupMinJoinAmount,
      groupMaxJoinAmount,
      groupMaxAccounts,
      isTukeMode,
    });
    return await execute([
      tokenAddress,
      actionId,
      groupId,
      description,
      stakedAmount,
      groupMinJoinAmount,
      groupMaxJoinAmount,
      groupMaxAccounts,
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
 * Hook for expandGroup - 扩展组
 */
export function useExpandGroup() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20GroupManagerAbi,
    CONTRACT_ADDRESS,
    'expandGroup',
  );

  const expandGroup = async (
    tokenAddress: `0x${string}`,
    actionId: bigint,
    groupId: bigint,
    additionalStake: bigint,
  ) => {
    console.log('提交 expandGroup 交易:', { tokenAddress, actionId, groupId, additionalStake, isTukeMode });
    return await execute([tokenAddress, actionId, groupId, additionalStake]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('expandGroup tx hash:', hash);
    }
    if (error) {
      console.log('提交 expandGroup 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    expandGroup,
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
    stakeTokenAddress: `0x${string}`,
    minGovVoteRatioBps: bigint,
    capacityMultiplier: bigint,
    stakingMultiplier: bigint,
    maxJoinAmountMultiplier: bigint,
    minJoinAmount: bigint,
  ) => {
    console.log('提交 setConfig 交易:', {
      stakeTokenAddress,
      minGovVoteRatioBps,
      capacityMultiplier,
      stakingMultiplier,
      maxJoinAmountMultiplier,
      minJoinAmount,
      isTukeMode,
    });
    return await execute([
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
    newMinJoinAmount: bigint,
    newMaxJoinAmount: bigint,
    newMaxAccounts: bigint,
  ) => {
    console.log('提交 updateGroupInfo 交易:', {
      tokenAddress,
      actionId,
      groupId,
      newDescription,
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

// hooks/extension/plugins/group/contracts/useGroupManager.ts

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { GroupManagerAbi } from '@/src/abis/GroupManager';
import { safeToBigInt } from '@/src/lib/clientUtils';

// GroupManager 是全局合约，使用环境变量配置地址
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_MANAGER as `0x${string}`;

// =====================
// === 读取 Hooks - 常量 ===
// =====================

/**
 * Hook for FACTORY_ADDRESS - 获取工厂地址
 */
export const useFactoryAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'FACTORY_ADDRESS',
  });

  return { factoryAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for PRECISION - 获取精度
 */
export const usePrecision = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'PRECISION',
  });

  return { precision: safeToBigInt(data), isPending, error };
};

// =====================
// === 读取 Hooks - 需要 actionFactory 参数的方法 ===
// =====================

/**
 * Hook for actionIds - 获取指定工厂和代币的 action ID 列表
 */
export const useActionIds = (actionFactory: `0x${string}`, tokenAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'actionIds',
    args: [actionFactory, tokenAddress],
    query: {
      enabled: !!actionFactory && !!tokenAddress,
    },
  });

  return { actionIds: data as bigint[] | undefined, isPending, error };
};

/**
 * Hook for actionIdsAtIndex - 获取指定索引的 action ID
 */
export const useActionIdsAtIndex = (actionFactory: `0x${string}`, tokenAddress: `0x${string}`, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'actionIdsAtIndex',
    args: [actionFactory, tokenAddress, index],
    query: {
      enabled: !!actionFactory && !!tokenAddress && index !== undefined,
    },
  });

  return { actionId: safeToBigInt(data), isPending, error };
};

/**
 * Hook for actionIdsCount - 获取 action ID 数量
 */
export const useActionIdsCount = (actionFactory: `0x${string}`, tokenAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'actionIdsCount',
    args: [actionFactory, tokenAddress],
    query: {
      enabled: !!actionFactory && !!tokenAddress,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

/**
 * Hook for actionIdsByGroupId - 获取指定组ID的 action ID 列表
 */
export const useActionIdsByGroupId = (actionFactory: `0x${string}`, tokenAddress: `0x${string}`, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'actionIdsByGroupId',
    args: [actionFactory, tokenAddress, groupId],
    query: {
      enabled: !!actionFactory && !!tokenAddress && groupId !== undefined,
    },
  });

  return { actionIds: data as bigint[] | undefined, isPending, error };
};

/**
 * Hook for actionIdsByGroupIdAtIndex - 获取指定索引的组 action ID
 */
export const useActionIdsByGroupIdAtIndex = (
  actionFactory: `0x${string}`,
  tokenAddress: `0x${string}`,
  groupId: bigint,
  index: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'actionIdsByGroupIdAtIndex',
    args: [actionFactory, tokenAddress, groupId, index],
    query: {
      enabled: !!actionFactory && !!tokenAddress && groupId !== undefined && index !== undefined,
    },
  });

  return { actionId: safeToBigInt(data), isPending, error };
};

/**
 * Hook for actionIdsByGroupIdCount - 获取指定组的 action ID 数量
 */
export const useActionIdsByGroupIdCount = (
  actionFactory: `0x${string}`,
  tokenAddress: `0x${string}`,
  groupId: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'actionIdsByGroupIdCount',
    args: [actionFactory, tokenAddress, groupId],
    query: {
      enabled: !!actionFactory && !!tokenAddress && groupId !== undefined,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

/**
 * Hook for votedGroupActions - 获取投票通过的链群行动
 */
export const useVotedGroupActions = (actionFactory: `0x${string}`, tokenAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'votedGroupActions',
    args: [actionFactory, tokenAddress, round],
    query: {
      enabled: !!actionFactory && !!tokenAddress && round !== undefined,
    },
  });

  const typedData = data as [bigint[], `0x${string}`[]] | undefined;

  return {
    actionIds: typedData ? typedData[0] : undefined,
    extensions: typedData ? typedData[1] : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for hasActiveGroups - 检查账户是否有活跃链群
 */
export const useHasActiveGroups = (
  actionFactory: `0x${string}`,
  tokenAddress: `0x${string}`,
  account: `0x${string}`,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'hasActiveGroups',
    args: [actionFactory, tokenAddress, account],
    query: {
      enabled: !!actionFactory && !!tokenAddress && !!account,
    },
  });

  return { hasActiveGroups: data as boolean | undefined, isPending, error };
};

// =====================
// === 读取 Hooks - 链群信息 ===
// =====================

/**
 * Hook for groupInfo - 获取链群信息
 */
export const useGroupInfo = (tokenAddress: `0x${string}`, actionId: bigint, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
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
 * Hook for isGroupActive - 检查链群是否活跃
 */
export const useIsGroupActive = (tokenAddress: `0x${string}`, actionId: bigint, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'isGroupActive',
    args: [tokenAddress, actionId, groupId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && groupId !== undefined,
    },
  });

  return { isGroupActive: data as boolean | undefined, isPending, error };
};

/**
 * Hook for activeGroupIds - 获取活跃链群ID列表
 */
export const useActiveGroupIds = (tokenAddress: `0x${string}`, actionId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'activeGroupIds',
    args: [tokenAddress, actionId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined,
    },
  });

  return { activeGroupIds: data as bigint[] | undefined, isPending, error };
};

/**
 * Hook for activeGroupIdsAtIndex - 获取指定索引的活跃链群ID
 */
export const useActiveGroupIdsAtIndex = (tokenAddress: `0x${string}`, actionId: bigint, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'activeGroupIdsAtIndex',
    args: [tokenAddress, actionId, index],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && index !== undefined,
    },
  });

  return { groupId: safeToBigInt(data), isPending, error };
};

/**
 * Hook for activeGroupIdsCount - 获取活跃链群数量
 */
export const useActiveGroupIdsCount = (tokenAddress: `0x${string}`, actionId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'activeGroupIdsCount',
    args: [tokenAddress, actionId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

/**
 * Hook for activeGroupIdsByOwner - 获取指定所有者的活跃链群ID列表
 */
export const useActiveGroupIdsByOwner = (tokenAddress: `0x${string}`, actionId: bigint, owner: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'activeGroupIdsByOwner',
    args: [tokenAddress, actionId, owner],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && !!owner,
    },
  });

  return { activeGroupIds: data as bigint[] | undefined, isPending, error };
};

// =====================
// === 读取 Hooks - 计算和统计 ===
// =====================

/**
 * Hook for calculateJoinMaxAmount - 计算最大加入金额
 */
export const useCalculateJoinMaxAmount = (tokenAddress: `0x${string}`, actionId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'calculateJoinMaxAmount',
    args: [tokenAddress, actionId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined,
    },
  });

  return { maxAmount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for maxVerifyCapacityByOwner - 获取所有者的最大验证容量
 */
export const useMaxVerifyCapacityByOwner = (tokenAddress: `0x${string}`, actionId: bigint, owner: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'maxVerifyCapacityByOwner',
    args: [tokenAddress, actionId, owner],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && !!owner,
    },
  });

  return { maxVerifyCapacity: safeToBigInt(data), isPending, error };
};

/**
 * Hook for totalStaked - 获取总质押量
 */
export const useTotalStaked = (tokenAddress: `0x${string}`, actionId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'totalStaked',
    args: [tokenAddress, actionId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined,
    },
  });

  return { totalStaked: safeToBigInt(data), isPending, error };
};

/**
 * Hook for totalStakedByActionIdByOwner - 获取指定所有者在指定行动的质押量
 */
export const useTotalStakedByActionIdByOwner = (
  tokenAddress: `0x${string}`,
  actionId: bigint,
  owner: `0x${string}`,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'totalStakedByActionIdByOwner',
    args: [tokenAddress, actionId, owner],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && !!owner,
    },
  });

  return { totalStaked: safeToBigInt(data), isPending, error };
};

// =====================
// === 写入 Hooks ===
// =====================

/**
 * Hook for activateGroup - 激活链群
 */
export function useActivateGroup() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    GroupManagerAbi,
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
 * Hook for deactivateGroup - 停用链群
 */
export function useDeactivateGroup() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    GroupManagerAbi,
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
 * Hook for updateGroupInfo - 更新链群信息
 */
export function useUpdateGroupInfo() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    GroupManagerAbi,
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

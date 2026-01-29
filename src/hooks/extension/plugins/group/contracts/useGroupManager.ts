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
export const useActionIds = (tokenAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'actionIds',
    args: [tokenAddress],
    query: {
      enabled: !!tokenAddress,
    },
  });

  return { actionIds: data as bigint[] | undefined, isPending, error };
};

/**
 * Hook for actionIdsAtIndex - 获取指定索引的 action ID
 */
export const useActionIdsAtIndex = (tokenAddress: `0x${string}`, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'actionIdsAtIndex',
    args: [tokenAddress, index],
    query: {
      enabled: !!tokenAddress && index !== undefined,
    },
  });

  return { actionId: safeToBigInt(data), isPending, error };
};

/**
 * Hook for actionIdsCount - 获取 action ID 数量
 */
export const useActionIdsCount = (tokenAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'actionIdsCount',
    args: [tokenAddress],
    query: {
      enabled: !!tokenAddress,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

/**
 * Hook for actionIdsByGroupId - 获取指定组ID的 action ID 列表
 */
export const useActionIdsByGroupId = (tokenAddress: `0x${string}`, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'actionIdsByGroupId',
    args: [tokenAddress, groupId],
    query: {
      enabled: !!tokenAddress && groupId !== undefined,
    },
  });

  return { actionIds: data as bigint[] | undefined, isPending, error };
};

/**
 * Hook for actionIdsByGroupIdAtIndex - 获取指定索引的组 action ID
 */
export const useActionIdsByGroupIdAtIndex = (tokenAddress: `0x${string}`, groupId: bigint, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'actionIdsByGroupIdAtIndex',
    args: [tokenAddress, groupId, index],
    query: {
      enabled: !!tokenAddress && groupId !== undefined && index !== undefined,
    },
  });

  return { actionId: safeToBigInt(data), isPending, error };
};

/**
 * Hook for actionIdsByGroupIdCount - 获取指定组的 action ID 数量
 */
export const useActionIdsByGroupIdCount = (tokenAddress: `0x${string}`, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'actionIdsByGroupIdCount',
    args: [tokenAddress, groupId],
    query: {
      enabled: !!tokenAddress && groupId !== undefined,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

/**
 * Hook for hasActiveGroups - 检查账户是否有活跃链群
 */
export const useHasActiveGroups = (tokenAddress: `0x${string}`, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'hasActiveGroups',
    args: [tokenAddress, account],
    query: {
      enabled: !!tokenAddress && !!account,
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
export const useGroupInfo = (extensionAddress: `0x${string}`, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'groupInfo',
    args: [extensionAddress, groupId],
    query: {
      enabled: !!extensionAddress && groupId !== undefined,
    },
  });

  const typedData = data as
    | {
        groupId: bigint;
        description: string;
        maxCapacity: bigint;
        minJoinAmount: bigint;
        maxJoinAmount: bigint;
        maxAccounts: bigint;
        isActive: boolean;
        activatedRound: bigint;
        deactivatedRound: bigint;
      }
    | undefined;

  return {
    groupId: typedData ? safeToBigInt(typedData.groupId) : undefined,
    description: typedData ? typedData.description : undefined,
    maxCapacity: typedData ? safeToBigInt(typedData.maxCapacity) : undefined,
    minJoinAmount: typedData ? safeToBigInt(typedData.minJoinAmount) : undefined,
    maxJoinAmount: typedData ? safeToBigInt(typedData.maxJoinAmount) : undefined,
    maxAccounts: typedData ? safeToBigInt(typedData.maxAccounts) : undefined,
    isActive: typedData ? typedData.isActive : undefined,
    activatedRound: typedData ? safeToBigInt(typedData.activatedRound) : undefined,
    deactivatedRound: typedData ? safeToBigInt(typedData.deactivatedRound) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for isGroupActive - 检查链群是否活跃
 */
export const useIsGroupActive = (extensionAddress: `0x${string}`, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'isGroupActive',
    args: [extensionAddress, groupId],
    query: {
      enabled: !!extensionAddress && groupId !== undefined,
    },
  });

  return { isGroupActive: data as boolean | undefined, isPending, error };
};

/**
 * Hook for activeGroupIds - 获取活跃链群ID列表
 */
export const useActiveGroupIds = (extensionAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'activeGroupIds',
    args: [extensionAddress],
    query: {
      enabled: !!extensionAddress,
    },
  });

  return { activeGroupIds: data as bigint[] | undefined, isPending, error };
};

/**
 * Hook for activeGroupIdsAtIndex - 获取指定索引的活跃链群ID
 */
export const useActiveGroupIdsAtIndex = (extensionAddress: `0x${string}`, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'activeGroupIdsAtIndex',
    args: [extensionAddress, index],
    query: {
      enabled: !!extensionAddress && index !== undefined,
    },
  });

  return { groupId: safeToBigInt(data), isPending, error };
};

/**
 * Hook for activeGroupIdsCount - 获取活跃链群数量
 */
export const useActiveGroupIdsCount = (extensionAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'activeGroupIdsCount',
    args: [extensionAddress],
    query: {
      enabled: !!extensionAddress,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

/**
 * Hook for activeGroupIdsByOwner - 获取指定所有者的活跃链群ID列表
 */
export const useActiveGroupIdsByOwner = (extensionAddress: `0x${string}`, owner: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'activeGroupIdsByOwner',
    args: [extensionAddress, owner],
    query: {
      enabled: !!extensionAddress && !!owner,
    },
  });

  return { activeGroupIds: data as bigint[] | undefined, isPending, error };
};

// =====================
// === 读取 Hooks - 计算和统计 ===
// =====================

/**
 * Hook for maxJoinAmount - 查询最大加入量
 */
export const useMaxJoinAmount = (extensionAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'maxJoinAmount',
    args: [extensionAddress],
    query: {
      enabled: !!extensionAddress,
    },
  });

  return { maxJoinAmount: safeToBigInt(data), isPending, error };
};

// 向后兼容：保留旧的 hook 名称，但内部调用新方法
export const useCalculateJoinMaxAmount = (extensionAddress: `0x${string}`) => {
  const result = useMaxJoinAmount(extensionAddress);
  return { maxAmount: result.maxJoinAmount, isPending: result.isPending, error: result.error };
};

/**
 * Hook for maxVerifyCapacityByOwner - 获取所有者的最大验证容量
 */
export const useMaxVerifyCapacityByOwner = (extensionAddress: `0x${string}`, owner: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'maxVerifyCapacityByOwner',
    args: [extensionAddress, owner],
    query: {
      enabled: !!extensionAddress && !!owner,
    },
  });

  return { maxVerifyCapacity: safeToBigInt(data), isPending, error };
};

/**
 * Hook for staked - 获取单个扩展的总质押量
 */
export const useStaked = (extensionAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'staked',
    args: [extensionAddress],
    query: {
      enabled: !!extensionAddress,
    },
  });

  return { staked: safeToBigInt(data), isPending, error };
};

/**
 * Hook for totalStaked - 获取指定代币的总质押量（全局统计，非单个扩展）
 * @param tokenAddress 代币地址（不是 extensionAddress）
 */
export const useTotalStaked = (tokenAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'totalStaked',
    args: [tokenAddress],
    query: {
      enabled: !!tokenAddress,
    },
  });

  return { totalStaked: safeToBigInt(data), isPending, error };
};

/**
 * Hook for stakedByOwner - 获取指定所有者在指定扩展的质押量
 */
export const useStakedByOwner = (extensionAddress: `0x${string}`, owner: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupManagerAbi,
    functionName: 'stakedByOwner',
    args: [extensionAddress, owner],
    query: {
      enabled: !!extensionAddress && !!owner,
    },
  });

  return { stakedByOwner: safeToBigInt(data), isPending, error };
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
    extensionAddress: `0x${string}`,
    groupId: bigint,
    description: string,
    maxCapacity: bigint,
    minJoinAmount: bigint,
    maxJoinAmount_: bigint,
    maxAccounts: bigint,
  ) => {
    console.log('提交 activateGroup 交易:', {
      extensionAddress,
      groupId,
      description,
      maxCapacity,
      minJoinAmount,
      maxJoinAmount: maxJoinAmount_,
      maxAccounts,
      isTukeMode,
    });
    return await execute([
      extensionAddress,
      groupId,
      description,
      maxCapacity,
      minJoinAmount,
      maxJoinAmount_,
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

  const deactivateGroup = async (extensionAddress: `0x${string}`, groupId: bigint) => {
    console.log('提交 deactivateGroup 交易:', { extensionAddress, groupId, isTukeMode });
    return await execute([extensionAddress, groupId]);
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
    extensionAddress: `0x${string}`,
    groupId: bigint,
    newDescription: string,
    newMaxCapacity: bigint,
    newMinJoinAmount: bigint,
    newMaxJoinAmount_: bigint,
    newMaxAccounts: bigint,
  ) => {
    console.log('提交 updateGroupInfo 交易:', {
      extensionAddress,
      groupId,
      newDescription,
      newMaxCapacity,
      newMinJoinAmount,
      newMaxJoinAmount: newMaxJoinAmount_,
      newMaxAccounts,
      isTukeMode,
    });
    return await execute([
      extensionAddress,
      groupId,
      newDescription,
      newMaxCapacity,
      newMinJoinAmount,
      newMaxJoinAmount_,
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

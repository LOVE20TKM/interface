// hooks/extension/plugins/group-service/contracts/useGroupRecipients.ts

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { GroupRecipientsAbi } from '@/src/abis/GroupRecipients';
import { safeToBigInt } from '@/src/lib/clientUtils';

// GroupRecipients 是全局合约，使用环境变量配置地址
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_RECIPIENTS as `0x${string}`;

// =====================
// === 读取 Hooks - 常量 ===
// =====================

/**
 * Hook for DEFAULT_MAX_RECIPIENTS - 获取默认最大接收者数量
 */
export const useDefaultMaxRecipients = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupRecipientsAbi,
    functionName: 'DEFAULT_MAX_RECIPIENTS',
  });

  return { maxRecipients: safeToBigInt(data), isPending, error };
};

/**
 * Hook for PRECISION - 获取精度常量
 */
export const usePrecision = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupRecipientsAbi,
    functionName: 'PRECISION',
  });

  return { precision: safeToBigInt(data), isPending, error };
};

// =====================
// === 读取 Hooks - 需要参数 ===
// =====================

/**
 * Hook for actionIdsWithRecipients - 获取账户在指定轮次设置了接收者的行动ID列表
 */
export const useActionIdsWithRecipients = (
  groupOwner: `0x${string}` | undefined,
  tokenAddress: `0x${string}` | undefined,
  round: bigint | undefined,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupRecipientsAbi,
    functionName: 'actionIdsWithRecipients',
    args: groupOwner && tokenAddress && round ? [groupOwner, tokenAddress, round] : undefined,
    query: {
      enabled: !!groupOwner && !!tokenAddress && !!round,
    },
  });

  return { actionIds: data as bigint[] | undefined, isPending, error };
};

/**
 * Hook for getDistribution - 获取分配详情（包括 amounts 和 ownerAmount）
 */
export const useGetDistribution = (
  groupOwner: `0x${string}` | undefined,
  tokenAddress: `0x${string}` | undefined,
  actionId: bigint | undefined,
  groupId: bigint | undefined,
  groupReward: bigint | undefined,
  round: bigint | undefined,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupRecipientsAbi,
    functionName: 'getDistribution',
    args:
      groupOwner && tokenAddress && actionId !== undefined && groupId !== undefined && groupReward !== undefined && round
        ? [groupOwner, tokenAddress, actionId, groupId, groupReward, round]
        : undefined,
    query: {
      enabled:
        !!groupOwner &&
        !!tokenAddress &&
        actionId !== undefined &&
        groupId !== undefined &&
        groupReward !== undefined &&
        !!round,
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
 * Hook for groupIdsByActionIdWithRecipients - 获取账户在指定行动和轮次设置了接收者的组ID列表
 */
export const useGroupIdsByActionIdWithRecipients = (
  groupOwner: `0x${string}` | undefined,
  tokenAddress: `0x${string}` | undefined,
  actionId: bigint | undefined,
  round: bigint | undefined,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupRecipientsAbi,
    functionName: 'groupIdsByActionIdWithRecipients',
    args: groupOwner && tokenAddress && actionId !== undefined && round ? [groupOwner, tokenAddress, actionId, round] : undefined,
    query: {
      enabled: !!groupOwner && !!tokenAddress && actionId !== undefined && !!round,
    },
  });

  return { groupIds: data as bigint[] | undefined, isPending, error };
};

/**
 * Hook for recipients - 获取指定组所有者和轮次的接收者信息
 */
export const useRecipients = (
  groupOwner: `0x${string}` | undefined,
  tokenAddress: `0x${string}` | undefined,
  actionId: bigint | undefined,
  groupId: bigint | undefined,
  round: bigint | undefined,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupRecipientsAbi,
    functionName: 'recipients',
    args:
      groupOwner && tokenAddress && actionId !== undefined && groupId !== undefined && round
        ? [groupOwner, tokenAddress, actionId, groupId, round]
        : undefined,
    query: {
      enabled: !!groupOwner && !!tokenAddress && actionId !== undefined && groupId !== undefined && !!round,
    },
  });

  return {
    addrs: data ? (data[0] as `0x${string}`[]) : undefined,
    ratios: data ? (data[1] as bigint[]) : undefined,
    isPending,
    error,
  };
};

// =====================
// === 写入 Hooks ===
// =====================

/**
 * Hook for setRecipients - 设置接收者
 */
export function useSetRecipients() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    GroupRecipientsAbi,
    CONTRACT_ADDRESS,
    'setRecipients',
  );

  const setRecipients = async (
    tokenAddress: `0x${string}`,
    actionId: bigint,
    groupId: bigint,
    addrs: `0x${string}`[],
    ratios: bigint[],
  ) => {
    console.log('提交 setRecipients 交易:', { tokenAddress, actionId, groupId, addrs, ratios, isTukeMode });
    return await execute([tokenAddress, actionId, groupId, addrs, ratios]);
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

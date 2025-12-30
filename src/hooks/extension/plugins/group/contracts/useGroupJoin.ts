// hooks/extension/plugins/group/contracts/useGroupJoin.ts

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { GroupJoinAbi } from '@/src/abis/GroupJoin';
import { safeToBigInt } from '@/src/lib/clientUtils';

// GroupJoin 是全局合约，使用环境变量配置地址
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_JOIN as `0x${string}`;

// =====================
// === 读取 Hooks ===
// =====================

/**
 * Hook for FACTORY_ADDRESS - 获取工厂地址
 */
export const useFactoryAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupJoinAbi,
    functionName: 'FACTORY_ADDRESS',
  });

  return { factoryAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for joinInfo - 获取账户的加入信息
 */
export const useJoinInfo = (tokenAddress: `0x${string}`, actionId: bigint, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupJoinAbi,
    functionName: 'joinInfo',
    args: [tokenAddress, actionId, account],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && !!account,
    },
  });

  const typedData = data as [bigint, bigint, bigint] | undefined;

  return {
    joinedRound: typedData ? safeToBigInt(typedData[0]) : undefined,
    amount: typedData ? safeToBigInt(typedData[1]) : undefined,
    groupId: typedData ? safeToBigInt(typedData[2]) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for accountsByGroupIdCount - 获取指定组ID的账户数量
 */
export const useAccountsByGroupIdCount = (tokenAddress: `0x${string}`, actionId: bigint, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupJoinAbi,
    functionName: 'accountsByGroupIdCount',
    args: [tokenAddress, actionId, groupId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && groupId !== undefined,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

/**
 * Hook for accountsByGroupIdAtIndex - 根据索引获取指定组ID的账户
 */
export const useAccountsByGroupIdAtIndex = (
  tokenAddress: `0x${string}`,
  actionId: bigint,
  groupId: bigint,
  index: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupJoinAbi,
    functionName: 'accountsByGroupIdAtIndex',
    args: [tokenAddress, actionId, groupId, index],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && groupId !== undefined && index !== undefined,
    },
  });

  return { accountAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for totalJoinedAmount - 获取总加入数量
 */
export const useTotalJoinedAmount = (tokenAddress: `0x${string}`, actionId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupJoinAbi,
    functionName: 'totalJoinedAmount',
    args: [tokenAddress, actionId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined,
    },
  });

  return { totalJoinedAmount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for totalJoinedAmountByGroupId - 获取指定组ID的总加入数量
 */
export const useTotalJoinedAmountByGroupId = (tokenAddress: `0x${string}`, actionId: bigint, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupJoinAbi,
    functionName: 'totalJoinedAmountByGroupId',
    args: [tokenAddress, actionId, groupId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && groupId !== undefined,
    },
  });

  return { totalJoinedAmount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for totalJoinedAmountByRound - 获取指定轮次的总加入数量
 */
export const useTotalJoinedAmountByRound = (tokenAddress: `0x${string}`, actionId: bigint, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupJoinAbi,
    functionName: 'totalJoinedAmountByRound',
    args: [tokenAddress, actionId, round],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined,
    },
  });

  return { totalJoinedAmount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for totalJoinedAmountByGroupIdByRound - 获取指定组ID和轮次的总加入数量
 */
export const useTotalJoinedAmountByGroupIdByRound = (
  tokenAddress: `0x${string}`,
  actionId: bigint,
  groupId: bigint,
  round: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupJoinAbi,
    functionName: 'totalJoinedAmountByGroupIdByRound',
    args: [tokenAddress, actionId, groupId, round],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && groupId !== undefined && round !== undefined,
    },
  });

  return { totalJoinedAmount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for accountByGroupIdAndIndexByRound - 根据轮次和索引获取指定组ID的账户
 */
export const useAccountByGroupIdAndIndexByRound = (
  tokenAddress: `0x${string}`,
  actionId: bigint,
  groupId: bigint,
  index: bigint,
  round: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupJoinAbi,
    functionName: 'accountByGroupIdAndIndexByRound',
    args: [tokenAddress, actionId, groupId, index, round],
    query: {
      enabled:
        !!tokenAddress && actionId !== undefined && groupId !== undefined && index !== undefined && round !== undefined,
    },
  });

  return { accountAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for accountCountByGroupIdByRound - 获取指定轮次和组ID的账户数量
 */
export const useAccountCountByGroupIdByRound = (
  tokenAddress: `0x${string}`,
  actionId: bigint,
  groupId: bigint,
  round: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupJoinAbi,
    functionName: 'accountCountByGroupIdByRound',
    args: [tokenAddress, actionId, groupId, round],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && groupId !== undefined && round !== undefined,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

/**
 * Hook for amountByAccountByRound - 获取指定账户在指定轮次的参与代币量
 */
export const useAmountByAccountByRound = (
  tokenAddress: `0x${string}`,
  actionId: bigint,
  account: `0x${string}`,
  round: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupJoinAbi,
    functionName: 'amountByAccountByRound',
    args: [tokenAddress, actionId, account, round],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && !!account && round !== undefined,
    },
  });

  return { amount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for groupIdByAccountByRound - 获取指定账户在指定轮次的组ID
 */
export const useGroupIdByAccountByRound = (
  tokenAddress: `0x${string}`,
  actionId: bigint,
  account: `0x${string}`,
  round: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupJoinAbi,
    functionName: 'groupIdByAccountByRound',
    args: [tokenAddress, actionId, account, round],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && !!account && round !== undefined,
    },
  });

  return { groupId: safeToBigInt(data), isPending, error };
};

// =====================
// === 写入 Hooks ===
// =====================

/**
 * Hook for join - 加入（质押代币）
 */
export function useJoin() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    GroupJoinAbi,
    CONTRACT_ADDRESS,
    'join',
  );

  const join = async (
    tokenAddress: `0x${string}`,
    actionId: bigint,
    groupId: bigint,
    amount: bigint,
    verificationInfos: string[] = [],
  ) => {
    console.log('提交 join 交易:', { tokenAddress, actionId, groupId, amount, verificationInfos, isTukeMode });
    return await execute([tokenAddress, actionId, groupId, amount, verificationInfos]);
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
 * Hook for exit - 退出（取回代币）
 */
export function useExit() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    GroupJoinAbi,
    CONTRACT_ADDRESS,
    'exit',
  );

  const exit = async (tokenAddress: `0x${string}`, actionId: bigint) => {
    console.log('提交 exit 交易:', { tokenAddress, actionId, isTukeMode });
    return await execute([tokenAddress, actionId]);
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

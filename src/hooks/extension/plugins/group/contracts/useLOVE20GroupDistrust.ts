// hooks/extension/plugins/group/contracts/useLOVE20GroupDistrust.ts

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { LOVE20GroupDistrustAbi } from '@/src/abis/LOVE20GroupDistrust';
import { safeToBigInt } from '@/src/lib/clientUtils';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_DISTRUST as `0x${string}`;

// =====================
// === 读取 Hook ===
// =====================

/**
 * Hook for distrustReason - 获取不信任投票的原因
 */
export const useDistrustReason = (
  tokenAddress: `0x${string}`,
  actionId: bigint,
  round: bigint,
  voter: `0x${string}`,
  groupOwner: `0x${string}`,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupDistrustAbi,
    functionName: 'distrustReason',
    args: [tokenAddress, actionId, round, voter, groupOwner],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined && !!voter && !!groupOwner,
    },
  });

  return { reason: data as string | undefined, isPending, error };
};

/**
 * Hook for distrustVotesByGroupId - 获取指定组ID的不信任投票数
 */
export const useDistrustVotesByGroupId = (
  tokenAddress: `0x${string}`,
  actionId: bigint,
  round: bigint,
  groupId: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupDistrustAbi,
    functionName: 'distrustVotesByGroupId',
    args: [tokenAddress, actionId, round, groupId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined && groupId !== undefined,
    },
  });

  return { votes: safeToBigInt(data), isPending, error };
};

/**
 * Hook for distrustVotesByGroupOwner - 获取指定组所有者的不信任投票数
 */
export const useDistrustVotesByGroupOwner = (
  tokenAddress: `0x${string}`,
  actionId: bigint,
  round: bigint,
  groupOwner: `0x${string}`,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupDistrustAbi,
    functionName: 'distrustVotesByGroupOwner',
    args: [tokenAddress, actionId, round, groupOwner],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined && !!groupOwner,
    },
  });

  return { votes: safeToBigInt(data), isPending, error };
};

/**
 * Hook for distrustVotesByVoterByGroupOwner - 获取指定投票者对组所有者的不信任投票数
 */
export const useDistrustVotesByVoterByGroupOwner = (
  tokenAddress: `0x${string}`,
  actionId: bigint,
  round: bigint,
  voter: `0x${string}`,
  groupOwner: `0x${string}`,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupDistrustAbi,
    functionName: 'distrustVotesByVoterByGroupOwner',
    args: [tokenAddress, actionId, round, voter, groupOwner],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined && !!voter && !!groupOwner,
    },
  });

  return { votes: safeToBigInt(data), isPending, error };
};

/**
 * Hook for totalVerifyVotes - 获取总验证投票数
 */
export const useTotalVerifyVotes = (tokenAddress: `0x${string}`, actionId: bigint, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20GroupDistrustAbi,
    functionName: 'totalVerifyVotes',
    args: [tokenAddress, actionId, round],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined,
    },
  });

  return { votes: safeToBigInt(data), isPending, error };
};

// =====================
// === 写入 Hook ===
// =====================

/**
 * Hook for distrustVote - 不信任投票
 */
export function useDistrustVote() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20GroupDistrustAbi,
    CONTRACT_ADDRESS,
    'distrustVote',
  );

  const distrustVote = async (
    tokenAddress: `0x${string}`,
    actionId: bigint,
    groupOwner: `0x${string}`,
    amount: bigint,
    reason: string,
    voter: `0x${string}`,
  ) => {
    console.log('提交 distrustVote 交易:', {
      contractAddress: CONTRACT_ADDRESS,
      tokenAddress,
      actionId,
      groupOwner,
      amount,
      reason,
      voter,
      isTukeMode,
    });
    return await execute([tokenAddress, actionId, groupOwner, amount, reason, voter]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('distrustVote tx hash:', hash);
    }
    if (error) {
      console.log('提交 distrustVote 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    distrustVote,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

// hooks/contracts/useLOVE20Vote.ts
import { useState, useEffect } from 'react';
import { useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { simulateContract, writeContract } from '@wagmi/core';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { deepLogError, logError, logWeb3Error } from '@/src/lib/debugUtils';
import { config } from '@/src/wagmi';

import { LOVE20VoteAbi } from '@/src/abis/LOVE20Vote';
import { safeToBigInt } from '@/src/lib/clientUtils';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_VOTE as `0x${string}`;

// =======================
// ===== Read Hooks ======
// =======================

/**
 * Hook to check if tokens can be voted.
 */
export const useCanBeVoted = (tokenAddress: `0x${string}`, round: bigint, actionIds: bigint[]) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VoteAbi,
    functionName: 'canBeVoted',
    args: [tokenAddress, round, actionIds],
  });

  return { canBeVoted: data as boolean | undefined, isPending, error };
};

/**
 * Hook to check if an account can vote.
 */
export const useCanVote = (tokenAddress: `0x${string}`, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VoteAbi,
    functionName: 'canVote',
    args: [tokenAddress, account],
  });

  return { canVote: data as boolean, isPending, error };
};

/**
 * Hook to get the current round.
 */
export const useCurrentRound = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VoteAbi,
    functionName: 'currentRound',
    args: [],
  });
  return { currentRound: safeToBigInt(data), isPending, error };
};

/**
 * Hook to check if an action ID has been voted.
 */
export const useIsActionIdVoted = (tokenAddress: `0x${string}`, round: bigint, actionId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VoteAbi,
    functionName: 'isActionIdVoted',
    args: [tokenAddress, round, actionId],
  });

  return { isActionIdVoted: data as boolean, isPending, error };
};

/**
 * Hook to get the maximum number of votes.
 */
export const useMaxVotesNum = (tokenAddress: `0x${string}`, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VoteAbi,
    functionName: 'maxVotesNum',
    args: [tokenAddress, account],
  });

  return { maxVotesNum: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook to get the origin blocks.
 */
export const useOriginBlocks = (flag: boolean) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VoteAbi,
    functionName: 'originBlocks',
    args: [],
    query: {
      enabled: flag,
    },
  });

  return { originBlocks: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook to get the round blocks.
 */
export const useRoundBlocks = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VoteAbi,
    functionName: 'phaseBlocks',
    args: [],
  });

  return { phaseBlocks: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook to get the round by block number.
 */
export const useRoundByBlockNumber = (blockNumber: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VoteAbi,
    functionName: 'roundByBlockNumber',
    args: [blockNumber],
  });

  return { round: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook to get the number of votes.
 */
export const useVotesNum = (tokenAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VoteAbi,
    functionName: 'votesNum',
    args: [tokenAddress, round],
    query: {
      enabled: !!tokenAddress && round !== undefined,
    },
  });

  return {
    votes: data ? safeToBigInt(data) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook to get the number of votes by account.
 */
export const useVotesNumByAccount = (tokenAddress: `0x${string}`, round: bigint, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VoteAbi,
    functionName: 'votesNumByAccount',
    args: [tokenAddress, round, account],
    query: {
      enabled: !!tokenAddress && !!account && round !== undefined,
    },
  });

  return {
    votesNumByAccount: safeToBigInt(data),
    isPending,
    error,
  };
};

/**
 * Hook to get the number of votes by account and action ID.
 */
export const useVotesNumByAccountByActionId = (
  tokenAddress: `0x${string}`,
  round: bigint,
  account: `0x${string}`,
  actionId: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VoteAbi,
    functionName: 'votesNumByAccountByActionId',
    args: [tokenAddress, round, account, actionId],
    query: {
      enabled: !!tokenAddress && !!account && !!round && actionId !== undefined,
    },
  });

  return { votesNumByAccountByActionId: safeToBigInt(data), isPending, error };
};

/**
 * Hook to get the number of votes by action ID.
 */
export const useVotesNumByActionId = (tokenAddress: `0x${string}`, round: bigint, actionId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VoteAbi,
    functionName: 'votesNumByActionId',
    args: [tokenAddress, round, actionId],
    query: {
      enabled: !!tokenAddress && round !== undefined && actionId !== undefined,
    },
  });

  return { votesNumByActionId: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook to get the number of votes by account (multiple).
 */
export const useVotesNumsByAccount = (tokenAddress: `0x${string}`, round: bigint, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VoteAbi,
    functionName: 'votesNumsByAccount',
    args: [tokenAddress, round, account],
    query: {
      enabled: !!tokenAddress && !!account && round !== undefined,
    },
  });

  return {
    actionIds: data?.[0] ? (data[0] as any[]).map(safeToBigInt) : undefined,
    votes: data?.[1] ? (data[1] as any[]).map(safeToBigInt) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook to get the number of votes by account and multiple action IDs.
 */
export const useVotesNumsByAccountByActionIds = (
  tokenAddress: `0x${string}`,
  round: bigint,
  account: `0x${string}`,
  actionIds: bigint[],
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VoteAbi,
    functionName: 'votesNumsByAccountByActionIds',
    args: [tokenAddress, round, account, actionIds],
  });

  return { votesNumsByAccountByActionIds: data ? (data as any[]).map(safeToBigInt) : undefined, isPending, error };
};

// =======================
// ===== Write Hook =====
// =======================

export function useVote() {
  // 使用统一交易处理器
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20VoteAbi,
    CONTRACT_ADDRESS,
    'vote',
  );

  // 包装vote函数，保持原有的接口
  const vote = async (tokenAddress: `0x${string}`, actionIds: bigint[], votes: bigint[]) => {
    console.log('提交vote交易:', { tokenAddress, actionIds, votes, isTukeMode });
    return await execute([tokenAddress, actionIds, votes]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('vote tx hash:', hash);
    }
    if (error) {
      console.log('提交vote交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    vote,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

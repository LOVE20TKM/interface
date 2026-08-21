// hooks/contracts/useLOVE20Vote.ts
import { useEffect } from 'react';
import { useBlockNumber } from 'wagmi';
import { useUniversalReadContract } from '@/src/lib/universalReadContract';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { LOVE20VoteAbi } from '@/src/abis/LOVE20Vote';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { getVoteRoundFromBlock } from '@/src/lib/burnStats';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_VOTE as `0x${string}`;

// =======================
// ===== Read Hooks ======
// =======================

/**
 * Hook to check if an account can vote.
 */
export const useCanVote = (tokenAddress: `0x${string}`, account: `0x${string}`) => {
  const { data, isPending, error } = useUniversalReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VoteAbi,
    functionName: 'canVote',
    args: [tokenAddress, account],
  });

  return { canVote: data as boolean, isPending, error };
};

/**
 * Hook to get the current round.
 *
 * Reads the current round directly from the contract's currentRound() function.
 * Suitable for pages with user interactions where data refreshes on user actions.
 */
export const useCurrentRound = (enabled: boolean = true) => {
  const { data, isPending, error } = useUniversalReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VoteAbi,
    functionName: 'currentRound',
    args: [],
    query: { enabled },
  });
  return { currentRound: safeToBigInt(data), isPending, error };
};

/**
 * Hook to get the current round with real-time block watching.
 *
 * Calculates the round from block number using originBlocks and phaseBlocks.
 * Automatically updates when new blocks arrive via WebSocket.
 *
 * Use cases:
 * - Background notifications that need automatic updates without user interaction
 * - Real-time dashboards or monitoring interfaces
 *
 * For pages with user interactions, prefer useCurrentRound() to avoid unnecessary
 * WebSocket connections.
 */
export const useLiveCurrentRound = (enabled: boolean = true) => {
  const originQuery = useUniversalReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VoteAbi,
    functionName: 'originBlocks',
    args: [],
    query: { enabled },
  });
  const phaseQuery = useUniversalReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VoteAbi,
    functionName: 'phaseBlocks',
    args: [],
    query: { enabled },
  });
  const { data: blockNumber, error: blockError } = useBlockNumber({
    watch: enabled,
    query: { enabled },
  });
  const originBlocks = safeToBigInt(originQuery.data);
  const phaseBlocks = safeToBigInt(phaseQuery.data);
  const currentRound =
    enabled && blockNumber !== undefined && originQuery.data !== undefined && phaseQuery.data !== undefined
      ? getVoteRoundFromBlock(blockNumber, originBlocks, phaseBlocks)
      : BigInt(0);

  return {
    currentRound,
    isPending: enabled && (originQuery.isPending || phaseQuery.isPending || blockNumber === undefined),
    error: originQuery.error || phaseQuery.error || blockError,
  };
};

/**
 * Hook to check if an action ID has been voted.
 */
export const useIsActionIdVoted = (tokenAddress: `0x${string}`, round: bigint, actionId: bigint) => {
  const { data, isPending, error } = useUniversalReadContract({
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
  const { data, isPending, error } = useUniversalReadContract({
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
  const { data, isPending, error } = useUniversalReadContract({
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
 * Hook to get the number of votes.
 */
export const useVotesNum = (tokenAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useUniversalReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VoteAbi,
    functionName: 'votesNum',
    args: [tokenAddress, round],
    query: {
      enabled: !!tokenAddress && !!round,
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
  const { data, isPending, error } = useUniversalReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VoteAbi,
    functionName: 'votesNumByAccount',
    args: [tokenAddress, round, account],
    query: {
      enabled: !!tokenAddress && !!account && !!round,
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
  const { data, isPending, error } = useUniversalReadContract({
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
  const { data, isPending, error } = useUniversalReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VoteAbi,
    functionName: 'votesNumByActionId',
    args: [tokenAddress, round, actionId],
    query: {
      enabled: !!tokenAddress && !!round && actionId !== undefined,
    },
  });

  return { votesNumByActionId: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook to get the number of votes by account (multiple).
 */
export const useVotesNumsByAccount = (tokenAddress: `0x${string}`, round: bigint, account: `0x${string}`) => {
  const { data, isPending, error } = useUniversalReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VoteAbi,
    functionName: 'votesNumsByAccount',
    args: [tokenAddress, round, account],
    query: {
      enabled: !!tokenAddress && !!account && !!round,
    },
  });

  return {
    actionIds: data?.[0] ? (data[0] as any[]).map(safeToBigInt) : undefined,
    votes: data?.[1] ? (data[1] as any[]).map(safeToBigInt) : undefined,
    isPending,
    error,
  };
};

// =======================
// ===== Write Hook =====
// =======================

export function useVote() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20VoteAbi,
    CONTRACT_ADDRESS,
    'vote',
  );

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

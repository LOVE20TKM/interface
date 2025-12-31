// hooks/contracts/useLOVE20MintViewer.ts

import { useReadContract } from 'wagmi';
import { LOVE20MintViewerAbi } from '@/src/abis/LOVE20MintViewer';
import { RewardInfo, ActionReward, GovReward } from '@/src/types/love20types';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PERIPHERAL_MINTVIEWER as `0x${string}`;

// =====================
// === 读取 Hooks ===
// =====================

/**
 * Hook for stakeAddress
 * Reads the address of the stake contract.
 */
export const useStakeAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20MintViewerAbi,
    functionName: 'stakeAddress',
  });

  return { stakeAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for voteAddress
 * Reads the address of the vote contract.
 */
export const useVoteAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20MintViewerAbi,
    functionName: 'voteAddress',
  });

  return { voteAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for joinAddress
 * Reads the address of the join contract.
 */
export const useJoinAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20MintViewerAbi,
    functionName: 'joinAddress',
  });

  return { joinAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for mintAddress
 * Reads the address of the mint contract.
 */
export const useMintAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20MintViewerAbi,
    functionName: 'mintAddress',
  });

  return { mintAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for govRewardsByAccountByRounds
 * Reads the gov rewards by account by rounds.
 */
export const useGovRewardsByAccountByRounds = (
  tokenAddress: `0x${string}`,
  account: `0x${string}`,
  startRound: bigint,
  endRound: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20MintViewerAbi,
    functionName: 'govRewardsByAccountByRounds',
    args: [tokenAddress, account, startRound, endRound],
    query: {
      enabled: !!tokenAddress && !!account && startRound !== undefined && !!endRound,
    },
  });

  return { rewards: data as GovReward[], isPending, error };
};

/**
 * Hook for actionRewardsByAccountByActionIdByRounds
 */
export const useActionRewardsByAccountByActionIdByRounds = (
  tokenAddress: `0x${string}`,
  account: `0x${string}`,
  actionId: bigint,
  startRound: bigint,
  endRound: bigint,
) => {
  const { data, isPending, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20MintViewerAbi,
    functionName: 'actionRewardsByAccountByActionIdByRounds',
    args: [tokenAddress, account, actionId, startRound, endRound],
    query: {
      enabled: !!tokenAddress && !!account && actionId !== undefined && startRound !== undefined && !!endRound,
      // 翻页时保留上一页数据，避免数据瞬空导致 UI 闪烁
      placeholderData: (previousData) => previousData,
      refetchOnWindowFocus: false,
    },
  });
  const rewards = (data as RewardInfo[]) || [];
  return { rewards, isPending, error, refetch };
};

/**
 * Hook for actionRewardsByAccountOfLastRounds
 */
export const useActionRewardsByAccountOfLastRounds = (
  tokenAddress: `0x${string}`,
  account: `0x${string}`,
  latestRounds: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20MintViewerAbi,
    functionName: 'actionRewardsByAccountOfLastRounds',
    args: [tokenAddress, account, latestRounds],
    query: {
      enabled: !!tokenAddress && !!account && !!latestRounds,
    },
  });
  const rewards = (data as ActionReward[]) || [];
  return { rewards, isPending, error };
};

/**
 * Hook for hasUnmintedActionRewardOfLastRounds
 */
export const useHasUnmintedActionRewardOfLastRounds = (
  tokenAddress: `0x${string}`,
  account: `0x${string}`,
  latestRounds: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20MintViewerAbi,
    functionName: 'hasUnmintedActionRewardOfLastRounds',
    args: [tokenAddress, account, latestRounds],
    query: {
      enabled: !!tokenAddress && !!account && !!latestRounds,
    },
  });
  return { hasUnmintedActionRewardOfLastRounds: data as boolean, isPending, error };
};

/**
 * Hook for estimatedActionRewardOfCurrentRound
 */
export const useEstimatedActionRewardOfCurrentRound = (tokenAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20MintViewerAbi,
    functionName: 'estimatedActionRewardOfCurrentRound',
    args: [tokenAddress],
    query: {
      enabled: !!tokenAddress,
    },
  });
  return { reward: data as bigint, isPending, error };
};

/**
 * Hook for estimatedGovRewardOfCurrentRound
 */
export const useEstimatedGovRewardOfCurrentRound = (tokenAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20MintViewerAbi,
    functionName: 'estimatedGovRewardOfCurrentRound',
    args: [tokenAddress],
    query: {
      enabled: !!tokenAddress,
    },
  });
  return { reward: data as bigint, isPending, error };
};

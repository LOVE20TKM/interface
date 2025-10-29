// hooks/contracts/useLOVE20RoundViewer.ts

import { useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { LOVE20RoundViewerAbi } from '@/src/abis/LOVE20RoundViewer';
import {
  JoinedAction,
  VerifiedAddress,
  VerificationInfo,
  JoinableAction,
  GovData,
  VerifyingAction,
  MyVerifyingAction,
  VotingAction,
  ActionVoter,
  AccountVotingAction,
  VerificationMatrix,
  ActionInfo,
} from '@/src/types/love20types';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PERIPHERAL_ROUNDVIEWER as `0x${string}`;

// =====================
// === 读取 Hooks ===
// =====================

/**
 * Hook for joinAddress
 * Reads the address of the join contract.
 */
export const useJoinAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20RoundViewerAbi,
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
    abi: LOVE20RoundViewerAbi,
    functionName: 'mintAddress',
  });

  return { mintAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for submitAddress
 * Reads the address of the submit contract.
 */
export const useSubmitAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20RoundViewerAbi,
    functionName: 'submitAddress',
  });

  return { submitAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for verifyAddress
 * Reads the address of the verify contract.
 */
export const useVerifyAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20RoundViewerAbi,
    functionName: 'verifyAddress',
  });

  return { verifyAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for voteAddress
 * Reads the address of the vote contract.
 */
export const useVoteAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20RoundViewerAbi,
    functionName: 'voteAddress',
  });

  return { voteAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for actionSubmits
 */
export const useActionSubmits = (tokenAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20RoundViewerAbi,
    functionName: 'actionSubmits',
    args: [tokenAddress, round],
    query: {
      enabled: !!tokenAddress && !!round,
    },
  });

  return { actionSubmits: data as any[] | undefined, isPending, error };
};

/**
 * Hook for actionInfosByIds
 */
export const useActionInfosByIds = (tokenAddress: `0x${string}`, actionIds: bigint[]) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20RoundViewerAbi,
    functionName: 'actionInfosByIds',
    args: [tokenAddress, actionIds],
    query: {
      enabled: !!tokenAddress && actionIds.length > 0,
    },
  });

  // 当 actionIds 为空数组时，直接返回空结果，避免 loading 状态一直为 true
  if (actionIds.length === 0) {
    return { actionInfos: [], isPending: false, error: undefined };
  }

  return { actionInfos: data as any[] | undefined, isPending, error };
};

/**
 * Hook for actionInfosByPage
 */
export const useActionInfosByPage = (tokenAddress: `0x${string}`, start: bigint, end: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20RoundViewerAbi,
    functionName: 'actionInfosByPage',
    args: [tokenAddress, start, end],
    query: {
      enabled: !!tokenAddress,
    },
  });

  return { actionInfos: data as any[] | undefined, isPending, error };
};

/**
 * Hook for votingActions
 */
export const useVotingActions = (tokenAddress: `0x${string}`, round: bigint, account: `0x${string}`) => {
  const enableRead = !!tokenAddress && !!account && round !== undefined;

  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20RoundViewerAbi,
    functionName: 'votingActions',
    args: [tokenAddress, round, account],
    query: {
      enabled: enableRead,
    },
  });

  if (round === BigInt(0) || !enableRead) {
    return { votingActions: [], isPending: false, error: undefined };
  }

  return {
    votingActions: data ? [...(data as unknown as VotingAction[])] : [],
    isPending,
    error,
  };
};

/**
 * Hook for joinableActions
 */
export const useJoinableActions = (tokenAddress: `0x${string}`, round: bigint, account: `0x${string}`) => {
  const enableRead = !!tokenAddress && !!account && round !== undefined;

  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20RoundViewerAbi,
    functionName: 'joinableActions',
    args: [tokenAddress, round, account],
    query: {
      enabled: enableRead,
    },
  });

  if (round === BigInt(0) || !enableRead) {
    return { joinableActions: [], isPending: false, error: undefined };
  }

  return {
    joinableActions: data ? [...(data as unknown as JoinableAction[])] : [],
    isPending,
    error,
  };
};

/**
 * Hook for joinedActions
 */
export const useJoinedActions = (tokenAddress: `0x${string}`, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20RoundViewerAbi,
    functionName: 'joinedActions',
    args: [tokenAddress, account],
    query: {
      enabled: !!tokenAddress && !!account,
    },
  });

  return { joinedActions: data ? [...(data as unknown as JoinedAction[])] : [], isPending, error };
};

/**
 * Hook for verifyingActions
 */
export const useVerifyingActions = (tokenAddress: `0x${string}`, round: bigint, account: `0x${string}`) => {
  const enableRead = !!tokenAddress && !!account && round !== undefined;

  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20RoundViewerAbi,
    functionName: 'verifyingActions',
    args: [tokenAddress, round, account],
    query: {
      enabled: enableRead,
    },
  });

  if (round === BigInt(0) || !enableRead) {
    return { verifyingActions: [], isPending: false, error: undefined };
  }

  return {
    verifyingActions: data ? [...(data as unknown as VerifyingAction[])] : [],
    isPending,
    error,
  };
};

/**
 * Hook for verifyingActionsByAccount
 */
export const useVerifingActionsByAccount = (tokenAddress: `0x${string}`, round: bigint, account: `0x${string}`) => {
  const enableRead = !!tokenAddress && !!account && round !== undefined;

  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20RoundViewerAbi,
    functionName: 'verifyingActionsByAccount',
    args: [tokenAddress, round, account],
    query: {
      enabled: enableRead,
    },
  });

  if (round === BigInt(0) || !enableRead) {
    return { myVerifyingActions: [], isPending: false, error: undefined };
  }

  return {
    myVerifyingActions: data ? [...(data as unknown as MyVerifyingAction[])] : [],
    isPending,
    error,
  };
};

/**
 * Hook for verifiedAddressesByAction
 * Reads the verified addresses by action.
 */
export const useVerifiedAddressesByAction = (tokenAddress: `0x${string}`, round: bigint, actionId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20RoundViewerAbi,
    functionName: 'verifiedAddressesByAction',
    args: [tokenAddress, round, actionId],
    query: {
      enabled: !!tokenAddress && round !== undefined && actionId !== undefined,
    },
  });
  return { verifiedAddresses: data as VerifiedAddress[], isPending, error };
};

/**
 * Hook for verificationInfosByAction
 */
export const useVerificationInfosByAction = (tokenAddress: `0x${string}`, round: bigint, actionId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20RoundViewerAbi,
    functionName: 'verificationInfosByAction',
    args: [tokenAddress, round, actionId],
    query: {
      enabled: !!tokenAddress && round !== undefined && actionId !== undefined,
    },
  });
  return { verificationInfos: data as VerificationInfo[], isPending, error };
};

/**
 * Hook for verificationInfosByAccount
 */
export const useVerificationInfosByAccount = (
  tokenAddress: `0x${string}`,
  actionId: bigint,
  account: `0x${string}`,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20RoundViewerAbi,
    functionName: 'verificationInfosByAccount',
    args: [tokenAddress, actionId, account],
    query: {
      enabled: !!tokenAddress && !!account && actionId !== undefined,
    },
  });

  return {
    verificationKeys: data?.[0] as string[],
    verificationInfos: data?.[1] as string[],
    isPending,
    error,
  };
};

/**
 * Hook for govData
 */
export const useGovData = (tokenAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20RoundViewerAbi,
    functionName: 'govData',
    args: [tokenAddress],
    query: {
      enabled: !!tokenAddress,
    },
  });

  return { govData: data as GovData, isPending, error };
};

/**
 * Hook for actionVoters - 一个行动的投票详情
 */
export const useActionVoters = (tokenAddress: `0x${string}`, round: bigint, actionId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20RoundViewerAbi,
    functionName: 'actionVoters',
    args: [tokenAddress, round, actionId],
    query: {
      enabled: !!tokenAddress && round !== undefined && actionId !== undefined,
    },
  });

  return { actionVoters: data as ActionVoter[] | undefined, isPending, error };
};

/**
 * Hook for accountVotingHistory - 一个投票者的投票历史
 */
export const useAccountVotingHistory = (
  tokenAddress: `0x${string}`,
  account: `0x${string}`,
  startRound: bigint,
  endRound: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20RoundViewerAbi,
    functionName: 'accountVotingHistory',
    args: [tokenAddress, account, startRound, endRound],
    query: {
      enabled: !!tokenAddress && !!account && startRound !== undefined && endRound !== undefined,
    },
  });

  const votingHistory = useMemo(() => {
    if (!data) return undefined;

    const [accountActions, actionInfos] = data as readonly [readonly AccountVotingAction[], readonly ActionInfo[]];

    return {
      accountActions: [...(accountActions || [])],
      actionInfos: [...(actionInfos || [])],
    };
  }, [data]);

  return {
    votingHistory,
    accountActions: votingHistory?.accountActions,
    actionInfos: votingHistory?.actionInfos,
    isPending,
    error,
  };
};

/**
 * Hook for actionVerificationMatrix - 验证矩阵
 */
export const useActionVerificationMatrix = (tokenAddress: `0x${string}`, round: bigint, actionId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20RoundViewerAbi,
    functionName: 'actionVerificationMatrix',
    args: [tokenAddress, round, actionId],
    query: {
      enabled: !!tokenAddress && round !== undefined && actionId !== undefined,
    },
  });

  return { verificationMatrix: data as VerificationMatrix | undefined, isPending, error };
};

/**
 * Hook for votesNums - 获取某轮所有被投票的行动及其投票数
 *
 * @param tokenAddress 代币地址
 * @param round 轮次
 * @returns 行动ID列表、投票数列表、加载状态和错误信息
 */
export const useVotesNums = (tokenAddress: `0x${string}`, round: bigint) => {
  const enableRead = !!tokenAddress && round !== undefined && round > BigInt(0);

  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20RoundViewerAbi,
    functionName: 'votesNums',
    args: [tokenAddress, round],
    query: {
      enabled: enableRead,
    },
  });

  const votesData = useMemo(() => {
    if (!data) return undefined;

    const [actionIds, votes] = data as readonly [readonly bigint[], readonly bigint[]];

    return {
      actionIds: [...(actionIds || [])],
      votes: [...(votes || [])],
    };
  }, [data]);

  return {
    votesData,
    actionIds: votesData?.actionIds,
    votes: votesData?.votes,
    isPending,
    error,
  };
};

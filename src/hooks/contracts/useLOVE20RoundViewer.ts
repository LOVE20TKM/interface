// hooks/contracts/useLOVE20RoundViewer.ts

import React, { useMemo, useEffect, useState, useRef } from 'react';
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
 * Hook for actionVerificationMatrixPaged - 分页查询验证矩阵
 * 自动处理分页逻辑，合并所有分页结果
 */
export const useActionVerificationMatrixPaged = (
  tokenAddress: `0x${string}`,
  round: bigint,
  actionId: bigint,
  pageSize: number = 30, // 每页验证者数量
) => {
  const [finalData, setFinalData] = useState<VerificationMatrix | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // 使用 useRef 存储临时数据，避免触发重新渲染
  const tempDataRef = useRef<{
    verifiers: `0x${string}`[];
    verifiees: `0x${string}`[];
    scores: bigint[][];
  } | null>(null);

  // 参数验证
  const isValidTokenAddress = tokenAddress && tokenAddress !== '0x' && tokenAddress.length === 42;
  const isValidRound = round !== undefined && round > BigInt(0);
  const isValidActionId = actionId !== undefined && actionId > BigInt(0);
  const enableRead = isValidTokenAddress && isValidRound && isValidActionId;

  // 单次分页查询
  const verifierStart = currentPage * pageSize;
  const verifierEnd = verifierStart + pageSize;

  const { data: pageData, isPending: isPagePending } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20RoundViewerAbi,
    functionName: 'actionVerificationMatrixPaged',
    args: [tokenAddress, round, actionId, BigInt(verifierStart), BigInt(verifierEnd)],
    query: {
      enabled: enableRead && hasMore,
      gcTime: 0,
      staleTime: 0,
      retry: 2,
    },
  });

  // 处理分页数据
  useEffect(() => {
    if (!enableRead) {
      setFinalData(undefined);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (isPagePending) {
      setIsLoading(true);
      return;
    }

    // 如果不在 pending 状态，但 pageData 为 undefined
    // 可能是查询超出范围或失败，应该停止查询
    if (!pageData && !isPagePending && currentPage > 0) {
      console.log('⚠️ 查询返回空数据，停止分页查询');
      setHasMore(false);
      setIsLoading(false);

      // 设置最终数据
      if (tempDataRef.current) {
        console.log(`✅ 分页查询完成，总验证者数: ${tempDataRef.current.verifiers.length}`);
        setFinalData({
          verifiers: tempDataRef.current.verifiers,
          verifiees: tempDataRef.current.verifiees,
          scores: tempDataRef.current.scores,
        });
      }
      return;
    }

    if (pageData) {
      const matrix = pageData as VerificationMatrix;

      console.log(`📄 分页查询结果 (${verifierStart}-${verifierEnd}):`, {
        verifiers: matrix.verifiers?.length || 0,
        verifiees: matrix.verifiees?.length || 0,
        scores: matrix.scores?.length || 0,
      });

      // 如果返回的验证者为空，说明已经查询完所有数据
      if (!matrix.verifiers || matrix.verifiers.length === 0) {
        setHasMore(false);
        setIsLoading(false);

        // 设置最终数据
        if (tempDataRef.current) {
          console.log('✅ 分页查询完成（返回空数组），总验证者数:', tempDataRef.current.verifiers.length);
          setFinalData({
            verifiers: tempDataRef.current.verifiers,
            verifiees: tempDataRef.current.verifiees,
            scores: tempDataRef.current.scores,
          });
        }
        return;
      }

      // 合并数据到 ref（不触发重新渲染）
      if (!tempDataRef.current) {
        // 第一页数据
        tempDataRef.current = {
          verifiers: [...matrix.verifiers],
          verifiees: [...matrix.verifiees],
          scores: [...matrix.scores],
        };
      } else {
        // 合并后续页数据
        tempDataRef.current.verifiers = [...tempDataRef.current.verifiers, ...matrix.verifiers];
        tempDataRef.current.scores = [...tempDataRef.current.scores, ...matrix.scores];
      }

      // 如果返回的验证者数量小于 pageSize，说明这是最后一页
      if (matrix.verifiers.length < pageSize) {
        setHasMore(false);
        setIsLoading(false);
        console.log('✅ 分页查询完成（最后一页），总验证者数:', tempDataRef.current.verifiers.length);

        // 所有数据加载完成，设置最终数据
        setFinalData({
          verifiers: tempDataRef.current.verifiers,
          verifiees: tempDataRef.current.verifiees,
          scores: tempDataRef.current.scores,
        });
      } else {
        // 继续查询下一页
        setCurrentPage((prev) => prev + 1);
      }
    }
  }, [pageData, isPagePending, enableRead, currentPage, pageSize]);

  // 重置状态（当查询参数变化时）
  useEffect(() => {
    setFinalData(undefined);
    setCurrentPage(0);
    setHasMore(true);
    setError(null);
    setIsLoading(enableRead);
    tempDataRef.current = null;

    console.log('🔄 重置分页查询状态:', {
      tokenAddress,
      round: round.toString(),
      actionId: actionId.toString(),
    });
  }, [tokenAddress, round.toString(), actionId.toString(), enableRead]);

  return {
    verificationMatrix: finalData,
    isPending: isLoading || isPagePending,
    error,
    progress: {
      currentPage,
      loadedVerifiers: tempDataRef.current?.verifiers.length || 0,
      hasMore,
    },
  };
};

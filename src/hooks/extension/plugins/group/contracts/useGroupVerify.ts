// hooks/extension/plugins/group/contracts/useGroupVerify.ts

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { GroupVerifyAbi } from '@/src/abis/GroupVerify';
import { safeToBigInt } from '@/src/lib/clientUtils';

// GroupVerify 是全局合约，使用环境变量配置地址
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_VERIFY as `0x${string}`;

// =====================
// === 读取 Hooks - 验证相关 ===
// =====================

/**
 * Hook for FACTORY_ADDRESS - 获取工厂地址
 */
export const useFactoryAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'FACTORY_ADDRESS',
  });

  return { factoryAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for canVerify - 检查账户是否可以验证指定组
 */
export const useCanVerify = (
  tokenAddress: `0x${string}`,
  actionId: bigint,
  account: `0x${string}`,
  groupId: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'canVerify',
    args: [tokenAddress, actionId, account, groupId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && !!account && groupId !== undefined,
    },
  });

  return { canVerify: data as boolean | undefined, isPending, error };
};

/**
 * Hook for isVerified - 检查指定轮次和组ID是否已验证
 */
export const useIsVerified = (tokenAddress: `0x${string}`, actionId: bigint, round: bigint, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'isVerified',
    args: [tokenAddress, actionId, round, groupId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined && groupId !== undefined,
    },
  });

  return { isVerified: data as boolean | undefined, isPending, error };
};

/**
 * Hook for verifiedAccountCount - 获取指定轮次和组ID的已验证账户数量
 */
export const useVerifiedAccountCount = (
  tokenAddress: `0x${string}`,
  actionId: bigint,
  round: bigint,
  groupId: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'verifiedAccountCount',
    args: [tokenAddress, actionId, round, groupId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined && groupId !== undefined,
    },
  });

  return { verifiedAccountCount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for verifiedGroupIds - 获取指定轮次已验证的组ID列表
 */
export const useVerifiedGroupIds = (tokenAddress: `0x${string}`, actionId: bigint, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'verifiedGroupIds',
    args: [tokenAddress, actionId, round],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined,
    },
  });

  return { verifiedGroupIds: data as bigint[] | undefined, isPending, error };
};

/**
 * Hook for verifiers - 获取指定轮次的所有验证者
 */
export const useVerifiers = (tokenAddress: `0x${string}`, actionId: bigint, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'verifiers',
    args: [tokenAddress, actionId, round],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined,
    },
  });

  return { verifiers: data as `0x${string}`[] | undefined, isPending, error };
};

/**
 * Hook for verifiersAtIndex - 根据索引获取指定轮次的验证者
 */
export const useVerifiersAtIndex = (tokenAddress: `0x${string}`, actionId: bigint, round: bigint, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'verifiersAtIndex',
    args: [tokenAddress, actionId, round, index],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined && index !== undefined,
    },
  });

  return { verifier: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for verifiersCount - 获取指定轮次的验证者数量
 */
export const useVerifiersCount = (tokenAddress: `0x${string}`, actionId: bigint, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'verifiersCount',
    args: [tokenAddress, actionId, round],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

/**
 * Hook for verifierByGroupId - 获取指定轮次和组ID的验证者
 */
export const useVerifierByGroupId = (tokenAddress: `0x${string}`, actionId: bigint, round: bigint, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'verifierByGroupId',
    args: [tokenAddress, actionId, round, groupId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined && groupId !== undefined,
    },
  });

  return { verifier: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for delegatedVerifierByGroupId - 获取指定组ID的委托验证者
 */
export const useDelegatedVerifierByGroupId = (tokenAddress: `0x${string}`, actionId: bigint, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'delegatedVerifierByGroupId',
    args: [tokenAddress, actionId, groupId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && groupId !== undefined,
    },
  });

  return { delegatedVerifier: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for groupIdsByVerifier - 获取指定验证者在指定轮次的组ID列表
 */
export const useGroupIdsByVerifier = (
  tokenAddress: `0x${string}`,
  actionId: bigint,
  round: bigint,
  verifier: `0x${string}`,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'groupIdsByVerifier',
    args: [tokenAddress, actionId, round, verifier],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined && !!verifier,
    },
  });

  return { groupIds: data as bigint[] | undefined, isPending, error };
};

/**
 * Hook for groupIdsByVerifierAtIndex - 根据索引获取指定验证者在指定轮次的组ID
 */
export const useGroupIdsByVerifierAtIndex = (
  tokenAddress: `0x${string}`,
  actionId: bigint,
  round: bigint,
  verifier: `0x${string}`,
  index: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'groupIdsByVerifierAtIndex',
    args: [tokenAddress, actionId, round, verifier, index],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined && !!verifier && index !== undefined,
    },
  });

  return { groupId: safeToBigInt(data), isPending, error };
};

/**
 * Hook for groupIdsByVerifierCount - 获取指定验证者在指定轮次的组ID数量
 */
export const useGroupIdsByVerifierCount = (
  tokenAddress: `0x${string}`,
  actionId: bigint,
  round: bigint,
  verifier: `0x${string}`,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'groupIdsByVerifierCount',
    args: [tokenAddress, actionId, round, verifier],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined && !!verifier,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

// =====================
// === 读取 Hooks - 积分相关 ===
// =====================

/**
 * Hook for score - 获取指定轮次的总积分
 */
export const useScore = (tokenAddress: `0x${string}`, actionId: bigint, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'score',
    args: [tokenAddress, actionId, round],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined,
    },
  });

  return { score: safeToBigInt(data), isPending, error };
};

/**
 * Hook for scoreByAccount - 获取账户的积分
 */
export const useScoreByAccount = (
  tokenAddress: `0x${string}`,
  actionId: bigint,
  round: bigint,
  account: `0x${string}`,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'scoreByAccount',
    args: [tokenAddress, actionId, round, account],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined && !!account,
    },
  });

  return { score: safeToBigInt(data), isPending, error };
};

/**
 * Hook for scoreByGroupId - 获取指定组ID的积分
 */
export const useScoreByGroupId = (tokenAddress: `0x${string}`, actionId: bigint, round: bigint, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'scoreByGroupId',
    args: [tokenAddress, actionId, round, groupId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined && groupId !== undefined,
    },
  });

  return { score: safeToBigInt(data), isPending, error };
};

/**
 * Hook for totalScoreByGroupId - 获取指定组ID的总积分
 */
export const useTotalScoreByGroupId = (
  tokenAddress: `0x${string}`,
  actionId: bigint,
  round: bigint,
  groupId: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'totalScoreByGroupId',
    args: [tokenAddress, actionId, round, groupId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined && groupId !== undefined,
    },
  });

  return { totalScore: safeToBigInt(data), isPending, error };
};

/**
 * Hook for originScoreByAccount - 获取账户的原始积分
 */
export const useOriginScoreByAccount = (
  tokenAddress: `0x${string}`,
  actionId: bigint,
  round: bigint,
  account: `0x${string}`,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'originScoreByAccount',
    args: [tokenAddress, actionId, round, account],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined && !!account,
    },
  });

  return { originScore: safeToBigInt(data), isPending, error };
};

/**
 * Hook for capacityReductionByGroupId - 获取指定轮次和组ID的容量削减
 */
export const useCapacityReductionByGroupId = (
  tokenAddress: `0x${string}`,
  actionId: bigint,
  round: bigint,
  groupId: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'capacityReductionByGroupId',
    args: [tokenAddress, actionId, round, groupId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined && groupId !== undefined,
    },
  });

  return { capacityReduction: safeToBigInt(data), isPending, error };
};

// =====================
// === 读取 Hooks - 不信任投票相关 ===
// =====================

/**
 * Hook for totalVerifyVotes - 获取总验证投票数
 */
export const useTotalVerifyVotes = (tokenAddress: `0x${string}`, actionId: bigint, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'totalVerifyVotes',
    args: [tokenAddress, actionId, round],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined,
    },
  });

  return { votes: safeToBigInt(data), isPending, error };
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
    abi: GroupVerifyAbi,
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
    abi: GroupVerifyAbi,
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
    abi: GroupVerifyAbi,
    functionName: 'distrustVotesByVoterByGroupOwner',
    args: [tokenAddress, actionId, round, voter, groupOwner],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined && !!voter && !!groupOwner,
    },
  });

  return { votes: safeToBigInt(data), isPending, error };
};

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
    abi: GroupVerifyAbi,
    functionName: 'distrustReason',
    args: [tokenAddress, actionId, round, voter, groupOwner],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined && !!voter && !!groupOwner,
    },
  });

  return { reason: data as string | undefined, isPending, error };
};

// =====================
// === 写入 Hooks ===
// =====================

/**
 * Hook for verifyWithOriginScores - 提交原始积分验证
 */
export function useVerifyWithOriginScores() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    GroupVerifyAbi,
    CONTRACT_ADDRESS,
    'verifyWithOriginScores',
  );

  const verifyWithOriginScores = async (
    tokenAddress: `0x${string}`,
    actionId: bigint,
    groupId: bigint,
    startIndex: bigint,
    originScores: bigint[],
  ) => {
    console.log('提交 verifyWithOriginScores 交易:', {
      tokenAddress,
      actionId,
      groupId,
      startIndex,
      originScores,
      isTukeMode,
    });
    return await execute([tokenAddress, actionId, groupId, startIndex, originScores]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('verifyWithOriginScores tx hash:', hash);
    }
    if (error) {
      console.log('提交 verifyWithOriginScores 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    verifyWithOriginScores,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for setGroupDelegatedVerifier - 设置组的委托验证者
 */
export function useSetGroupDelegatedVerifier() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    GroupVerifyAbi,
    CONTRACT_ADDRESS,
    'setGroupDelegatedVerifier',
  );

  const setGroupDelegatedVerifier = async (
    tokenAddress: `0x${string}`,
    actionId: bigint,
    groupId: bigint,
    delegatedVerifier: `0x${string}`,
  ) => {
    console.log('提交 setGroupDelegatedVerifier 交易:', {
      tokenAddress,
      actionId,
      groupId,
      delegatedVerifier,
      isTukeMode,
    });
    return await execute([tokenAddress, actionId, groupId, delegatedVerifier]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('setGroupDelegatedVerifier tx hash:', hash);
    }
    if (error) {
      console.log('提交 setGroupDelegatedVerifier 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    setGroupDelegatedVerifier,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for distrustVote - 不信任投票
 */
export function useDistrustVote() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    GroupVerifyAbi,
    CONTRACT_ADDRESS,
    'distrustVote',
  );

  const distrustVote = async (
    tokenAddress: `0x${string}`,
    actionId: bigint,
    groupOwner: `0x${string}`,
    amount: bigint,
    reason: string,
  ) => {
    console.log('提交 distrustVote 交易:', { tokenAddress, actionId, groupOwner, amount, reason, isTukeMode });
    return await execute([tokenAddress, actionId, groupOwner, amount, reason]);
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

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
export const useCanVerify = (extensionAddress: `0x${string}`, account: `0x${string}`, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'canVerify',
    args: [extensionAddress, account, groupId],
    query: {
      enabled: !!extensionAddress && !!account && groupId !== undefined,
    },
  });

  return { canVerify: data as boolean | undefined, isPending, error };
};

/**
 * Hook for isVerified - 检查指定轮次和组ID是否已验证
 */
export const useIsVerified = (extensionAddress: `0x${string}`, round: bigint, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'isVerified',
    args: [extensionAddress, round, groupId],
    query: {
      enabled: !!extensionAddress && round !== undefined && groupId !== undefined,
    },
  });

  return { isVerified: data as boolean | undefined, isPending, error };
};

/**
 * Hook for verifiedAccountCount - 获取指定轮次和组ID的已验证账户数量
 */
export const useVerifiedAccountCount = (extensionAddress: `0x${string}`, round: bigint, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'verifiedAccountCount',
    args: [extensionAddress, round, groupId],
    query: {
      enabled: !!extensionAddress && round !== undefined && groupId !== undefined,
    },
  });

  return { verifiedAccountCount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for verifiedGroupIds - 获取指定轮次已验证的组ID列表
 */
export const useVerifiedGroupIds = (extensionAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'verifiedGroupIds',
    args: [extensionAddress, round],
    query: {
      enabled: !!extensionAddress && round !== undefined,
    },
  });

  return { verifiedGroupIds: data as bigint[] | undefined, isPending, error };
};

/**
 * Hook for verifiers - 获取指定轮次的所有验证者
 */
export const useVerifiers = (extensionAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'verifiers',
    args: [extensionAddress, round],
    query: {
      enabled: !!extensionAddress && round !== undefined,
    },
  });

  return { verifiers: data as `0x${string}`[] | undefined, isPending, error };
};

/**
 * Hook for verifiersAtIndex - 根据索引获取指定轮次的验证者
 */
export const useVerifiersAtIndex = (extensionAddress: `0x${string}`, round: bigint, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'verifiersAtIndex',
    args: [extensionAddress, round, index],
    query: {
      enabled: !!extensionAddress && round !== undefined && index !== undefined,
    },
  });

  return { verifier: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for verifiersCount - 获取指定轮次的验证者数量
 */
export const useVerifiersCount = (extensionAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'verifiersCount',
    args: [extensionAddress, round],
    query: {
      enabled: !!extensionAddress && round !== undefined,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

/**
 * Hook for verifierByGroupId - 获取指定轮次和组ID的验证者
 */
export const useVerifierByGroupId = (extensionAddress: `0x${string}`, round: bigint, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'verifierByGroupId',
    args: [extensionAddress, round, groupId],
    query: {
      enabled: !!extensionAddress && round !== undefined && groupId !== undefined,
    },
  });

  return { verifier: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for delegateByGroupId - 获取指定组ID的委托验证者
 */
export const useDelegateByGroupId = (extensionAddress: `0x${string}`, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'delegateByGroupId',
    args: [extensionAddress, groupId],
    query: {
      enabled: !!extensionAddress && groupId !== undefined,
    },
  });

  return { delegatedVerifier: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for groupIdsByVerifier - 获取指定验证者在指定轮次的组ID列表
 */
export const useGroupIdsByVerifier = (extensionAddress: `0x${string}`, round: bigint, verifier: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'groupIdsByVerifier',
    args: [extensionAddress, round, verifier],
    query: {
      enabled: !!extensionAddress && round !== undefined && !!verifier,
    },
  });

  return { groupIds: data as bigint[] | undefined, isPending, error };
};

/**
 * Hook for actionIdsByVerifier - 获取指定验证者在指定轮次验证的行动ID列表
 */
export const useActionIdsByVerifier = (
  tokenAddress: `0x${string}` | undefined,
  round: bigint | undefined,
  verifier: `0x${string}` | undefined,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'actionIdsByVerifier',
    args: [tokenAddress!, round!, verifier!],
    query: {
      enabled: !!tokenAddress && round !== undefined && !!verifier,
    },
  });

  return { actionIds: data as bigint[] | undefined, isPending, error };
};

/**
 * Hook for groupIdsByVerifierAtIndex - 根据索引获取指定验证者在指定轮次的组ID
 */
export const useGroupIdsByVerifierAtIndex = (
  extensionAddress: `0x${string}`,
  round: bigint,
  verifier: `0x${string}`,
  index: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'groupIdsByVerifierAtIndex',
    args: [extensionAddress, round, verifier, index],
    query: {
      enabled: !!extensionAddress && round !== undefined && !!verifier && index !== undefined,
    },
  });

  return { groupId: safeToBigInt(data), isPending, error };
};

/**
 * Hook for groupIdsByVerifierCount - 获取指定验证者在指定轮次的组ID数量
 */
export const useGroupIdsByVerifierCount = (extensionAddress: `0x${string}`, round: bigint, verifier: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'groupIdsByVerifierCount',
    args: [extensionAddress, round, verifier],
    query: {
      enabled: !!extensionAddress && round !== undefined && !!verifier,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

// =====================
// === 读取 Hooks - 积分相关 ===
// =====================

/**
 * Hook for totalGroupScore - 获取指定轮次的总积分
 */
export const useTotalGroupScore = (extensionAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'totalGroupScore',
    args: [extensionAddress, round],
    query: {
      enabled: !!extensionAddress && round !== undefined,
    },
  });

  return { score: safeToBigInt(data), isPending, error };
};

/**
 * Hook for accountScore - 获取账户的积分
 */
export const useAccountScore = (extensionAddress: `0x${string}`, round: bigint, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'accountScore',
    args: [extensionAddress, round, account],
    query: {
      enabled: !!extensionAddress && round !== undefined && !!account,
    },
  });

  return { score: safeToBigInt(data), isPending, error };
};

/**
 * Hook for groupScore - 获取指定组ID的积分
 */
export const useGroupScore = (extensionAddress: `0x${string}`, round: bigint, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'groupScore',
    args: [extensionAddress, round, groupId],
    query: {
      enabled: !!extensionAddress && round !== undefined && groupId !== undefined,
    },
  });

  return { score: safeToBigInt(data), isPending, error };
};

/**
 * Hook for totalAccountScore - 获取指定组ID的总账户积分
 * 注意：此方法在新 ABI 中对应 totalAccountScore，而不是之前的 totalScoreByGroupId
 */
export const useTotalAccountScore = (extensionAddress: `0x${string}`, round: bigint, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'totalAccountScore',
    args: [extensionAddress, round, groupId],
    query: {
      enabled: !!extensionAddress && round !== undefined && groupId !== undefined,
    },
  });

  return { totalScore: safeToBigInt(data), isPending, error };
};

/**
 * Hook for originScoreByAccount - 获取账户的原始积分
 */
export const useOriginScoreByAccount = (extensionAddress: `0x${string}`, round: bigint, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'originScoreByAccount',
    args: [extensionAddress, round, account],
    query: {
      enabled: !!extensionAddress && round !== undefined && !!account,
    },
  });

  return { originScore: safeToBigInt(data), isPending, error };
};

/**
 * Hook for capacityDecayRate - 获取指定轮次和组ID的容量削减
 */
export const useCapacityDecayRate = (extensionAddress: `0x${string}`, round: bigint, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'capacityDecayRate',
    args: [extensionAddress, round, groupId],
    query: {
      enabled: !!extensionAddress && round !== undefined && groupId !== undefined,
    },
  });

  return { capacityDecayRate: safeToBigInt(data), isPending, error };
};

// =====================
// === 读取 Hooks - 不信任投票相关 ===
// =====================

/**
 * Hook for distrustVotesByGroupOwner - 获取指定组所有者的不信任投票数
 */
export const useDistrustVotesByGroupOwner = (
  extensionAddress: `0x${string}`,
  round: bigint,
  groupOwner: `0x${string}`,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'distrustVotesByGroupOwner',
    args: [extensionAddress, round, groupOwner],
    query: {
      enabled: !!extensionAddress && round !== undefined && !!groupOwner,
    },
  });

  return { votes: safeToBigInt(data), isPending, error };
};

/**
 * Hook for distrustVotesByVoterByGroupOwner - 获取指定投票者对组所有者的不信任投票数
 */
export const useDistrustVotesByVoterByGroupOwner = (
  extensionAddress: `0x${string}`,
  round: bigint,
  voter: `0x${string}`,
  groupOwner: `0x${string}`,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'distrustVotesByVoterByGroupOwner',
    args: [extensionAddress, round, voter, groupOwner],
    query: {
      enabled: !!extensionAddress && round !== undefined && !!voter && !!groupOwner,
    },
  });

  return { votes: safeToBigInt(data), isPending, error };
};

/**
 * Hook for distrustRateByGroupId - 获取指定轮次和组ID的不信任比例
 */
export const useDistrustRateByGroupId = (
  extensionAddress: `0x${string}` | undefined,
  round: bigint | undefined,
  groupId: bigint | undefined,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'distrustRateByGroupId',
    args: [extensionAddress!, round!, groupId!],
    query: {
      enabled: !!extensionAddress && round !== undefined && groupId !== undefined,
    },
  });

  return { distrustRate: safeToBigInt(data), isPending, error };
};

/**
 * Hook for distrustReason - 获取不信任投票的原因
 */
export const useDistrustReason = (
  extensionAddress: `0x${string}`,
  round: bigint,
  voter: `0x${string}`,
  groupOwner: `0x${string}`,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'distrustReason',
    args: [extensionAddress, round, voter, groupOwner],
    query: {
      enabled: !!extensionAddress && round !== undefined && !!voter && !!groupOwner,
    },
  });

  return { reason: data as string | undefined, isPending, error };
};

/**
 * Hook for distrustGroupOwners - 获取指定轮次的不信任组所有者列表
 */
export const useDistrustGroupOwners = (extensionAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'distrustGroupOwners',
    args: [extensionAddress, round],
    query: {
      enabled: !!extensionAddress && round !== undefined,
    },
  });

  return { groupOwners: data as `0x${string}`[] | undefined, isPending, error };
};

/**
 * Hook for distrustVotersByGroupOwner - 获取指定组所有者的不信任投票者列表
 */
export const useDistrustVotersByGroupOwner = (
  extensionAddress: `0x${string}` | undefined,
  round: bigint | undefined,
  groupOwner: `0x${string}` | undefined,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupVerifyAbi,
    functionName: 'distrustVotersByGroupOwner',
    args: [extensionAddress!, round!, groupOwner!],
    query: {
      enabled: !!extensionAddress && round !== undefined && !!groupOwner,
    },
  });

  return { voters: data as `0x${string}`[] | undefined, isPending, error };
};

// =====================
// === 写入 Hooks ===
// =====================

/**
 * Hook for submitOriginScores - 提交原始积分验证
 */
export function useSubmitOriginScores() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    GroupVerifyAbi,
    CONTRACT_ADDRESS,
    'submitOriginScores',
  );

  const submitOriginScores = async (
    extensionAddress: `0x${string}`,
    groupId: bigint,
    startIndex: bigint,
    originScores: bigint[],
  ) => {
    console.log('提交 submitOriginScores 交易:', {
      extensionAddress,
      groupId,
      startIndex,
      originScores,
      isTukeMode,
    });
    return await execute([extensionAddress, groupId, startIndex, originScores]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('submitOriginScores tx hash:', hash);
    }
    if (error) {
      console.log('提交 submitOriginScores 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    submitOriginScores,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for setGroupDelegate - 设置组的委托验证者
 */
export function useSetGroupDelegate() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    GroupVerifyAbi,
    CONTRACT_ADDRESS,
    'setGroupDelegate',
  );

  const setGroupDelegate = async (extensionAddress: `0x${string}`, groupId: bigint, delegate: `0x${string}`) => {
    console.log('提交 setGroupDelegate 交易:', {
      extensionAddress,
      groupId,
      delegate,
      isTukeMode,
    });
    return await execute([extensionAddress, groupId, delegate]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('setGroupDelegate tx hash:', hash);
    }
    if (error) {
      console.log('提交 setGroupDelegate 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    setGroupDelegate,
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
    extensionAddress: `0x${string}`,
    groupOwner: `0x${string}`,
    amount: bigint,
    reason: string,
  ) => {
    console.log('提交 distrustVote 交易:', { extensionAddress, groupOwner, amount, reason, isTukeMode });
    return await execute([extensionAddress, groupOwner, amount, reason]);
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

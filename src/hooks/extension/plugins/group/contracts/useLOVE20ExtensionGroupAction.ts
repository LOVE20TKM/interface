// hooks/extension/plugins/group/contracts/useLOVE20ExtensionGroupAction.ts

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { LOVE20ExtensionGroupActionAbi } from '@/src/abis/LOVE20ExtensionGroupAction';
import { safeToBigInt } from '@/src/lib/clientUtils';

// 注意：ExtensionGroupAction 是动态部署的合约，需要传入合约地址
// 与其他固定地址的合约不同

// =====================
// === 读取 Hook ===
// =====================

/**
 * Hook for CAPACITY_MULTIPLIER - 获取容量乘数
 */
export const useCapacityMultiplier = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'CAPACITY_MULTIPLIER',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { capacityMultiplier: safeToBigInt(data), isPending, error };
};

/**
 * Hook for GROUP_ADDRESS - 获取组地址
 */
export const useGroupAddress = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'GROUP_ADDRESS',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { groupAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for JOIN_TOKEN_ADDRESS - 获取加入代币地址
 */
export const useJoinTokenAddress = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'JOIN_TOKEN_ADDRESS',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { joinTokenAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for MAX_JOIN_AMOUNT_MULTIPLIER - 获取最大加入数量乘数
 */
export const useMaxJoinAmountMultiplier = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'MAX_JOIN_AMOUNT_MULTIPLIER',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { maxJoinAmountMultiplier: safeToBigInt(data), isPending, error };
};

/**
 * Hook for MIN_GOV_VOTE_RATIO_BPS - 获取最小治理投票比率（基点）
 */
export const useMinGovVoteRatioBps = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'MIN_GOV_VOTE_RATIO_BPS',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { minGovVoteRatioBps: safeToBigInt(data), isPending, error };
};

/**
 * Hook for MIN_JOIN_AMOUNT - 获取最小加入数量
 */
export const useMinJoinAmount = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'MIN_JOIN_AMOUNT',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { minJoinAmount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for STAKE_TOKEN_ADDRESS - 获取质押代币地址
 */
export const useStakeTokenAddress = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'STAKE_TOKEN_ADDRESS',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { stakeTokenAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for STAKING_MULTIPLIER - 获取质押乘数
 */
export const useStakingMultiplier = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'STAKING_MULTIPLIER',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { stakingMultiplier: safeToBigInt(data), isPending, error };
};

/**
 * Hook for accountAtIndex - 根据索引获取账户地址
 */
export const useAccountAtIndex = (contractAddress: `0x${string}`, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'accountAtIndex',
    args: [index],
    query: {
      enabled: !!contractAddress && index !== undefined,
    },
  });

  return { accountAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for accounts - 获取所有账户地址
 */
export const useAccounts = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'accounts',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { accounts: data as `0x${string}`[] | undefined, isPending, error };
};

/**
 * Hook for accountsByGroupId - 获取指定组ID的账户列表
 */
export const useAccountsByGroupId = (contractAddress: `0x${string}`, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'accountsByGroupId',
    args: [groupId],
    query: {
      enabled: !!contractAddress && groupId !== undefined,
    },
  });

  return { accounts: data as `0x${string}`[] | undefined, isPending, error };
};

/**
 * Hook for accountsByGroupIdAtIndex - 根据索引获取指定组ID的账户
 */
export const useAccountsByGroupIdAtIndex = (contractAddress: `0x${string}`, groupId: bigint, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'accountsByGroupIdAtIndex',
    args: [groupId, index],
    query: {
      enabled: !!contractAddress && groupId !== undefined && index !== undefined,
    },
  });

  return { accountAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for accountsByGroupIdCount - 获取指定组ID的账户数量
 */
export const useAccountsByGroupIdCount = (contractAddress: `0x${string}`, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'accountsByGroupIdCount',
    args: [groupId],
    query: {
      enabled: !!contractAddress && groupId !== undefined,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

/**
 * Hook for accountsCount - 获取账户数量
 */
export const useAccountsCount = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'accountsCount',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { accountsCount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for actionId - 获取 action ID
 */
export const useActionId = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'actionId',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { actionId: safeToBigInt(data), isPending, error };
};

/**
 * Hook for activeGroupIds - 获取所有活跃组ID列表
 */
export const useActiveGroupIds = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'activeGroupIds',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { activeGroupIds: data as bigint[] | undefined, isPending, error };
};

/**
 * Hook for activeGroupIdsAtIndex - 根据索引获取活跃组ID
 */
export const useActiveGroupIdsAtIndex = (contractAddress: `0x${string}`, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'activeGroupIdsAtIndex',
    args: [index],
    query: {
      enabled: !!contractAddress && index !== undefined,
    },
  });

  return { groupId: safeToBigInt(data), isPending, error };
};

/**
 * Hook for activeGroupIdsByOwner - 获取指定所有者的活跃组ID列表
 */
export const useActiveGroupIdsByOwner = (contractAddress: `0x${string}`, owner: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'activeGroupIdsByOwner',
    args: [owner],
    query: {
      enabled: !!contractAddress && !!owner,
    },
  });

  return { activeGroupIds: data as bigint[] | undefined, isPending, error };
};

/**
 * Hook for activeGroupIdsCount - 获取活跃组ID数量
 */
export const useActiveGroupIdsCount = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'activeGroupIdsCount',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

/**
 * Hook for calculateJoinMaxAmount - 计算最大加入数量
 */
export const useCalculateJoinMaxAmount = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'calculateJoinMaxAmount',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { maxAmount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for canVerify - 检查账户是否可以验证指定组
 */
export const useCanVerify = (contractAddress: `0x${string}`, account: `0x${string}`, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'canVerify',
    args: [account, groupId],
    query: {
      enabled: !!contractAddress && !!account && groupId !== undefined,
    },
  });

  return { canVerify: data as boolean | undefined, isPending, error };
};

/**
 * Hook for center - 获取 center 合约地址
 */
export const useCenter = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'center',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { centerAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for delegatedVerifierByGroupId - 获取指定组ID的委托验证者
 */
export const useDelegatedVerifierByGroupId = (contractAddress: `0x${string}`, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'delegatedVerifierByGroupId',
    args: [groupId],
    query: {
      enabled: !!contractAddress && groupId !== undefined,
    },
  });

  return { delegatedVerifier: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for distrustRatioByGroupOwner - 获取指定组所有者的不信任比率
 */
export const useDistrustRatioByGroupOwner = (
  contractAddress: `0x${string}`,
  round: bigint,
  groupOwner: `0x${string}`,
) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'distrustRatioByGroupOwner',
    args: [round, groupOwner],
    query: {
      enabled: !!contractAddress && round !== undefined && !!groupOwner,
    },
  });

  return {
    distrustVotes: data ? safeToBigInt(data[0]) : undefined,
    totalVerifyVotes: data ? safeToBigInt(data[1]) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for distrustReason - 获取不信任投票的原因
 */
export const useDistrustReason = (
  contractAddress: `0x${string}`,
  round: bigint,
  voter: `0x${string}`,
  groupOwner: `0x${string}`,
) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'distrustReason',
    args: [round, voter, groupOwner],
    query: {
      enabled: !!contractAddress && round !== undefined && !!voter && !!groupOwner,
    },
  });

  return { reason: data as string | undefined, isPending, error };
};

/**
 * Hook for distrustVotesByGroupId - 获取指定组ID的不信任投票数
 */
export const useDistrustVotesByGroupId = (contractAddress: `0x${string}`, round: bigint, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'distrustVotesByGroupId',
    args: [round, groupId],
    query: {
      enabled: !!contractAddress && round !== undefined && groupId !== undefined,
    },
  });

  return { votes: safeToBigInt(data), isPending, error };
};

/**
 * Hook for distrustVotesByGroupOwner - 获取指定组所有者的不信任投票数
 */
export const useDistrustVotesByGroupOwner = (
  contractAddress: `0x${string}`,
  round: bigint,
  groupOwner: `0x${string}`,
) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'distrustVotesByGroupOwner',
    args: [round, groupOwner],
    query: {
      enabled: !!contractAddress && round !== undefined && !!groupOwner,
    },
  });

  return { votes: safeToBigInt(data), isPending, error };
};

/**
 * Hook for distrustVotesByVoterByGroupOwner - 获取指定投票者对组所有者的不信任投票数
 */
export const useDistrustVotesByVoterByGroupOwner = (
  contractAddress: `0x${string}`,
  round: bigint,
  voter: `0x${string}`,
  groupOwner: `0x${string}`,
) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'distrustVotesByVoterByGroupOwner',
    args: [round, voter, groupOwner],
    query: {
      enabled: !!contractAddress && round !== undefined && !!voter && !!groupOwner,
    },
  });

  return { votes: safeToBigInt(data), isPending, error };
};

/**
 * Hook for expandableInfo - 获取可扩展信息
 */
export const useExpandableInfo = (contractAddress: `0x${string}`, owner: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'expandableInfo',
    args: [owner],
    query: {
      enabled: !!contractAddress && !!owner,
    },
  });

  return {
    currentCapacity: data ? safeToBigInt(data[0]) : undefined,
    maxCapacity: data ? safeToBigInt(data[1]) : undefined,
    currentStake: data ? safeToBigInt(data[2]) : undefined,
    maxStake: data ? safeToBigInt(data[3]) : undefined,
    additionalStakeAllowed: data ? safeToBigInt(data[4]) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for factory - 获取工厂地址
 */
export const useFactory = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'factory',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { factoryAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for groupIdByAccountByRound - 获取指定账户在指定轮次的组ID
 */
export const useGroupIdByAccountByRound = (contractAddress: `0x${string}`, account: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'groupIdByAccountByRound',
    args: [account, round],
    query: {
      enabled: !!contractAddress && !!account && round !== undefined,
    },
  });

  return { groupId: safeToBigInt(data), isPending, error };
};

/**
 * Hook for groupIdsByVerifier - 获取指定验证者在指定轮次的组ID列表
 */
export const useGroupIdsByVerifier = (contractAddress: `0x${string}`, round: bigint, verifier: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'groupIdsByVerifier',
    args: [round, verifier],
    query: {
      enabled: !!contractAddress && round !== undefined && !!verifier,
    },
  });

  return { groupIds: data as bigint[] | undefined, isPending, error };
};

/**
 * Hook for groupIdsByVerifierAtIndex - 根据索引获取指定验证者在指定轮次的组ID
 */
export const useGroupIdsByVerifierAtIndex = (
  contractAddress: `0x${string}`,
  round: bigint,
  verifier: `0x${string}`,
  index: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'groupIdsByVerifierAtIndex',
    args: [round, verifier, index],
    query: {
      enabled: !!contractAddress && round !== undefined && !!verifier && index !== undefined,
    },
  });

  return { groupId: safeToBigInt(data), isPending, error };
};

/**
 * Hook for groupIdsByVerifierCount - 获取指定验证者在指定轮次的组ID数量
 */
export const useGroupIdsByVerifierCount = (contractAddress: `0x${string}`, round: bigint, verifier: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'groupIdsByVerifierCount',
    args: [round, verifier],
    query: {
      enabled: !!contractAddress && round !== undefined && !!verifier,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

/**
 * Hook for groupInfo - 获取组信息
 */
export const useGroupInfo = (contractAddress: `0x${string}`, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'groupInfo',
    args: [groupId],
    query: {
      enabled: !!contractAddress && groupId !== undefined,
    },
  });

  const typedData = data as
    | [bigint, string, bigint, bigint, bigint, bigint, bigint, boolean, bigint, bigint]
    | undefined;

  return {
    groupId: typedData ? safeToBigInt(typedData[0]) : undefined,
    description: typedData ? typedData[1] : undefined,
    stakedAmount: typedData ? safeToBigInt(typedData[2]) : undefined,
    capacity: typedData ? safeToBigInt(typedData[3]) : undefined,
    groupMinJoinAmount: typedData ? safeToBigInt(typedData[4]) : undefined,
    groupMaxJoinAmount: typedData ? safeToBigInt(typedData[5]) : undefined,
    totalJoinedAmount: typedData ? safeToBigInt(typedData[6]) : undefined,
    isActive: typedData ? typedData[7] : undefined,
    activatedRound: typedData ? safeToBigInt(typedData[8]) : undefined,
    deactivatedRound: typedData ? safeToBigInt(typedData[9]) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for initialized - 检查是否已初始化
 */
export const useInitialized = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'initialized',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { initialized: data as boolean | undefined, isPending, error };
};

/**
 * Hook for isGroupActive - 检查组是否活跃
 */
export const useIsGroupActive = (contractAddress: `0x${string}`, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'isGroupActive',
    args: [groupId],
    query: {
      enabled: !!contractAddress && groupId !== undefined,
    },
  });

  return { isActive: data as boolean | undefined, isPending, error };
};

/**
 * Hook for isJoinedValueCalculated - 检查加入值是否已计算
 */
export const useIsJoinedValueCalculated = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'isJoinedValueCalculated',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { isJoinedValueCalculated: data as boolean | undefined, isPending, error };
};

/**
 * Hook for joinInfo - 获取账户的加入信息
 */
export const useJoinInfo = (contractAddress: `0x${string}`, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'joinInfo',
    args: [account],
    query: {
      enabled: !!contractAddress && !!account,
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
 * Hook for joinedValue - 获取加入值
 */
export const useJoinedValue = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'joinedValue',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { joinedValue: safeToBigInt(data), isPending, error };
};

/**
 * Hook for joinedValueByAccount - 获取账户的加入值
 */
export const useJoinedValueByAccount = (contractAddress: `0x${string}`, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'joinedValueByAccount',
    args: [account],
    query: {
      enabled: !!contractAddress && !!account,
    },
  });

  return { joinedValueByAccount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for maxCapacityByOwner - 获取指定所有者的最大容量
 */
export const useMaxCapacityByOwner = (contractAddress: `0x${string}`, owner: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'maxCapacityByOwner',
    args: [owner],
    query: {
      enabled: !!contractAddress && !!owner,
    },
  });

  return { maxCapacity: safeToBigInt(data), isPending, error };
};

/**
 * Hook for originScoreByAccount - 获取账户的原始积分
 */
export const useOriginScoreByAccount = (contractAddress: `0x${string}`, round: bigint, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'originScoreByAccount',
    args: [round, account],
    query: {
      enabled: !!contractAddress && round !== undefined && !!account,
    },
  });

  return { originScore: safeToBigInt(data), isPending, error };
};

/**
 * Hook for reward - 获取指定轮次的奖励
 */
export const useReward = (contractAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'reward',
    args: [round],
    query: {
      enabled: !!contractAddress && round !== undefined,
    },
  });

  return { reward: safeToBigInt(data), isPending, error };
};

/**
 * Hook for rewardByAccount - 获取账户的奖励信息
 */
export const useRewardByAccount = (contractAddress: `0x${string}`, round: bigint, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'rewardByAccount',
    args: [round, account],
    query: {
      enabled: !!contractAddress && round !== undefined && !!account,
    },
  });

  return {
    reward: data ? safeToBigInt(data[0]) : undefined,
    isMinted: data ? (data[1] as boolean) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for rewardByGroupId - 获取指定组ID的奖励
 */
export const useRewardByGroupId = (contractAddress: `0x${string}`, round: bigint, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'rewardByGroupId',
    args: [round, groupId],
    query: {
      enabled: !!contractAddress && round !== undefined && groupId !== undefined,
    },
  });

  return { reward: safeToBigInt(data), isPending, error };
};

/**
 * Hook for rewardByGroupOwner - 获取指定组所有者的奖励
 */
export const useRewardByGroupOwner = (contractAddress: `0x${string}`, round: bigint, groupOwner: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'rewardByGroupOwner',
    args: [round, groupOwner],
    query: {
      enabled: !!contractAddress && round !== undefined && !!groupOwner,
    },
  });

  return { amount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for score - 获取指定轮次的积分
 */
export const useScore = (contractAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'score',
    args: [round],
    query: {
      enabled: !!contractAddress && round !== undefined,
    },
  });

  return { score: safeToBigInt(data), isPending, error };
};

/**
 * Hook for scoreByAccount - 获取账户的积分
 */
export const useScoreByAccount = (contractAddress: `0x${string}`, round: bigint, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'scoreByAccount',
    args: [round, account],
    query: {
      enabled: !!contractAddress && round !== undefined && !!account,
    },
  });

  return { score: safeToBigInt(data), isPending, error };
};

/**
 * Hook for scoreByGroupId - 获取指定组ID的积分
 */
export const useScoreByGroupId = (contractAddress: `0x${string}`, round: bigint, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'scoreByGroupId',
    args: [round, groupId],
    query: {
      enabled: !!contractAddress && round !== undefined && groupId !== undefined,
    },
  });

  return { score: safeToBigInt(data), isPending, error };
};

/**
 * Hook for snapshotAccountsByGroupId - 获取指定轮次和组ID的快照账户列表
 */
export const useSnapshotAccountsByGroupId = (contractAddress: `0x${string}`, round: bigint, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'snapshotAccountsByGroupId',
    args: [round, groupId],
    query: {
      enabled: !!contractAddress && round !== undefined && groupId !== undefined,
    },
  });

  return { accounts: data as `0x${string}`[] | undefined, isPending, error };
};

/**
 * Hook for snapshotAccountsByGroupIdAtIndex - 根据索引获取指定轮次和组ID的快照账户
 */
export const useSnapshotAccountsByGroupIdAtIndex = (
  contractAddress: `0x${string}`,
  round: bigint,
  groupId: bigint,
  index: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'snapshotAccountsByGroupIdAtIndex',
    args: [round, groupId, index],
    query: {
      enabled: !!contractAddress && round !== undefined && groupId !== undefined && index !== undefined,
    },
  });

  return { accountAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for snapshotAccountsByGroupIdCount - 获取指定轮次和组ID的快照账户数量
 */
export const useSnapshotAccountsByGroupIdCount = (contractAddress: `0x${string}`, round: bigint, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'snapshotAccountsByGroupIdCount',
    args: [round, groupId],
    query: {
      enabled: !!contractAddress && round !== undefined && groupId !== undefined,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

/**
 * Hook for snapshotAmount - 获取指定轮次的快照数量
 */
export const useSnapshotAmount = (contractAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'snapshotAmount',
    args: [round],
    query: {
      enabled: !!contractAddress && round !== undefined,
    },
  });

  return { amount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for snapshotAmountByAccount - 获取指定轮次和账户的快照数量
 */
export const useSnapshotAmountByAccount = (contractAddress: `0x${string}`, round: bigint, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'snapshotAmountByAccount',
    args: [round, account],
    query: {
      enabled: !!contractAddress && round !== undefined && !!account,
    },
  });

  return { amount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for snapshotAmountByGroupId - 获取指定轮次和组ID的快照数量
 */
export const useSnapshotAmountByGroupId = (contractAddress: `0x${string}`, round: bigint, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'snapshotAmountByGroupId',
    args: [round, groupId],
    query: {
      enabled: !!contractAddress && round !== undefined && groupId !== undefined,
    },
  });

  return { amount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for snapshotGroupIds - 获取指定轮次的快照组ID列表
 */
export const useSnapshotGroupIds = (contractAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'snapshotGroupIds',
    args: [round],
    query: {
      enabled: !!contractAddress && round !== undefined,
    },
  });

  return { groupIds: data as bigint[] | undefined, isPending, error };
};

/**
 * Hook for snapshotGroupIdsAtIndex - 根据索引获取指定轮次的快照组ID
 */
export const useSnapshotGroupIdsAtIndex = (contractAddress: `0x${string}`, round: bigint, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'snapshotGroupIdsAtIndex',
    args: [round, index],
    query: {
      enabled: !!contractAddress && round !== undefined && index !== undefined,
    },
  });

  return { groupId: safeToBigInt(data), isPending, error };
};

/**
 * Hook for snapshotGroupIdsCount - 获取指定轮次的快照组ID数量
 */
export const useSnapshotGroupIdsCount = (contractAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'snapshotGroupIdsCount',
    args: [round],
    query: {
      enabled: !!contractAddress && round !== undefined,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

/**
 * Hook for tokenAddress - 获取代币地址
 */
export const useTokenAddress = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'tokenAddress',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { tokenAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for totalJoinedAmount - 获取总加入数量
 */
export const useTotalJoinedAmount = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'totalJoinedAmount',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { totalJoinedAmount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for totalJoinedAmountByGroupIdByRound - 获取指定组ID和轮次的总加入数量
 */
export const useTotalJoinedAmountByGroupIdByRound = (
  contractAddress: `0x${string}`,
  groupId: bigint,
  round: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'totalJoinedAmountByGroupIdByRound',
    args: [groupId, round],
    query: {
      enabled: !!contractAddress && groupId !== undefined && round !== undefined,
    },
  });

  return { totalJoinedAmount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for totalJoinedAmountByRound - 获取指定轮次的总加入数量
 */
export const useTotalJoinedAmountByRound = (contractAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'totalJoinedAmountByRound',
    args: [round],
    query: {
      enabled: !!contractAddress && round !== undefined,
    },
  });

  return { totalJoinedAmount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for totalStaked - 获取总质押数量
 */
export const useTotalStaked = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'totalStaked',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { totalStaked: safeToBigInt(data), isPending, error };
};

/**
 * Hook for totalStakedByOwner - 获取指定所有者的总质押数量
 */
export const useTotalStakedByOwner = (contractAddress: `0x${string}`, owner: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'totalStakedByOwner',
    args: [owner],
    query: {
      enabled: !!contractAddress && !!owner,
    },
  });

  return { totalStaked: safeToBigInt(data), isPending, error };
};

/**
 * Hook for verificationInfo - 获取验证信息
 */
export const useVerificationInfo = (
  contractAddress: `0x${string}`,
  account: `0x${string}`,
  verificationKey: string,
) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'verificationInfo',
    args: [account, verificationKey],
    query: {
      enabled: !!contractAddress && !!account && !!verificationKey,
    },
  });

  return { verificationInfo: data as string | undefined, isPending, error };
};

/**
 * Hook for verificationInfoByRound - 获取指定轮次的验证信息
 */
export const useVerificationInfoByRound = (
  contractAddress: `0x${string}`,
  account: `0x${string}`,
  verificationKey: string,
  round: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'verificationInfoByRound',
    args: [account, verificationKey, round],
    query: {
      enabled: !!contractAddress && !!account && !!verificationKey && round !== undefined,
    },
  });

  return { verificationInfo: data as string | undefined, isPending, error };
};

/**
 * Hook for verificationInfoUpdateRoundsAtIndex - 根据索引获取验证信息更新轮次
 */
export const useVerificationInfoUpdateRoundsAtIndex = (
  contractAddress: `0x${string}`,
  account: `0x${string}`,
  verificationKey: string,
  index: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'verificationInfoUpdateRoundsAtIndex',
    args: [account, verificationKey, index],
    query: {
      enabled: !!contractAddress && !!account && !!verificationKey && index !== undefined,
    },
  });

  return { round: safeToBigInt(data), isPending, error };
};

/**
 * Hook for verificationInfoUpdateRoundsCount - 获取验证信息更新轮次数量
 */
export const useVerificationInfoUpdateRoundsCount = (
  contractAddress: `0x${string}`,
  account: `0x${string}`,
  verificationKey: string,
) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'verificationInfoUpdateRoundsCount',
    args: [account, verificationKey],
    query: {
      enabled: !!contractAddress && !!account && !!verificationKey,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

/**
 * Hook for verifierByGroupId - 获取指定轮次和组ID的验证者
 */
export const useVerifierByGroupId = (contractAddress: `0x${string}`, round: bigint, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'verifierByGroupId',
    args: [round, groupId],
    query: {
      enabled: !!contractAddress && round !== undefined && groupId !== undefined,
    },
  });

  return { verifier: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for verifiers - 获取指定轮次的所有验证者
 */
export const useVerifiers = (contractAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'verifiers',
    args: [round],
    query: {
      enabled: !!contractAddress && round !== undefined,
    },
  });

  return { verifiers: data as `0x${string}`[] | undefined, isPending, error };
};

/**
 * Hook for verifiersAtIndex - 根据索引获取指定轮次的验证者
 */
export const useVerifiersAtIndex = (contractAddress: `0x${string}`, round: bigint, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'verifiersAtIndex',
    args: [round, index],
    query: {
      enabled: !!contractAddress && round !== undefined && index !== undefined,
    },
  });

  return { verifier: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for verifiersCount - 获取指定轮次的验证者数量
 */
export const useVerifiersCount = (contractAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'verifiersCount',
    args: [round],
    query: {
      enabled: !!contractAddress && round !== undefined,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

// =====================
// === 写入 Hook ===
// =====================

/**
 * Hook for activateGroup - 激活组
 */
export function useActivateGroup(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionGroupActionAbi,
    contractAddress,
    'activateGroup',
  );

  const activateGroup = async (
    groupId: bigint,
    description: string,
    stakedAmount: bigint,
    groupMinJoinAmount: bigint,
    groupMaxJoinAmount: bigint,
  ) => {
    console.log('提交 activateGroup 交易:', {
      contractAddress,
      groupId,
      description,
      stakedAmount,
      groupMinJoinAmount,
      groupMaxJoinAmount,
      isTukeMode,
    });
    return await execute([groupId, description, stakedAmount, groupMinJoinAmount, groupMaxJoinAmount]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('activateGroup tx hash:', hash);
    }
    if (error) {
      console.log('提交 activateGroup 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    activateGroup,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for burnUnclaimedReward - 销毁未领取的奖励
 */
export function useBurnUnclaimedReward(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionGroupActionAbi,
    contractAddress,
    'burnUnclaimedReward',
  );

  const burnUnclaimedReward = async (round: bigint) => {
    console.log('提交 burnUnclaimedReward 交易:', { contractAddress, round, isTukeMode });
    return await execute([round]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('burnUnclaimedReward tx hash:', hash);
    }
    if (error) {
      console.log('提交 burnUnclaimedReward 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    burnUnclaimedReward,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for claimReward - 领取奖励
 */
export function useClaimReward(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionGroupActionAbi,
    contractAddress,
    'claimReward',
  );

  const claimReward = async (round: bigint) => {
    console.log('提交 claimReward 交易:', { contractAddress, round, isTukeMode });
    return await execute([round]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('claimReward tx hash:', hash);
    }
    if (error) {
      console.log('提交 claimReward 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    claimReward,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for deactivateGroup - 停用组
 */
export function useDeactivateGroup(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionGroupActionAbi,
    contractAddress,
    'deactivateGroup',
  );

  const deactivateGroup = async (groupId: bigint) => {
    console.log('提交 deactivateGroup 交易:', { contractAddress, groupId, isTukeMode });
    return await execute([groupId]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('deactivateGroup tx hash:', hash);
    }
    if (error) {
      console.log('提交 deactivateGroup 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    deactivateGroup,
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
export function useDistrustVote(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionGroupActionAbi,
    contractAddress,
    'distrustVote',
  );

  const distrustVote = async (groupOwner: `0x${string}`, amount: bigint, reason: string) => {
    console.log('提交 distrustVote 交易:', { contractAddress, groupOwner, amount, reason, isTukeMode });
    return await execute([groupOwner, amount, reason]);
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

/**
 * Hook for exit - 退出（取回代币）
 */
export function useExit(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionGroupActionAbi,
    contractAddress,
    'exit',
  );

  const exit = async () => {
    console.log('提交 exit 交易:', { contractAddress, isTukeMode });
    return await execute([]);
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

/**
 * Hook for expandGroup - 扩展组
 */
export function useExpandGroup(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionGroupActionAbi,
    contractAddress,
    'expandGroup',
  );

  const expandGroup = async (groupId: bigint, additionalStake: bigint) => {
    console.log('提交 expandGroup 交易:', { contractAddress, groupId, additionalStake, isTukeMode });
    return await execute([groupId, additionalStake]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('expandGroup tx hash:', hash);
    }
    if (error) {
      console.log('提交 expandGroup 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    expandGroup,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for join - 加入（质押代币）
 */
export function useJoin(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionGroupActionAbi,
    contractAddress,
    'join',
  );

  const join = async (groupId: bigint, amount: bigint) => {
    console.log('提交 join 交易:', { contractAddress, groupId, amount, isTukeMode });
    return await execute([groupId, amount]);
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
 * Hook for setGroupDelegatedVerifier - 设置组的委托验证者
 */
export function useSetGroupDelegatedVerifier(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionGroupActionAbi,
    contractAddress,
    'setGroupDelegatedVerifier',
  );

  const setGroupDelegatedVerifier = async (groupId: bigint, delegatedVerifier: `0x${string}`) => {
    console.log('提交 setGroupDelegatedVerifier 交易:', {
      contractAddress,
      groupId,
      delegatedVerifier,
      isTukeMode,
    });
    return await execute([groupId, delegatedVerifier]);
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
 * Hook for snapshotIfNeeded - 如果需要则创建快照
 */
export function useSnapshotIfNeeded(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionGroupActionAbi,
    contractAddress,
    'snapshotIfNeeded',
  );

  const snapshotIfNeeded = async (groupId: bigint) => {
    console.log('提交 snapshotIfNeeded 交易:', { contractAddress, groupId, isTukeMode });
    return await execute([groupId]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('snapshotIfNeeded tx hash:', hash);
    }
    if (error) {
      console.log('提交 snapshotIfNeeded 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    snapshotIfNeeded,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for submitOriginScore - 提交原始积分
 */
export function useSubmitOriginScore(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionGroupActionAbi,
    contractAddress,
    'submitOriginScore',
  );

  const submitOriginScore = async (groupId: bigint, scores: bigint[]) => {
    console.log('提交 submitOriginScore 交易:', { contractAddress, groupId, scores, isTukeMode });
    return await execute([groupId, scores]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('submitOriginScore tx hash:', hash);
    }
    if (error) {
      console.log('提交 submitOriginScore 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    submitOriginScore,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for updateGroupInfo - 更新组信息
 */
export function useUpdateGroupInfo(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionGroupActionAbi,
    contractAddress,
    'updateGroupInfo',
  );

  const updateGroupInfo = async (
    groupId: bigint,
    newDescription: string,
    newMinJoinAmount: bigint,
    newMaxJoinAmount: bigint,
  ) => {
    console.log('提交 updateGroupInfo 交易:', {
      contractAddress,
      groupId,
      newDescription,
      newMinJoinAmount,
      newMaxJoinAmount,
      isTukeMode,
    });
    return await execute([groupId, newDescription, newMinJoinAmount, newMaxJoinAmount]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('updateGroupInfo tx hash:', hash);
    }
    if (error) {
      console.log('提交 updateGroupInfo 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    updateGroupInfo,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for updateVerificationInfo - 更新验证信息
 */
export function useUpdateVerificationInfo(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionGroupActionAbi,
    contractAddress,
    'updateVerificationInfo',
  );

  const updateVerificationInfo = async (verificationInfos: string[]) => {
    console.log('提交 updateVerificationInfo 交易:', { contractAddress, verificationInfos, isTukeMode });
    return await execute([verificationInfos]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('updateVerificationInfo tx hash:', hash);
    }
    if (error) {
      console.log('提交 updateVerificationInfo 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    updateVerificationInfo,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

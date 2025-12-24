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
 * Hook for VERIFY_CAPACITY_MULTIPLIER - 获取验证容量倍数
 */
export const useVerifyCapacityMultiplier = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'VERIFY_CAPACITY_MULTIPLIER',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { verifyCapacityMultiplier: safeToBigInt(data), isPending, error };
};

/**
 * Hook for GROUP_ACTIVATION_STAKE_AMOUNT - 获取激活需质押代币数量
 */
export const useGroupActivationStakeAmount = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'GROUP_ACTIVATION_STAKE_AMOUNT',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { groupActivationStakeAmount: safeToBigInt(data), isPending, error };
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
 * Hook for GROUP_DISTRUST_ADDRESS - 获取群不信任合约地址
 */
export const useGroupDistrustAddress = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'GROUP_DISTRUST_ADDRESS',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { groupDistrustAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for GROUP_MANAGER_ADDRESS - 获取群管理合约地址
 */
export const useGroupManagerAddress = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'GROUP_MANAGER_ADDRESS',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { groupManagerAddress: data as `0x${string}` | undefined, isPending, error };
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
 * Hook for accountByGroupIdAndIndexByRound - 根据轮次和索引获取指定组ID的账户
 */
export const useAccountByGroupIdAndIndexByRound = (
  contractAddress: `0x${string}`,
  groupId: bigint,
  index: bigint,
  round: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'accountByGroupIdAndIndexByRound',
    args: [groupId, index, round],
    query: {
      enabled: !!contractAddress && groupId !== undefined && index !== undefined && round !== undefined,
    },
  });

  return { accountAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for accountCountByGroupIdByRound - 获取指定轮次和组ID的账户数量
 */
export const useAccountCountByGroupIdByRound = (contractAddress: `0x${string}`, groupId: bigint, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'accountCountByGroupIdByRound',
    args: [groupId, round],
    query: {
      enabled: !!contractAddress && groupId !== undefined && round !== undefined,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
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
 * Hook for amountByAccountByRound - 获取指定账户在指定轮次的参与代币量
 */
export const useAmountByAccountByRound = (contractAddress: `0x${string}`, account: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'amountByAccountByRound',
    args: [account, round],
    query: {
      enabled: !!contractAddress && !!account && round !== undefined,
    },
  });

  return { amount: safeToBigInt(data), isPending, error };
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
export const useGeneratedRewardByGroupId = (contractAddress: `0x${string}`, round: bigint, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'generatedRewardByGroupId',
    args: [round, groupId],
    query: {
      enabled: !!contractAddress && round !== undefined && groupId !== undefined,
    },
  });

  return { reward: safeToBigInt(data), isPending, error };
};

/**
 * Hook for rewardByGroupId - 获取指定组ID的奖励
 */
export const useGeneratedRewardByVerifier = (
  contractAddress: `0x${string}`,
  round: bigint,
  verifier: `0x${string}`,
) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'generatedRewardByVerifier',
    args: [round, verifier],
    query: {
      enabled: !!contractAddress && round !== undefined && !!verifier,
    },
  });

  return { reward: safeToBigInt(data), isPending, error };
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
 * Hook for verifiedAccountCount - 获取指定轮次和组ID的已提交数量
 */
export const useVerifiedAccountCount = (contractAddress: `0x${string}`, round: bigint, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionGroupActionAbi,
    functionName: 'verifiedAccountCount',
    args: [round, groupId],
    query: {
      enabled: !!contractAddress && round !== undefined && groupId !== undefined,
    },
  });

  return { verifiedAccountCount: safeToBigInt(data), isPending, error };
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
 * Hook for join - 加入（质押代币）
 */
export function useJoin(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionGroupActionAbi,
    contractAddress,
    'join',
  );

  const join = async (groupId: bigint, amount: bigint, verificationInfos: string[] = []) => {
    console.log('提交 join 交易:', { contractAddress, groupId, amount, verificationInfos, isTukeMode });
    return await execute([groupId, amount, verificationInfos]);
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
 * Hook for verifyWithOriginScores - 提交原始积分
 */
export function useVerifyWithOriginScores(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionGroupActionAbi,
    contractAddress,
    'verifyWithOriginScores',
  );

  const verifyWithOriginScores = async (groupId: bigint, startIndex: bigint, originScores: bigint[]) => {
    console.log('提交 verifyWithOriginScores 交易:', {
      contractAddress,
      groupId,
      startIndex,
      originScores,
      isTukeMode,
    });
    return await execute([groupId, startIndex, originScores]);
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

// hooks/useLOVE20ExtensionStakeLp.ts

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { LOVE20ExtensionStakeLpAbi } from '@/src/abis/LOVE20ExtensionStakeLp';
import { safeToBigInt } from '@/src/lib/clientUtils';

// 注意：ExtensionStakeLp 是动态部署的合约，需要传入合约地址
// 与其他固定地址的合约不同

// =====================
// === 读取 Hook ===
// =====================

/**
 * Hook for accountAtIndex - 根据索引获取账户地址
 */
export const useAccountAtIndex = (contractAddress: `0x${string}`, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
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
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'accounts',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { accounts: data as `0x${string}`[] | undefined, isPending, error };
};

/**
 * Hook for accountsCount - 获取账户数量
 */
export const useAccountsCount = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
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
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'actionId',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { actionId: safeToBigInt(data), isPending, error };
};

/**
 * Hook for anotherTokenAddress - 获取另一个代币地址
 */
export const useAnotherTokenAddress = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'anotherTokenAddress',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { anotherTokenAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for calculateScore - 计算账户的积分
 */
export const useCalculateScore = (contractAddress: `0x${string}`, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'calculateScore',
    args: [account],
    query: {
      enabled: !!contractAddress && !!account,
    },
  });

  return {
    total: data ? safeToBigInt(data[0]) : undefined,
    score: data ? safeToBigInt(data[1]) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for calculateScores - 计算所有积分
 */
export const useCalculateScores = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'calculateScores',
    query: {
      enabled: !!contractAddress,
    },
  });

  return {
    totalCalculated: data ? safeToBigInt(data[0]) : undefined,
    scoresCalculated: data ? (data[1] as bigint[]) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for center - 获取 center 合约地址
 */
export const useCenter = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'center',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { centerAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for factory - 获取工厂地址
 */
export const useFactory = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'factory',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { factoryAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for govRatioMultiplier - 获取治理比率乘数
 */
export const useGovRatioMultiplier = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'govRatioMultiplier',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { govRatioMultiplier: safeToBigInt(data), isPending, error };
};

/**
 * Hook for initialized - 检查是否已初始化
 */
export const useInitialized = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
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
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'isJoinedValueCalculated',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { isJoinedValueCalculated: data as boolean | undefined, isPending, error };
};

/**
 * Hook for isTokenAddressTheFirstToken - 检查代币地址是否为第一个代币
 */
export const useIsTokenAddressTheFirstToken = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'isTokenAddressTheFirstToken',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { isTokenAddressTheFirstToken: data as boolean | undefined, isPending, error };
};

/**
 * Hook for join - 获取 Join 合约地址
 */
export const useJoin = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'join',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { joinAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for joinedValue - 获取加入值
 */
export const useJoinedValue = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
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
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'joinedValueByAccount',
    args: [account],
    query: {
      enabled: !!contractAddress && !!account,
    },
  });

  return { joinedValueByAccount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for lpTokenAddress - 获取 LP 代币地址
 */
export const useLpTokenAddress = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'lpTokenAddress',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { lpTokenAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for mint - 获取 Mint 合约地址
 */
export const useMint = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'mint',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { mintAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for minGovVotes - 获取最小治理投票数
 */
export const useMinGovVotes = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'minGovVotes',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { minGovVotes: safeToBigInt(data), isPending, error };
};

/**
 * Hook for pair - 获取交易对地址（即 LP Token 地址）
 * @deprecated 使用 useLpTokenAddress 替代，pair 和 lpTokenAddress 是同一个地址
 */
export const usePair = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'lpTokenAddress',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { pairAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for rewardByAccount - 获取账户的奖励信息
 */
export const useRewardByAccount = (contractAddress: `0x${string}`, round: bigint, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
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
 * Hook for scoreByAccount - 获取账户的积分
 */
export const useScoreByAccount = (contractAddress: `0x${string}`, round: bigint, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'scoreByAccount',
    args: [round, account],
    query: {
      enabled: !!contractAddress && round !== undefined && !!account,
    },
  });

  return { score: safeToBigInt(data), isPending, error };
};

/**
 * Hook for scores - 获取所有积分
 */
export const useScores = (contractAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'scores',
    args: [round],
    query: {
      enabled: !!contractAddress && round !== undefined,
    },
  });

  return { scores: data as bigint[] | undefined, isPending, error };
};

/**
 * Hook for scoresAtIndex - 根据索引获取积分
 */
export const useScoresAtIndex = (contractAddress: `0x${string}`, round: bigint, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'scoresAtIndex',
    args: [round, index],
    query: {
      enabled: !!contractAddress && round !== undefined && index !== undefined,
    },
  });

  return { score: safeToBigInt(data), isPending, error };
};

/**
 * Hook for scoresCount - 获取积分数量
 */
export const useScoresCount = (contractAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'scoresCount',
    args: [round],
    query: {
      enabled: !!contractAddress && round !== undefined,
    },
  });

  return { scoresCount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for stake - 获取 Stake 合约地址
 */
export const useStake = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'stake',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { stakeAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for stakeInfo - 获取质押信息
 */
export const useStakeInfo = (contractAddress: `0x${string}`, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'stakeInfo',
    args: [account],
    query: {
      enabled: !!contractAddress && !!account,
    },
  });

  return {
    amount: data ? safeToBigInt(data[0]) : undefined,
    requestedUnstakeRound: data ? safeToBigInt(data[1]) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for stakers - 获取所有质押者地址
 */
export const useStakers = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'stakers',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { stakers: data as `0x${string}`[] | undefined, isPending, error };
};

/**
 * Hook for stakersAtIndex - 根据索引获取质押者地址
 */
export const useStakersAtIndex = (contractAddress: `0x${string}`, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'stakersAtIndex',
    args: [index],
    query: {
      enabled: !!contractAddress && index !== undefined,
    },
  });

  return { stakerAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for stakersCount - 获取质押者数量
 */
export const useStakersCount = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'stakersCount',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { stakersCount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for tokenAddress - 获取代币地址
 */
export const useTokenAddress = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'tokenAddress',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { tokenAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for totalScore - 获取总积分
 */
export const useTotalScore = (contractAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'totalScore',
    args: [round],
    query: {
      enabled: !!contractAddress && round !== undefined,
    },
  });

  return { totalScore: safeToBigInt(data), isPending, error };
};

/**
 * Hook for totalStakedAmount - 获取总质押数量
 */
export const useTotalStakedAmount = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'totalStakedAmount',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { totalStakedAmount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for unstakers - 获取所有取消质押者地址
 */
export const useUnstakers = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'unstakers',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { unstakers: data as `0x${string}`[] | undefined, isPending, error };
};

/**
 * Hook for unstakersAtIndex - 根据索引获取取消质押者地址
 */
export const useUnstakersAtIndex = (contractAddress: `0x${string}`, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'unstakersAtIndex',
    args: [index],
    query: {
      enabled: !!contractAddress && index !== undefined,
    },
  });

  return { unstakerAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for unstakersCount - 获取取消质押者数量
 */
export const useUnstakersCount = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'unstakersCount',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { unstakersCount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for verifiedAccounts - 获取已验证账户列表
 */
export const useVerifiedAccounts = (contractAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'verifiedAccounts',
    args: [round],
    query: {
      enabled: !!contractAddress && round !== undefined,
    },
  });

  return { verifiedAccounts: data as `0x${string}`[] | undefined, isPending, error };
};

/**
 * Hook for verifiedAccountsAtIndex - 根据索引获取已验证账户
 */
export const useVerifiedAccountsAtIndex = (contractAddress: `0x${string}`, round: bigint, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'verifiedAccountsAtIndex',
    args: [round, index],
    query: {
      enabled: !!contractAddress && round !== undefined && index !== undefined,
    },
  });

  return { verifiedAccountAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for verifiedAccountsCount - 获取已验证账户数量
 */
export const useVerifiedAccountsCount = (contractAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'verifiedAccountsCount',
    args: [round],
    query: {
      enabled: !!contractAddress && round !== undefined,
    },
  });

  return { verifiedAccountsCount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for verify - 获取 Verify 合约地址
 */
export const useVerify = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'verify',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { verifyAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for waitingPhases - 获取等待阶段数
 */
export const useWaitingPhases = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionStakeLpAbi,
    functionName: 'waitingPhases',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { waitingPhases: safeToBigInt(data), isPending, error };
};

// =====================
// === 写入 Hook ===
// =====================

/**
 * Hook for claimReward - 领取奖励
 */
export function useClaimReward(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionStakeLpAbi,
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
 * Hook for initialize - 初始化合约
 */
export function useInitialize(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionStakeLpAbi,
    contractAddress,
    'initialize',
  );

  const initialize = async () => {
    console.log('提交 initialize 交易:', { contractAddress, isTukeMode });
    return await execute([]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('initialize tx hash:', hash);
    }
    if (error) {
      console.log('提交 initialize 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    initialize,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for stakeLp - 质押 LP 代币
 */
export function useStakeLp(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionStakeLpAbi,
    contractAddress,
    'stakeLp',
  );

  const stakeLp = async (amount: bigint) => {
    console.log('提交 stakeLp 交易:', { contractAddress, amount, isTukeMode });
    return await execute([amount]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('stakeLp tx hash:', hash);
    }
    if (error) {
      console.log('提交 stakeLp 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    stakeLp,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for unstakeLp - 取消质押 LP 代币
 */
export function useUnstakeLp(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionStakeLpAbi,
    contractAddress,
    'unstakeLp',
  );

  const unstakeLp = async () => {
    console.log('提交 unstakeLp 交易:', { contractAddress, isTukeMode });
    return await execute([]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('unstakeLp tx hash:', hash);
    }
    if (error) {
      console.log('提交 unstakeLp 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    unstakeLp,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for withdrawLp - 提取 LP 代币
 */
export function useWithdrawLp(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionStakeLpAbi,
    contractAddress,
    'withdrawLp',
  );

  const withdrawLp = async () => {
    console.log('提交 withdrawLp 交易:', { contractAddress, isTukeMode });
    return await execute([]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('withdrawLp tx hash:', hash);
    }
    if (error) {
      console.log('提交 withdrawLp 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    withdrawLp,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

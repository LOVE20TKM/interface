// hooks/useLOVE20ExtensionLp.ts

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { LOVE20ExtensionLpAbi } from '@/src/abis/LOVE20ExtensionLp';
import { safeToBigInt } from '@/src/lib/clientUtils';

// 注意：ExtensionLp 是动态部署的合约，需要传入合约地址
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
    abi: LOVE20ExtensionLpAbi,
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
    abi: LOVE20ExtensionLpAbi,
    functionName: 'accounts',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { accounts: data as `0x${string}`[] | undefined, isPending, error };
};

/**
 * Hook for accountsByRound - 获取指定轮次的账户列表
 */
export const useAccountsByRound = (contractAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionLpAbi,
    functionName: 'accountsByRound',
    args: [round],
    query: {
      enabled: !!contractAddress && round !== undefined,
    },
  });

  return { accounts: data as `0x${string}`[] | undefined, isPending, error };
};

/**
 * Hook for accountsByRoundAtIndex - 根据索引获取指定轮次的账户
 */
export const useAccountsByRoundAtIndex = (contractAddress: `0x${string}`, round: bigint, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionLpAbi,
    functionName: 'accountsByRoundAtIndex',
    args: [round, index],
    query: {
      enabled: !!contractAddress && round !== undefined && index !== undefined,
    },
  });

  return { accountAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for accountsByRoundCount - 获取指定轮次的账户数量
 */
export const useAccountsByRoundCount = (contractAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionLpAbi,
    functionName: 'accountsByRoundCount',
    args: [round],
    query: {
      enabled: !!contractAddress && round !== undefined,
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
    abi: LOVE20ExtensionLpAbi,
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
    abi: LOVE20ExtensionLpAbi,
    functionName: 'actionId',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { actionId: safeToBigInt(data), isPending, error };
};

/**
 * Hook for calculateScore - 计算账户的积分
 */
export const useCalculateScore = (contractAddress: `0x${string}`, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionLpAbi,
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
    abi: LOVE20ExtensionLpAbi,
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
 * Hook for canExit - 检查账户是否可以退出
 */
export const useCanExit = (contractAddress: `0x${string}`, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionLpAbi,
    functionName: 'canExit',
    args: [account],
    query: {
      enabled: !!contractAddress && !!account,
    },
  });

  return { canExit: data as boolean | undefined, isPending, error };
};

/**
 * Hook for center - 获取 center 合约地址
 */
export const useCenter = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionLpAbi,
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
    abi: LOVE20ExtensionLpAbi,
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
    abi: LOVE20ExtensionLpAbi,
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
    abi: LOVE20ExtensionLpAbi,
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
    abi: LOVE20ExtensionLpAbi,
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
    abi: LOVE20ExtensionLpAbi,
    functionName: 'joinInfo',
    args: [account],
    query: {
      enabled: !!contractAddress && !!account,
    },
  });

  return {
    amount: data ? safeToBigInt(data[0]) : undefined,
    joinedBlock: data ? safeToBigInt(data[1]) : undefined,
    exitableBlock: data ? safeToBigInt(data[2]) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for joinTokenAddress - 获取加入代币地址
 */
export const useJoinTokenAddress = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionLpAbi,
    functionName: 'joinTokenAddress',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { joinTokenAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for joinedValue - 获取加入值
 */
export const useJoinedValue = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionLpAbi,
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
    abi: LOVE20ExtensionLpAbi,
    functionName: 'joinedValueByAccount',
    args: [account],
    query: {
      enabled: !!contractAddress && !!account,
    },
  });

  return { joinedValueByAccount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for lpRatioPrecision - 获取 LP 比率精度
 */
export const useLpRatioPrecision = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionLpAbi,
    functionName: 'lpRatioPrecision',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { lpRatioPrecision: safeToBigInt(data), isPending, error };
};

/**
 * Hook for minGovVotes - 获取最小治理投票数
 */
export const useMinGovVotes = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionLpAbi,
    functionName: 'minGovVotes',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { minGovVotes: safeToBigInt(data), isPending, error };
};

/**
 * Hook for rewardByAccount - 获取账户的奖励信息
 */
export const useRewardByAccount = (contractAddress: `0x${string}`, round: bigint, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionLpAbi,
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
    abi: LOVE20ExtensionLpAbi,
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
    abi: LOVE20ExtensionLpAbi,
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
    abi: LOVE20ExtensionLpAbi,
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
    abi: LOVE20ExtensionLpAbi,
    functionName: 'scoresCount',
    args: [round],
    query: {
      enabled: !!contractAddress && round !== undefined,
    },
  });

  return { scoresCount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for tokenAddress - 获取代币地址
 */
export const useTokenAddress = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionLpAbi,
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
    abi: LOVE20ExtensionLpAbi,
    functionName: 'totalJoinedAmount',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { totalJoinedAmount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for totalScore - 获取总积分
 */
export const useTotalScore = (contractAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionLpAbi,
    functionName: 'totalScore',
    args: [round],
    query: {
      enabled: !!contractAddress && round !== undefined,
    },
  });

  return { totalScore: safeToBigInt(data), isPending, error };
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
    abi: LOVE20ExtensionLpAbi,
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
    abi: LOVE20ExtensionLpAbi,
    functionName: 'verificationInfoByRound',
    args: [account, verificationKey, round],
    query: {
      enabled: !!contractAddress && !!account && !!verificationKey && round !== undefined,
    },
  });

  return { verificationInfo: data as string | undefined, isPending, error };
};

/**
 * Hook for waitingBlocks - 获取等待区块数
 */
export const useWaitingBlocks = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: LOVE20ExtensionLpAbi,
    functionName: 'waitingBlocks',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { waitingBlocks: safeToBigInt(data), isPending, error };
};

// =====================
// === 写入 Hook ===
// =====================

/**
 * Hook for claimReward - 领取奖励
 */
export function useClaimReward(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionLpAbi,
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
 * Hook for exit - 退出（取回LP代币）
 */
export function useExit(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionLpAbi,
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
 * Hook for join - 加入（质押LP代币）
 */
export function useJoin(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionLpAbi,
    contractAddress,
    'join',
  );

  const join = async (amount: bigint, verificationInfos: string[]) => {
    console.log('提交 join 交易:', { contractAddress, amount, verificationInfos, isTukeMode });
    return await execute([amount, verificationInfos]);
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
 * Hook for updateVerificationInfo - 更新验证信息
 */
export function useUpdateVerificationInfo(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionLpAbi,
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

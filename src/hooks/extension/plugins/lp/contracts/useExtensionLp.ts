// hooks/useExtensionLp.ts

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { ExtensionLpAbi } from '@/src/abis/ExtensionLp';
import { safeToBigInt } from '@/src/lib/clientUtils';

// 注意：ExtensionLp 是动态部署的合约，需要传入合约地址
// 与其他固定地址的合约不同

// =====================
// === 读取 Hook ===
// =====================

/**
 * Hook for factory - 获取工厂地址
 */
export const useFactory = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionLpAbi,
    functionName: 'factory',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { factoryAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for GOV_RATIO_MULTIPLIER - 获取治理比率乘数
 */
export const useGovRatioMultiplier = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionLpAbi,
    functionName: 'GOV_RATIO_MULTIPLIER',
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
    abi: ExtensionLpAbi,
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
    abi: ExtensionLpAbi,
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
    abi: ExtensionLpAbi,
    functionName: 'joinInfo',
    args: [account],
    query: {
      enabled: !!contractAddress && !!account,
    },
  });

  const typedData = data as [bigint, bigint, bigint, bigint] | undefined;

  return {
    joinedRound: typedData ? safeToBigInt(typedData[0]) : undefined,
    amount: typedData ? safeToBigInt(typedData[1]) : undefined,
    joinedBlock: typedData ? safeToBigInt(typedData[2]) : undefined,
    exitableBlock: typedData ? safeToBigInt(typedData[3]) : undefined,
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
    abi: ExtensionLpAbi,
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
    abi: ExtensionLpAbi,
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
    abi: ExtensionLpAbi,
    functionName: 'joinedValueByAccount',
    args: [account],
    query: {
      enabled: !!contractAddress && !!account,
    },
  });

  return { joinedValueByAccount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for MIN_GOV_VOTES - 获取最小治理投票数
 */
export const useMinGovVotes = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionLpAbi,
    functionName: 'MIN_GOV_VOTES',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { minGovVotes: safeToBigInt(data), isPending, error };
};

/**
 * Hook for reward - 获取指定轮次的奖励
 */
export const useReward = (contractAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionLpAbi,
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
    abi: ExtensionLpAbi,
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
 * Hook for tokenAddress - 获取代币地址
 */
export const useTokenAddress = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionLpAbi,
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
    abi: ExtensionLpAbi,
    functionName: 'totalJoinedAmount',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { totalJoinedAmount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for WAITING_BLOCKS - 获取等待区块数
 */
export const useWaitingBlocks = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionLpAbi,
    functionName: 'WAITING_BLOCKS',
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
 * Hook for exit - 退出（取回LP代币）
 */
export function useExit(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    ExtensionLpAbi,
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
    ExtensionLpAbi,
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

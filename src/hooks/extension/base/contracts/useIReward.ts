// hooks/useIReward.ts
// 通用的 IReward 接口 Hook
// 可用于任何实现 IReward 接口的合约

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { IRewardAbi } from '@/src/abis/IReward';
import { safeToBigInt } from '@/src/lib/clientUtils';

// =====================
// === 读取 Hook ===
// =====================

/**
 * Hook for reward - 获取指定轮次的奖励
 */
export const useReward = (contractAddress: `0x${string}` | undefined, round: bigint | undefined) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: IRewardAbi,
    functionName: 'reward',
    args: !!round ? [round] : undefined,
    query: {
      enabled: !!contractAddress && !!round,
    },
  });

  return { reward: safeToBigInt(data), isPending, error };
};

/**
 * Hook for rewardByAccount - 获取账户的奖励信息
 * 返回值: (mintReward, burnReward, claimed)
 */
export const useRewardByAccount = (
  contractAddress: `0x${string}` | undefined,
  round: bigint | undefined,
  account: `0x${string}` | undefined,
) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: IRewardAbi,
    functionName: 'rewardByAccount',
    args: !!round && account ? [round, account] : undefined,
    query: {
      enabled: !!contractAddress && !!round && !!account,
    },
  });

  return {
    mintReward: data ? safeToBigInt(data[0]) : undefined,
    burnReward: data ? safeToBigInt(data[1]) : undefined,
    claimed: data ? (data[2] as boolean) : undefined,
    isPending,
    error,
  };
};

// =====================
// === 写入 Hook ===
// =====================

/**
 * Hook for claimReward - 领取奖励
 */
export function useClaimReward(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    IRewardAbi,
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

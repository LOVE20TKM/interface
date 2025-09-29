// hooks/useLove20Join.ts

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { LOVE20JoinAbi } from '@/src/abis/LOVE20Join';
import { safeToBigInt } from '@/src/lib/clientUtils';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_JOIN as `0x${string}`;

// =====================
// === 读取 Hook ===
// =====================

/**
 * Hook for currentRound
 */
export const useCurrentRound = (flag: boolean = true) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20JoinAbi,
    functionName: 'currentRound',
    query: {
      enabled: flag,
    },
  });

  return { currentRound: safeToBigInt(data), isPending, error };
};

/**
 * Hook for joinedAmountByActionId tokenAddress => actionId => amount
 */
export const useJoinedAmountByActionId = (tokenAddress: `0x${string}`, actionId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20JoinAbi,
    functionName: 'amountByActionId',
    args: [tokenAddress, actionId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined,
    },
  });

  return { joinedAmountByActionId: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook for joinedAmountByActionIdByAccount
 */
export const useJoinedAmountByActionIdByAccount = (
  tokenAddress: `0x${string}`,
  actionId: bigint,
  account: `0x${string}`,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20JoinAbi,
    functionName: 'amountByActionIdByAccount',
    args: [tokenAddress, actionId, account],
    query: {
      enabled: !!tokenAddress && !!account && actionId !== undefined,
    },
  });

  return { joinedAmountByActionIdByAccount: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook for originBlocks
 */
export const useOriginBlocks = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20JoinAbi,
    functionName: 'originBlocks',
  });

  return { originBlocks: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook for stakedAmountByAccount
 */
export const useStakedAmountByAccount = (tokenAddress: `0x${string}`, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20JoinAbi,
    functionName: 'amountByAccount',
    args: [tokenAddress, account],
    query: {
      enabled: !!tokenAddress && !!account,
    },
  });

  return { stakedAmount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for indexToAccount - 根据索引获取参与地址
 */
export const useIndexToAccount = (tokenAddress: `0x${string}`, actionId: bigint, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20JoinAbi,
    functionName: 'indexToAccount',
    args: [tokenAddress, actionId, index],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && index !== undefined,
    },
  });

  return { indexToAccount: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for numOfAccounts - 参与地址数
 */
export const useNumOfAccounts = (tokenAddress: `0x${string}`, actionId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20JoinAbi,
    functionName: 'numOfAccounts',
    args: [tokenAddress, actionId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined,
    },
  });

  return { numOfAccounts: data ? safeToBigInt(data) : undefined, isPending, error };
};

// =====================
// === 写入 Hook ===
// =====================

/**
 * Hook for join
 */
/**
 * Hook for join
 */
export function useJoin() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20JoinAbi,
    CONTRACT_ADDRESS,
    'join',
  );

  const join = async (
    tokenAddress: `0x${string}`,
    actionId: bigint,
    additionalStakeAmount: bigint,
    verificationInfos_: string[],
  ) => {
    console.log('提交join交易:', { tokenAddress, actionId, additionalStakeAmount, verificationInfos_, isTukeMode });
    return await execute([tokenAddress, actionId, additionalStakeAmount, verificationInfos_]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('join tx hash:', hash);
    }
    if (error) {
      console.log('提交join交易错误:');
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
 * Hook for withdraw
 */
/**
 * Hook for withdraw
 */
export function useWithdraw() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20JoinAbi,
    CONTRACT_ADDRESS,
    'withdraw',
  );

  const withdraw = async (tokenAddress: `0x${string}`, actionId: bigint) => {
    console.log('提交withdraw交易:', { tokenAddress, actionId, isTukeMode });
    return await execute([tokenAddress, actionId]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('withdraw tx hash:', hash);
    }
    if (error) {
      console.log('提交withdraw交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    withdraw,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

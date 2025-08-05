import { useEffect, useState } from 'react';
import { useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { simulateContract, writeContract } from '@wagmi/core';
import { config } from '@/src/wagmi';
import { LOVE20SubmitAbi } from '@/src/abis/LOVE20Submit';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { deepLogError, logError, logWeb3Error } from '@/src/lib/debugUtils';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_SUBMIT as `0x${string}`;

// =====================
// === 读取 Hook ===
// =====================

/**
 * Hook for SUBMIT_MIN_PER_THOUSAND
 */
export const useSubmitMinPerThousand = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20SubmitAbi,
    functionName: 'SUBMIT_MIN_PER_THOUSAND',
    args: [],
  });

  return { submitMinPerThousand: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook for actionInfo
 */
export const useActionInfo = (tokenAddress: `0x${string}`, actionId: bigint | undefined) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20SubmitAbi,
    functionName: 'actionInfo',
    args: [tokenAddress, actionId || 0n],
    query: {
      enabled: !!tokenAddress && actionId !== undefined,
    },
  });

  return { actionInfo: data as any | undefined, isPending, error };
};

/**
 * Hook for actionNum
 */
export const useActionsCount = (tokenAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20SubmitAbi,
    functionName: 'actionsCount',
    args: [tokenAddress],
  });

  return { actionNum: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook for canSubmit
 */
export const useCanSubmit = (tokenAddress: `0x${string}`, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20SubmitAbi,
    functionName: 'canSubmit',
    args: [tokenAddress, account],
  });

  return { canSubmit: data as boolean | undefined, isPending, error };
};

/**
 * Hook for currentRound
 */
export const useCurrentRound = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20SubmitAbi,
    functionName: 'currentRound',
    args: [],
  });

  return { currentRound: safeToBigInt(data), isPending, error };
};

/**
 * Hook for isSubmitted
 */
export const useIsSubmitted = (tokenAddress: `0x${string}`, round: bigint, actionId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20SubmitAbi,
    functionName: 'isSubmitted',
    args: [tokenAddress, round, actionId],
  });

  return { isSubmitted: data as boolean | undefined, isPending, error };
};

/**
 * Hook for originBlocks
 */
export const useOriginBlocks = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20SubmitAbi,
    functionName: 'originBlocks',
    args: [],
  });

  return { originBlocks: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook for phaseBlocks
 */
export const useRoundBlocks = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20SubmitAbi,
    functionName: 'phaseBlocks',
    args: [],
  });

  return { phaseBlocks: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook for roundByBlockNumber
 */
export const useRoundByBlockNumber = (blockNumber: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20SubmitAbi,
    functionName: 'roundByBlockNumber',
    args: [blockNumber],
  });

  return { round: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook for stakeAddress
 */
export const useStakeAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20SubmitAbi,
    functionName: 'stakeAddress',
    args: [],
  });

  return { stakeAddress: data as `0x${string}` | undefined, isPending, error };
};

// =====================
// === 写入 Hook ===
// =====================

export function useSubmit() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20SubmitAbi,
    CONTRACT_ADDRESS,
    'submit',
  );

  const submit = async (tokenAddress: `0x${string}`, actionId: bigint) => {
    console.log('提交submit交易:', { tokenAddress, actionId, isTukeMode });
    return await execute([tokenAddress, actionId]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('submit tx hash:', hash);
    }
    if (error) {
      console.log('提交submit交易错误:');
      logWeb3Error(error);
      logError(error);
    }
    if (isConfirmed) {
      console.log('submit tx confirmed');
    }
  }, [hash, error, isConfirmed]);

  return {
    submit,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for submitNewAction
 */
export function useSubmitNewAction() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20SubmitAbi,
    CONTRACT_ADDRESS,
    'submitNewAction',
    { skipSimulation: true },
  );

  const submitNewAction = async (
    tokenAddress: `0x${string}`,
    actionBody: {
      minStake: bigint;
      maxRandomAccounts: bigint;
      whiteListAddress: `0x${string}`;
      title: string;
      verificationRule: string;
      verificationKeys: string[];
      verificationInfoGuides: string[];
    },
  ) => {
    console.log('提交submitNewAction交易:', { tokenAddress, actionBody, isTukeMode });
    return await execute([tokenAddress, actionBody]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('submitNewAction tx hash:', hash);
    }
    if (error) {
      console.log('提交submitNewAction交易错误:');
      logWeb3Error(error);
      logError(error);
    }
    if (isConfirmed) {
      console.log('submitNewAction tx confirmed');
    }
  }, [hash, error, isConfirmed]);

  return {
    submitNewAction,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

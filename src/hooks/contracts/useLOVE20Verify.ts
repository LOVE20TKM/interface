// hooks/contracts/useLOVE20Verify.ts

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { LOVE20VerifyAbi } from '@/src/abis/LOVE20Verify';
import { safeToBigInt } from '@/src/lib/clientUtils';

// 定义合约地址，请根据实际情况设置
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_VERIFY as `0x${string}`;

// =====================
// === 读取 Hooks ===
// =====================

/**
 * Hook for currentRound
 */
export const useCurrentRound = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VerifyAbi,
    functionName: 'currentRound',
  });

  return { currentRound: safeToBigInt(data), isPending, error };
};

/**
 * Hook for firstTokenAddress
 */
export const useFirstTokenAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VerifyAbi,
    functionName: 'firstTokenAddress',
  });

  return { firstTokenAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for originBlocks
 */
export const useOriginBlocks = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VerifyAbi,
    functionName: 'originBlocks',
  });

  return { originBlocks: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook for score
 */
export const useScore = (account: `0x${string}`, someNumber: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VerifyAbi,
    functionName: 'score',
    args: [account, someNumber],
    query: {
      enabled: !!account && someNumber !== undefined,
    },
  });

  return { score: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook for scoreByActionId
 */
export const useScoreByActionId = (account: `0x${string}`, someNumber1: bigint, someNumber2: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VerifyAbi,
    functionName: 'scoreByActionId',
    args: [account, someNumber1, someNumber2],
    query: {
      enabled: !!account && someNumber1 !== undefined && someNumber2 !== undefined,
    },
  });

  return { scoreByActionId: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook for scoreByActionIdByAccount
 */
export const useScoreByActionIdByAccount = (
  account: `0x${string}`,
  someNumber1: bigint,
  someNumber2: bigint,
  anotherAccount: `0x${string}`,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VerifyAbi,
    functionName: 'scoreByActionIdByAccount',
    args: [account, someNumber1, someNumber2, anotherAccount],
    query: {
      enabled: !!account && someNumber1 !== undefined && someNumber2 !== undefined && !!anotherAccount,
    },
  });

  return { scoreByActionIdByAccount: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * Hook for scoreByVerifier
 */
export const useScoreByVerifier = (tokenAddress: `0x${string}`, round: bigint, verifier: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VerifyAbi,
    functionName: 'scoreByVerifier',
    args: [tokenAddress, round, verifier],
    query: {
      enabled: !!tokenAddress && !!verifier && !!round,
    },
  });
  return { scoreByVerifier: safeToBigInt(data), isPending, error };
};

/**
 * Hook for scoreByVerifierByActionId
 */
export const useScoreByVerifierByActionId = (
  tokenAddress: `0x${string}`,
  round: bigint,
  verifier: `0x${string}`,
  actionId: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VerifyAbi,
    functionName: 'scoreByVerifierByActionId',
    args: [tokenAddress, round, verifier, actionId],
    query: {
      enabled: !!tokenAddress && !!round && !!verifier && actionId !== undefined,
    },
  });

  return { scoreByVerifierByActionId: safeToBigInt(data), isPending, error };
};

/**
 * Hook for scoreByVerifierByActionIdByAccount
 */
export const useScoreByVerifierByActionIdByAccount = (
  verifier: `0x${string}`,
  round: bigint,
  tokenAddress: `0x${string}`,
  actionId: bigint,
  account: `0x${string}`,
  enabled: boolean = true,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VerifyAbi,
    functionName: 'scoreByVerifierByActionIdByAccount',
    args: [verifier, round, tokenAddress, actionId, account],
    query: {
      enabled: enabled && !!verifier && !!round && !!tokenAddress && actionId !== undefined && !!account,
    },
  });

  return { scoreByVerifierByActionIdByAccount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for scoreWithReward
 */
export const useScoreWithReward = (account: `0x${string}`, someNumber: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20VerifyAbi,
    functionName: 'scoreWithReward',
    args: [account, someNumber],
    query: {
      enabled: !!account && someNumber !== undefined,
    },
  });

  return { scoreWithReward: data ? safeToBigInt(data) : undefined, isPending, error };
};

// =====================
// === 写入 Hooks ===
// =====================

export function useVerify() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20VerifyAbi,
    CONTRACT_ADDRESS,
    'verify',
  );

  const verify = async (tokenAddress: `0x${string}`, actionId: bigint, abstentionScore: bigint, scores: bigint[]) => {
    console.log('提交verify交易:', { tokenAddress, actionId, abstentionScore, scores, isTukeMode });
    return await execute([tokenAddress, actionId, abstentionScore, scores]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('verify tx hash:', hash);
    }
    if (error) {
      console.log('提交verify交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    verify,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

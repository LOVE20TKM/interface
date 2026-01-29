// hooks/contracts/useLOVE20Mint.ts

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { LOVE20MintAbi } from '@/src/abis/LOVE20Mint';
import { safeToBigInt } from '@/src/lib/clientUtils';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MINT as `0x${string}`;

// =====================
// === 读取 Hook ===
// =====================
/**
 * Hook for ROUND_REWARD_ACTION_PER_THOUSAND
 */
export const useRoundRewardActionPerThousand = () => {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20MintAbi,
    functionName: 'ROUND_REWARD_ACTION_PER_THOUSAND',
    args: [],
  });

  return {
    roundRewardActionPerThousand: data ? safeToBigInt(data) : undefined,
    isPending: isLoading,
    error,
  };
};

/**
 * Hook for ROUND_REWARD_GOV_PER_THOUSAND
 */
export const useRoundRewardGovPerThousand = () => {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20MintAbi,
    functionName: 'ROUND_REWARD_GOV_PER_THOUSAND',
    args: [],
  });

  return {
    roundRewardGovPerThousand: data ? safeToBigInt(data) : undefined,
    isPending: isLoading,
    error,
  };
};

/**
 * Hook for numOfMintGovRewardByAccount
 * 查询账户已铸造的治理次数
 */
export const useNumOfMintGovRewardByAccount = (tokenAddress: `0x${string}`, account: `0x${string}`) => {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20MintAbi,
    functionName: 'numOfMintGovRewardByAccount',
    args: [tokenAddress, account],
  });

  return {
    numOfMintGovRewardByAccount: data ? safeToBigInt(data) : undefined,
    isPending: isLoading,
    error,
  };
};

/**
 * Hook for actionReward
 */
export const useActionReward = (tokenAddress: `0x${string}`, round: bigint) => {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20MintAbi,
    functionName: 'actionReward',
    args: [tokenAddress, round],
  });

  return {
    actionReward: data ? safeToBigInt(data) : undefined,
    isPending: isLoading,
    error,
  };
};

/**
 * Hook for actionRewardByActionIdByAccount
 */
export const useActionRewardByActionIdByAccount = (
  tokenAddress: `0x${string}`,
  round: bigint,
  actionId: bigint,
  account: `0x${string}`,
) => {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20MintAbi,
    functionName: 'actionRewardByActionIdByAccount',
    args: [tokenAddress, round, actionId, account],
  });

  return {
    actionRewardByActionIdByAccount: data?.[0] ? safeToBigInt(data[0]) : undefined,
    isMinted: data?.[1] as boolean | undefined,
    isPending: isLoading,
    error,
  };
};

/**
 * Hook for actionRewardMintedByAccount
 */
export const useActionRewardMintedByAccount = (
  account: `0x${string}`,
  round: bigint,
  actionId: bigint,
  targetAddress: `0x${string}`,
) => {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20MintAbi,
    functionName: 'actionRewardMintedByAccount',
    args: [account, round, actionId, targetAddress],
  });

  return {
    actionRewardMintedByAccount: data ? safeToBigInt(data) : undefined,
    isPending: isLoading,
    error,
  };
};

/**
 * Hook for calculateRoundActionReward
 */
export const useCalculateRoundActionReward = (tokenAddress: `0x${string}`, round: bigint) => {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20MintAbi,
    functionName: 'calculateRoundActionReward',
    args: [tokenAddress],
  });

  return {
    calculateRoundActionReward: data ? safeToBigInt(data) : undefined,
    isPending: isLoading,
    error,
  };
};

/**
 * Hook for calculateRoundGovReward
 */
export const useCalculateRoundGovReward = (tokenAddress: `0x${string}`) => {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20MintAbi,
    functionName: 'calculateRoundGovReward',
    args: [tokenAddress],
  });

  return {
    calculateRoundGovReward: data ? safeToBigInt(data) : undefined,
    isPending: isLoading,
    error,
  };
};

/**
 * Hook for govReward
 */
export const useGovReward = (tokenAddress: `0x${string}`, round: bigint) => {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20MintAbi,
    functionName: 'govReward',
    args: [tokenAddress, round],
  });

  return {
    govReward: data ? safeToBigInt(data) : undefined,
    isPending: isLoading,
    error,
  };
};

/**
 * Hook for govRewardByAccount
 */
export const useGovRewardByAccount = (tokenAddress: `0x${string}`, round: bigint, account: `0x${string}`) => {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20MintAbi,
    functionName: 'govRewardByAccount',
    args: [tokenAddress, round, account],
    query: {
      enabled: !!tokenAddress && !!account && !!round,
    },
  });

  return {
    verifyReward: data?.[0] ? safeToBigInt(data[0]) : undefined,
    boostReward: data?.[1] ? safeToBigInt(data[1]) : undefined,
    burnReward: data?.[2] ? safeToBigInt(data[2]) : undefined,
    isMinted: data?.[3] as boolean | undefined,
    isPending: isLoading,
    error,
  };
};

/**
 * Hook for govRewardMintedByAccount
 */
export const useGovRewardMintedByAccount = (account: `0x${string}`, round: bigint, targetAddress: `0x${string}`) => {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20MintAbi,
    functionName: 'govRewardMintedByAccount',
    args: [account, round, targetAddress],
  });

  return {
    govRewardMintedByAccount: data ? safeToBigInt(data) : undefined,
    isPending: isLoading,
    error,
  };
};

/**
 * Hook for isRewardPrepared
 */
export const useIsRewardPrepared = (tokenAddress: `0x${string}`, round: bigint) => {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20MintAbi,
    functionName: 'isRewardPrepared',
    args: [tokenAddress, round],
  });

  return {
    isRewardPrepared: data as boolean | undefined,
    isPending: isLoading,
    error,
  };
};

/**
 * Hook for rewardAvailable
 */
export const useRewardAvailable = (tokenAddress: `0x${string}`) => {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20MintAbi,
    functionName: 'rewardAvailable',
    args: [tokenAddress],
    query: {
      enabled: !!tokenAddress,
    },
  });

  return {
    rewardAvailable: data ? safeToBigInt(data) : undefined,
    isPending: isLoading,
    error,
  };
};

/**
 * Hook for rewardBurned
 */
export const useRewardBurned = (account: `0x${string}`) => {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20MintAbi,
    functionName: 'rewardBurned',
    args: [account],
  });

  return {
    rewardBurned: data ? safeToBigInt(data) : undefined,
    isPending: isLoading,
    error,
  };
};

/**
 * Hook for rewardMinted
 */
export const useRewardMinted = (account: `0x${string}`) => {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20MintAbi,
    functionName: 'rewardMinted',
    args: [account],
  });

  return {
    rewardMinted: data ? safeToBigInt(data) : undefined,
    isPending: isLoading,
    error,
  };
};

/**
 * Hook for rewardReserved
 */
export const useRewardReserved = (account: `0x${string}`) => {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20MintAbi,
    functionName: 'rewardReserved',
    args: [account],
  });

  return {
    rewardReserved: data ? safeToBigInt(data) : undefined,
    isPending: isLoading,
    error,
  };
};

// =====================
// === 写入 Hook ===
// =====================

/**
 * Hook for mintActionReward
 */
export function useMintActionReward() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20MintAbi,
    CONTRACT_ADDRESS,
    'mintActionReward',
  );

  const mintActionReward = async (tokenAddress: `0x${string}`, round: bigint, actionId: bigint) => {
    console.log('提交mintActionReward交易:', { tokenAddress, round, actionId, isTukeMode });
    return await execute([tokenAddress, round, actionId]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('mintActionReward tx hash:', hash);
    }
    if (error) {
      console.log('提交mintActionReward交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    mintActionReward,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for mintGovReward
 */
export function useMintGovReward() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20MintAbi,
    CONTRACT_ADDRESS,
    'mintGovReward',
  );

  const mintGovReward = async (tokenAddress: `0x${string}`, round: bigint) => {
    console.log('提交mintGovReward交易:', { tokenAddress, round, isTukeMode });
    return await execute([tokenAddress, round]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('mintGovReward tx hash:', hash);
    }
    if (error) {
      console.log('提交mintGovReward交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    mintGovReward,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for prepareRewardIfNeeded
 */
export function usePrepareRewardIfNeeded() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20MintAbi,
    CONTRACT_ADDRESS,
    'prepareRewardIfNeeded',
  );

  const prepareRewardIfNeeded = async (tokenAddress: `0x${string}`, round: bigint) => {
    console.log('提交prepareRewardIfNeeded交易:', { tokenAddress, round, isTukeMode });
    return await execute([tokenAddress]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('prepareRewardIfNeeded tx hash:', hash);
    }
    if (error) {
      console.log('提交prepareRewardIfNeeded交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    prepareRewardIfNeeded,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

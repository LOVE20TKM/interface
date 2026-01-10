// hooks/extension/plugins/group/contracts/useExtensionGroupAction.ts

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { ExtensionGroupActionAbi } from '@/src/abis/ExtensionGroupAction';
import { safeToBigInt } from '@/src/lib/clientUtils';

// 注意：ExtensionGroupAction 是动态部署的合约，需要传入合约地址
// 与 GroupJoin/GroupVerify 等全局合约不同

// =====================
// === 读取 Hooks - 配置常量 ===
// =====================

/**
 * Hook for ACTIVATION_STAKE_AMOUNT - 获取激活需质押代币数量
 */
export const useActivationStakeAmount = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupActionAbi,
    functionName: 'ACTIVATION_STAKE_AMOUNT',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { activationStakeAmount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for MAX_VERIFY_CAPACITY_FACTOR - 获取验证容量系数
 */
export const useMaxVerifyCapacityFactor = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupActionAbi,
    functionName: 'MAX_VERIFY_CAPACITY_FACTOR',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { maxVerifyCapacityFactor: safeToBigInt(data), isPending, error };
};

/**
 * Hook for MAX_JOIN_AMOUNT_RATIO - 获取最大加入代币比例
 */
export const useMaxJoinAmountRatio = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupActionAbi,
    functionName: 'MAX_JOIN_AMOUNT_RATIO',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { maxJoinAmountRatio: safeToBigInt(data), isPending, error };
};

/**
 * Hook for JOIN_TOKEN_ADDRESS - 获取加入代币地址
 */
export const useJoinTokenAddress = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupActionAbi,
    functionName: 'JOIN_TOKEN_ADDRESS',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { joinTokenAddress: data as `0x${string}` | undefined, isPending, error };
};

// =====================
// === 读取 Hooks - 基本信息 ===
// =====================

/**
 * Hook for actionId - 获取 action ID
 */
export const useActionId = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupActionAbi,
    functionName: 'actionId',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { actionId: safeToBigInt(data), isPending, error };
};

/**
 * Hook for FACTORY_ADDRESS - 获取工厂地址
 */
export const useFactory = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupActionAbi,
    functionName: 'FACTORY_ADDRESS',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { factoryAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for TOKEN_ADDRESS - 获取代币地址
 */
export const useTokenAddress = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupActionAbi,
    functionName: 'TOKEN_ADDRESS',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { tokenAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for initialized - 检查是否已初始化
 */
export const useInitialized = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupActionAbi,
    functionName: 'initialized',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { initialized: data as boolean | undefined, isPending, error };
};

// =====================
// === 读取 Hooks - 参与值 ===
// =====================

/**
 * Hook for joinedAmount - 获取加入值
 */
export const useJoinedAmount = (contractAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupActionAbi,
    functionName: 'joinedAmount',
    query: {
      enabled: !!contractAddress,
    },
  });

  return { joinedAmount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for joinedAmountByAccount - 获取账户的加入值
 */
export const useJoinedAmountByAccount = (contractAddress: `0x${string}`, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupActionAbi,
    functionName: 'joinedAmountByAccount',
    args: [account],
    query: {
      enabled: !!contractAddress && !!account,
    },
  });

  return { joinedAmountByAccount: safeToBigInt(data), isPending, error };
};

// =====================
// === 读取 Hooks - 奖励相关 ===
// =====================

/**
 * Hook for reward - 获取指定轮次的奖励
 */
export const useReward = (contractAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupActionAbi,
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
    abi: ExtensionGroupActionAbi,
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
 * Hook for generatedRewardByGroupId - 获取指定组ID的生成奖励
 */
export const useGeneratedRewardByGroupId = (contractAddress: `0x${string}`, round: bigint, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupActionAbi,
    functionName: 'generatedRewardByGroupId',
    args: [round, groupId],
    query: {
      enabled: !!contractAddress && round !== undefined && groupId !== undefined,
    },
  });

  return { reward: safeToBigInt(data), isPending, error };
};

/**
 * Hook for generatedActionRewardByVerifier - 获取指定验证者的生成行动奖励
 */
export const useGeneratedActionRewardByVerifier = (
  contractAddress: `0x${string}`,
  round: bigint,
  verifier: `0x${string}`,
) => {
  const { data, isPending, error } = useReadContract({
    address: contractAddress,
    abi: ExtensionGroupActionAbi,
    functionName: 'generatedActionRewardByVerifier',
    args: [round, verifier],
    query: {
      enabled: !!contractAddress && round !== undefined && !!verifier,
    },
  });

  return { reward: safeToBigInt(data), isPending, error };
};

// =====================
// === 写入 Hooks ===
// =====================

/**
 * Hook for claimReward - 领取奖励
 */
export function useClaimReward(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    ExtensionGroupActionAbi,
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
 * Hook for burnUnclaimedReward - 销毁未领取的奖励
 */
export function useBurnUnclaimedReward(contractAddress: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    ExtensionGroupActionAbi,
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

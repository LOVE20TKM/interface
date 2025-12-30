// hooks/useExtensionCenter.ts

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { ExtensionCenterAbi } from '@/src/abis/ExtensionCenter';
import { safeToBigInt } from '@/src/lib/clientUtils';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_CENTER as `0x${string}`;

// =====================
// === 读取 Hook ===
// =====================

/**
 * Hook for verificationInfo - 获取验证信息
 */
export const useVerificationInfo = (
  tokenAddress: `0x${string}`,
  actionId: bigint,
  account: `0x${string}`,
  verificationKey: string,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ExtensionCenterAbi,
    functionName: 'verificationInfo',
    args: [tokenAddress, actionId, account, verificationKey],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && !!account && !!verificationKey,
    },
  });

  return { verificationInfo: data as string | undefined, isPending, error };
};

/**
 * Hook for verificationInfoByRound - 获取指定轮次的验证信息
 */
export const useVerificationInfoByRound = (
  tokenAddress: `0x${string}`,
  actionId: bigint,
  account: `0x${string}`,
  verificationKey: string,
  round: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ExtensionCenterAbi,
    functionName: 'verificationInfoByRound',
    args: [tokenAddress, actionId, account, verificationKey, round],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && !!account && !!verificationKey && round !== undefined,
    },
  });

  return { verificationInfo: data as string | undefined, isPending, error };
};

/**
 * Hook for accounts - 获取指定 token 和 actionId 的所有账户地址
 */
export const useAccounts = (tokenAddress: `0x${string}`, actionId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ExtensionCenterAbi,
    functionName: 'accounts',
    args: [tokenAddress, actionId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined,
    },
  });

  return { accounts: data as `0x${string}`[] | undefined, isPending, error };
};

/**
 * Hook for accountsAtIndex - 根据索引获取账户地址
 */
export const useAccountsAtIndex = (tokenAddress: `0x${string}`, actionId: bigint, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ExtensionCenterAbi,
    functionName: 'accountsAtIndex',
    args: [tokenAddress, actionId, index],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && index !== undefined,
    },
  });

  return { accountAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for accountsAtIndexByRound - 根据轮次和索引获取账户地址
 */
export const useAccountsByRoundAtIndex = (
  tokenAddress: `0x${string}`,
  actionId: bigint,
  index: bigint,
  round: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ExtensionCenterAbi,
    functionName: 'accountsByRoundAtIndex',
    args: [tokenAddress, actionId, index, round],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && index !== undefined && round !== undefined,
    },
  });

  return { accountAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for accountsCount - 获取账户数量
 */
export const useAccountsCount = (tokenAddress: `0x${string}`, actionId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ExtensionCenterAbi,
    functionName: 'accountsCount',
    args: [tokenAddress, actionId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

/**
 * Hook for accountsCountByRound - 获取指定轮次的账户数量
 */
export const useAccountsByRoundCount = (tokenAddress: `0x${string}`, actionId: bigint, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ExtensionCenterAbi,
    functionName: 'accountsByRoundCount',
    args: [tokenAddress, actionId, round],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

/**
 * Hook for actionIdsByAccount - 获取用户参与的所有 action ID、扩展地址和 factory 地址
 * @returns 返回 actionIds、extensions 和 factories_ 三个数组
 */
export const useActionIdsByAccount = (
  tokenAddress: `0x${string}`,
  account: `0x${string}`,
  factories: `0x${string}`[],
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ExtensionCenterAbi,
    functionName: 'actionIdsByAccount',
    args: [tokenAddress, account, factories],
    query: {
      enabled: !!tokenAddress && !!account && factories.length > 0,
    },
  });

  // 解析返回的三个数组：actionIds, extensions, factories_
  const result = data as [bigint[], `0x${string}`[], `0x${string}`[]] | undefined;

  return {
    actionIds: result?.[0],
    extensions: result?.[1],
    factories_: result?.[2],
    isPending,
    error,
  };
};

/**
 * Hook for extension - 获取指定 action 的扩展合约地址
 */
export const useExtension = (tokenAddress: `0x${string}`, actionId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ExtensionCenterAbi,
    functionName: 'extension',
    args: [tokenAddress, actionId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined,
    },
  });

  return { extensionAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for isAccountJoined - 检查账户是否已加入
 */
export const useIsAccountJoined = (tokenAddress: `0x${string}`, actionId: bigint, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ExtensionCenterAbi,
    functionName: 'isAccountJoined',
    args: [tokenAddress, actionId, account],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && !!account,
    },
  });

  return { isJoined: data as boolean | undefined, isPending, error };
};

/**
 * Hook for joinAddress - 获取 Join 合约地址
 */
export const useJoinAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ExtensionCenterAbi,
    functionName: 'joinAddress',
  });

  return { joinAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for launchAddress - 获取 Launch 合约地址
 */
export const useLaunchAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ExtensionCenterAbi,
    functionName: 'launchAddress',
  });

  return { launchAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for mintAddress - 获取 Mint 合约地址
 */
export const useMintAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ExtensionCenterAbi,
    functionName: 'mintAddress',
  });

  return { mintAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for randomAddress - 获取 Random 合约地址
 */
export const useRandomAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ExtensionCenterAbi,
    functionName: 'randomAddress',
  });

  return { randomAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for stakeAddress - 获取 Stake 合约地址
 */
export const useStakeAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ExtensionCenterAbi,
    functionName: 'stakeAddress',
  });

  return { stakeAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for submitAddress - 获取 Submit 合约地址
 */
export const useSubmitAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ExtensionCenterAbi,
    functionName: 'submitAddress',
  });

  return { submitAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for uniswapV2FactoryAddress - 获取 UniswapV2Factory 合约地址
 */
export const useUniswapV2FactoryAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ExtensionCenterAbi,
    functionName: 'uniswapV2FactoryAddress',
  });

  return { uniswapV2FactoryAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for verifyAddress - 获取 Verify 合约地址
 */
export const useVerifyAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ExtensionCenterAbi,
    functionName: 'verifyAddress',
  });

  return { verifyAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for voteAddress - 获取 Vote 合约地址
 */
export const useVoteAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ExtensionCenterAbi,
    functionName: 'voteAddress',
  });

  return { voteAddress: data as `0x${string}` | undefined, isPending, error };
};

// =====================
// === 写入 Hook ===
// =====================

/**
 * Hook for addAccount - 添加账户
 */
export function useAddAccount() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    ExtensionCenterAbi,
    CONTRACT_ADDRESS,
    'addAccount',
  );

  const addAccount = async (
    tokenAddress: `0x${string}`,
    actionId: bigint,
    account: `0x${string}`,
    verificationInfos: string[],
  ) => {
    console.log('提交 addAccount 交易:', {
      tokenAddress,
      actionId,
      account,
      verificationInfos,
      isTukeMode,
    });
    return await execute([tokenAddress, actionId, account, verificationInfos]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('addAccount tx hash:', hash);
    }
    if (error) {
      console.log('提交 addAccount 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    addAccount,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for removeAccount - 移除账户
 */
export function useRemoveAccount() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    ExtensionCenterAbi,
    CONTRACT_ADDRESS,
    'removeAccount',
  );

  const removeAccount = async (tokenAddress: `0x${string}`, actionId: bigint, account: `0x${string}`) => {
    console.log('提交 removeAccount 交易:', { tokenAddress, actionId, account, isTukeMode });
    return await execute([tokenAddress, actionId, account]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('removeAccount tx hash:', hash);
    }
    if (error) {
      console.log('提交 removeAccount 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    removeAccount,
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
export function useUpdateVerificationInfo() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    ExtensionCenterAbi,
    CONTRACT_ADDRESS,
    'updateVerificationInfo',
  );

  const updateVerificationInfo = async (
    tokenAddress: `0x${string}`,
    actionId: bigint,
    account: `0x${string}`,
    verificationInfos: string[],
  ) => {
    console.log('提交 updateVerificationInfo 交易:', {
      tokenAddress,
      actionId,
      account,
      verificationInfos,
      isTukeMode,
    });
    return await execute([tokenAddress, actionId, account, verificationInfos]);
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

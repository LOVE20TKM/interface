// hooks/useLOVE20ExtensionCenter.ts

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { LOVE20ExtensionCenterAbi } from '@/src/abis/LOVE20ExtensionCenter';
import { safeToBigInt } from '@/src/lib/clientUtils';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_CENTER as `0x${string}`;

// =====================
// === 读取 Hook ===
// =====================

/**
 * Hook for actionIdsByAccount - 获取用户参与的所有 action ID
 */
export const useActionIdsByAccount = (tokenAddress: `0x${string}`, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20ExtensionCenterAbi,
    functionName: 'actionIdsByAccount',
    args: [tokenAddress, account],
    query: {
      enabled: !!tokenAddress && !!account,
    },
  });

  return { actionIdsByAccount: data as bigint[] | undefined, isPending, error };
};

/**
 * Hook for actionIdsByAccountAtIndex - 根据索引获取用户参与的 action ID
 */
export const useActionIdsByAccountAtIndex = (tokenAddress: `0x${string}`, account: `0x${string}`, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20ExtensionCenterAbi,
    functionName: 'actionIdsByAccountAtIndex',
    args: [tokenAddress, account, index],
    query: {
      enabled: !!tokenAddress && !!account && index !== undefined,
    },
  });

  return { actionId: safeToBigInt(data), isPending, error };
};

/**
 * Hook for actionIdsByAccountCount - 获取用户参与的 action 数量
 */
export const useActionIdsByAccountCount = (tokenAddress: `0x${string}`, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20ExtensionCenterAbi,
    functionName: 'actionIdsByAccountCount',
    args: [tokenAddress, account],
    query: {
      enabled: !!tokenAddress && !!account,
    },
  });

  return { actionIdsCount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for existsFactory - 检查工厂地址是否存在
 */
export const useExistsFactory = (tokenAddress: `0x${string}`, factory: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20ExtensionCenterAbi,
    functionName: 'existsFactory',
    args: [tokenAddress, factory],
    query: {
      enabled: !!tokenAddress && !!factory,
    },
  });

  return { existsFactory: data as boolean | undefined, isPending, error };
};

/**
 * Hook for extension - 获取指定 action 的扩展合约地址
 */
export const useExtension = (tokenAddress: `0x${string}`, actionId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20ExtensionCenterAbi,
    functionName: 'extension',
    args: [tokenAddress, actionId],
    query: {
      enabled: !!tokenAddress && actionId !== undefined,
    },
  });

  return { extensionAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for extensionInfo - 获取扩展合约的信息
 */
export const useExtensionInfo = (extensionAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20ExtensionCenterAbi,
    functionName: 'extensionInfo',
    args: [extensionAddress],
    query: {
      enabled: !!extensionAddress,
    },
  });

  return {
    tokenAddress: data ? (data[0] as `0x${string}`) : undefined,
    actionId: data ? safeToBigInt(data[1]) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for extensions - 获取所有扩展合约地址
 */
export const useExtensions = (tokenAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20ExtensionCenterAbi,
    functionName: 'extensions',
    args: [tokenAddress],
    query: {
      enabled: !!tokenAddress,
    },
  });

  return { extensions: data as `0x${string}`[] | undefined, isPending, error };
};

/**
 * Hook for extensionsAtIndex - 根据索引获取扩展合约地址
 */
export const useExtensionsAtIndex = (tokenAddress: `0x${string}`, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20ExtensionCenterAbi,
    functionName: 'extensionsAtIndex',
    args: [tokenAddress, index],
    query: {
      enabled: !!tokenAddress && index !== undefined,
    },
  });

  return { extensionAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for extensionsCount - 获取扩展合约数量
 */
export const useExtensionsCount = (tokenAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20ExtensionCenterAbi,
    functionName: 'extensionsCount',
    args: [tokenAddress],
    query: {
      enabled: !!tokenAddress,
    },
  });

  return { extensionsCount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for factories - 获取所有工厂地址
 */
export const useFactories = (tokenAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20ExtensionCenterAbi,
    functionName: 'factories',
    args: [tokenAddress],
    query: {
      enabled: !!tokenAddress,
    },
  });

  return { factories: data as `0x${string}`[] | undefined, isPending, error };
};

/**
 * Hook for factoriesAtIndex - 根据索引获取工厂地址
 */
export const useFactoriesAtIndex = (tokenAddress: `0x${string}`, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20ExtensionCenterAbi,
    functionName: 'factoriesAtIndex',
    args: [tokenAddress, index],
    query: {
      enabled: !!tokenAddress && index !== undefined,
    },
  });

  return { factoryAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for factoriesCount - 获取工厂数量
 */
export const useFactoriesCount = (tokenAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20ExtensionCenterAbi,
    functionName: 'factoriesCount',
    args: [tokenAddress],
    query: {
      enabled: !!tokenAddress,
    },
  });

  return { factoriesCount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for isAccountJoined - 检查账户是否已加入
 */
export const useIsAccountJoined = (tokenAddress: `0x${string}`, actionId: bigint, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20ExtensionCenterAbi,
    functionName: 'isAccountJoined',
    args: [tokenAddress, actionId, account],
    query: {
      enabled: !!tokenAddress && actionId !== undefined && !!account,
    },
  });

  return { isAccountJoined: data as boolean | undefined, isPending, error };
};

/**
 * Hook for joinAddress - 获取 Join 合约地址
 */
export const useJoinAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20ExtensionCenterAbi,
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
    abi: LOVE20ExtensionCenterAbi,
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
    abi: LOVE20ExtensionCenterAbi,
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
    abi: LOVE20ExtensionCenterAbi,
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
    abi: LOVE20ExtensionCenterAbi,
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
    abi: LOVE20ExtensionCenterAbi,
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
    abi: LOVE20ExtensionCenterAbi,
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
    abi: LOVE20ExtensionCenterAbi,
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
    abi: LOVE20ExtensionCenterAbi,
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
    LOVE20ExtensionCenterAbi,
    CONTRACT_ADDRESS,
    'addAccount',
  );

  const addAccount = async (tokenAddress: `0x${string}`, actionId: bigint, account: `0x${string}`) => {
    console.log('提交 addAccount 交易:', { tokenAddress, actionId, account, isTukeMode });
    return await execute([tokenAddress, actionId, account]);
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
 * Hook for addFactory - 添加工厂地址
 */
export function useAddFactory() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionCenterAbi,
    CONTRACT_ADDRESS,
    'addFactory',
  );

  const addFactory = async (tokenAddress: `0x${string}`, factory: `0x${string}`) => {
    console.log('提交 addFactory 交易:', { tokenAddress, factory, isTukeMode });
    return await execute([tokenAddress, factory]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('addFactory tx hash:', hash);
    }
    if (error) {
      console.log('提交 addFactory 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    addFactory,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for initializeExtension - 初始化扩展合约
 */
export function useInitializeExtension() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20ExtensionCenterAbi,
    CONTRACT_ADDRESS,
    'initializeExtension',
  );

  const initializeExtension = async (
    extensionAddress: `0x${string}`,
    tokenAddress: `0x${string}`,
    actionId: bigint,
  ) => {
    console.log('提交 initializeExtension 交易:', { extensionAddress, tokenAddress, actionId, isTukeMode });
    return await execute([extensionAddress, tokenAddress, actionId]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('initializeExtension tx hash:', hash);
    }
    if (error) {
      console.log('提交 initializeExtension 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    initializeExtension,
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
    LOVE20ExtensionCenterAbi,
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

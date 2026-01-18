// hooks/extension/plugins/group/contracts/useGroupJoin.ts

import { useEffect, useMemo } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';

import { GroupJoinAbi } from '@/src/abis/GroupJoin';
import { safeToBigInt } from '@/src/lib/clientUtils';

// GroupJoin 是全局合约，使用环境变量配置地址
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_JOIN as `0x${string}`;

// =====================
// === 读取 Hooks ===
// =====================

/**
 * Hook for FACTORY_ADDRESS - 获取工厂地址
 */
export const useFactoryAddress = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupJoinAbi,
    functionName: 'FACTORY_ADDRESS',
  });

  return { factoryAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for joinInfo - 获取账户的加入信息
 */
export const useJoinInfo = (extensionAddress: `0x${string}`, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupJoinAbi,
    functionName: 'joinInfo',
    args: [extensionAddress, account],
    query: {
      enabled: !!extensionAddress && !!account,
    },
  });

  const typedData = data as [bigint, bigint, bigint, `0x${string}`] | undefined;

  return {
    joinedRound: typedData ? safeToBigInt(typedData[0]) : undefined,
    amount: typedData ? safeToBigInt(typedData[1]) : undefined,
    groupId: typedData ? safeToBigInt(typedData[2]) : undefined,
    provider: typedData ? (typedData[3] as unknown as `0x${string}`) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for accountsByGroupIdCount - 获取指定组ID的账户数量
 */
export const useAccountsByGroupIdCount = (extensionAddress: `0x${string}`, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupJoinAbi,
    functionName: 'accountsByGroupIdCount',
    args: [extensionAddress, groupId],
    query: {
      enabled: !!extensionAddress && groupId !== undefined,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

/**
 * Hook for accountsByGroupIdAtIndex - 根据索引获取指定组ID的账户
 */
export const useAccountsByGroupIdAtIndex = (extensionAddress: `0x${string}`, groupId: bigint, index: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupJoinAbi,
    functionName: 'accountsByGroupIdAtIndex',
    args: [extensionAddress, groupId, index],
    query: {
      enabled: !!extensionAddress && groupId !== undefined && index !== undefined,
    },
  });

  return { accountAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for totalJoinedAmountByGroupId - 获取指定组ID的总加入数量
 */
export const useTotalJoinedAmountByGroupId = (extensionAddress: `0x${string}`, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupJoinAbi,
    functionName: 'totalJoinedAmountByGroupId',
    args: [extensionAddress, groupId],
    query: {
      enabled: !!extensionAddress && groupId !== undefined,
    },
  });

  return { totalJoinedAmount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for joinedAmountByRound - 获取指定轮次的总加入数量
 */
export const useJoinedAmountByRound = (extensionAddress: `0x${string}`, round: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupJoinAbi,
    functionName: 'joinedAmountByRound',
    args: [extensionAddress, round],
    query: {
      enabled: !!extensionAddress && round !== undefined,
    },
  });

  return { joinedAmount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for totalJoinedAmountByGroupIdByRound - 获取指定组ID和轮次的总加入数量
 */
export const useTotalJoinedAmountByGroupIdByRound = (
  extensionAddress: `0x${string}`,
  round: bigint,
  groupId: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupJoinAbi,
    functionName: 'totalJoinedAmountByGroupIdByRound',
    args: [extensionAddress, round, groupId],
    query: {
      enabled: !!extensionAddress && groupId !== undefined && round !== undefined,
    },
  });

  return { totalJoinedAmount: safeToBigInt(data), isPending, error };
};

/**
 * Hook for accountsByGroupIdByRoundAtIndex - 根据轮次和索引获取指定组ID的账户
 */
export const useAccountsByGroupIdByRoundAtIndex = (
  extensionAddress: `0x${string}`,
  round: bigint,
  groupId: bigint,
  index: bigint,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupJoinAbi,
    functionName: 'accountsByGroupIdByRoundAtIndex',
    args: [extensionAddress, round, groupId, index],
    query: {
      enabled: !!extensionAddress && groupId !== undefined && index !== undefined && round !== undefined,
    },
  });

  return { accountAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for accountsByGroupIdByRoundCount - 获取指定轮次和组ID的账户数量
 */
export const useAccountsByGroupIdByRoundCount = (extensionAddress: `0x${string}`, round: bigint, groupId: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupJoinAbi,
    functionName: 'accountsByGroupIdByRoundCount',
    args: [extensionAddress, round, groupId],
    query: {
      enabled: !!extensionAddress && groupId !== undefined && round !== undefined,
    },
  });

  return { count: safeToBigInt(data), isPending, error };
};

/**
 * Hook for groupIdByAccountByRound - 获取指定账户在指定轮次的组ID
 */
export const useGroupIdByAccountByRound = (extensionAddress: `0x${string}`, round: bigint, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupJoinAbi,
    functionName: 'groupIdByAccountByRound',
    args: [extensionAddress, round, account as `0x${string}`],
    query: {
      enabled: !!extensionAddress && !!account && round !== undefined,
    },
  });

  return { groupId: safeToBigInt(data), isPending, error };
};

/**
 * Hook for trialWaitingListByProvider - 获取体验待使用地址列表
 */
export const useTrialWaitingListByProvider = (
  extensionAddress: `0x${string}`,
  groupId: bigint,
  provider: `0x${string}`,
) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupJoinAbi,
    functionName: 'trialWaitingListByProvider',
    args: [extensionAddress, groupId, provider],
    query: {
      enabled: !!extensionAddress && groupId !== undefined && !!provider && provider !== '0x0',
    },
  });

  const waitingList = useMemo(() => {
    if (!data) return [];
    const [accounts, amounts] = data as [`0x${string}`[], bigint[]];
    return accounts.map((account, index) => ({
      account,
      amount: safeToBigInt(amounts?.[index]),
    }));
  }, [data]);

  return { waitingList, isPending, error };
};

/**
 * Hook for trialJoinedListByProvider - 获取体验中地址列表（包含体验代币数量）
 */
export const useTrialJoinedListByProvider = (
  extensionAddress: `0x${string}`,
  groupId: bigint,
  provider: `0x${string}`,
) => {
  const {
    data: accountsData,
    isPending: isPendingAccounts,
    error: accountsError,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: GroupJoinAbi,
    functionName: 'trialJoinedListByProvider',
    args: [extensionAddress, groupId, provider],
    query: {
      enabled: !!extensionAddress && groupId !== undefined && !!provider && provider !== '0x0',
    },
  });

  const accounts = useMemo(() => {
    return (accountsData as `0x${string}`[] | undefined) || [];
  }, [accountsData]);

  const joinInfoContracts = useMemo(() => {
    if (!extensionAddress || accounts.length === 0) return [];
    return accounts.map((account) => ({
      address: CONTRACT_ADDRESS,
      abi: GroupJoinAbi,
      functionName: 'joinInfo',
      args: [extensionAddress, account],
    }));
  }, [extensionAddress, accounts]);

  const {
    data: joinInfos,
    isPending: isPendingJoinInfos,
    error: joinInfoError,
  } = useReadContracts({
    contracts: joinInfoContracts as any,
    query: {
      enabled: joinInfoContracts.length > 0,
    },
  });

  const joinedList = useMemo(() => {
    if (accounts.length === 0) return [];
    return accounts.map((account, index) => {
      const joinInfo = joinInfos?.[index]?.result as [bigint, bigint, bigint, `0x${string}`] | undefined;
      return {
        account,
        amount: joinInfo ? safeToBigInt(joinInfo[1]) : BigInt(0),
        joinedRound: joinInfo ? safeToBigInt(joinInfo[0]) : BigInt(0),
      };
    });
  }, [accounts, joinInfos]);

  const finalIsPending = useMemo(() => {
    if (isPendingAccounts) return true;
    if (accounts.length === 0) return false;
    return isPendingJoinInfos;
  }, [isPendingAccounts, accounts.length, isPendingJoinInfos]);

  return { joinedList, isPending: finalIsPending, error: accountsError || joinInfoError };
};

// =====================
// === 写入 Hooks ===
// =====================

/**
 * Hook for join - 加入（质押代币）
 */
export function useJoin() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    GroupJoinAbi,
    CONTRACT_ADDRESS,
    'join',
  );

  const join = async (
    extensionAddress: `0x${string}`,
    groupId: bigint,
    amount: bigint,
    verificationInfos: string[] = [],
  ) => {
    console.log('提交 join 交易:', { extensionAddress, groupId, amount, verificationInfos, isTukeMode });
    return await execute([extensionAddress, groupId, amount, verificationInfos]);
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
 * Hook for exit - 退出（取回代币）
 */
export function useExit() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    GroupJoinAbi,
    CONTRACT_ADDRESS,
    'exit',
  );

  const exit = async (extensionAddress: `0x${string}`) => {
    console.log('提交 exit 交易:', { extensionAddress, isTukeMode });
    return await execute([extensionAddress]);
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
 * Hook for trialWaitingListAdd - 添加体验待使用地址
 */
export function useTrialWaitingListAdd() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    GroupJoinAbi,
    CONTRACT_ADDRESS,
    'trialWaitingListAdd',
  );

  const trialWaitingListAdd = async (
    extensionAddress: `0x${string}`,
    groupId: bigint,
    trialAccounts: `0x${string}`[],
    trialAmounts: bigint[],
  ) => {
    console.log('提交 trialWaitingListAdd 交易:', {
      extensionAddress,
      groupId,
      trialAccounts,
      trialAmounts,
      isTukeMode,
    });
    return await execute([extensionAddress, groupId, trialAccounts, trialAmounts]);
  };

  useEffect(() => {
    if (hash) {
      console.log('trialWaitingListAdd tx hash:', hash);
    }
    if (error) {
      console.log('提交 trialWaitingListAdd 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    trialWaitingListAdd,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for trialJoin - 体验加入（不需要代币）
 */
export function useTrialJoin() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    GroupJoinAbi,
    CONTRACT_ADDRESS,
    'trialJoin',
  );

  const trialJoin = async (
    extensionAddress: `0x${string}`,
    groupId: bigint,
    provider: `0x${string}`,
    verificationInfos: string[] = [],
  ) => {
    console.log('提交 trialJoin 交易:', { extensionAddress, groupId, provider, verificationInfos, isTukeMode });
    return await execute([extensionAddress, groupId, provider, verificationInfos]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('trialJoin tx hash:', hash);
    }
    if (error) {
      console.log('提交 trialJoin 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    trialJoin,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for trialWaitingListRemove - 删除体验待使用地址
 */
export function useTrialWaitingListRemove() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    GroupJoinAbi,
    CONTRACT_ADDRESS,
    'trialWaitingListRemove',
  );

  const trialWaitingListRemove = async (
    extensionAddress: `0x${string}`,
    groupId: bigint,
    trialAccounts: `0x${string}`[],
  ) => {
    console.log('提交 trialWaitingListRemove 交易:', { extensionAddress, groupId, trialAccounts, isTukeMode });
    return await execute([extensionAddress, groupId, trialAccounts]);
  };

  useEffect(() => {
    if (hash) {
      console.log('trialWaitingListRemove tx hash:', hash);
    }
    if (error) {
      console.log('提交 trialWaitingListRemove 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    trialWaitingListRemove,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for trialWaitingListRemoveAll - 取消所有体验待使用地址
 */
export function useTrialWaitingListRemoveAll() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    GroupJoinAbi,
    CONTRACT_ADDRESS,
    'trialWaitingListRemoveAll',
  );

  const trialWaitingListRemoveAll = async (extensionAddress: `0x${string}`, groupId: bigint) => {
    console.log('提交 trialWaitingListRemoveAll 交易:', { extensionAddress, groupId, isTukeMode });
    return await execute([extensionAddress, groupId]);
  };

  useEffect(() => {
    if (hash) {
      console.log('trialWaitingListRemoveAll tx hash:', hash);
    }
    if (error) {
      console.log('提交 trialWaitingListRemoveAll 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    trialWaitingListRemoveAll,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * Hook for trialExit - 体验地址退出（由提供者代替退出）
 */
export function useTrialExit() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    GroupJoinAbi,
    CONTRACT_ADDRESS,
    'trialExit',
  );

  const trialExit = async (extensionAddress: `0x${string}`, account: `0x${string}`) => {
    console.log('提交 trialExit 交易:', { extensionAddress, account, isTukeMode });
    return await execute([extensionAddress, account]);
  };

  useEffect(() => {
    if (hash) {
      console.log('trialExit tx hash:', hash);
    }
    if (error) {
      console.log('提交 trialExit 交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    trialExit,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

// hooks/extension/plugins/group/composite/useGroupAccountsJoinedAmountOfRound.ts
// 获取某轮某群参与代币的明细

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { GroupJoinAbi } from '@/src/abis/GroupJoin';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useAccountsByGroupIdByRound } from './useAccountsByGroupIdByRound';

const GROUP_JOIN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_JOIN as `0x${string}`;

export interface AccountJoinedAmountInfo {
  account: `0x${string}`;
  joinedAmount: bigint;
  joinedRound: bigint;
}

export interface UseGroupAccountsJoinedAmountOfRoundParams {
  extensionAddress: `0x${string}` | undefined;
  round: bigint | undefined;
  groupId: bigint | undefined;
}

export interface UseGroupAccountsJoinedAmountOfRoundResult {
  accountJoinedAmounts: AccountJoinedAmountInfo[];
  isPending: boolean;
  error: any;
}

/**
 * Hook: 获取某轮某群参与代币的明细
 *
 * 算法：
 * 1. 获取某轮的行动者列表
 * 2. 循环每个行动者：获取行动者的参与代币数量
 */
export const useGroupAccountsJoinedAmountOfRound = ({
  extensionAddress,
  round,
  groupId,
}: UseGroupAccountsJoinedAmountOfRoundParams): UseGroupAccountsJoinedAmountOfRoundResult => {
  // 第一步：获取账户列表（使用 useAccountsByGroupIdByRound hook）
  const {
    accounts,
    isPending: isAccountsPending,
    error: accountsError,
  } = useAccountsByGroupIdByRound({
    extensionAddress: extensionAddress || '0x0',
    groupId: groupId || BigInt(0),
    round: round || BigInt(0),
  });

  // 第二步：获取每个账户的参与代币数量
  // 新版合约 joinedAmountByRound 需要 extensionAddress, account, round 参数
  const amountsContracts = useMemo(() => {
    if (!extensionAddress || round === undefined || accounts.length === 0) return [];

    const contracts = [];

    for (const account of accounts) {
      contracts.push({
        address: GROUP_JOIN_CONTRACT_ADDRESS,
        abi: GroupJoinAbi,
        functionName: 'joinedAmountByAccount',
        args: [extensionAddress, round, account],
      });
    }

    return contracts;
  }, [extensionAddress, round, accounts]);

  // 第三步：获取每个账户的参与轮次
  // 新版合约 joinInfo 需要 extensionAddress, account 参数
  const joinInfoContracts = useMemo(() => {
    if (!extensionAddress || round === undefined || accounts.length === 0) return [];

    return accounts.map((account) => ({
      address: GROUP_JOIN_CONTRACT_ADDRESS,
      abi: GroupJoinAbi,
      functionName: 'joinInfo',
      args: [extensionAddress, round, account],
    }));
  }, [extensionAddress, round, accounts]);

  const mergedContracts = useMemo(() => {
    if (!extensionAddress || round === undefined) return [];
    if (amountsContracts.length === 0 && joinInfoContracts.length === 0) return [];
    return [...amountsContracts, ...joinInfoContracts];
  }, [extensionAddress, round, amountsContracts, joinInfoContracts]);

  const {
    data: mergedData,
    isPending: isMergedPending,
    error: mergedError,
  } = useReadContracts({
    contracts: mergedContracts as any,
    query: {
      enabled: mergedContracts.length > 0,
    },
  });

  // 解析数据
  const accountJoinedAmounts = useMemo(() => {
    if (!mergedData || accounts.length === 0) return [];

    const result: AccountJoinedAmountInfo[] = [];
    const amountDataEndIndex = accounts.length;

    for (let i = 0; i < accounts.length; i++) {
      const joinedAmount = safeToBigInt(mergedData[i]?.result);
      const joinInfoResult = mergedData[amountDataEndIndex + i]?.result as [bigint, bigint, bigint] | undefined;
      const joinedRound = joinInfoResult ? safeToBigInt(joinInfoResult[0]) : BigInt(0);

      result.push({
        account: accounts[i],
        joinedAmount,
        joinedRound,
      });
    }

    return result;
  }, [mergedData, accounts]);

  // 计算最终的 pending 状态
  // 如果账户列表还在加载中，返回 true
  // 如果账户列表加载完成但为空，返回 false（不需要等待后续查询）
  // 如果账户列表不为空，等待参与数量数据加载完成
  const finalIsPending = useMemo(() => {
    if (isAccountsPending) return true;
    if (accounts.length === 0) return false;
    return isMergedPending;
  }, [isAccountsPending, accounts.length, isMergedPending]);

  return {
    accountJoinedAmounts,
    isPending: finalIsPending,
    error: accountsError || mergedError,
  };
};

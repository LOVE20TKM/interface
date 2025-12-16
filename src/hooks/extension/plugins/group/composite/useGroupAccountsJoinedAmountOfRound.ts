// hooks/extension/plugins/group/composite/useGroupAccountsJoinedAmountOfRound.ts
// 获取某轮某群参与代币的明细

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionGroupActionAbi } from '@/src/abis/LOVE20ExtensionGroupAction';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useAccountsByGroupIdByRound } from './useAccountsByGroupIdByRound';

export interface AccountJoinedAmountInfo {
  account: `0x${string}`;
  joinedAmount: bigint;
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
  const amountsContracts = useMemo(() => {
    if (!extensionAddress || round === undefined || accounts.length === 0) return [];

    const contracts = [];

    for (const account of accounts) {
      contracts.push({
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'amountByAccountByRound',
        args: [account, round],
      });
    }

    return contracts;
  }, [extensionAddress, round, accounts]);

  const {
    data: amountsData,
    isPending: isAmountsPending,
    error: amountsError,
  } = useReadContracts({
    contracts: amountsContracts as any,
    query: {
      enabled: !!extensionAddress && round !== undefined && amountsContracts.length > 0,
    },
  });

  // 解析数据
  const accountJoinedAmounts = useMemo(() => {
    if (!amountsData || accounts.length === 0) return [];

    const result: AccountJoinedAmountInfo[] = [];

    for (let i = 0; i < accounts.length; i++) {
      const joinedAmount = safeToBigInt(amountsData[i]?.result);

      result.push({
        account: accounts[i],
        joinedAmount,
      });
    }

    return result;
  }, [amountsData, accounts]);

  // 计算最终的 pending 状态
  // 如果账户列表还在加载中，返回 true
  // 如果账户列表加载完成但为空，返回 false（不需要等待后续查询）
  // 如果账户列表不为空，等待参与数量数据加载完成
  const finalIsPending = useMemo(() => {
    if (isAccountsPending) return true;
    if (accounts.length === 0) return false;
    return isAmountsPending;
  }, [isAccountsPending, accounts.length, isAmountsPending]);

  return {
    accountJoinedAmounts,
    isPending: finalIsPending,
    error: accountsError || amountsError,
  };
};

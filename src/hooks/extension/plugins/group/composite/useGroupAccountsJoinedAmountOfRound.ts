// hooks/extension/plugins/group/composite/useGroupAccountsJoinedAmountOfRound.ts
// 获取某轮某群参与代币的明细

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionGroupActionAbi } from '@/src/abis/LOVE20ExtensionGroupAction';
import { safeToBigInt } from '@/src/lib/clientUtils';

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
  // 第一步：获取快照账户列表
  const accountsContract = useMemo(() => {
    if (!extensionAddress || round === undefined || groupId === undefined) return [];

    return [
      {
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'snapshotAccountsByGroupId',
        args: [round, groupId],
      },
    ];
  }, [extensionAddress, round, groupId]);

  const {
    data: accountsData,
    isPending: isAccountsPending,
    error: accountsError,
  } = useReadContracts({
    contracts: accountsContract as any,
    query: {
      enabled:
        !!extensionAddress && round !== undefined && groupId !== undefined && accountsContract.length > 0,
    },
  });

  const accounts = useMemo(() => {
    if (!accountsData || !accountsData[0]?.result) return [];
    return accountsData[0].result as `0x${string}`[];
  }, [accountsData]);

  // 第二步：获取每个账户的参与代币数量
  const amountsContracts = useMemo(() => {
    if (!extensionAddress || round === undefined || accounts.length === 0) return [];

    const contracts = [];

    for (const account of accounts) {
      contracts.push({
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'snapshotAmountByAccount',
        args: [round, account],
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

  return {
    accountJoinedAmounts,
    isPending: isAccountsPending || isAmountsPending,
    error: accountsError || amountsError,
  };
};

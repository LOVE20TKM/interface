// hooks/extension/plugins/group/composite/useGroupAccountsRewardOfRound.ts
// 获取某轮某群激励的明细

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionGroupActionAbi } from '@/src/abis/LOVE20ExtensionGroupAction';
import { safeToBigInt } from '@/src/lib/clientUtils';

export interface AccountRewardInfo {
  account: `0x${string}`;
  reward: bigint;
  isMinted: boolean;
}

export interface UseGroupAccountsRewardOfRoundParams {
  extensionAddress: `0x${string}` | undefined;
  round: bigint | undefined;
  groupId: bigint | undefined;
}

export interface UseGroupAccountsRewardOfRoundResult {
  accountRewards: AccountRewardInfo[];
  isPending: boolean;
  error: any;
}

/**
 * Hook: 获取某轮某群激励的明细
 *
 * 算法：
 * 1. 获取某轮的行动者列表
 * 2. 循环每个行动者：获取行动者的激励
 */
export const useGroupAccountsRewardOfRound = ({
  extensionAddress,
  round,
  groupId,
}: UseGroupAccountsRewardOfRoundParams): UseGroupAccountsRewardOfRoundResult => {
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

  // 第二步：获取每个账户的激励
  const rewardsContracts = useMemo(() => {
    if (!extensionAddress || round === undefined || accounts.length === 0) return [];

    const contracts = [];

    for (const account of accounts) {
      contracts.push({
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'rewardByAccount',
        args: [round, account],
      });
    }

    return contracts;
  }, [extensionAddress, round, accounts]);

  const {
    data: rewardsData,
    isPending: isRewardsPending,
    error: rewardsError,
  } = useReadContracts({
    contracts: rewardsContracts as any,
    query: {
      enabled: !!extensionAddress && round !== undefined && rewardsContracts.length > 0,
    },
  });

  // 解析数据
  const accountRewards = useMemo(() => {
    if (!rewardsData || accounts.length === 0) return [];

    const result: AccountRewardInfo[] = [];

    for (let i = 0; i < accounts.length; i++) {
      const rewardData = rewardsData[i]?.result as [bigint, boolean] | undefined;

      if (rewardData) {
        result.push({
          account: accounts[i],
          reward: safeToBigInt(rewardData[0]),
          isMinted: rewardData[1],
        });
      }
    }

    return result;
  }, [rewardsData, accounts]);

  return {
    accountRewards,
    isPending: isAccountsPending || isRewardsPending,
    error: accountsError || rewardsError,
  };
};

// hooks/extension/plugins/group/composite/useGroupAccountsRewardOfRound.ts
// 获取某轮某群激励的明细

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionGroupActionAbi } from '@/src/abis/LOVE20ExtensionGroupAction';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useAccountsByGroupIdByRound } from './useAccountsByGroupIdByRound';

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

  // 计算最终的 pending 状态
  // 如果账户列表还在加载中，返回 true
  // 如果账户列表加载完成但为空，返回 false（不需要等待后续查询）
  // 如果账户列表不为空，等待奖励数据加载完成
  const finalIsPending = useMemo(() => {
    if (isAccountsPending) return true;
    if (accounts.length === 0) return false;
    return isRewardsPending;
  }, [isAccountsPending, accounts.length, isRewardsPending]);

  return {
    accountRewards,
    isPending: finalIsPending,
    error: accountsError || rewardsError,
  };
};

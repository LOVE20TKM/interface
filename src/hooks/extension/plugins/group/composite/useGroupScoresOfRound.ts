// hooks/extension/plugins/group/composite/useGroupScoresOfRound.ts
// 获取某轮某群打分的结果

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionGroupActionAbi } from '@/src/abis/LOVE20ExtensionGroupAction';
import { safeToBigInt } from '@/src/lib/clientUtils';

export interface AccountScoreInfo {
  account: `0x${string}`;
  originScore: bigint;
}

export interface UseGroupScoresOfRoundParams {
  extensionAddress: `0x${string}` | undefined;
  round: bigint | undefined;
  groupId: bigint | undefined;
}

export interface UseGroupScoresOfRoundResult {
  accountScores: AccountScoreInfo[];
  isPending: boolean;
  error: any;
}

/**
 * Hook: 获取某轮某群打分的结果
 *
 * 算法：
 * 1. 获取某轮的行动者列表
 * 2. 循环每个行动者：获取行动者的得分
 */
export const useGroupScoresOfRound = ({
  extensionAddress,
  round,
  groupId,
}: UseGroupScoresOfRoundParams): UseGroupScoresOfRoundResult => {
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

  // 第二步：获取每个账户的原始得分
  const scoresContracts = useMemo(() => {
    if (!extensionAddress || round === undefined || accounts.length === 0) return [];

    const contracts = [];

    for (const account of accounts) {
      contracts.push({
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'originScoreByAccount',
        args: [round, account],
      });
    }

    return contracts;
  }, [extensionAddress, round, accounts]);

  const {
    data: scoresData,
    isPending: isScoresPending,
    error: scoresError,
  } = useReadContracts({
    contracts: scoresContracts as any,
    query: {
      enabled: !!extensionAddress && round !== undefined && scoresContracts.length > 0,
    },
  });

  // 解析数据
  const accountScores = useMemo(() => {
    if (!scoresData || accounts.length === 0) return [];

    const result: AccountScoreInfo[] = [];

    for (let i = 0; i < accounts.length; i++) {
      const originScore = safeToBigInt(scoresData[i]?.result);

      result.push({
        account: accounts[i],
        originScore,
      });
    }

    return result;
  }, [scoresData, accounts]);

  return {
    accountScores,
    isPending: isAccountsPending || isScoresPending,
    error: accountsError || scoresError,
  };
};

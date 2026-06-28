// hooks/extension/plugins/group/composite/useGroupScoresOfRound.ts
// 获取某轮某群打分的结果

import { useMemo } from 'react';
import { useUniversalReadContracts } from '@/src/lib/universalReadContract';
import { GroupVerifyAbi } from '@/src/abis/GroupVerify';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useAccountsByGroupIdByRound } from './useAccountsByGroupIdByRound';

const GROUP_VERIFY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_VERIFY as `0x${string}`;

export interface AccountScoreInfo {
  account: `0x${string}`;
  originScore: bigint;
  finalScore: bigint;
}

export interface UseGroupScoresOfRoundParams {
  extensionAddress: `0x${string}` | undefined;
  round: bigint | undefined;
  groupId: bigint | undefined;
  accounts?: `0x${string}`[];
  includeFinalScore?: boolean;
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
  accounts: providedAccounts,
  includeFinalScore = true,
}: UseGroupScoresOfRoundParams): UseGroupScoresOfRoundResult => {
  // 第一步：获取账户列表（使用 useAccountsByGroupIdByRound hook）
  const {
    accounts: fetchedAccounts,
    isPending: isAccountsPending,
    error: accountsError,
  } = useAccountsByGroupIdByRound({
    extensionAddress: extensionAddress || '0x0',
    groupId: groupId || BigInt(0),
    round: round || BigInt(0),
    enabled: !providedAccounts,
  });

  const accounts = providedAccounts ?? fetchedAccounts;
  const shouldFetchAccounts = !providedAccounts;

  // 第二步：获取每个账户的原始得分和最终得分
  // 新版合约的 originScoreByAccount 和 accountScore 需要 extensionAddress, round, account 参数
  const scoresContracts = useMemo(() => {
    if (!extensionAddress || round === undefined || accounts.length === 0) return [];

    const contracts = [];

    for (const account of accounts) {
      // 获取原始得分
      contracts.push({
        address: GROUP_VERIFY_CONTRACT_ADDRESS,
        abi: GroupVerifyAbi,
        functionName: 'originScoreByAccount',
        args: [extensionAddress, round, account],
      });
      if (includeFinalScore) {
        // 获取最终得分
        contracts.push({
          address: GROUP_VERIFY_CONTRACT_ADDRESS,
          abi: GroupVerifyAbi,
          functionName: 'accountScore',
          args: [extensionAddress, round, account],
        });
      }
    }

    return contracts;
  }, [extensionAddress, round, accounts, includeFinalScore]);

  const {
    data: scoresData,
    isPending: isScoresPending,
    error: scoresError,
  } = useUniversalReadContracts({
    contracts: scoresContracts as any,
    query: {
      enabled: !!extensionAddress && !!round && scoresContracts.length > 0,
    },
  });

  // 解析数据
  const accountScores = useMemo(() => {
    if (!scoresData || accounts.length === 0) return [];

    const result: AccountScoreInfo[] = [];
    const fieldsPerAccount = includeFinalScore ? 2 : 1;

    // 由于每个账户有两个查询（originScoreByAccount 和 scoreByAccount），
    // 所以数据索引是 i * 2 和 i * 2 + 1
    for (let i = 0; i < accounts.length; i++) {
      const baseIndex = i * fieldsPerAccount;
      const originScore = safeToBigInt(scoresData[baseIndex]?.result);
      const finalScore = includeFinalScore ? safeToBigInt(scoresData[baseIndex + 1]?.result) : BigInt(0);

      result.push({
        account: accounts[i],
        originScore,
        finalScore,
      });
    }

    return result;
  }, [scoresData, accounts, includeFinalScore]);

  // 计算最终的 pending 状态
  // 如果账户列表还在加载中，返回 true
  // 如果账户列表加载完成但为空，返回 false（不需要等待后续查询）
  // 如果账户列表不为空，等待分数数据加载完成
  const finalIsPending = useMemo(() => {
    if (shouldFetchAccounts && isAccountsPending) return true;
    if (accounts.length === 0) return false;
    return isScoresPending;
  }, [shouldFetchAccounts, isAccountsPending, accounts.length, isScoresPending]);

  return {
    accountScores,
    isPending: finalIsPending,
    error: (shouldFetchAccounts ? accountsError : null) ?? scoresError,
  };
};

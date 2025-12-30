// hooks/extension/plugins/group/composite/useGroupScoresOfRound.ts
// 获取某轮某群打分的结果

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { GroupVerifyAbi } from '@/src/abis/GroupVerify';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useAccountsByGroupIdByRound } from './useAccountsByGroupIdByRound';

const GROUP_VERIFY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_VERIFY as `0x${string}`;

export interface AccountScoreInfo {
  account: `0x${string}`;
  originScore: bigint;
  finalScore: bigint;
}

export interface UseGroupScoresOfRoundParams {
  extensionAddress: `0x${string}` | undefined;
  tokenAddress: `0x${string}` | undefined;
  actionId: bigint | undefined;
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
  tokenAddress,
  actionId,
  round,
  groupId,
}: UseGroupScoresOfRoundParams): UseGroupScoresOfRoundResult => {
  // 第一步：获取账户列表（使用 useAccountsByGroupIdByRound hook）
  const {
    accounts,
    isPending: isAccountsPending,
    error: accountsError,
  } = useAccountsByGroupIdByRound({
    extensionAddress: extensionAddress || '0x0',
    tokenAddress: tokenAddress || '0x0',
    actionId: actionId || BigInt(0),
    groupId: groupId || BigInt(0),
    round: round || BigInt(0),
  });

  // 第二步：获取每个账户的原始得分和最终得分
  // 新版合约的 originScoreByAccount 和 scoreByAccount 需要 tokenAddress, actionId, round, account 参数
  const scoresContracts = useMemo(() => {
    if (!tokenAddress || actionId === undefined || round === undefined || accounts.length === 0) return [];

    const contracts = [];

    for (const account of accounts) {
      // 获取原始得分
      contracts.push({
        address: GROUP_VERIFY_CONTRACT_ADDRESS,
        abi: GroupVerifyAbi,
        functionName: 'originScoreByAccount',
        args: [tokenAddress, actionId, round, account],
      });
      // 获取最终得分
      contracts.push({
        address: GROUP_VERIFY_CONTRACT_ADDRESS,
        abi: GroupVerifyAbi,
        functionName: 'scoreByAccount',
        args: [tokenAddress, actionId, round, account],
      });
    }

    return contracts;
  }, [tokenAddress, actionId, round, accounts]);

  const {
    data: scoresData,
    isPending: isScoresPending,
    error: scoresError,
  } = useReadContracts({
    contracts: scoresContracts as any,
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined && scoresContracts.length > 0,
    },
  });

  // 解析数据
  const accountScores = useMemo(() => {
    if (!scoresData || accounts.length === 0) return [];

    const result: AccountScoreInfo[] = [];

    // 由于每个账户有两个查询（originScoreByAccount 和 scoreByAccount），
    // 所以数据索引是 i * 2 和 i * 2 + 1
    for (let i = 0; i < accounts.length; i++) {
      const originScore = safeToBigInt(scoresData[i * 2]?.result);
      const finalScore = safeToBigInt(scoresData[i * 2 + 1]?.result);

      result.push({
        account: accounts[i],
        originScore,
        finalScore,
      });
    }

    return result;
  }, [scoresData, accounts]);

  // 计算最终的 pending 状态
  // 如果账户列表还在加载中，返回 true
  // 如果账户列表加载完成但为空，返回 false（不需要等待后续查询）
  // 如果账户列表不为空，等待分数数据加载完成
  const finalIsPending = useMemo(() => {
    if (isAccountsPending) return true;
    if (accounts.length === 0) return false;
    return isScoresPending;
  }, [isAccountsPending, accounts.length, isScoresPending]);

  return {
    accountScores,
    isPending: finalIsPending,
    error: accountsError || scoresError,
  };
};

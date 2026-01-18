// hooks/extension/plugins/group/composite/useGroupAccountsRewardOfRound.ts
// 获取某轮某群激励的明细

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { ExtensionGroupActionAbi } from '@/src/abis/ExtensionGroupAction';
import { GroupJoinAbi } from '@/src/abis/GroupJoin';
import { GroupVerifyAbi } from '@/src/abis/GroupVerify';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useAccountsByGroupIdByRound } from './useAccountsByGroupIdByRound';

const GROUP_VERIFY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_VERIFY as `0x${string}`;
const GROUP_JOIN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_JOIN as `0x${string}`;

export interface AccountRewardRecord {
  account: `0x${string}`;
  reward: bigint;
  isMinted: boolean;
  originScore: bigint;
  finalScore: bigint;
  joinedAmount: bigint;
  joinedRound: bigint;
  trialProvider: `0x${string}` | undefined;
}

export interface UseGroupAccountsRewardOfRoundParams {
  extensionAddress: `0x${string}` | undefined;
  round: bigint | undefined;
  groupId: bigint | undefined;
}

export interface UseGroupAccountsRewardOfRoundResult {
  accountRewardRecords: AccountRewardRecord[];
  isPending: boolean;
  error: any;
}

/**
 * Hook: 获取某轮某群激励的明细
 *
 * 算法：
 * 1. 获取某轮的行动者列表
 * 2. 循环每个行动者：获取激励、得分、加入信息
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

  // 第二步：获取每个账户的激励、得分、加入信息
  const mergedContracts = useMemo(() => {
    if (!extensionAddress || round === undefined || accounts.length === 0) return [];

    const contracts = [];

    for (const account of accounts) {
      // 激励
      contracts.push({
        address: extensionAddress,
        abi: ExtensionGroupActionAbi,
        functionName: 'rewardByAccount',
        args: [round, account],
      });
      // 原始得分
      contracts.push({
        address: GROUP_VERIFY_CONTRACT_ADDRESS,
        abi: GroupVerifyAbi,
        functionName: 'originScoreByAccount',
        args: [extensionAddress, round, account],
      });
      // 最终得分
      contracts.push({
        address: GROUP_VERIFY_CONTRACT_ADDRESS,
        abi: GroupVerifyAbi,
        functionName: 'accountScore',
        args: [extensionAddress, round, account],
      });
      // 参与代币数
      contracts.push({
        address: GROUP_JOIN_CONTRACT_ADDRESS,
        abi: GroupJoinAbi,
        functionName: 'joinedAmountByAccountByRound',
        args: [extensionAddress, round, account],
      });
      // 加入轮次
      contracts.push({
        address: GROUP_JOIN_CONTRACT_ADDRESS,
        abi: GroupJoinAbi,
        functionName: 'joinInfo',
        args: [extensionAddress, account],
      });
    }

    return contracts;
  }, [extensionAddress, round, accounts]);

  const {
    data: mergedData,
    isPending: isMergedPending,
    error: mergedError,
  } = useReadContracts({
    contracts: mergedContracts as any,
    query: {
      enabled: !!extensionAddress && round !== undefined && mergedContracts.length > 0,
    },
  });

  // 解析数据
  const accountRewardRecords = useMemo(() => {
    if (!mergedData || accounts.length === 0) return [];

    const result: AccountRewardRecord[] = [];
    const recordSize = 5;

    for (let i = 0; i < accounts.length; i++) {
      const baseIndex = i * recordSize;
      const rewardData = mergedData[baseIndex]?.result as [bigint, boolean] | undefined;
      const originScoreData = mergedData[baseIndex + 1]?.result;
      const finalScoreData = mergedData[baseIndex + 2]?.result;
      const joinedAmountData = mergedData[baseIndex + 3]?.result;
      const joinInfoResult = mergedData[baseIndex + 4]?.result as [bigint, bigint, bigint, `0x${string}`] | undefined;

      result.push({
        account: accounts[i],
        reward: rewardData ? safeToBigInt(rewardData[0]) : BigInt(0),
        isMinted: rewardData ? rewardData[1] : false,
        originScore: safeToBigInt(originScoreData),
        finalScore: safeToBigInt(finalScoreData),
        joinedAmount: safeToBigInt(joinedAmountData),
        joinedRound: joinInfoResult ? safeToBigInt(joinInfoResult[0]) : BigInt(0),
        trialProvider: joinInfoResult ? (joinInfoResult[3] as unknown as `0x${string}`) : undefined,
      });
    }

    return result;
  }, [mergedData, accounts]);

  // 计算最终的 pending 状态
  // 如果账户列表还在加载中，返回 true
  // 如果账户列表加载完成但为空，返回 false（不需要等待后续查询）
  // 如果账户列表不为空，等待奖励数据加载完成
  const finalIsPending = useMemo(() => {
    if (isAccountsPending) return true;
    if (accounts.length === 0) return false;
    return isMergedPending;
  }, [isAccountsPending, accounts.length, isMergedPending]);

  return {
    accountRewardRecords,
    isPending: finalIsPending,
    error: accountsError || mergedError,
  };
};

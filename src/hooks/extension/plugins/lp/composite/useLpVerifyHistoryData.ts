// hooks/extension/plugins/lp/composite/useLpVerifyHistoryData.ts
// 获取 LP 行动的历史验证激励数据

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { IRewardAbi } from '@/src/abis/IReward';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useAccountsByActionByRound } from '@/src/hooks/extension/base/composite/useAccountsByActionByRound';

export interface LpVerifyHistoryParticipant {
  address: `0x${string}`;
  score: bigint;
  rewardRatio: number;
  reward: bigint;
  isMinted: boolean;
}

export interface UseLpVerifyHistoryDataParams {
  extensionAddress: `0x${string}` | undefined;
  tokenAddress: `0x${string}` | undefined;
  actionId: bigint | undefined;
  round: bigint | undefined;
}

export interface UseLpVerifyHistoryDataResult {
  participants: LpVerifyHistoryParticipant[];
  totalScore: bigint;
  isEmpty: boolean;
  isPending: boolean;
  error: any;
}

/**
 * Hook: 获取 LP 行动的历史验证激励数据
 *
 * 功能：
 * 1. 获取指定轮次的已验证账户列表
 * 2. 获取每个账户的激励金额
 * 3. 用于"激励公示"标签，显示指定轮次的激励分配结果
 *
 * @param extensionAddress LP 扩展合约地址
 * @param tokenAddress Token 地址
 * @param actionId Action ID
 * @param round 轮次
 * @returns 历史验证数据、加载状态和错误信息
 */
export const useLpVerifyHistoryData = ({
  extensionAddress,
  tokenAddress,
  actionId,
  round,
}: UseLpVerifyHistoryDataParams): UseLpVerifyHistoryDataResult => {
  // ==========================================
  // 步骤 1: 获取账户列表（使用 useAccountsByActionByRound）
  // ==========================================
  const {
    accounts: accountsByRound,
    isPending: isPendingAccounts,
    error: errorAccounts,
  } = useAccountsByActionByRound({
    tokenAddress,
    actionId,
    round,
  });

  // ==========================================
  // 步骤 2: 为每个账户获取实际激励金额
  // ==========================================
  const rewardContracts = useMemo(() => {
    if (!extensionAddress || round === undefined || accountsByRound.length === 0) return [];

    return accountsByRound.map((account) => ({
      address: extensionAddress,
      abi: IRewardAbi,
      functionName: 'rewardByAccount',
      args: [round, account],
    }));
  }, [extensionAddress, round, accountsByRound]);

  const {
    data: rewardData,
    isPending: isPendingRewards,
    error: errorRewards,
  } = useReadContracts({
    contracts: rewardContracts as any,
    query: {
      enabled: rewardContracts.length > 0,
    },
  });

  // ==========================================
  // 步骤 3: 解析和整合数据
  // ==========================================
  const result = useMemo(() => {
    // 如果没有账户数据，返回空
    if (accountsByRound.length === 0) {
      return {
        participants: [] as LpVerifyHistoryParticipant[],
        totalScore: BigInt(0),
        isEmpty: true,
      };
    }

    // 组合数据
    const participants: LpVerifyHistoryParticipant[] = accountsByRound.map((address, index) => {
      // 获取实际激励金额
      let reward = BigInt(0);
      let isMinted = false;
      if (rewardData && rewardData[index]?.result) {
        const rewardResult = rewardData[index].result as [bigint, boolean];
        reward = safeToBigInt(rewardResult[0]);
        isMinted = rewardResult[1];
      }

      return {
        address,
        score: BigInt(0), // 已废弃，设为默认值
        rewardRatio: 0, // 已废弃，设为默认值
        reward,
        isMinted,
      };
    });

    return {
      participants,
      totalScore: BigInt(0), // 已废弃，设为默认值
      isEmpty: false,
    };
  }, [accountsByRound, rewardData]);

  return {
    ...result,
    isPending: accountsByRound.length === 0 ? isPendingAccounts : isPendingAccounts || isPendingRewards,
    error: errorAccounts || errorRewards,
  };
};

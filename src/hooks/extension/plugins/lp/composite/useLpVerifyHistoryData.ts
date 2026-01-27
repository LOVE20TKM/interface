// hooks/extension/plugins/lp/composite/useLpVerifyHistoryData.ts
// 获取 LP 行动的历史验证激励数据

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { ExtensionLpAbi } from '@/src/abis/ExtensionLp';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useAccountsByActionByRound } from '@/src/hooks/extension/base/composite/useAccountsByActionByRound';

export interface LpVerifyHistoryParticipant {
  address: `0x${string}`;
  reward: bigint; // mintReward
  burnReward: bigint;
  isMinted: boolean; // isClaimed
}

export interface UseLpVerifyHistoryDataParams {
  extensionAddress: `0x${string}` | undefined;
  tokenAddress: `0x${string}` | undefined;
  actionId: bigint | undefined;
  round: bigint | undefined;
}

export interface UseLpVerifyHistoryDataResult {
  participants: LpVerifyHistoryParticipant[];
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
      abi: ExtensionLpAbi,
      functionName: 'rewardInfoByAccount',
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
        isEmpty: true,
      };
    }

    // 组合数据
    const participants: LpVerifyHistoryParticipant[] = accountsByRound.map((address, index) => {
      // 获取实际激励金额
      let reward = BigInt(0); // mintReward
      let burnReward = BigInt(0);
      let isMinted = false; // isClaimed
      if (rewardData && rewardData[index]?.result) {
        const rewardResult = rewardData[index].result as [bigint, bigint, boolean];
        reward = safeToBigInt(rewardResult[0]); // mintReward
        // 忽略很小的 burnReward 值（小于 1e11 时认为是 0，避免精度误差）
        const rawBurnReward = safeToBigInt(rewardResult[1]); // burnReward
        burnReward = rawBurnReward < BigInt(1e11) ? BigInt(0) : rawBurnReward;
        isMinted = rewardResult[2]; // isClaimed
      }

      return {
        address,
        reward,
        burnReward,
        isMinted,
      };
    });

    return {
      participants,
      isEmpty: false,
    };
  }, [accountsByRound, rewardData]);

  return {
    ...result,
    isPending: accountsByRound.length === 0 ? isPendingAccounts : isPendingAccounts || isPendingRewards,
    error: errorAccounts || errorRewards,
  };
};

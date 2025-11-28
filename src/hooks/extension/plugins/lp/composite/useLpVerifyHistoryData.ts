// hooks/extension/plugins/lp/composite/useLpVerifyHistoryData.ts
// 获取 LP 行动的历史验证激励数据

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionLpAbi } from '@/src/abis/LOVE20ExtensionLp';
import { safeToBigInt } from '@/src/lib/clientUtils';

export interface LpVerifyHistoryParticipant {
  address: `0x${string}`;
  score: bigint;
  rewardRatio: number;
  reward: bigint;
  isMinted: boolean;
}

export interface UseLpVerifyHistoryDataParams {
  extensionAddress: `0x${string}` | undefined;
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
 * 2. 获取每个账户的得分和激励占比
 * 3. 用于"激励公示"标签，显示指定轮次的激励分配结果
 *
 * @param extensionAddress LP 扩展合约地址
 * @param round 轮次
 * @returns 历史验证数据、加载状态和错误信息
 */
export const useLpVerifyHistoryData = ({
  extensionAddress,
  round,
}: UseLpVerifyHistoryDataParams): UseLpVerifyHistoryDataResult => {
  // ==========================================
  // 步骤 1: 获取基础数据（账户列表、得分、总得分）
  // ==========================================
  const baseContracts = useMemo(() => {
    if (!extensionAddress || round === undefined) return [];

    return [
      // 获取指定轮次的账户列表
      {
        address: extensionAddress,
        abi: LOVE20ExtensionLpAbi,
        functionName: 'accountsByRound',
        args: [round],
      },
      // 获取所有得分
      {
        address: extensionAddress,
        abi: LOVE20ExtensionLpAbi,
        functionName: 'scores',
        args: [round],
      },
      // 获取总得分
      {
        address: extensionAddress,
        abi: LOVE20ExtensionLpAbi,
        functionName: 'totalScore',
        args: [round],
      },
    ];
  }, [extensionAddress, round]);

  const {
    data: baseData,
    isPending: isPendingBase,
    error: errorBase,
  } = useReadContracts({
    contracts: baseContracts as any,
    query: {
      enabled: !!extensionAddress && round !== undefined && baseContracts.length > 0,
    },
  });

  // 解析基础数据，获取账户列表
  const accountsByRound = useMemo(() => {
    if (!baseData || baseData.length < 1) return [];
    return (baseData[0]?.result as `0x${string}`[]) || [];
  }, [baseData]);

  // ==========================================
  // 步骤 2: 为每个账户获取实际激励金额
  // ==========================================
  const rewardContracts = useMemo(() => {
    if (!extensionAddress || round === undefined || accountsByRound.length === 0) return [];

    return accountsByRound.map((account) => ({
      address: extensionAddress,
      abi: LOVE20ExtensionLpAbi,
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
    if (!baseData || baseData.length < 3) {
      return {
        participants: [] as LpVerifyHistoryParticipant[],
        totalScore: BigInt(0),
        isEmpty: false,
      };
    }

    const accounts = (baseData[0]?.result as `0x${string}`[]) || [];
    const scores = (baseData[1]?.result as bigint[]) || [];
    const totalScore = safeToBigInt(baseData[2]?.result) || BigInt(0);

    // 如果没有数据，返回空
    if (accounts.length === 0) {
      return {
        participants: [] as LpVerifyHistoryParticipant[],
        totalScore: BigInt(0),
        isEmpty: true,
      };
    }

    // 组合数据并计算比例
    const participants: LpVerifyHistoryParticipant[] = accounts.map((address, index) => {
      const score = scores[index] || BigInt(0);
      const rewardRatio = totalScore > BigInt(0) ? Number(score) / Number(totalScore) : 0;

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
        score,
        rewardRatio,
        reward,
        isMinted,
      };
    });

    return {
      participants,
      totalScore,
      isEmpty: false,
    };
  }, [baseData, rewardData]);

  return {
    ...result,
    isPending: isPendingBase || isPendingRewards,
    error: errorBase || errorRewards,
  };
};

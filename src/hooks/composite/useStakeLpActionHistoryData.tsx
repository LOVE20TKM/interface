// hooks/composite/useStakeLpActionHistoryData.tsx
// 获取质押LP行动的历史数据（激励公示标签）

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionStakeLpAbi } from '@/src/abis/LOVE20ExtensionStakeLp';
import { safeToBigInt } from '@/src/lib/clientUtils';

export interface StakeLpHistoryParticipant {
  address: `0x${string}`;
  score: bigint;
  rewardRatio: number;
}

export interface UseStakeLpActionHistoryDataParams {
  extensionAddress: `0x${string}` | undefined;
  round: bigint | undefined;
}

export interface UseStakeLpActionHistoryDataResult {
  participants: StakeLpHistoryParticipant[];
  totalScore: bigint;
  isEmpty: boolean;
  isPending: boolean;
  error: any;
}

/**
 * Hook: 获取质押LP行动的历史激励数据
 *
 * 用于"激励公示"标签，显示指定轮次的激励分配结果
 */
export const useStakeLpActionHistoryData = ({
  extensionAddress,
  round,
}: UseStakeLpActionHistoryDataParams): UseStakeLpActionHistoryDataResult => {
  // ==========================================
  // 步骤 1: 批量获取历史数据
  // ==========================================
  const contracts = useMemo(() => {
    if (!extensionAddress || round === undefined) return [];

    return [
      // 获取已验证账户列表
      {
        address: extensionAddress,
        abi: LOVE20ExtensionStakeLpAbi,
        functionName: 'verifiedAccounts',
        args: [round],
      },
      // 获取所有得分
      {
        address: extensionAddress,
        abi: LOVE20ExtensionStakeLpAbi,
        functionName: 'scores',
        args: [round],
      },
      // 获取总得分
      {
        address: extensionAddress,
        abi: LOVE20ExtensionStakeLpAbi,
        functionName: 'totalScore',
        args: [round],
      },
    ];
  }, [extensionAddress, round]);

  const { data, isPending, error } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: !!extensionAddress && round !== undefined && contracts.length > 0,
    },
  });

  // ==========================================
  // 步骤 2: 解析和计算数据
  // ==========================================
  const result = useMemo(() => {
    if (!data || data.length < 3) {
      return {
        participants: [] as StakeLpHistoryParticipant[],
        totalScore: BigInt(0),
        isEmpty: false,
      };
    }

    const verifiedAccounts = (data[0]?.result as `0x${string}`[]) || [];
    const scores = (data[1]?.result as bigint[]) || [];
    const totalScore = safeToBigInt(data[2]?.result) || BigInt(0);

    // 如果没有数据，返回空
    if (verifiedAccounts.length === 0) {
      return {
        participants: [] as StakeLpHistoryParticipant[],
        totalScore: BigInt(0),
        isEmpty: true,
      };
    }

    // 组合数据并计算比例
    const participants: StakeLpHistoryParticipant[] = verifiedAccounts.map((address, index) => {
      const score = scores[index] || BigInt(0);
      const rewardRatio = totalScore > BigInt(0) ? Number(score) / Number(totalScore) : 0;

      return {
        address,
        score,
        rewardRatio,
      };
    });

    return {
      participants,
      totalScore,
      isEmpty: false,
    };
  }, [data]);

  return {
    ...result,
    isPending,
    error,
  };
};

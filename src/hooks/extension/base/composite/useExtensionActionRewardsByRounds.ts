/**
 * Hook: 获得 1个扩展行动在指定轮次范围内的激励数据
 *
 * 功能：
 * 1. 查询指定扩展行动在指定轮次范围内的激励数据
 * 2. 使用 IExtensionAbi 标准接口（所有扩展都实现该接口）
 * 3. 批量查询优化性能
 *
 * 使用示例：
 * ```typescript
 * const { rewards, isPending, error } = useExtensionActionRewardsByRounds({
 *   extensionAddress: '0x...',
 *   startRound: 1n,
 *   endRound: 10n,
 *   enabled: true,
 * });
 * ```
 */

import { useMemo } from 'react';
import { useAccount, useReadContracts } from 'wagmi';
import { IExtensionAbi } from '@/src/abis/IExtension';
import { safeToBigInt } from '@/src/lib/clientUtils';

/**
 * 扩展激励数据结构
 */
export interface ExtensionActionReward {
  round: bigint;
  reward: bigint;
  isMinted: boolean;
}

/**
 * Hook 参数
 */
export interface UseExtensionActionRewardsByRoundsParams {
  extensionAddress: `0x${string}` | undefined;
  startRound: bigint;
  endRound: bigint;
  enabled: boolean;
}

/**
 * Hook 返回值
 */
export interface UseExtensionActionRewardsByRoundsResult {
  /** 激励数据列表（按轮次倒序） */
  rewards: ExtensionActionReward[];
  /** 加载状态 */
  isPending: boolean;
  /** 错误信息 */
  error: any;
  /** 手动刷新函数 */
  refetch: () => void;
}

/**
 * 获取扩展行动在指定轮次范围内的激励数据
 *
 * @param extensionAddress 扩展合约地址
 * @param startRound 起始轮次
 * @param endRound 结束轮次
 * @param enabled 是否启用查询
 * @returns 激励数据列表、加载状态和错误信息
 */
export const useExtensionActionRewardsByRounds = ({
  extensionAddress,
  startRound,
  endRound,
  enabled,
}: UseExtensionActionRewardsByRoundsParams): UseExtensionActionRewardsByRoundsResult => {
  const { address: account } = useAccount();

  // 构建批量查询合约列表
  const contracts = useMemo(() => {
    if (!extensionAddress || !account || !enabled || endRound < startRound) {
      return [];
    }

    const calls: any[] = [];

    // 为每一轮创建查询
    for (let round = startRound; round <= endRound; round++) {
      calls.push({
        address: extensionAddress,
        abi: IExtensionAbi,
        functionName: 'rewardByAccount',
        args: [round, account],
      });
    }

    return calls;
  }, [extensionAddress, account, enabled, startRound, endRound]);

  // 批量查询激励数据
  const {
    data: rewardsData,
    isPending,
    error,
    refetch,
  } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: contracts.length > 0,
    },
  });

  // 解析查询结果
  const rewards = useMemo(() => {
    if (!rewardsData || rewardsData.length === 0) {
      return [];
    }

    const result: ExtensionActionReward[] = [];

    // rewardByAccount 返回 (reward, isMinted)
    for (let i = 0; i < rewardsData.length; i++) {
      const roundData = rewardsData[i];
      if (!roundData?.result) continue;

      const [reward, isMinted] = roundData.result as [bigint, boolean];
      const round = startRound + BigInt(i);

      result.push({
        round,
        reward: safeToBigInt(reward),
        isMinted: isMinted as boolean,
      });
    }

    // 按轮次倒序排序
    return result.sort((a, b) => (a.round > b.round ? -1 : 1));
  }, [rewardsData, startRound]);

  // 当查询被禁用时（contracts 为空），不应该 pending
  const finalIsPending = contracts.length > 0 ? isPending : false;

  return {
    rewards,
    isPending: finalIsPending,
    error,
    refetch: refetch || (() => {}),
  };
};

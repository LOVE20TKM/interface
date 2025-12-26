/**
 * Hook：获得多个扩展行动的最近 N 轮激励数据
 *
 * 功能：
 * 1. 根据扩展地址数组获取最近 N 轮的激励数据
 * 2. 使用 useReadContracts 批量调用 rewardByAccount
 * 3. 返回按扩展地址分组的激励铸造情况
 *
 * 使用示例：
 * ```typescript
 * const { rewardsMap, isPending, error } = useExtensionActionsLatestRewards({
 *   extensionAddresses: ['0x...', '0x...'],
 *   lastRounds: 10n,
 *   account: '0x...',
 * });
 * ```
 */

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { ILOVE20ExtensionAbi } from '@/src/abis/ILOVE20Extension';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useCurrentRound } from '@/src/hooks/contracts/useLOVE20Verify';

/**
 * 扩展激励数据结构（包含扩展地址）
 */
export interface ExtensionActionRewardWithAddress {
  extensionAddress: `0x${string}`;
  round: bigint;
  reward: bigint;
  isMinted: boolean;
}

/**
 * Hook 参数
 */
export interface UseExtensionActionsLatestRewardsParams {
  /** 扩展合约地址列表 */
  extensionAddresses: `0x${string}`[];
  /** 获取最近多少轮的数据 */
  lastRounds: bigint;
  /** 用户地址 */
  account: `0x${string}` | undefined;
}

/**
 * Hook 返回值
 */
export interface UseExtensionActionsLatestRewardsResult {
  /** 按扩展地址分组的激励数据 Map */
  rewardsMap: Map<`0x${string}`, ExtensionActionRewardWithAddress[]>;
  /** 加载状态 */
  isPending: boolean;
  /** 错误信息 */
  error: any;
}

/**
 * 批量获取扩展行动的激励数据
 *
 * @param extensionAddresses 扩展合约地址列表
 * @param lastRounds 查询最近多少轮
 * @param account 用户地址
 * @returns 按扩展地址分组的激励数据
 */
export const useExtensionActionsLatestRewards = ({
  extensionAddresses,
  lastRounds,
  account,
}: UseExtensionActionsLatestRewardsParams): UseExtensionActionsLatestRewardsResult => {
  // 步骤1: 获取当前轮次
  const { currentRound, isPending: isPendingCurrentRound, error: errorCurrentRound } = useCurrentRound();

  // 步骤2: 构建批量查询合约列表
  // 为每个扩展地址查询最近 lastRounds 轮的激励
  const rewardContracts = useMemo(() => {
    if (!account || !currentRound || currentRound <= BigInt(1) || extensionAddresses.length === 0) {
      return [];
    }

    const endRound = currentRound - BigInt(1); //当前验证轮的上一轮
    const contracts: any[] = [];

    for (const extensionAddress of extensionAddresses) {
      // 计算起始轮次
      const startRound = endRound > lastRounds ? endRound - lastRounds + BigInt(1) : BigInt(1);

      // 为每一轮创建查询
      for (let round = startRound; round <= endRound; round++) {
        contracts.push({
          address: extensionAddress,
          abi: ILOVE20ExtensionAbi,
          functionName: 'rewardByAccount',
          args: [round, account],
        });
      }
    }

    return contracts;
  }, [account, currentRound, extensionAddresses, lastRounds]);

  // 步骤3: 批量查询激励数据
  const {
    data: rewardsData,
    isPending: isPendingRewards,
    error: errorRewards,
  } = useReadContracts({
    contracts: rewardContracts as any,
    query: {
      enabled: rewardContracts.length > 0,
    },
  });

  // 步骤4: 解析数据并按扩展地址分组
  const rewardsMap = useMemo(() => {
    const map = new Map<`0x${string}`, ExtensionActionRewardWithAddress[]>();

    if (!rewardsData || !currentRound || currentRound === BigInt(0)) {
      return map;
    }

    let dataIndex = 0;
    for (const extensionAddress of extensionAddresses) {
      const rewards: ExtensionActionRewardWithAddress[] = [];

      // 计算起始轮次
      const startRound = currentRound > lastRounds ? currentRound - lastRounds + BigInt(1) : BigInt(1);
      const roundsCount = Number(currentRound - startRound + BigInt(1));

      // 解析该扩展地址的所有轮次数据
      for (let i = 0; i < roundsCount; i++) {
        const result = rewardsData[dataIndex + i];
        if (!result?.result) continue;

        const [reward, isMinted] = result.result as [bigint, boolean];
        const round = startRound + BigInt(i);

        // 只保存有激励的轮次
        if (reward > BigInt(0)) {
          rewards.push({
            extensionAddress,
            round,
            reward: safeToBigInt(reward),
            isMinted: isMinted as boolean,
          });
        }
      }

      // 按轮次倒序排序
      if (rewards.length > 0) {
        rewards.sort((a, b) => (a.round > b.round ? -1 : 1));
      }

      map.set(extensionAddress, rewards);
      dataIndex += roundsCount;
    }

    return map;
  }, [rewardsData, extensionAddresses, currentRound, lastRounds]);

  // 如果没有扩展地址或没有账户，不需要加载任何数据，直接返回空结果
  const hasExtensions = extensionAddresses.length > 0 && !!account;
  const isPending = hasExtensions ? isPendingCurrentRound || isPendingRewards : false;
  const error = errorCurrentRound || errorRewards;

  return {
    rewardsMap,
    isPending,
    error,
  };
};

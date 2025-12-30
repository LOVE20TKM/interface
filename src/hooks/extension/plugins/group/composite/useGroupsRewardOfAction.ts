/**
 * 获取一个行动下所有链群的激励信息
 *
 * 职责：
 * - 获取行动的所有活跃链群 IDs
 * - 批量获取链群名称（带缓存优化）
 * - 批量获取每个链群在指定轮次的激励金额
 *
 * 使用示例：
 * ```typescript
 * const { groupRewards, isPending, error } = useGroupsRewardOfAction({
 *   tokenAddress: '0x123...',
 *   actionId: BigInt(1),
 *   round: BigInt(5),
 *   extensionAddress: '0xabc...',
 * });
 *
 * if (!isPending) {
 *   groupRewards.forEach(({ groupId, groupName, reward }) => {
 *     console.log(`链群 ${groupName} (${groupId}): ${reward} 代币`);
 *   });
 * }
 * ```
 */

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { useActiveGroupIds } from '@/src/hooks/extension/plugins/group/contracts/useGroupManager';
import { useGroupNamesWithCache } from '@/src/hooks/extension/base/composite/useGroupNamesWithCache';
import { ExtensionGroupActionAbi } from '@/src/abis/ExtensionGroupAction';
import { safeToBigInt } from '@/src/lib/clientUtils';

// ==================== 类型定义 ====================

/**
 * 链群激励信息
 */
export interface GroupRewardInfo {
  /** 链群 ID (tokenId) */
  groupId: bigint;
  /** 链群名称 */
  groupName: string | undefined;
  /** 激励代币数量 */
  reward: bigint | undefined;
}

/**
 * Hook 参数
 */
export interface UseGroupsRewardOfActionParams {
  /** 代币地址 */
  tokenAddress: `0x${string}` | undefined;
  /** 行动 ID */
  actionId: bigint | undefined;
  /** 轮次 */
  round: bigint | undefined;
  /** 扩展合约地址（必填） */
  extensionAddress: `0x${string}` | undefined;
}

/**
 * Hook 返回值
 */
export interface UseGroupsRewardOfActionResult {
  /** 链群激励列表 */
  groupRewards: GroupRewardInfo[];
  /** 加载状态 */
  isPending: boolean;
  /** 错误信息 */
  error: any;
}

// ==================== Hook 实现 ====================

/**
 * 获取一个行动下所有链群的激励信息
 *
 * @param params - Hook 参数
 * @returns 链群激励列表及加载状态
 *
 * @description
 * 分四步获取链群激励信息：
 * 1. 调用 activeGroupIds(tokenAddress, actionId) 获取所有活跃链群 IDs
 * 2. 使用 useGroupNamesWithCache 批量获取链群名称（带缓存）
 * 3. 使用 useReadContracts 批量调用 generatedRewardByGroupId(round, groupId) 获取每个链群的激励
 * 4. 组合链群 ID、名称和激励，返回完整列表
 *
 * @example
 * ```typescript
 * // 获取第5轮、行动1下所有链群的激励
 * const { groupRewards, isPending } = useGroupsRewardOfAction({
 *   tokenAddress: '0x123...',
 *   actionId: BigInt(1),
 *   round: BigInt(5),
 *   extensionAddress: '0xabc...',
 * });
 *
 * if (!isPending && groupRewards) {
 *   console.log('链群激励列表:', groupRewards);
 *   groupRewards.forEach(({ groupId, groupName, reward }) => {
 *     console.log(`链群 ${groupName} (${groupId}): ${reward} 代币`);
 *   });
 * }
 * ```
 */
export function useGroupsRewardOfAction(
  params: UseGroupsRewardOfActionParams,
): UseGroupsRewardOfActionResult {
  const { tokenAddress, actionId, round, extensionAddress } = params;

  // 第一步：获取所有活跃链群 IDs
  const {
    activeGroupIds,
    isPending: isPendingIds,
    error: errorIds,
  } = useActiveGroupIds(tokenAddress || ('0x0' as `0x${string}`), actionId || BigInt(0));

  // 转换为数组，如果没有数据则返回空数组
  const groupIds = useMemo(() => activeGroupIds || [], [activeGroupIds]);

  // 第二步：批量获取链群名称（带缓存）
  const {
    groupNameMap,
    isPending: isPendingNames,
    error: errorNames,
  } = useGroupNamesWithCache({
    groupIds,
    enabled: groupIds.length > 0,
  });

  // 第三步：构建批量查询链群激励的合约调用
  const rewardsContracts = useMemo(() => {
    // 如果缺少必要参数或没有链群，返回空数组
    if (!extensionAddress || round === undefined || groupIds.length === 0) return [];

    return groupIds.map((groupId) => ({
      address: extensionAddress,
      abi: ExtensionGroupActionAbi,
      functionName: 'generatedRewardByGroupId' as const,
      args: [round, groupId],
    }));
  }, [extensionAddress, round, groupIds]);

  // 第四步：批量获取链群激励
  const {
    data: rewardsData,
    isPending: isPendingRewards,
    error: errorRewards,
  } = useReadContracts({
    contracts: rewardsContracts as any,
    query: {
      enabled: !!extensionAddress && round !== undefined && rewardsContracts.length > 0,
    },
  });

  // 第五步：组合最终数据
  const groupRewards = useMemo(() => {
    // 如果没有链群数据，返回空数组
    if (groupIds.length === 0) return [];

    // 如果激励数据还未加载完成，返回空数组
    if (!rewardsData) return [];

    // 组合链群 ID、名称和激励
    return groupIds.map((groupId, index) => ({
      groupId,
      groupName: groupNameMap.get(groupId),
      reward: safeToBigInt(rewardsData[index]?.result),
    }));
  }, [groupIds, groupNameMap, rewardsData]);

  // 计算最终的 loading 状态
  // 使用智能 loading 状态：如果前一阶段返回空数据，立即返回 false
  const isPending = useMemo(() => {
    // 第一阶段：获取链群 IDs
    if (isPendingIds) return true;
    if (groupIds.length === 0) return false; // 没有链群，提前退出

    // 第二阶段：获取链群名称
    if (isPendingNames) return true;

    // 如果没有 extensionAddress 或 round，提前退出
    if (!extensionAddress || round === undefined) return false;

    // 第三阶段：获取激励
    return isPendingRewards;
  }, [isPendingIds, groupIds.length, isPendingNames, extensionAddress, round, isPendingRewards]);

  return {
    groupRewards,
    isPending,
    error: errorIds || errorNames || errorRewards,
  };
}

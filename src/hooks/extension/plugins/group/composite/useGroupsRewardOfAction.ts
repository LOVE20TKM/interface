/**
 * 获取一个行动下所有链群的激励信息
 *
 * 职责：
 * - 获取行动的所有活跃链群 IDs
 * - 批量获取链群名称（带缓存优化）
 * - 批量获取每个链群在指定轮次的激励金额和参与代币量（合并为一次合约调用）
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
 *   groupRewards.forEach(({ groupId, groupName, reward, joinedAmount }) => {
 *     console.log(`链群 ${groupName} (${groupId}): ${reward} 代币, 参与 ${joinedAmount} 代币`);
 *   });
 * }
 * ```
 */

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { useActiveGroupIds } from '@/src/hooks/extension/plugins/group/contracts/useGroupManager';
import { useGroupNamesWithCache } from '@/src/hooks/extension/base/composite/useGroupNamesWithCache';
import { ExtensionGroupActionAbi } from '@/src/abis/ExtensionGroupAction';
import { GroupJoinAbi } from '@/src/abis/GroupJoin';
import { safeToBigInt } from '@/src/lib/clientUtils';

const GROUP_JOIN_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_JOIN as `0x${string}`;

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
  /** 链群铸造代币数量（与 generatedRewardByGroupId 接口保持一致） */
  generatedReward?: bigint;
  /** 参与代币数量 */
  joinedAmount?: bigint;
  /** 不信任投票数 */
  distrustVotes?: bigint;
  /** 不信任率 */
  distrustRatio?: number;
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
 * 3. 使用 useReadContracts 批量调用 generatedRewardByGroupId 和 totalJoinedAmountByGroupIdByRound（合并为一次调用）
 * 4. 组合链群 ID、名称、激励和参与代币量，返回完整列表
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
export function useGroupsRewardOfAction(params: UseGroupsRewardOfActionParams): UseGroupsRewardOfActionResult {
  const { tokenAddress, actionId, round, extensionAddress } = params;

  // 第一步：获取所有活跃链群 IDs
  const {
    activeGroupIds,
    isPending: isPendingIds,
    error: errorIds,
  } = useActiveGroupIds(extensionAddress || ('0x0' as `0x${string}`));

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

  // 第三步：构建批量查询链群激励和参与代币量的合约调用（合并为一次调用）
  const allContracts = useMemo(() => {
    // 如果缺少必要参数或没有链群，返回空数组
    if (!extensionAddress || !tokenAddress || round === undefined || groupIds.length === 0) return [];

    const contracts = [];
    // 为每个链群添加两个合约调用：激励和参与代币量
    for (const groupId of groupIds) {
      // 获取链群激励
      contracts.push({
        address: extensionAddress,
        abi: ExtensionGroupActionAbi,
        functionName: 'generatedRewardByGroupId' as const,
        args: [round, groupId],
      });
      // 获取链群参与代币量
      contracts.push({
        address: GROUP_JOIN_ADDRESS,
        abi: GroupJoinAbi,
        functionName: 'totalJoinedAmountByGroupIdByRound' as const,
        args: [tokenAddress, actionId || BigInt(0), groupId, round],
      });
    }

    return contracts;
  }, [extensionAddress, tokenAddress, actionId, round, groupIds]);

  // 第四步：批量获取链群激励和参与代币量（合并为一次调用）
  const {
    data: allData,
    isPending: isPendingAll,
    error: errorAll,
  } = useReadContracts({
    contracts: allContracts as any,
    query: {
      enabled: !!extensionAddress && !!tokenAddress && round !== undefined && allContracts.length > 0,
    },
  });

  // 第五步：组合最终数据
  const groupRewards = useMemo(() => {
    // 如果没有链群数据，返回空数组
    if (groupIds.length === 0) return [];

    // 如果数据还未加载完成，返回空数组
    if (!allData) return [];

    // 组合链群 ID、名称、激励和参与代币量
    // 每个链群对应两个数据：索引 2*index 是激励，索引 2*index+1 是参与代币量
    return groupIds.map((groupId, index) => {
      const rewardIndex = index * 2;
      const joinedAmountIndex = index * 2 + 1;
      const reward = safeToBigInt(allData[rewardIndex]?.result);
      const joinedAmount = allData[joinedAmountIndex]?.result
        ? safeToBigInt(allData[joinedAmountIndex].result)
        : undefined;
      return {
        groupId,
        groupName: groupNameMap.get(groupId),
        reward,
        generatedReward: reward, // 与 generatedRewardByGroupId 接口保持一致
        joinedAmount,
      };
    });
  }, [groupIds, groupNameMap, allData]);

  // 计算最终的 loading 状态
  // 使用智能 loading 状态：如果前一阶段返回空数据，立即返回 false
  const isPending = useMemo(() => {
    // 第一阶段：获取链群 IDs
    if (isPendingIds) return true;
    if (groupIds.length === 0) return false; // 没有链群，提前退出

    // 第二阶段：获取链群名称
    if (isPendingNames) return true;

    // 如果没有 extensionAddress、tokenAddress 或 round，提前退出
    if (!extensionAddress || !tokenAddress || round === undefined) return false;

    // 第三阶段：获取激励和参与代币量
    return isPendingAll;
  }, [isPendingIds, groupIds.length, isPendingNames, extensionAddress, tokenAddress, round, isPendingAll]);

  return {
    groupRewards,
    isPending,
    error: errorIds || errorNames || errorAll,
  };
}

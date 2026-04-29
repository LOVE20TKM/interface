/**
 * 获取服务者的所有行动和链群信息 Hook
 *
 * 功能：
 * 1. 使用 useActionIdsWithActiveGroupIdsByOwner 获取行动ID和链群ID列表（使用传入的代币地址）
 * 2. 使用 useActionBaseInfosByIdsWithCache 批量获取行动信息
 * 3. 使用 useGroupNamesWithCache 批量获取链群名称
 * 4. 使用 GroupJoin 批量获取链群参与代币量和参与地址数
 * 5. 组合并返回结构化数据
 *
 * 使用示例：
 * ```typescript
 * const { actionsWithGroups, isPending, error } = useActionsWithActiveGroupsByOwner({
 *   groupActionTokenAddress: '0x...',
 *   account: '0x...'
 * });
 * ```
 */

import { useMemo } from 'react';
import { useUniversalReadContracts } from '@/src/lib/universalReadContract';
import { GroupJoinAbi } from '@/src/abis/GroupJoin';
import { useActionIdsWithActiveGroupIdsByOwner } from './useActionIdsWithActiveGroupIdsByOwner';
import { useActionBaseInfosByIdsWithCache } from '@/src/hooks/composite/useActionBaseInfosByIdsWithCache';
import { useGroupNamesWithCache } from '@/src/hooks/extension/base/composite/useGroupNamesWithCache';
import { useExtensionsByActionIdsWithCache } from '@/src/hooks/extension/base/composite/useExtensionsByActionIdsWithCache';
import { safeToBigInt } from '@/src/lib/clientUtils';

// ==================== 常量定义 ====================

const GROUP_JOIN_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_JOIN as `0x${string}`;

// ==================== 类型定义 ====================

/**
 * 链群信息（包含代币参与量）
 */
export interface GroupWithAmount {
  /** 链群ID */
  groupId: bigint;
  /** 链群名称 */
  groupName: string | undefined;
  /** 链群的代币参与量 */
  totalJoinedAmount: bigint;
  /** 链群的参与地址数 */
  accountCount: bigint;
}

/**
 * 行动信息（包含链群列表）
 */
export interface ActionWithGroups {
  /** 行动ID */
  actionId: bigint;
  /** 行动标题 */
  actionTitle: string;
  /** 扩展地址 */
  extensionAddress: `0x${string}`;
  /** 该行动下的链群列表 */
  groups: GroupWithAmount[];
}

/**
 * Hook 参数
 */
export interface UseActionsWithActiveGroupsByOwnerParams {
  /** 链群行动所在代币地址 */
  groupActionTokenAddress: `0x${string}` | undefined;
  /** 链群服务者账户地址 */
  account: `0x${string}` | undefined;
  /** 加入轮次 */
  round: bigint | undefined;
}

/**
 * Hook 返回值
 */
export interface UseActionsWithActiveGroupsByOwnerResult {
  /** 行动列表（包含链群信息） */
  actionsWithGroups: ActionWithGroups[];
  /** 加载状态 */
  isPending: boolean;
  /** 错误信息 */
  error: any;
}

// ==================== Hook 实现 ====================

/**
 * 获取服务者的所有行动和链群信息
 *
 * @param params - Hook 参数
 * @returns 行动列表（包含链群信息）
 */
export function useActionsWithActiveGroupsByOwner({
  groupActionTokenAddress,
  account,
  round,
}: UseActionsWithActiveGroupsByOwnerParams): UseActionsWithActiveGroupsByOwnerResult {
  // ==========================================
  // 步骤1：获取 actionIds 和 groupIds
  // ==========================================

  const {
    actionIdsWithGroupIds,
    isPending: isActionIdsPending,
    error: actionIdsError,
  } = useActionIdsWithActiveGroupIdsByOwner({
    tokenAddress: groupActionTokenAddress,
    account,
  });

  // ==========================================
  // 步骤3.5：获取每个 actionId 对应的扩展地址
  // ==========================================

  const allActionIds = useMemo(() => {
    return actionIdsWithGroupIds.map((item) => item.actionId);
  }, [actionIdsWithGroupIds]);

  const {
    extensions,
    isPending: isExtensionsPending,
    error: extensionsError,
  } = useExtensionsByActionIdsWithCache({
    token: { address: groupActionTokenAddress as `0x${string}` } as any,
    actionIds: allActionIds,
    enabled: !!groupActionTokenAddress && allActionIds.length > 0,
  });

  // 创建 actionId 到扩展地址的映射
  const actionIdToExtensionMap = useMemo(() => {
    const map = new Map<bigint, `0x${string}`>();
    extensions.forEach((ext) => {
      if (ext.isExtension && ext.extensionAddress) {
        map.set(ext.actionId, ext.extensionAddress);
      }
    });
    return map;
  }, [extensions]);

  // ==========================================
  // 步骤4：批量获取行动信息（使用缓存）
  // ==========================================

  const {
    actionInfos,
    isPending: isActionInfosPending,
    error: actionInfosError,
  } = useActionBaseInfosByIdsWithCache({
    tokenAddress: groupActionTokenAddress,
    actionIds: allActionIds,
    enabled: !!groupActionTokenAddress && allActionIds.length > 0 && !isExtensionsPending,
  });

  const actionInfoById = useMemo(() => {
    const map = new Map<string, (typeof actionInfos)[number]>();
    for (const actionInfo of actionInfos) {
      map.set(actionInfo.head.id.toString(), actionInfo);
    }
    return map;
  }, [actionInfos]);

  // ==========================================
  // 步骤5：批量获取链群名称（使用缓存）
  // ==========================================

  // 提取所有唯一的 groupIds
  const allGroupIds = useMemo(() => {
    const groupIdSet = new Set<string>();
    actionIdsWithGroupIds.forEach((item) => {
      item.groupIds.forEach((groupId) => {
        groupIdSet.add(groupId.toString());
      });
    });
    return Array.from(groupIdSet).map((id) => BigInt(id));
  }, [actionIdsWithGroupIds]);

  const {
    groupNameMap,
    isPending: isGroupNamesPending,
    error: groupNamesError,
  } = useGroupNamesWithCache({
    groupIds: allGroupIds.length > 0 ? allGroupIds : undefined,
    enabled: allGroupIds.length > 0 && !isActionIdsPending,
  });

  // ==========================================
  // 步骤6：批量获取链群参与统计
  // ==========================================

  // 构建所有 (extensionAddress, groupId) 对
  const extensionGroupPairs = useMemo(() => {
    const pairs: Array<{
      actionId: bigint;
      extensionAddress: `0x${string}`;
      groupId: bigint;
      index: number;
    }> = [];

    actionIdsWithGroupIds.forEach((item) => {
      const extensionAddr = actionIdToExtensionMap.get(item.actionId);
      if (extensionAddr) {
        item.groupIds.forEach((groupId) => {
          pairs.push({
            actionId: item.actionId,
            extensionAddress: extensionAddr,
            groupId,
            index: pairs.length,
          });
        });
      }
    });

    return pairs;
  }, [actionIdsWithGroupIds, actionIdToExtensionMap]);

  const groupStatsContracts = useMemo(() => {
    if (extensionGroupPairs.length === 0 || !round) {
      return [];
    }

    return extensionGroupPairs.flatMap(({ extensionAddress, groupId }) => [
      {
        address: GROUP_JOIN_ADDRESS,
        abi: GroupJoinAbi,
        functionName: 'totalJoinedAmountByGroupId' as const,
        args: [extensionAddress, round, groupId] as const,
      },
      {
        address: GROUP_JOIN_ADDRESS,
        abi: GroupJoinAbi,
        functionName: 'accountsByGroupIdCount' as const,
        args: [extensionAddress, round, groupId] as const,
      },
    ]);
  }, [extensionGroupPairs, round]);

  const {
    data: groupStatsData,
    isPending: isGroupStatsPending,
    error: groupStatsError,
  } = useUniversalReadContracts({
    contracts: groupStatsContracts as any,
    query: {
      enabled: !!round && groupStatsContracts.length > 0 && !isExtensionsPending,
    },
  });

  // 构建 (actionId, groupId) -> 参与统计 的映射
  const { totalJoinedAmountMap, accountCountMap } = useMemo(() => {
    const amountMap = new Map<string, bigint>();
    const countMap = new Map<string, bigint>();

    if (groupStatsData && extensionGroupPairs.length > 0) {
      extensionGroupPairs.forEach(({ actionId, groupId }, index) => {
        const amountResult = groupStatsData[index * 2];
        const countResult = groupStatsData[index * 2 + 1];
        const key = `${actionId}_${groupId}`;

        if (amountResult?.status === 'success' && amountResult.result !== undefined) {
          amountMap.set(key, safeToBigInt(amountResult.result));
        }
        if (countResult?.status === 'success' && countResult.result !== undefined) {
          countMap.set(key, safeToBigInt(countResult.result));
        }
      });
    }

    return { totalJoinedAmountMap: amountMap, accountCountMap: countMap };
  }, [groupStatsData, extensionGroupPairs]);

  // ==========================================
  // 步骤7：组合数据并返回
  // ==========================================

  const actionsWithGroups = useMemo(() => {
    if (allActionIds.length === 0) return [];

    const result: ActionWithGroups[] = [];

    // 遍历每个 actionId
    actionIdsWithGroupIds.forEach((item) => {
      const actionId = item.actionId;

      // 获取行动基本信息
      const actionInfo = actionInfoById.get(actionId.toString());

      // 获取扩展地址
      const extensionAddr = actionIdToExtensionMap.get(actionId);
      if (!extensionAddr) return; // 如果没有扩展地址，跳过

      // 构建链群信息列表
      const groups: GroupWithAmount[] = item.groupIds.map((groupId) => {
        const key = `${actionId}_${groupId}`;
        const totalJoinedAmount = totalJoinedAmountMap.get(key) || BigInt(0);
        const accountCount = accountCountMap.get(key) || BigInt(0);

        return {
          groupId,
          groupName: groupNameMap.get(groupId),
          totalJoinedAmount,
          accountCount,
        };
      });

      result.push({
        actionId,
        actionTitle: actionInfo?.body.title || `行动 #${actionId.toString()}`,
        extensionAddress: extensionAddr,
        groups,
      });
    });

    return result;
  }, [actionIdsWithGroupIds, actionInfoById, actionIdToExtensionMap, groupNameMap, totalJoinedAmountMap, accountCountMap]);

  // ==========================================
  // 计算 isPending 状态
  // ==========================================

  const isPending = useMemo(() => {
    // 等待基本参数
    if (!groupActionTokenAddress || !account || !round) return true;

    // 步骤1：获取 actionIds 和 groupIds
    if (isActionIdsPending) return true;
    if (actionIdsWithGroupIds.length === 0) return false; // 没有数据，不需要继续加载

    // 步骤2：获取扩展地址
    if (isExtensionsPending) return true;
    if (actionIdToExtensionMap.size === 0) return false;

    // 步骤3：获取行动信息
    if (isActionInfosPending) return true;

    // 步骤4：获取链群名称
    if (isGroupNamesPending) return true;

    // 步骤5：获取参与统计
    return isGroupStatsPending;
  }, [
    groupActionTokenAddress,
    account,
    round,
    isActionIdsPending,
    actionIdsWithGroupIds.length,
    isExtensionsPending,
    actionIdToExtensionMap.size,
    isActionInfosPending,
    isGroupNamesPending,
    isGroupStatsPending,
  ]);

  // ==========================================
  // 错误处理
  // ==========================================

  const error =
    actionIdsError ||
    extensionsError ||
    actionInfosError ||
    groupNamesError ||
    groupStatsError;

  // ==========================================
  // 返回结果
  // ==========================================

  return {
    actionsWithGroups,
    isPending,
    error,
  };
}

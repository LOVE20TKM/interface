/**
 * 获取一个链群服务者所有激活链群的行动信息列表（包含链群列表）Hook
 *
 * 功能：
 * 1. 通过 useActionIdsWithActiveGroupIdsByOwner 获取行动id、链群NFT 列表
 * 2. 对于行动id，用 useActionBaseInfosByIdsWithCache 批量获取行动信息
 * 3. 对于链群NFT，用 useGroupNamesWithCache 批量获取链群名称信息
 * 4. 组合上面的数据并返回
 *
 * 使用示例：
 * ```typescript
 * const { actionInfosWithGroups, isPending, error } = useActionInfosWithActiveGroupIdsByOwner({
 *   tokenAddress: '0x...',
 *   verifyRound: BigInt(10),
 *   account: '0x...'
 * });
 * ```
 */

import { useMemo } from 'react';
import { ActionBaseInfo } from '@/src/types/love20types';
import {
  useActionIdsWithActiveGroupIdsByOwner,
  UseActionIdsWithActiveGroupIdsByOwnerParams,
} from './useActionIdsWithActiveGroupIdsByOwner';
import { useActionBaseInfosByIdsWithCache } from '@/src/hooks/composite/useActionBaseInfosByIdsWithCache';
import { useGroupNamesWithCache } from '@/src/hooks/extension/base/composite/useGroupNamesWithCache';

// ==================== 类型定义 ====================

/**
 * 链群信息
 */
export interface GroupInfo {
  /** 链群NFT */
  groupId: bigint;
  /** 链群名称 */
  groupName: string | undefined;
}

/**
 * 行动信息（包含关联的链群列表）
 */
export interface ActionInfoWithGroups {
  /** 行动ID */
  actionId: bigint;
  /** 行动基本信息 */
  actionBaseInfo: ActionBaseInfo;
  /** 该行动下激活的链群列表 */
  groups: GroupInfo[];
}

/**
 * Hook 返回值
 */
export interface UseActionInfosWithActiveGroupIdsByOwnerResult {
  /** 行动信息列表（包含关联的链群列表） */
  actionInfosWithGroups: ActionInfoWithGroups[];
  /** 加载状态 */
  isPending: boolean;
  /** 错误信息 */
  error: any;
}

// ==================== Hook 实现 ====================

/**
 * 获取一个链群服务者所有激活链群的行动信息列表（包含链群列表）
 *
 * @param params - Hook 参数
 * @returns 行动信息列表（包含关联的链群列表）
 */
export function useActionInfosWithActiveGroupIdsByOwner({
  tokenAddress,
  verifyRound,
  account,
}: UseActionIdsWithActiveGroupIdsByOwnerParams): UseActionInfosWithActiveGroupIdsByOwnerResult {
  // ==========================================
  // 步骤1：获取行动ID和链群NFT列表
  // ==========================================

  const {
    actionIdsWithGroupIds,
    isPending: isActionIdsPending,
    error: actionIdsError,
  } = useActionIdsWithActiveGroupIdsByOwner({
    tokenAddress,
    verifyRound,
    account,
  });

  // ==========================================
  // 步骤2：提取所有唯一的 actionIds 和 groupIds
  // ==========================================

  const allActionIds = useMemo(() => {
    if (actionIdsWithGroupIds.length === 0) return [];
    return actionIdsWithGroupIds.map((item) => item.actionId);
  }, [actionIdsWithGroupIds]);

  const allGroupIds = useMemo(() => {
    if (actionIdsWithGroupIds.length === 0) return [];
    // 使用 Set 去重
    const groupIdSet = new Set<string>();
    actionIdsWithGroupIds.forEach((item) => {
      item.groupIds.forEach((groupId) => {
        groupIdSet.add(groupId.toString());
      });
    });
    return Array.from(groupIdSet).map((id) => BigInt(id));
  }, [actionIdsWithGroupIds]);

  // ==========================================
  // 步骤3：批量获取行动信息
  // ==========================================

  const {
    actionInfos,
    isPending: isActionInfosPending,
    error: actionInfosError,
  } = useActionBaseInfosByIdsWithCache({
    tokenAddress,
    actionIds: allActionIds,
    enabled: allActionIds.length > 0 && !isActionIdsPending,
  });

  // ==========================================
  // 步骤4：批量获取链群名称信息
  // ==========================================

  const {
    groupNameMap,
    isPending: isGroupNamesPending,
    error: groupNamesError,
  } = useGroupNamesWithCache({
    groupIds: allGroupIds.length > 0 ? allGroupIds : undefined,
    enabled: allGroupIds.length > 0 && !isActionIdsPending,
  });

  // ==========================================
  // 步骤5：组合数据
  // ==========================================

  const actionInfosWithGroups = useMemo(() => {
    if (actionIdsWithGroupIds.length === 0) return [];

    // 构建 actionId 到 ActionBaseInfo 的映射
    const actionInfoMap = new Map<bigint, ActionBaseInfo>();
    actionInfos.forEach((actionInfo, index) => {
      if (index < allActionIds.length) {
        actionInfoMap.set(allActionIds[index], actionInfo);
      }
    });

    const result: ActionInfoWithGroups[] = [];

    // 遍历 actionIdsWithGroupIds，组合数据
    for (const { actionId, groupIds } of actionIdsWithGroupIds) {
      const actionBaseInfo = actionInfoMap.get(actionId);

      // 如果行动信息不存在，跳过（可能还在加载中）
      if (!actionBaseInfo) {
        continue;
      }

      // 构建链群信息列表
      const groups: GroupInfo[] = groupIds.map((groupId) => ({
        groupId,
        groupName: groupNameMap.get(groupId),
      }));

      result.push({
        actionId,
        actionBaseInfo,
        groups,
      });
    }

    return result;
  }, [actionIdsWithGroupIds, actionInfos, allActionIds, groupNameMap]);

  // ==========================================
  // 计算 isPending 状态
  // ==========================================

  const isPending = useMemo(() => {
    // 如果基本参数不存在，等待参数
    if (!tokenAddress || verifyRound === undefined || !account) return true;

    // 步骤1：获取行动ID和链群NFT列表
    if (isActionIdsPending) return true;

    // 如果步骤1没有数据，后续步骤不执行，isPending 为 false
    if (actionIdsWithGroupIds.length === 0) return false;

    // 步骤2：获取行动信息
    if (isActionInfosPending) return true;

    // 步骤3：获取链群名称
    return isGroupNamesPending;
  }, [
    tokenAddress,
    verifyRound,
    account,
    isActionIdsPending,
    actionIdsWithGroupIds.length,
    isActionInfosPending,
    isGroupNamesPending,
  ]);

  // ==========================================
  // 错误处理
  // ==========================================

  const error = actionIdsError || actionInfosError || groupNamesError;

  // ==========================================
  // 返回结果
  // ==========================================

  return {
    actionInfosWithGroups,
    isPending,
    error,
  };
}

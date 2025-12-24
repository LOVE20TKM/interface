/**
 * 获取一个链群主地址在某一轮的二次分配设置明细 Hook
 *
 * 功能：
 * 1. 获取该地址在某一轮次有二次分配的行动ID列表
 * 2. 对于所有actionIds，获取有二次分配的groupId列表
 * 3. 使用 rewardDistribution 获取每个群组的明细
 * 4. 获取行动基本详情、链群基本信息
 * 5. 组合并返回结果
 *
 * 使用示例：
 * ```typescript
 * const { actionInfosWithGroups, isPending, error } = useRecipientsDetailByAccountByRound({
 *   extensionAddress: '0x...',
 *   tokenAddress: '0x...',
 *   account: '0x...',
 *   round: BigInt(10)
 * });
 * ```
 */

import { useMemo } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';
import { LOVE20ExtensionGroupServiceAbi } from '@/src/abis/LOVE20ExtensionGroupService';
import { ActionBaseInfo } from '@/src/types/love20types';
import { useActionBaseInfosByIdsWithCache } from '@/src/hooks/composite/useActionBaseInfosByIdsWithCache';
import { useGroupNamesWithCache } from '@/src/hooks/extension/base/composite/useGroupNamesWithCache';
import { safeToBigInt } from '@/src/lib/clientUtils';

// ==================== 类型定义 ====================

/**
 * 二次分配明细
 */
export interface RecipientsDistribution {
  /** 接收地址列表 */
  addrs: `0x${string}`[];
  /** 对应的基点数列表 */
  basisPoints: bigint[];
  /** 对应的金额列表 */
  amounts: bigint[];
  /** 链群主保留的金额 */
  ownerAmount: bigint;
}

/**
 * 链群信息（包含二次分配明细）
 */
export interface GroupInfoWithDistribution {
  /** 链群NFT */
  groupId: bigint;
  /** 链群名称 */
  groupName: string | undefined;
  /** 二次分配明细 */
  distribution: RecipientsDistribution | undefined;
}

/**
 * 行动信息（包含关联的链群列表和二次分配明细）
 */
export interface ActionInfoWithGroupsAndDistribution {
  /** 行动ID */
  actionId: bigint;
  /** 行动基本信息 */
  actionBaseInfo: ActionBaseInfo;
  /** 该行动下有二次分配的链群列表 */
  groups: GroupInfoWithDistribution[];
}

/**
 * Hook 参数
 */
export interface UseRecipientsDetailByAccountByRoundParams {
  /** Extension 合约地址 */
  extensionAddress: `0x${string}` | undefined;
  /** Token 地址 */
  tokenAddress: `0x${string}` | undefined;
  /** 链群主账户地址 */
  account: `0x${string}` | undefined;
  /** 轮次 */
  round: bigint | undefined;
}

/**
 * Hook 返回值
 */
export interface UseRecipientsDetailByAccountByRoundResult {
  /** 行动信息列表（包含关联的链群列表和二次分配明细） */
  actionInfosWithGroups: ActionInfoWithGroupsAndDistribution[];
  /** 加载状态 */
  isPending: boolean;
  /** 错误信息 */
  error: any;
}

// ==================== Hook 实现 ====================

/**
 * 获取一个链群主地址在某一轮的二次分配设置明细
 *
 * @param params - Hook 参数
 * @returns 行动信息列表（包含关联的链群列表和二次分配明细）
 */
export function useRecipientsDetailByAccountByRound({
  extensionAddress,
  tokenAddress,
  account,
  round,
}: UseRecipientsDetailByAccountByRoundParams): UseRecipientsDetailByAccountByRoundResult {
  // ==========================================
  // 步骤1：获取有二次分配的行动ID列表
  // ==========================================

  const {
    data: actionIdsData,
    isPending: isActionIdsPending,
    error: actionIdsError,
  } = useReadContract({
    address: extensionAddress,
    abi: LOVE20ExtensionGroupServiceAbi,
    functionName: 'actionIdsWithRecipients',
    args: account && round !== undefined ? [account, round] : undefined,
    query: {
      enabled: !!extensionAddress && !!account && round !== undefined,
    },
  });

  const actionIds = useMemo(() => {
    if (!actionIdsData || !Array.isArray(actionIdsData)) {
      return [];
    }
    return actionIdsData as bigint[];
  }, [actionIdsData]);

  // ==========================================
  // 步骤2：获取每个行动的有二次分配的链群NFT列表
  // ==========================================

  const groupIdsContracts = useMemo(() => {
    if (!extensionAddress || !account || round === undefined || actionIds.length === 0) {
      return [];
    }

    return actionIds.map((actionId) => ({
      address: extensionAddress,
      abi: LOVE20ExtensionGroupServiceAbi,
      functionName: 'groupIdsWithRecipients' as const,
      args: [account, actionId, round] as const,
    }));
  }, [extensionAddress, account, round, actionIds]);

  const {
    data: groupIdsData,
    isPending: isGroupIdsPending,
    error: groupIdsError,
  } = useReadContracts({
    contracts: groupIdsContracts,
    query: {
      enabled: !!extensionAddress && !!account && round !== undefined && groupIdsContracts.length > 0,
    },
  });

  // 构建 actionId -> groupIds[] 的映射
  const actionIdToGroupIdsMap = useMemo(() => {
    const map = new Map<bigint, bigint[]>();

    if (!groupIdsData || actionIds.length === 0) {
      return map;
    }

    actionIds.forEach((actionId, index) => {
      const result = groupIdsData[index];
      if (result?.status === 'success' && result.result) {
        const groupIds = result.result as bigint[];
        if (Array.isArray(groupIds) && groupIds.length > 0) {
          map.set(actionId, groupIds);
        }
      }
    });

    return map;
  }, [groupIdsData, actionIds]);

  // ==========================================
  // 步骤3：获取每个群组的二次分配明细
  // ==========================================

  // 构建所有 (actionId, groupId) 对
  const actionGroupPairs = useMemo(() => {
    const pairs: Array<{ actionId: bigint; groupId: bigint }> = [];

    actionIdToGroupIdsMap.forEach((groupIds, actionId) => {
      groupIds.forEach((groupId) => {
        pairs.push({ actionId, groupId });
      });
    });

    return pairs;
  }, [actionIdToGroupIdsMap]);

  const distributionContracts = useMemo(() => {
    if (!extensionAddress || !account || round === undefined || actionGroupPairs.length === 0) {
      return [];
    }

    return actionGroupPairs.map(({ actionId, groupId }) => ({
      address: extensionAddress,
      abi: LOVE20ExtensionGroupServiceAbi,
      functionName: 'rewardDistribution' as const,
      args: [round, account, actionId, groupId] as const,
    }));
  }, [extensionAddress, account, round, actionGroupPairs]);

  const {
    data: distributionData,
    isPending: isDistributionPending,
    error: distributionError,
  } = useReadContracts({
    contracts: distributionContracts,
    query: {
      enabled: !!extensionAddress && !!account && round !== undefined && distributionContracts.length > 0,
    },
  });

  // 构建 (actionId, groupId) -> distribution 的映射
  const distributionMap = useMemo(() => {
    const map = new Map<string, RecipientsDistribution>();

    if (!distributionData || actionGroupPairs.length === 0) {
      return map;
    }

    actionGroupPairs.forEach(({ actionId, groupId }, index) => {
      const result = distributionData[index];
      if (result?.status === 'success' && result.result) {
        const [addrs, basisPoints, amounts, ownerAmount] = result.result as [
          `0x${string}`[],
          bigint[],
          bigint[],
          bigint,
        ];
        const key = `${actionId}_${groupId}`;
        map.set(key, {
          addrs,
          basisPoints,
          amounts,
          ownerAmount: safeToBigInt(ownerAmount),
        });
      }
    });

    return map;
  }, [distributionData, actionGroupPairs]);

  // ==========================================
  // 步骤4：获取行动基本信息和链群名称
  // ==========================================

  const allActionIds = useMemo(() => {
    return Array.from(actionIdToGroupIdsMap.keys());
  }, [actionIdToGroupIdsMap]);

  const {
    actionInfos,
    isPending: isActionInfosPending,
    error: actionInfosError,
  } = useActionBaseInfosByIdsWithCache({
    tokenAddress,
    actionIds: allActionIds,
    enabled: allActionIds.length > 0 && !isActionIdsPending && !isGroupIdsPending,
  });

  // 提取所有唯一的 groupIds
  const allGroupIds = useMemo(() => {
    const groupIdSet = new Set<string>();
    actionIdToGroupIdsMap.forEach((groupIds) => {
      groupIds.forEach((groupId) => {
        groupIdSet.add(groupId.toString());
      });
    });
    return Array.from(groupIdSet).map((id) => BigInt(id));
  }, [actionIdToGroupIdsMap]);

  const {
    groupNameMap,
    isPending: isGroupNamesPending,
    error: groupNamesError,
  } = useGroupNamesWithCache({
    groupIds: allGroupIds.length > 0 ? allGroupIds : undefined,
    enabled: allGroupIds.length > 0 && !isActionIdsPending && !isGroupIdsPending,
  });

  // ==========================================
  // 步骤5：组合数据并返回
  // ==========================================

  const actionInfosWithGroups = useMemo(() => {
    if (allActionIds.length === 0) return [];

    // 构建 actionId -> ActionBaseInfo 的映射
    const actionInfoMap = new Map<bigint, ActionBaseInfo>();
    actionInfos.forEach((actionInfo, index) => {
      if (index < allActionIds.length) {
        actionInfoMap.set(allActionIds[index], actionInfo);
      }
    });

    const result: ActionInfoWithGroupsAndDistribution[] = [];

    // 遍历每个 actionId
    for (const actionId of allActionIds) {
      const actionBaseInfo = actionInfoMap.get(actionId);
      if (!actionBaseInfo) continue; // 如果行动信息还未加载，跳过

      const groupIds = actionIdToGroupIdsMap.get(actionId);
      if (!groupIds || groupIds.length === 0) continue;

      // 构建链群信息列表
      const groups: GroupInfoWithDistribution[] = groupIds.map((groupId) => {
        const key = `${actionId}_${groupId}`;
        const distribution = distributionMap.get(key);

        return {
          groupId,
          groupName: groupNameMap.get(groupId),
          distribution,
        };
      });

      result.push({
        actionId,
        actionBaseInfo,
        groups,
      });
    }

    return result;
  }, [allActionIds, actionInfos, actionIdToGroupIdsMap, distributionMap, groupNameMap]);

  // ==========================================
  // 计算 isPending 状态
  // ==========================================

  const isPending = useMemo(() => {
    // 等待基本参数
    if (!extensionAddress || !account || round === undefined) return true;

    // 步骤1：获取行动ID列表
    if (isActionIdsPending) return true;
    if (actionIds.length === 0) return false; // 没有数据，不需要继续加载

    // 步骤2：获取链群NFT列表
    if (isGroupIdsPending) return true;
    if (actionIdToGroupIdsMap.size === 0) return false; // 没有数据，不需要继续加载

    // 步骤3：获取二次分配明细
    if (isDistributionPending) return true;

    // 步骤4：获取行动信息
    if (isActionInfosPending) return true;

    // 步骤5：获取链群名称
    return isGroupNamesPending;
  }, [
    extensionAddress,
    account,
    round,
    isActionIdsPending,
    actionIds.length,
    isGroupIdsPending,
    actionIdToGroupIdsMap.size,
    isDistributionPending,
    isActionInfosPending,
    isGroupNamesPending,
  ]);

  // ==========================================
  // 错误处理
  // ==========================================

  const error = actionIdsError || groupIdsError || distributionError || actionInfosError || groupNamesError;

  // ==========================================
  // 返回结果
  // ==========================================

  return {
    actionInfosWithGroups,
    isPending,
    error,
  };
}

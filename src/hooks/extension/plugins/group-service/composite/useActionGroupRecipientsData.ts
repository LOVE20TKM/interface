/**
 * 获取所有行动-链群的二次分配地址数据 Hook
 *
 * 功能：
 * 1. 获取用户所有激活的行动-链群对
 * 2. 批量获取行动信息（标题等）
 * 3. 批量获取链群名称
 * 4. 批量获取每个行动-链群的二次分配地址和比例
 * 5. 组合数据按行动分组返回
 *
 * 使用示例：
 * ```typescript
 * const { currentRound } = useCurrentRound();
 * const { actionGroupRecipientsData, isPending, error } = useActionGroupRecipientsData({
 *   tokenAddress: '0x...',
 *   account: '0x...',
 *   extensionAddress: '0x...',
 *   round: currentRound,
 * });
 * ```
 */

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { GroupRecipientsAbi } from '@/src/abis/GroupRecipients';
import { useActionIdsWithActiveGroupIdsByOwner } from '@/src/hooks/extension/plugins/group-service/composite/useActionIdsWithActiveGroupIdsByOwner';
import { useActionBaseInfosByIdsWithCache } from '@/src/hooks/composite/useActionBaseInfosByIdsWithCache';
import { useGroupNamesWithCache } from '@/src/hooks/extension/base/composite/useGroupNamesWithCache';

// GroupRecipients 是全局合约，使用环境变量配置地址
const GROUP_RECIPIENTS_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_RECIPIENTS as `0x${string}`;

// ==================== 类型定义 ====================

/**
 * 链群的二次分配数据
 */
export interface GroupRecipientData {
  /** 链群NFT */
  groupId: bigint;
  /** 链群名称 */
  groupName: string | undefined;
  /** 接收地址列表 */
  addrs: `0x${string}`[] | undefined;
  /** 对应的分配比例（wei 格式，1e18 = 100%） */
  ratios: bigint[] | undefined;
  /** 接收地址的备注（名称/职位等） */
  remarks: string[] | undefined;
}

/**
 * 行动的二次分配数据
 */
export interface ActionGroupRecipientsData {
  /** 行动 ID */
  actionId: bigint;
  /** 行动标题 */
  actionTitle: string;
  /** 该行动下所有链群的二次分配数据 */
  groups: GroupRecipientData[];
}

/**
 * Hook 参数
 */
export interface UseActionGroupRecipientsDataParams {
  /** Token 地址 */
  tokenAddress: `0x${string}` | undefined;
  /** 链群服务者账户地址 */
  account: `0x${string}` | undefined;
  /** Extension 合约地址 */
  extensionAddress: `0x${string}` | undefined;
  /** 验证轮轮次（用于 recipients 查询） */
  round: bigint | undefined;
}

/**
 * Hook 返回值
 */
export interface UseActionGroupRecipientsDataResult {
  /** 按行动分组的二次分配数据 */
  actionGroupRecipientsData: ActionGroupRecipientsData[];
  /** 加载状态 */
  isPending: boolean;
  /** 错误信息 */
  error: any;
}

// ==================== Hook 实现 ====================

/**
 * 获取所有行动-链群的二次分配地址数据
 *
 * @param params - Hook 参数
 * @returns 按行动分组的二次分配数据
 */
export function useActionGroupRecipientsData({
  tokenAddress,
  account,
  extensionAddress,
  round,
}: UseActionGroupRecipientsDataParams): UseActionGroupRecipientsDataResult {
  // ==========================================
  // 步骤1：获取行动-链群结构
  // ==========================================

  const {
    actionIdsWithGroupIds,
    isPending: isActionIdsPending,
    error: actionIdsError,
  } = useActionIdsWithActiveGroupIdsByOwner({
    tokenAddress,
    account,
  });

  // ==========================================
  // 步骤2：提取所有唯一的 actionIds 和 groupIds
  // ==========================================

  const { allActionIds, allGroupIds } = useMemo(() => {
    if (actionIdsWithGroupIds.length === 0) {
      return { allActionIds: [], allGroupIds: [] };
    }

    // 提取所有 actionIds
    const actionIds = actionIdsWithGroupIds.map((item) => item.actionId);

    // 提取并去重所有 groupIds
    const groupIdSet = new Set<string>();
    actionIdsWithGroupIds.forEach((item) => {
      item.groupIds.forEach((groupId) => {
        groupIdSet.add(groupId.toString());
      });
    });
    const groupIds = Array.from(groupIdSet).map((id) => BigInt(id));

    return { allActionIds: actionIds, allGroupIds: groupIds };
  }, [actionIdsWithGroupIds]);

  // ==========================================
  // 步骤3：批量获取行动信息（带缓存）
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
  // 步骤4：批量获取链群名称（带缓存）
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
  // 步骤5：批量获取二次分配数据（使用 GroupRecipients 合约）
  // ==========================================

  // 构建批量合约调用配置（使用 recipients，需传入验证轮轮次和 tokenAddress）
  const recipientsContracts = useMemo(() => {
    if (!GROUP_RECIPIENTS_ADDRESS || !tokenAddress || !account || round === undefined || actionIdsWithGroupIds.length === 0) {
      return [];
    }

    const contracts: any[] = [];
    actionIdsWithGroupIds.forEach(({ actionId, groupIds }) => {
      groupIds.forEach((groupId) => {
        contracts.push({
          address: GROUP_RECIPIENTS_ADDRESS,
          abi: GroupRecipientsAbi,
          functionName: 'recipients' as const,
          args: [account, tokenAddress, actionId, groupId, round] as const,
        });
      });
    });

    return contracts;
  }, [tokenAddress, account, round, actionIdsWithGroupIds]);

  const {
    data: recipientsData,
    isPending: isRecipientsPending,
    error: recipientsError,
  } = useReadContracts({
    contracts: recipientsContracts,
    query: {
      enabled: !!GROUP_RECIPIENTS_ADDRESS && !!tokenAddress && !!account && !!round && recipientsContracts.length > 0,
    },
  });

  // ==========================================
  // 步骤6：解析二次分配数据并建立映射
  // ==========================================

  const recipientsMap = useMemo(() => {
    const map = new Map<string, { addrs: `0x${string}`[]; ratios: bigint[]; remarks: string[] }>();

    if (!recipientsData || actionIdsWithGroupIds.length === 0) return map;

    let index = 0;
    actionIdsWithGroupIds.forEach(({ actionId, groupIds }) => {
      groupIds.forEach((groupId) => {
        const data = recipientsData[index];
        if (data?.status === 'success' && data.result) {
          const [addrs, ratios, remarks] = data.result as [`0x${string}`[], bigint[], string[]];
          const key = `${actionId}_${groupId}`;
          map.set(key, { addrs, ratios, remarks });
        }
        index++;
      });
    });

    return map;
  }, [recipientsData, actionIdsWithGroupIds]);

  // ==========================================
  // 步骤7：组合所有数据
  // ==========================================

  const actionGroupRecipientsData = useMemo(() => {
    if (actionIdsWithGroupIds.length === 0) return [];

    // 构建 actionId -> ActionBaseInfo 的映射
    const actionInfoMap = new Map();
    actionInfos.forEach((info, idx) => {
      if (idx < allActionIds.length) {
        actionInfoMap.set(allActionIds[idx], info);
      }
    });

    const result: ActionGroupRecipientsData[] = [];

    actionIdsWithGroupIds.forEach(({ actionId, groupIds }) => {
      const actionInfo = actionInfoMap.get(actionId);
      if (!actionInfo) return; // 如果行动信息还未加载，跳过

      const groups: GroupRecipientData[] = groupIds.map((groupId) => {
        const key = `${actionId}_${groupId}`;
        const recipients = recipientsMap.get(key);

        return {
          groupId,
          groupName: groupNameMap.get(groupId),
          addrs: recipients?.addrs,
          ratios: recipients?.ratios,
          remarks: recipients?.remarks,
        };
      });

      result.push({
        actionId,
        actionTitle: actionInfo.body.title,
        groups,
      });
    });

    return result;
  }, [actionIdsWithGroupIds, actionInfos, allActionIds, groupNameMap, recipientsMap]);

  // ==========================================
  // 步骤8：计算加载状态
  // ==========================================

  const isPending = useMemo(() => {
    // 等待参数（含验证轮轮次）
    if (!tokenAddress || !account || !extensionAddress || round === undefined) {
      return true;
    }

    // 步骤1：获取行动-链群结构
    if (isActionIdsPending) return true;
    if (actionIdsWithGroupIds.length === 0) return false; // 没有数据，不需要继续加载

    // 步骤2：获取行动信息
    if (isActionInfosPending) return true;

    // 步骤3：获取链群名称
    if (isGroupNamesPending) return true;

    // 步骤4：获取二次分配数据
    return isRecipientsPending;
  }, [
    tokenAddress,
    account,
    extensionAddress,
    round,
    isActionIdsPending,
    actionIdsWithGroupIds.length,
    isActionInfosPending,
    isGroupNamesPending,
    isRecipientsPending,
  ]);

  // ==========================================
  // 错误处理
  // ==========================================

  const error = actionIdsError || actionInfosError || groupNamesError || recipientsError;

  // ==========================================
  // 返回结果
  // ==========================================

  return {
    actionGroupRecipientsData,
    isPending,
    error,
  };
}

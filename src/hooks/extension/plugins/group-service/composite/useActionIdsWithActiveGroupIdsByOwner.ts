/**
 * 获取一个链群服务者所有激活的链群NFTs列表（按行动id分组）Hook
 *
 * 功能：
 * 1. 使用 GroupManager.votedGroupActions 一次性获取当轮有投票且有激活链群的行动列表及扩展地址
 * 2. 批量对于每个 actionId 用 activeGroupIdsByOwner 获取在该群激活的链群NFT列表
 *
 * 使用示例：
 * ```typescript
 * const { actionIdsWithGroupIds, isPending, error } = useActionIdsWithActiveGroupIdsByOwner({
 *   tokenAddress: '0x...',
 *   verifyRound: BigInt(10),
 *   account: '0x...'
 * });
 * ```
 */

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { GroupManagerAbi } from '@/src/abis/GroupManager';
import { useActionIds } from '@/src/hooks/extension/plugins/group/contracts/useGroupManager';

// ==================== 类型定义 ====================

/**
 * 按 actionId 分组的链群NFT列表
 */
export interface ActionIdWithGroupIds {
  /** 行动ID */
  actionId: bigint;
  /** 该行动下激活的链群NFT列表 */
  groupIds: bigint[];
}

/**
 * Hook 参数
 */
export interface UseActionIdsWithActiveGroupIdsByOwnerParams {
  /** Token 地址 */
  tokenAddress: `0x${string}` | undefined;
  /** 验证轮次 */
  verifyRound: bigint | undefined;
  /** 链群服务者账户地址 */
  account: `0x${string}` | undefined;
}

/**
 * Hook 返回值
 */
export interface UseActionIdsWithActiveGroupIdsByOwnerResult {
  /** 按 actionId 分组的激活链群NFT列表 */
  actionIdsWithGroupIds: ActionIdWithGroupIds[];
  /** 加载状态 */
  isPending: boolean;
  /** 错误信息 */
  error: any;
}

// ==================== 常量定义 ====================

const GROUP_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_MANAGER as `0x${string}`;
const GROUP_ACTION_FACTORY_ADDRESS = process.env
  .NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_FACTORY_GROUP_ACTION as `0x${string}`;

// ==================== Hook 实现 ====================

/**
 * 获取一个链群服务者所有激活的链群NFTs列表（按行动id分组）
 *
 * @param params - Hook 参数
 * @returns 按 actionId 分组的激活链群NFT列表
 */
export function useActionIdsWithActiveGroupIdsByOwner({
  tokenAddress,
  verifyRound,
  account,
}: UseActionIdsWithActiveGroupIdsByOwnerParams): UseActionIdsWithActiveGroupIdsByOwnerResult {
  // ==========================================
  // 步骤1：使用 actionIds 获取所有含激活链群的行动列表
  // ==========================================

  const {
    actionIds,
    isPending: isActionIdsPending,
    error: actionIdsError,
  } = useActionIds(GROUP_ACTION_FACTORY_ADDRESS, tokenAddress as `0x${string}`);

  // ==========================================
  // 步骤2：批量获取每个 actionId 的激活链群NFT列表
  // ==========================================

  const groupIdsContracts = useMemo(() => {
    if (!tokenAddress || !account || !actionIds || actionIds.length === 0) return [];
    return actionIds.map((actionId) => ({
      address: GROUP_MANAGER_ADDRESS,
      abi: GroupManagerAbi,
      functionName: 'activeGroupIdsByOwner' as const,
      args: [tokenAddress, actionId, account] as const,
    }));
  }, [tokenAddress, account, actionIds]);

  const {
    data: groupIdsData,
    isPending: isGroupIdsPending,
    error: groupIdsError,
  } = useReadContracts({
    contracts: groupIdsContracts as any,
    query: {
      enabled: !!tokenAddress && !!account && !!actionIds && actionIds.length > 0,
    },
  });

  // ==========================================
  // 结果组装
  // ==========================================

  const actionIdsWithGroupIds = useMemo(() => {
    if (!groupIdsData || !actionIds || actionIds.length === 0) return [];

    const result: ActionIdWithGroupIds[] = [];
    groupIdsData.forEach((item, index) => {
      if (item?.status === 'success' && item.result) {
        const groupIds = item.result as bigint[];
        // 只返回有激活链群的 actionId
        if (groupIds.length > 0) {
          result.push({
            actionId: actionIds[index],
            groupIds,
          });
        }
      }
    });
    return result;
  }, [groupIdsData, actionIds]);

  // ==========================================
  // 计算 isPending 状态
  // ==========================================

  const isPending = useMemo(() => {
    // 如果基本参数不存在，等待参数
    if (!tokenAddress || !account) return true;

    // 步骤1：获取 actionIds
    if (isActionIdsPending) return true;

    // 如果步骤1没有数据（没有符合条件的行动），isPending 为 false
    if (!actionIds || actionIds.length === 0) return false;

    // 步骤2：获取链群NFT列表
    return isGroupIdsPending;
  }, [tokenAddress, account, isActionIdsPending, actionIds, isGroupIdsPending]);

  // ==========================================
  // 错误处理
  // ==========================================

  const error = actionIdsError || groupIdsError;

  // ==========================================
  // 返回结果
  // ==========================================

  return {
    actionIdsWithGroupIds,
    isPending,
    error,
  };
}

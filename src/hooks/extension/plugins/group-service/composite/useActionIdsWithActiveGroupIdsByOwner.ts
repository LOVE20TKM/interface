/**
 * 获取一个链群服务者所有激活的链群NFTs列表（按行动id分组）Hook
 *
 * 功能：
 * 1. 使用 GroupManager.actionIds 一次性获取所有含激活链群的行动列表
 * 2. 直接从 ExtensionCenter.extension 获取每个 actionId 对应的扩展地址
 * 3. 批量对于每个 actionId 用 activeGroupIdsByOwner 获取在该行动扩展下激活的链群NFT列表
 *
 * 使用示例：
 * ```typescript
 * const { actionIdsWithGroupIds, isPending, error } = useActionIdsWithActiveGroupIdsByOwner({
 *   tokenAddress: '0x...',
 *   account: '0x...',
 * });
 * ```
 */

import { useMemo } from 'react';
import { useUniversalReadContracts } from '@/src/lib/universalReadContract';
import { GroupManagerAbi } from '@/src/abis/GroupManager';
import { ExtensionCenterAbi } from '@/src/abis/ExtensionCenter';
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
const EXTENSION_CENTER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_CENTER as `0x${string}`;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// ==================== Hook 实现 ====================

/**
 * 获取一个链群服务者所有激活的链群NFTs列表（按行动id分组）
 *
 * @param params - Hook 参数
 * @returns 按 actionId 分组的激活链群NFT列表
 */
export function useActionIdsWithActiveGroupIdsByOwner({
  tokenAddress,
  account,
}: UseActionIdsWithActiveGroupIdsByOwnerParams): UseActionIdsWithActiveGroupIdsByOwnerResult {
  // ==========================================
  // 步骤1：使用 actionIds 获取所有含激活链群的行动列表
  // ==========================================

  const {
    actionIds,
    isPending: isActionIdsPending,
    error: actionIdsError,
  } = useActionIds(tokenAddress as `0x${string}`);

  // ==========================================
  // 步骤1.5：获取每个 actionId 对应的行动扩展地址
  // ==========================================

  const extensionContracts = useMemo(() => {
    if (!tokenAddress || !actionIds || actionIds.length === 0) return [];

    return actionIds.map((actionId) => ({
      address: EXTENSION_CENTER_ADDRESS,
      abi: ExtensionCenterAbi,
      functionName: 'extension' as const,
      args: [tokenAddress, actionId] as const,
    }));
  }, [tokenAddress, actionIds]);

  const {
    data: extensionsData,
    isPending: isExtensionsPending,
    error: extensionsError,
  } = useUniversalReadContracts({
    contracts: extensionContracts as any,
    query: {
      enabled: !!tokenAddress && !!actionIds && actionIds.length > 0,
    },
  });

  // 创建 actionId 到扩展地址的映射（只包含有效的扩展）
  const extensionAddressMap = useMemo(() => {
    const map = new Map<bigint, `0x${string}`>();
    extensionsData?.forEach((result, index) => {
      if (result?.status === 'success' && result.result) {
        const extensionAddress = result.result as `0x${string}`;
        const actionId = actionIds?.[index];
        if (actionId !== undefined && extensionAddress !== ZERO_ADDRESS) {
          map.set(actionId, extensionAddress);
        }
      }
    });
    return map;
  }, [actionIds, extensionsData]);

  // ==========================================
  // 步骤2：批量获取每个 actionId 的激活链群NFT列表
  // ==========================================

  // 创建 actionId 到合约索引的映射（用于结果组装）
  const { groupIdsContracts, contractIndexToActionIdMap } = useMemo(() => {
    if (!account || !actionIds || actionIds.length === 0 || extensionAddressMap.size === 0) {
      return { groupIdsContracts: [], contractIndexToActionIdMap: new Map<number, bigint>() };
    }

    const contracts: Array<{
      address: `0x${string}`;
      abi: typeof GroupManagerAbi;
      functionName: 'activeGroupIdsByOwner';
      args: [`0x${string}`, `0x${string}`];
    }> = [];
    const indexMap = new Map<number, bigint>();

    // 只为有扩展地址的 actionId 创建合约调用
    actionIds.forEach((actionId) => {
      const extensionAddr = extensionAddressMap.get(actionId);
      if (extensionAddr) {
        const index = contracts.length;
        contracts.push({
          address: GROUP_MANAGER_ADDRESS,
          abi: GroupManagerAbi,
          functionName: 'activeGroupIdsByOwner' as const,
          args: [extensionAddr, account] as const,
        });
        indexMap.set(index, actionId);
      }
    });

    return { groupIdsContracts: contracts, contractIndexToActionIdMap: indexMap };
  }, [account, actionIds, extensionAddressMap]);

  const {
    data: groupIdsData,
    isPending: isGroupIdsPending,
    error: groupIdsError,
  } = useUniversalReadContracts({
    contracts: groupIdsContracts as any,
    query: {
      enabled: !!account && !!actionIds && actionIds.length > 0 && extensionAddressMap.size > 0 && !isExtensionsPending,
    },
  });

  // ==========================================
  // 结果组装
  // ==========================================

  const actionIdsWithGroupIds = useMemo(() => {
    if (!groupIdsData || groupIdsContracts.length === 0) return [];

    const result: ActionIdWithGroupIds[] = [];
    groupIdsData.forEach((item, index) => {
      if (item?.status === 'success' && item.result) {
        const actionId = contractIndexToActionIdMap.get(index);
        if (actionId === undefined) return;

        const groupIds = item.result as bigint[];
        // 只返回有激活链群的 actionId
        if (groupIds.length > 0) {
          result.push({
            actionId,
            groupIds,
          });
        }
      }
    });
    return result;
  }, [groupIdsData, groupIdsContracts, contractIndexToActionIdMap]);

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

    // 步骤1.5：获取扩展地址
    if (isExtensionsPending) return true;

    // 如果没有有效的扩展地址，isPending 为 false
    if (extensionAddressMap.size === 0) return false;

    // 步骤2：获取链群NFT列表
    return isGroupIdsPending;
  }, [
    tokenAddress,
    account,
    isActionIdsPending,
    actionIds,
    isExtensionsPending,
    extensionAddressMap.size,
    isGroupIdsPending,
  ]);

  // ==========================================
  // 错误处理
  // ==========================================

  const error = actionIdsError || extensionsError || groupIdsError;

  // ==========================================
  // 返回结果
  // ==========================================

  return {
    actionIdsWithGroupIds,
    isPending,
    error,
  };
}

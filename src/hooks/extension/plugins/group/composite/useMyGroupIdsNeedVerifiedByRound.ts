/**
 * 获取账户在指定轮次内所有待验证的链群信息 Hook
 *
 * 功能：
 * 1. 通过 LOVE20Group.balanceOf 获取账户拥有的链群 NFT 总数
 * 2. 通过 LOVE20Group.tokenOfOwnerByIndex 批量获取所有 groupIds
 * 3. 通过 GroupJoin.gActionIdsByTokenAddressByGroupId 批量获取每个 groupId 对应的行动 IDs
 * 4. 通过 useExtensionsByActionIdsWithCache 获取所有 actionIds 对应的扩展信息
 * 5. 批量调用 GroupVerify.isVerified 检查每个链群是否已验证
 * 6. 批量调用 GroupJoin.accountsByGroupIdCount 获取每个链群的账户数量
 * 7. 批量调用 GroupVerify.capacityDecayRateByGroupId 获取每个链群在该轮次的容量衰减率
 * 8. 计算 needToVerify：如果未验证且地址数>0，则为true（参与地址数为空时，虽然未验证但也不需要验证）
 *
 * 性能优化：
 * - 使用批量 RPC 调用优化性能
 * - 所有派生计算使用 useMemo 缓存
 * - 在每个步骤检查数据是否为空，及时返回
 *
 * 使用示例：
 * ```typescript
 * const { groups, isPending, error } = useMyGroupIdsNeedVerifiedByRound({
 *   account: '0x...',
 *   round: BigInt(10)
 * });
 * ```
 */

import { useMemo, useContext } from 'react';
import { useReadContracts } from 'wagmi';
import { TokenContext } from '@/src/contexts/TokenContext';
import { LOVE20GroupAbi } from '@/src/abis/LOVE20Group';
import { GroupVerifyAbi } from '@/src/abis/GroupVerify';
import { GroupJoinAbi } from '@/src/abis/GroupJoin';
import { useExtensionsByActionIdsWithCache } from '@/src/hooks/extension/base/composite/useExtensionsByActionIdsWithCache';
import { useBalanceOf } from '@/src/hooks/extension/base/contracts/useLOVE20Group';
import { safeToBigInt } from '@/src/lib/clientUtils';

// ==================== 类型定义 ====================

/**
 * 链群验证信息
 */
export interface GroupNeedVerifyInfo {
  /** 链群ID */
  groupId: bigint;
  /** 扩展地址 */
  extensionAddress: `0x${string}`;
  /** 行动ID */
  actionId: bigint;
  /** 是否已验证 */
  isVerified: boolean;
  /** 是否需要验证：如果未验证且地址数>0，则为true */
  needToVerify: boolean;
  /** 容量衰减率（WAD 1e18 比例，1e18 = 100%） */
  capacityDecayRate: bigint | undefined;
}

/**
 * Hook 参数
 */
export interface UseMyGroupIdsNeedVerifiedByRoundParams {
  /** 账户地址 */
  account: `0x${string}` | undefined;
  /** 验证轮次 */
  round: bigint | undefined;
}

/**
 * Hook 返回值
 */
export interface UseMyGroupIdsNeedVerifiedByRoundResult {
  /** 链群验证信息列表 */
  groups: GroupNeedVerifyInfo[];
  /** 加载状态 */
  isPending: boolean;
  /** 错误信息 */
  error: any;
}

/**
 * 内部类型：链群元组（用于构建中间数据结构）
 */
interface GroupTuple {
  actionId: bigint;
  extensionAddress: `0x${string}`;
  groupId: bigint;
}

// ==================== 常量定义 ====================

const LOVE20_GROUP_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP as `0x${string}`;
const GROUP_VERIFY_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_VERIFY as `0x${string}`;
const GROUP_JOIN_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_JOIN as `0x${string}`;

// ==================== Hook 实现 ====================

/**
 * 获取账户在指定轮次内所有待验证的链群信息
 *
 * @param params - Hook 参数
 * @returns 链群验证信息列表
 */
export function useMyGroupIdsNeedVerifiedByRound({
  account,
  round,
}: UseMyGroupIdsNeedVerifiedByRoundParams): UseMyGroupIdsNeedVerifiedByRoundResult {
  // ==========================================
  // 步骤1：获取 token 和 tokenAddress
  // ==========================================

  const { token } = useContext(TokenContext) || {};
  const tokenAddress = token?.address;

  // ==========================================
  // 步骤2：获取账户拥有的链群 NFT 总数
  // ==========================================

  const {
    balance: balanceData,
    isPending: isBalancePending,
    error: balanceError,
  } = useBalanceOf(account!, !!account);

  const balance = balanceData || BigInt(0);

  // ==========================================
  // 步骤3：批量获取所有 groupIds
  // ==========================================

  const groupIdsContracts = useMemo(() => {
    if (!account || balance === BigInt(0)) return [];

    const contracts = [];
    for (let i = 0; i < Number(balance); i++) {
      contracts.push({
        address: LOVE20_GROUP_ADDRESS,
        abi: LOVE20GroupAbi,
        functionName: 'tokenOfOwnerByIndex' as const,
        args: [account, BigInt(i)] as const,
      });
    }
    return contracts;
  }, [account, balance]);

  const {
    data: groupIdsData,
    isPending: isGroupIdsPending,
    error: groupIdsError,
  } = useReadContracts({
    contracts: groupIdsContracts as any,
    query: {
      enabled: !!account && balance > BigInt(0),
    },
  });

  const groupIds = useMemo(() => {
    if (!groupIdsData) return [];

    const ids: bigint[] = [];
    groupIdsData.forEach((item) => {
      if (item?.status === 'success' && item.result) {
        ids.push(safeToBigInt(item.result));
      }
    });
    return ids;
  }, [groupIdsData]);

  // ==========================================
  // 步骤4：批量获取每个 groupId 对应的行动 IDs
  // ==========================================

  const actionIdsByGroupIdContracts = useMemo(() => {
    if (!tokenAddress || groupIds.length === 0) return [];

    return groupIds.map((groupId) => ({
      address: GROUP_JOIN_ADDRESS,
      abi: GroupJoinAbi,
      functionName: 'gActionIdsByTokenAddressByGroupId' as const,
      args: [tokenAddress, groupId] as const,
    }));
  }, [tokenAddress, groupIds]);

  const {
    data: actionIdsByGroupIdData,
    isPending: isActionIdsByGroupIdPending,
    error: actionIdsByGroupIdError,
  } = useReadContracts({
    contracts: actionIdsByGroupIdContracts as any,
    query: {
      enabled: !!tokenAddress && groupIds.length > 0,
    },
  });

  // 构建 groupId -> actionIds[] 的映射，并收集所有唯一的 actionIds
  const { groupIdToActionIdsMap, allUniqueActionIds } = useMemo(() => {
    const map = new Map<bigint, bigint[]>();
    const actionIdsSet = new Set<bigint>();

    if (!actionIdsByGroupIdData) return { groupIdToActionIdsMap: map, allUniqueActionIds: [] };

    groupIds.forEach((groupId, index) => {
      const item = actionIdsByGroupIdData[index];
      if (item?.status === 'success' && item.result) {
        const actionIds = (item.result as bigint[]).map((id) => safeToBigInt(id));
        map.set(groupId, actionIds);
        actionIds.forEach((actionId) => actionIdsSet.add(actionId));
      }
    });

    return {
      groupIdToActionIdsMap: map,
      allUniqueActionIds: Array.from(actionIdsSet),
    };
  }, [groupIds, actionIdsByGroupIdData]);

  // ==========================================
  // 步骤5：获取所有 actionIds 对应的扩展信息
  // ==========================================

  const {
    extensions: extensionsInfo,
    isPending: isExtensionsPending,
    error: extensionsError,
  } = useExtensionsByActionIdsWithCache({
    token: token!,
    actionIds: allUniqueActionIds,
    enabled: !!token && allUniqueActionIds.length > 0,
  });

  // 构建 actionId -> extensionAddress 的映射（只保留有效的扩展行动）
  const actionIdToExtensionMap = useMemo(() => {
    const map = new Map<bigint, `0x${string}`>();
    extensionsInfo.forEach((info) => {
      if (info.isExtension && info.extensionAddress) {
        map.set(info.actionId, info.extensionAddress);
      }
    });
    return map;
  }, [extensionsInfo]);

  // ==========================================
  // 步骤6：构建中间数据结构 (groupTuples)
  // ==========================================

  const groupTuples = useMemo(() => {
    const tuples: GroupTuple[] = [];

    groupIdToActionIdsMap.forEach((actionIds, groupId) => {
      actionIds.forEach((actionId) => {
        const extensionAddress = actionIdToExtensionMap.get(actionId);
        // 只保留有效的扩展行动
        if (extensionAddress) {
          tuples.push({ actionId, extensionAddress, groupId });
        }
      });
    });

    return tuples;
  }, [groupIdToActionIdsMap, actionIdToExtensionMap]);

  // ==========================================
  // 步骤7：批量检查验证状态、账户数量、容量衰减率（合并为一次调用）
  // ==========================================

  const combinedContracts = useMemo(() => {
    if (round === undefined || groupTuples.length === 0) return [];

    // 先添加所有 isVerified 调用
    const isVerifiedContracts = groupTuples.map(({ extensionAddress, groupId }) => ({
      address: GROUP_VERIFY_ADDRESS,
      abi: GroupVerifyAbi,
      functionName: 'isVerified' as const,
      args: [extensionAddress, round, groupId] as const,
    }));

    // 再添加所有 accountsByGroupIdCount 调用
    const accountCountContracts = groupTuples.map(({ extensionAddress, groupId }) => ({
      address: GROUP_JOIN_ADDRESS,
      abi: GroupJoinAbi,
      functionName: 'accountsByGroupIdCount' as const,
      args: [extensionAddress, round, groupId] as const,
    }));

    // 再添加所有 capacityDecayRateByGroupId 调用
    const capacityDecayRateContracts = groupTuples.map(({ extensionAddress, groupId }) => ({
      address: GROUP_VERIFY_ADDRESS,
      abi: GroupVerifyAbi,
      functionName: 'capacityDecayRateByGroupId' as const,
      args: [extensionAddress, round, groupId] as const,
    }));

    // 合并数组（一次批量 RPC）
    return [...isVerifiedContracts, ...accountCountContracts, ...capacityDecayRateContracts];
  }, [round, groupTuples]);

  const {
    data: combinedData,
    isPending: isCombinedPending,
    error: combinedError,
  } = useReadContracts({
    contracts: combinedContracts as any,
    query: {
      enabled: round !== undefined && groupTuples.length > 0,
    },
  });

  // 从合并结果中分离出 isVerified、accountCount 和 capacityDecayRate 数据
  const isVerifiedData = useMemo(() => {
    if (!combinedData || groupTuples.length === 0) return undefined;
    // 前 groupTuples.length 个结果是 isVerified
    return combinedData.slice(0, groupTuples.length);
  }, [combinedData, groupTuples.length]);

  const accountCountData = useMemo(() => {
    if (!combinedData || groupTuples.length === 0) return undefined;
    // 中间 groupTuples.length 个结果是 accountCount
    return combinedData.slice(groupTuples.length, groupTuples.length * 2);
  }, [combinedData, groupTuples.length]);

  const capacityDecayRateData = useMemo(() => {
    if (!combinedData || groupTuples.length === 0) return undefined;
    // 最后 groupTuples.length 个结果是 capacityDecayRate
    return combinedData.slice(groupTuples.length * 2, groupTuples.length * 3);
  }, [combinedData, groupTuples.length]);

  // ==========================================
  // 步骤8：组装最终结果
  // ==========================================

  const groups = useMemo(() => {
    if (!isVerifiedData || !accountCountData || !capacityDecayRateData || groupTuples.length === 0) return [];

    const result: GroupNeedVerifyInfo[] = [];

    isVerifiedData.forEach((item, index) => {
      if (item?.status === 'success') {
        const { actionId, extensionAddress, groupId } = groupTuples[index];
        const isVerified = item.result as boolean;

        // 获取对应的 accountCount
        const accountCountItem = accountCountData[index];
        const accountCount = accountCountItem?.status === 'success' ? (accountCountItem.result as bigint) : BigInt(0);

        // 获取对应的 capacityDecayRate
        const capacityDecayRateItem = capacityDecayRateData[index];
        const capacityDecayRate =
          capacityDecayRateItem?.status === 'success' ? safeToBigInt(capacityDecayRateItem.result) : undefined;

        // needToVerify: 如果未验证且地址数>0，则为true
        const needToVerify = !isVerified && accountCount > BigInt(0);

        result.push({
          groupId,
          extensionAddress,
          actionId,
          isVerified,
          needToVerify,
          capacityDecayRate,
        });
      }
    });

    return result;
  }, [groupTuples, isVerifiedData, accountCountData, capacityDecayRateData]);

  // ==========================================
  // 步骤9：计算 isPending 状态
  // ==========================================

  const isPending = useMemo(() => {
    // 等待必需参数
    if (!tokenAddress || !account || round === undefined) return true;

    // 步骤2: 获取 balance
    if (isBalancePending) return true;

    // 如果没有链群 NFT，直接返回 false
    if (balance === BigInt(0)) return false;

    // 步骤3: 获取 groupIds
    if (isGroupIdsPending) return true;

    // 如果没有链群，直接返回 false
    if (groupIds.length === 0) return false;

    // 步骤4: 获取每个 groupId 对应的 actionIds
    if (isActionIdsByGroupIdPending) return true;

    // 如果没有有效的 actionIds，直接返回 false
    if (allUniqueActionIds.length === 0) return false;

    // 步骤5: 获取扩展信息
    if (isExtensionsPending) return true;

    // 如果没有有效的 groupTuples，直接返回 false
    if (groupTuples.length === 0) return false;

    // 步骤7: 检查验证状态和账户数量
    return isCombinedPending;
  }, [
    tokenAddress,
    account,
    round,
    isBalancePending,
    balance,
    isGroupIdsPending,
    groupIds.length,
    isActionIdsByGroupIdPending,
    allUniqueActionIds.length,
    isExtensionsPending,
    groupTuples.length,
    isCombinedPending,
  ]);

  // ==========================================
  // 步骤10：错误处理
  // ==========================================

  const error =
    balanceError || groupIdsError || actionIdsByGroupIdError || extensionsError || combinedError || null;

  // ==========================================
  // 步骤11：返回结果
  // ==========================================

  return {
    groups,
    isPending,
    error,
  };
}

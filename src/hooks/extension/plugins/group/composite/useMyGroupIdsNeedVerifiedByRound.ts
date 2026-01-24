/**
 * 获取账户在指定轮次内所有待验证的链群信息 Hook
 *
 * 功能：
 * 1. 使用 ExtensionGroupActionFactory.votedGroupActions 获取当轮有投票且有激活链群的行动列表及扩展地址
 * 2. 批量调用 activeGroupIdsByOwner 获取每个扩展地址下账户拥有的激活链群NFT列表
 * 3. 批量调用 ExtensionGroupAction.isVerified 检查每个链群是否已验证
 * 4. 批量调用 ExtensionGroupAction.accountsByGroupIdByRoundCount 获取每个链群的账户数量
 * 5. 批量调用 GroupVerify.capacityDecayRate 获取每个链群在该轮次的容量衰减率
 * 6. 计算 needToVerify：如果未验证且人数>0，则为true（参与人数为空时，虽然未验证但也不需要验证）
 *
 * 性能优化：
 * - 使用批量 RPC 调用，总共约 4 次调用
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
import { GroupManagerAbi } from '@/src/abis/GroupManager';
import { GroupVerifyAbi } from '@/src/abis/GroupVerify';
import { GroupJoinAbi } from '@/src/abis/GroupJoin';
import { useVotedGroupActions } from '@/src/hooks/extension/plugins/group/contracts/useExtensionGroupActionFactory';
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
  /** 是否需要验证：如果未验证且人数>0，则为true */
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

const GROUP_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_MANAGER as `0x${string}`;
const GROUP_VERIFY_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_VERIFY as `0x${string}`;
const GROUP_JOIN_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_JOIN as `0x${string}`;
const GROUP_ACTION_FACTORY_ADDRESS = process.env
  .NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_ACTION_FACTORY as `0x${string}`;

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
  // 步骤1：获取 tokenAddress
  // ==========================================

  const { token } = useContext(TokenContext) || {};
  const tokenAddress = token?.address;

  // ==========================================
  // 步骤2：获取投票的链群行动
  // ==========================================

  const {
    actionIds,
    extensions,
    isPending: isVotedPending,
    error: votedError,
  } = useVotedGroupActions(GROUP_ACTION_FACTORY_ADDRESS, tokenAddress as `0x${string}`, round as bigint);

  // ==========================================
  // 步骤3：批量获取每个行动的活跃链群NFT
  // ==========================================

  const groupIdsContracts = useMemo(() => {
    if (!account || !extensions || extensions.length === 0) return [];

    return extensions.map((extensionAddress) => ({
      address: GROUP_MANAGER_ADDRESS,
      abi: GroupManagerAbi,
      functionName: 'activeGroupIdsByOwner' as const,
      args: [extensionAddress, account] as const,
    }));
  }, [account, extensions]);

  const {
    data: groupIdsData,
    isPending: isGroupIdsPending,
    error: groupIdsError,
  } = useReadContracts({
    contracts: groupIdsContracts as any,
    query: {
      enabled: !!account && !!extensions && extensions.length > 0,
    },
  });

  // ==========================================
  // 步骤4：构建中间数据结构 (groupTuples)
  // ==========================================

  const groupTuples = useMemo(() => {
    if (!actionIds || !extensions || !groupIdsData) return [];

    const tuples: GroupTuple[] = [];

    groupIdsData.forEach((item, index) => {
      if (item?.status === 'success' && item.result) {
        const actionId = actionIds[index];
        const extensionAddress = extensions[index];
        const groupIds = item.result as bigint[];

        // 为每个 groupId 创建一个元组
        groupIds.forEach((groupId) => {
          tuples.push({ actionId, extensionAddress, groupId });
        });
      }
    });

    return tuples;
  }, [actionIds, extensions, groupIdsData]);

  // ==========================================
  // 步骤5：批量检查验证状态、账户数量、容量衰减率（合并为一次调用）
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

    // 再添加所有 accountsByGroupIdByRoundCount 调用
    const accountCountContracts = groupTuples.map(({ extensionAddress, groupId }) => ({
      address: GROUP_JOIN_ADDRESS,
      abi: GroupJoinAbi,
      functionName: 'accountsByGroupIdByRoundCount' as const,
      args: [extensionAddress, round, groupId] as const,
    }));

    // 再添加所有 capacityDecayRate 调用
    const capacityDecayRateContracts = groupTuples.map(({ extensionAddress, groupId }) => ({
      address: GROUP_VERIFY_ADDRESS,
      abi: GroupVerifyAbi,
      functionName: 'capacityDecayRate' as const,
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

  // 从合并结果中分离出 isVerified 和 accountCount 数据
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
  // 步骤6：组装最终结果
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

        // needToVerify: 如果未验证且人数>0，则为true
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
  // 步骤7：计算 isPending 状态
  // ==========================================

  const isPending = useMemo(() => {
    // 等待必需参数
    if (!tokenAddress || !account || round === undefined) return true;

    // 步骤1: 获取 votedGroupActions
    if (isVotedPending) return true;

    // 如果没有行动，直接返回 false
    if (!actionIds || actionIds.length === 0) return false;

    // 步骤2: 获取链群NFT列表
    if (isGroupIdsPending) return true;

    // 如果没有链群，直接返回 false
    if (groupTuples.length === 0) return false;

    // 步骤3: 检查验证状态和账户数量
    return isCombinedPending;
  }, [tokenAddress, account, round, isVotedPending, actionIds, isGroupIdsPending, groupTuples, isCombinedPending]);

  // ==========================================
  // 步骤8：错误处理
  // ==========================================

  const error = votedError || groupIdsError || combinedError;

  // ==========================================
  // 步骤9：返回结果
  // ==========================================

  return {
    groups,
    isPending,
    error,
  };
}

/**
 * 获取账户在指定轮次内所有待验证的链群信息 Hook
 *
 * 功能：
 * 1. 使用 GroupManager.votedGroupActions 获取当轮有投票且有激活链群的行动列表
 * 2. 批量调用 activeGroupIdsByOwner 获取每个行动下账户拥有的激活链群NFT列表
 * 3. 批量调用 ExtensionGroupAction.isVerified 检查每个链群是否已验证
 * 4. 批量调用 ExtensionGroupAction.accountCountByGroupIdByRound 获取每个链群的账户数量
 * 5. 当账户数量为 0 时，自动将 isVerified 设为 true（因为不需要验证）
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
import { useVotedGroupActions } from '@/src/hooks/extension/plugins/group/contracts/useGroupManager';

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

const GROUP_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_MANAGER as `0x${string}`;
const GROUP_VERIFY_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_VERIFY as `0x${string}`;
const GROUP_JOIN_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_JOIN as `0x${string}`;
const GROUP_ACTION_FACTORY_ADDRESS = process.env
  .NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_FACTORY_GROUP_ACTION as `0x${string}`;

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
  // 步骤5：批量检查验证状态
  // ==========================================

  // 新版合约 isVerified 需要 tokenAddress, actionId, round, groupId 参数，移到 GroupVerify 合约
  const isVerifiedContracts = useMemo(() => {
    if (!tokenAddress || round === undefined || groupTuples.length === 0) return [];

    return groupTuples.map(({ actionId, groupId }) => ({
      address: GROUP_VERIFY_ADDRESS,
      abi: GroupVerifyAbi,
      functionName: 'isVerified' as const,
      args: [tokenAddress, actionId, round, groupId] as const,
    }));
  }, [tokenAddress, round, groupTuples]);

  const {
    data: isVerifiedData,
    isPending: isVerifiedPending,
    error: isVerifiedError,
  } = useReadContracts({
    contracts: isVerifiedContracts as any,
    query: {
      enabled: round !== undefined && groupTuples.length > 0,
    },
  });

  // 批量读取 accountCountByGroupIdByRound
  // 新版合约 accountCountByGroupIdByRound 需要 tokenAddress, actionId, groupId, round 参数，移到 GroupJoin 合约
  const accountCountContracts = useMemo(() => {
    if (!tokenAddress || round === undefined || groupTuples.length === 0) return [];

    return groupTuples.map(({ actionId, groupId }) => ({
      address: GROUP_JOIN_ADDRESS,
      abi: GroupJoinAbi,
      functionName: 'accountCountByGroupIdByRound' as const,
      args: [tokenAddress, actionId, groupId, round] as const,
    }));
  }, [tokenAddress, round, groupTuples]);

  const {
    data: accountCountData,
    isPending: isAccountCountPending,
    error: accountCountError,
  } = useReadContracts({
    contracts: accountCountContracts as any,
    query: {
      enabled: round !== undefined && groupTuples.length > 0,
    },
  });

  // ==========================================
  // 步骤6：组装最终结果
  // ==========================================

  const groups = useMemo(() => {
    if (!isVerifiedData || !accountCountData || groupTuples.length === 0) return [];

    const result: GroupNeedVerifyInfo[] = [];

    isVerifiedData.forEach((item, index) => {
      if (item?.status === 'success') {
        const { actionId, extensionAddress, groupId } = groupTuples[index];
        const isVerified = item.result as boolean;

        // 获取对应的 accountCount
        const accountCountItem = accountCountData[index];
        const accountCount = accountCountItem?.status === 'success' ? (accountCountItem.result as bigint) : BigInt(0);

        // 如果 accountCount 为 0，则不需要验证，将 isVerified 设为 true
        const finalIsVerified = accountCount === BigInt(0) ? true : isVerified;

        result.push({
          groupId,
          extensionAddress,
          actionId,
          isVerified: finalIsVerified,
        });
      }
    });

    return result;
  }, [groupTuples, isVerifiedData, accountCountData]);

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
    return isVerifiedPending || isAccountCountPending;
  }, [
    tokenAddress,
    account,
    round,
    isVotedPending,
    actionIds,
    isGroupIdsPending,
    groupTuples,
    isVerifiedPending,
    isAccountCountPending,
  ]);

  // ==========================================
  // 步骤8：错误处理
  // ==========================================

  const error = votedError || groupIdsError || isVerifiedError || accountCountError;

  // ==========================================
  // 步骤9：返回结果
  // ==========================================

  return {
    groups,
    isPending,
    error,
  };
}

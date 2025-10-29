// hooks/composite/useActionParticipationData.tsx
// 统一获取行动参与数据（自动判断普通行动 vs 扩展行动）

import { useExtension } from '@/src/hooks/contracts/useLOVE20ExtensionCenter';
import { useActionExtensionStats } from './useActionExtensionStats';
import { useActionExtensionUserStatus } from './useActionExtensionUserStatus';

/**
 * 行动参与数据类型（统一接口）
 */
export interface ActionParticipationData {
  // 行动类型
  isExtensionAction: boolean;
  extensionAddress: `0x${string}` | undefined;

  // 参与统计
  participantCount: bigint | undefined;
  totalAmount: bigint | undefined;

  // 用户参与状态
  userJoinedAmount: bigint | undefined;
  isJoined: boolean;

  // 加载状态
  isPending: boolean;
  error: Error | null;
}

/**
 * Hook: 统一获取行动参与数据
 *
 * @param tokenAddress - 代币地址
 * @param actionId - 行动 ID
 * @param account - 用户地址（可选）
 * @param coreData - 普通行动的 core 数据（可选，用于回退）
 * @returns 统一的行动参与数据
 *
 * @description
 * 这是一个高级组合 Hook，它：
 * 1. 自动判断行动类型（普通 vs 扩展）
 * 2. 根据行动类型从对应合约获取数据
 * 3. 返回统一的数据结构
 *
 * 使用示例：
 * ```tsx
 * const {
 *   isExtensionAction,
 *   participantCount,
 *   totalAmount,
 *   userJoinedAmount,
 *   isJoined
 * } = useActionParticipationData(tokenAddress, actionId, account);
 * ```
 */
export function useActionParticipationData(
  tokenAddress: `0x${string}` | undefined,
  actionId: bigint | undefined,
  account?: `0x${string}` | undefined,
  coreData?: {
    participantCount?: bigint;
    totalAmount?: bigint;
    userJoinedAmount?: bigint;
    isJoined?: boolean;
  },
): ActionParticipationData {
  // ==========================================
  // 步骤 1: 判断是否为扩展行动
  // ==========================================
  const { extensionAddress, isPending: isExtensionCheckPending } = useExtension(
    tokenAddress || '0x0000000000000000000000000000000000000000',
    actionId ?? 0n,
  );

  // 判断是否为扩展行动（扩展地址非零地址）
  const isExtensionAction = !!(extensionAddress && extensionAddress !== '0x0000000000000000000000000000000000000000');

  // ==========================================
  // 步骤 2: 获取扩展行动的统计数据
  // ==========================================
  const {
    participantCount: extensionParticipantCount,
    totalAmount: extensionTotalAmount,
    isPending: isExtensionStatsPending,
    error: extensionStatsError,
  } = useActionExtensionStats(isExtensionAction ? extensionAddress : undefined);

  // ==========================================
  // 步骤 3: 获取扩展行动的用户参与状态
  // ==========================================
  const {
    userJoinedAmount: extensionUserJoinedAmount,
    isJoined: extensionIsJoined,
    isPending: isExtensionUserStatusPending,
    error: extensionUserStatusError,
  } = useActionExtensionUserStatus(isExtensionAction ? extensionAddress : undefined, tokenAddress, actionId, account);

  // ==========================================
  // 步骤 4: 整合数据（优先使用扩展数据，回退到 core 数据）
  // ==========================================
  const participantCount = isExtensionAction ? extensionParticipantCount : coreData?.participantCount;

  const totalAmount = isExtensionAction ? extensionTotalAmount : coreData?.totalAmount;

  const userJoinedAmount = isExtensionAction ? extensionUserJoinedAmount : coreData?.userJoinedAmount;

  const isJoined = isExtensionAction ? extensionIsJoined : coreData?.isJoined ?? false;

  // ==========================================
  // 步骤 5: 汇总加载状态和错误
  // ==========================================
  const isPending =
    isExtensionCheckPending || (isExtensionAction && (isExtensionStatsPending || isExtensionUserStatusPending));

  const error = extensionStatsError || extensionUserStatusError || null;

  return {
    isExtensionAction,
    extensionAddress: isExtensionAction ? extensionAddress : undefined,
    participantCount,
    totalAmount,
    userJoinedAmount,
    isJoined,
    isPending,
    error,
  };
}

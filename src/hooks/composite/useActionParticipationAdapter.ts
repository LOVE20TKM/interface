/**
 * 行动参与数据适配器（支持扩展）
 *
 * 职责：
 * - 自动判断行动是否为扩展行动（使用 useExtensionContractInfo）
 * - 扩展行动：从扩展合约获取数据
 * - 普通行动：使用传入的基础数据
 * - 返回统一的数据接口
 *
 * 使用示例：
 * ```typescript
 * // 在 useActionDetailData 中使用
 * const participationData = useActionParticipationAdapter(
 *   tokenAddress,
 *   actionInfo,
 *   account,
 *   {
 *     participantCount: basicData.participantCount,
 *     totalAmount: basicData.totalAmount,
 *     userJoinedAmount: basicData.userJoinedAmount,
 *     isJoined: basicData.isJoined,
 *   }
 * );
 * ```
 */

import { useMemo } from 'react';
import { useExtensionParticipationData, useExtensionContractInfo } from '@/src/hooks/extension/base/composite';
import { ActionInfo } from '@/src/types/love20types';

// ==================== 类型定义 ====================

/**
 * 基础行动参与数据（从 Submit/Join 合约查询）
 */
export interface CoreParticipationData {
  /** 参与者数量 */
  participantCount?: bigint;
  /** 总参与金额 */
  totalAmount?: bigint;
  /** 用户参与金额 */
  userJoinedAmount?: bigint;
  /** 用户是否已参与 */
  isJoined?: boolean;
}

/**
 * 行动参与数据（统一接口）
 */
export interface ActionParticipationData {
  /** 是否为扩展行动 */
  isExtensionAction: boolean;
  /** 扩展合约地址（仅扩展行动有值） */
  extensionAddress: `0x${string}` | undefined;
  /** 参与者数量 */
  participantCount: bigint | undefined;
  /** 总参与金额 */
  totalAmount: bigint | undefined;
  /** 用户参与金额 */
  userJoinedAmount: bigint | undefined;
  /** 用户是否已参与 */
  isJoined: boolean;
  /** 加载状态 */
  isPending: boolean;
  /** 错误信息 */
  error: Error | null;
}

// ==================== Hook 实现 ====================

/**
 * 获取行动参与数据（自动适配扩展）
 *
 * @param tokenAddress - 代币地址
 * @param actionInfo - 行动信息（用于判断是否为扩展行动）
 * @param account - 用户地址（可选）
 * @param coreData - 基础行动数据（从 Submit/Join 合约查询的数据）
 * @returns 统一的行动参与数据
 *
 * @description
 * 工作流程：
 * 1. 使用 useExtensionContractInfo 判断该行动是否为扩展行动
 * 2. 如果是扩展行动：调用 useExtensionParticipationData 获取扩展数据
 * 3. 如果是普通行动：直接使用传入的 coreData
 * 4. 返回统一的数据结构
 *
 * 设计理念：
 * - 使用统一的扩展判断逻辑（useExtensionContractInfo）
 * - 这个 Hook 不负责查询普通行动的数据
 * - 普通行动的数据由调用者查询后通过 coreData 传入
 * - 这样避免重复查询，提高性能
 */
export function useActionParticipationAdapter(
  tokenAddress: `0x${string}` | undefined,
  actionInfo: ActionInfo | undefined,
  account?: `0x${string}` | undefined,
  coreData?: CoreParticipationData,
): ActionParticipationData {
  // ==========================================
  // 步骤 1: 使用 useExtensionContractInfo 判断是否为扩展行动
  // ==========================================
  const { contractInfo, isPending: isExtensionCheckPending } = useExtensionContractInfo({
    tokenAddress,
    actionInfo,
  });

  // 判断是否为扩展行动
  const isExtensionAction = useMemo(() => {
    return contractInfo?.isExtension ?? false;
  }, [contractInfo]);

  // 获取扩展合约地址
  const extensionAddress = useMemo(() => {
    return contractInfo?.extension;
  }, [contractInfo]);

  // ==========================================
  // 步骤 2: 获取扩展行动的数据
  // ==========================================
  const actionId = useMemo(() => actionInfo?.head?.id, [actionInfo]);

  const extensionData = useExtensionParticipationData(
    isExtensionAction ? extensionAddress : undefined,
    tokenAddress,
    actionId,
    account,
  );

  // ==========================================
  // 步骤 3: 整合数据（扩展数据优先，回退到基础数据）
  // ==========================================
  const finalData = useMemo<ActionParticipationData>(() => {
    return {
      // 行动类型信息
      isExtensionAction,
      extensionAddress: isExtensionAction ? extensionAddress : undefined,

      // 参与统计（扩展优先，回退到 core）
      participantCount: isExtensionAction ? extensionData.participantCount : coreData?.participantCount,
      totalAmount: isExtensionAction ? extensionData.totalAmount : coreData?.totalAmount,

      // 用户参与状态（扩展优先，回退到 core）
      userJoinedAmount: isExtensionAction ? extensionData.userJoinedAmount : coreData?.userJoinedAmount,
      isJoined: isExtensionAction ? extensionData.isJoined : coreData?.isJoined ?? false,

      // 加载状态（包括：扩展判断、扩展数据查询）
      isPending: isExtensionCheckPending || (isExtensionAction && extensionData.isPending),

      // 错误信息（仅在扩展行动时传递扩展数据的错误）
      error: isExtensionAction ? extensionData.error : null,
    };
  }, [isExtensionAction, extensionAddress, extensionData, coreData, isExtensionCheckPending]);

  return finalData;
}

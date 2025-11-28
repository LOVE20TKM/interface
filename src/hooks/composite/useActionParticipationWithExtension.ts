/**
 * 行动参与数据适配器（支持扩展）
 *
 * 职责：
 * - 自动判断行动是否为扩展行动
 * - 扩展行动：从扩展合约获取数据
 * - 普通行动：使用传入的基础数据
 * - 返回统一的数据接口
 *
 * 使用示例：
 * ```typescript
 * // 在 useActionDetailData 中使用
 * const participationData = useActionParticipationWithExtension(
 *   tokenAddress,
 *   actionId,
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
import { useExtension } from '@/src/hooks/extension/base/contracts';
import { useExtensionParticipationData, useIsExtensionContract } from '@/src/hooks/extension/base/composite';
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
 * @param actionId - 行动 ID
 * @param account - 用户地址（可选）
 * @param actionInfo - 行动基本信息（用于判断白名单地址是否是扩展合约）
 * @param coreData - 基础行动数据（从 Submit/Join 合约查询的数据）
 * @returns 统一的行动参与数据
 *
 * @description
 * 工作流程：
 * 1. 查询该行动是否绑定了扩展合约（从 center 查询）
 * 2. 如果未注册到 center，但行动设置了白名单且无人参与，检查白名单地址是否是扩展合约
 * 3. 如果是扩展行动：调用 useExtensionParticipationData 获取扩展数据
 * 4. 如果是普通行动：直接使用传入的 coreData
 * 5. 返回统一的数据结构
 *
 * 设计理念：
 * - 支持未注册的扩展行动（在第一个用户 join 之前）
 * - 这个 Hook 不负责查询普通行动的数据
 * - 普通行动的数据由调用者查询后通过 coreData 传入
 * - 这样避免重复查询，提高性能
 */
export function useActionParticipationWithExtension(
  tokenAddress: `0x${string}` | undefined,
  actionId: bigint | undefined,
  account?: `0x${string}` | undefined,
  actionInfo?: ActionInfo,
  coreData?: CoreParticipationData,
): ActionParticipationData {
  // ==========================================
  // 步骤 1: 从 center 查询是否已注册为扩展行动
  // ==========================================
  const { extensionAddress: registeredExtensionAddress, isPending: isExtensionCheckPending } = useExtension(
    tokenAddress || '0x0000000000000000000000000000000000000000',
    actionId ?? BigInt(0),
  );

  // 判断是否已注册（扩展地址非零地址）
  const isRegistered = useMemo(() => {
    return !!(
      registeredExtensionAddress && registeredExtensionAddress !== '0x0000000000000000000000000000000000000000'
    );
  }, [registeredExtensionAddress]);

  // ==========================================
  // 步骤 2: 检查白名单地址是否是未注册的扩展合约
  // ==========================================
  // 只有在未注册、有白名单、且无人参与时才检查
  const shouldCheckWhitelistAddress = useMemo(() => {
    if (isRegistered) return false; // 已注册，不需要检查
    if (!actionInfo?.body?.whiteListAddress) return false; // 没有白名单

    const whiteListAddress = actionInfo.body.whiteListAddress;
    if (whiteListAddress === '0x0000000000000000000000000000000000000000') {
      return false; // 零地址，不是白名单
    }

    // 检查是否无人参与（participantCount 为 0 或 undefined）
    const participantCount = coreData?.participantCount ?? BigInt(0);
    return participantCount === BigInt(0);
  }, [isRegistered, actionInfo, coreData?.participantCount]);

  const whitelistAddress = shouldCheckWhitelistAddress ? actionInfo?.body?.whiteListAddress : undefined;

  // 检查白名单地址是否是扩展合约
  const { isExtensionContract, isPending: isCheckingWhitelist } = useIsExtensionContract(whitelistAddress);

  // ==========================================
  // 步骤 3: 确定最终的扩展地址和状态
  // ==========================================
  const extensionAddress = useMemo(() => {
    // 1. 如果已注册，使用注册的地址
    if (isRegistered) {
      return registeredExtensionAddress;
    }
    // 2. 如果白名单地址是扩展合约，使用白名单地址
    if (isExtensionContract) {
      return whitelistAddress;
    }
    // 3. 否则不是扩展行动
    return undefined;
  }, [isRegistered, registeredExtensionAddress, isExtensionContract, whitelistAddress]);

  // 判断是否为扩展行动
  const isExtensionAction = useMemo(() => {
    return !!extensionAddress;
  }, [extensionAddress]);

  // ==========================================
  // 步骤 4: 获取扩展行动的数据
  // ==========================================
  const extensionData = useExtensionParticipationData(
    isExtensionAction ? extensionAddress : undefined,
    tokenAddress,
    actionId,
    account,
  );

  // ==========================================
  // 步骤 5: 整合数据（扩展数据优先，回退到基础数据）
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

      // 加载状态（包括：center查询、白名单检查（仅在需要时）、扩展数据查询）
      isPending:
        isExtensionCheckPending ||
        (shouldCheckWhitelistAddress && isCheckingWhitelist) ||
        (isExtensionAction && extensionData.isPending),

      // 错误信息（仅在扩展行动时传递扩展数据的错误）
      error: isExtensionAction ? extensionData.error : null,
    };
  }, [
    isExtensionAction,
    extensionAddress,
    extensionData,
    coreData,
    isExtensionCheckPending,
    shouldCheckWhitelistAddress,
    isCheckingWhitelist,
  ]);

  return finalData;
}

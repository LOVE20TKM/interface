/**
 * 获取行动的扩展合约地址
 *
 * 职责：
 * - 自动判断行动是否绑定了扩展合约
 * - 优先从 center 查询已注册的扩展地址
 * - 如果未注册，检查行动的白名单地址是否是扩展合约
 * - 返回统一的扩展地址接口
 *
 * 使用示例：
 * ```typescript
 * const {
 *   extensionAddress,
 *   isPending,
 *   error,
 * } = useExtensionAddressOfAction(
 *   tokenAddress,
 *   actionId,
 *   actionInfo
 * );
 * ```
 */

import { useMemo } from 'react';
import { useExtension } from '@/src/hooks/extension/base/contracts/useLOVE20ExtensionCenter';
import { useIsExtensionContract } from '@/src/hooks/extension/base/composite/useIsExtensionContract';
import { ActionInfo } from '@/src/types/love20types';

/**
 * 获取行动的扩展合约地址
 *
 * @param tokenAddress - 代币地址
 * @param actionId - 行动 ID
 * @param actionInfo - 行动基本信息（用于判断白名单地址是否是扩展合约）
 * @returns 扩展合约地址、加载状态和错误信息
 *
 * @description
 * 工作流程：
 * 1. 查询该行动是否绑定了扩展合约（从 center 查询）
 * 2. 如果未注册到 center，检查行动的白名单地址是否是扩展合约
 * 3. 返回最终的扩展地址
 *
 * 设计理念：
 * - 支持未注册的扩展行动（在第一个用户 join 之前）
 * - 优先使用 center 中注册的地址（更可靠）
 * - 回退到检查白名单地址（支持未注册场景）
 */
export function useExtensionAddressOfAction(
  tokenAddress: `0x${string}` | undefined,
  actionId: bigint | undefined,
  actionInfo?: ActionInfo,
): {
  extensionAddress: `0x${string}` | undefined;
  isPending: boolean;
  error: Error | null;
} {
  // ==========================================
  // 步骤 1: 从 center 查询是否已注册为扩展行动
  // ==========================================
  const {
    extensionAddress: registeredExtensionAddress,
    isPending: isExtensionCheckPending,
    error: extensionError,
  } = useExtension(tokenAddress || '0x0000000000000000000000000000000000000000', actionId ?? BigInt(0));

  // 判断是否已注册（扩展地址非零地址）
  const isRegistered = useMemo(() => {
    return !!(
      registeredExtensionAddress && registeredExtensionAddress !== '0x0000000000000000000000000000000000000000'
    );
  }, [registeredExtensionAddress]);

  // ==========================================
  // 步骤 2: 检查白名单地址是否是未注册的扩展合约
  // ==========================================
  // 只有在未注册且有白名单时才检查
  const shouldCheckWhitelistAddress = useMemo(() => {
    if (isRegistered) return false; // 已注册，不需要检查
    if (!actionInfo?.body?.whiteListAddress) return false; // 没有白名单

    const whiteListAddress = actionInfo.body.whiteListAddress;
    if (whiteListAddress === '0x0000000000000000000000000000000000000000') {
      return false; // 零地址，不是白名单
    }

    return true;
  }, [isRegistered, actionInfo]);

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

  // ==========================================
  // 步骤 4: 整合返回结果
  // ==========================================
  const result = useMemo(
    () => ({
      extensionAddress,
      isPending: isExtensionCheckPending || (shouldCheckWhitelistAddress && isCheckingWhitelist),
      error: extensionError || null,
    }),
    [extensionAddress, isExtensionCheckPending, shouldCheckWhitelistAddress, isCheckingWhitelist, extensionError],
  );

  return result;
}

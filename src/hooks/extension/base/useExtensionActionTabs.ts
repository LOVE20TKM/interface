/**
 * useExtensionActionTabs - 获取扩展行动详情页标签配置的 Hook
 *
 * 功能：
 * 1. 根据扩展地址获取 factory 地址
 * 2. 根据 factory 地址从配置中获取静态标签配置
 * 3. 根据显示条件过滤并返回静态标签
 */

import { useMemo } from 'react';

// my hooks
import { useExtensionFactory } from '@/src/hooks/extension/base/contracts/useIExtension';

// my config
import {
  getExtensionConfigByFactory,
  ActionTabConfig,
  TabShowCondition,
  ExtensionType,
} from '@/src/config/extensionConfig';

/**
 * Hook 参数接口
 */
interface UseExtensionActionTabsParams {
  extensionAddress?: `0x${string}`; // 扩展合约地址
  isExtensionAction?: boolean; // 是否为扩展行动
  account?: `0x${string}`; // 当前用户地址
}

/**
 * Hook 返回值接口
 */
interface UseExtensionActionTabsResult {
  tabs: { key: string; label: string }[]; // 应显示的标签列表
  isPending: boolean; // 是否正在加载
  extensionType: ExtensionType | null; // 扩展类型
}

/**
 * 检查标签显示条件
 * @param condition - 显示条件
 * @param context - 运行时上下文
 */
const checkShowCondition = (
  condition: TabShowCondition | undefined,
  context: { isExtensionAction?: boolean },
): boolean => {
  const effectiveCondition = condition || 'hasExtension';

  switch (effectiveCondition) {
    case 'always':
      return true;
    case 'hasExtension':
      return !!context.isExtensionAction;
    default:
      return false;
  }
};

/**
 * 获取扩展行动详情页标签配置的 Hook
 *
 * @param params - Hook 参数
 * @returns 标签列表和加载状态
 *
 * @example
 * ```tsx
 * const { tabs, isPending } = useExtensionActionTabs({
 *   extensionAddress: '0x...',
 *   isExtensionAction: true,
 *   tokenAddress: '0x...',
 *   actionId: BigInt(1),
 *   account: '0x...',
 * });
 * ```
 */
export const useExtensionActionTabs = (params: UseExtensionActionTabsParams): UseExtensionActionTabsResult => {
  const { extensionAddress, isExtensionAction, account } = params;

  // 获取扩展合约的 factory 地址
  const { factory: factoryAddress, isPending: isFactoryPending } = useExtensionFactory(
    extensionAddress as `0x${string}`,
  );

  // 获取扩展配置和类型
  const extensionConfig = useMemo(() => {
    if (!factoryAddress) return null;
    return getExtensionConfigByFactory(factoryAddress);
  }, [factoryAddress]);

  const extensionType = extensionConfig?.type || null;

  // 计算静态标签
  const staticTabs = useMemo(() => {
    // 如果没有扩展地址或不是扩展行动，返回空数组
    if (!extensionAddress || !isExtensionAction) {
      return [];
    }

    // 如果还在加载 factory 地址，返回空数组
    if (isFactoryPending || !factoryAddress) {
      return [];
    }

    // 获取扩展配置
    if (!extensionConfig || !extensionConfig.actionDetailTabs) {
      return [];
    }

    // 运行时上下文
    const context = { isExtensionAction };

    // 根据条件过滤标签
    return extensionConfig.actionDetailTabs
      .filter((tabConfig: ActionTabConfig) => checkShowCondition(tabConfig.showCondition, context))
      .map((tabConfig: ActionTabConfig) => ({
        key: tabConfig.key,
        label: tabConfig.label,
      }));
  }, [extensionAddress, isExtensionAction, isFactoryPending, factoryAddress, extensionConfig]);

  // 返回静态标签
  const tabs = useMemo(() => {
    return staticTabs;
  }, [staticTabs]);

  // 计算是否正在加载
  const isPending = useMemo(() => {
    return isFactoryPending;
  }, [isFactoryPending]);

  return {
    tabs,
    isPending,
    extensionType,
  };
};

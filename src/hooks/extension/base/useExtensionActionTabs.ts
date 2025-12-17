/**
 * useExtensionActionTabs - 获取扩展行动详情页标签配置的 Hook
 *
 * 功能：
 * 1. 根据扩展地址获取 factory 地址
 * 2. 根据 factory 地址从配置中获取静态标签配置
 * 3. 根据扩展类型调用对应的动态标签 hook
 * 4. 合并静态标签和动态标签
 */

import { useMemo } from 'react';

// my hooks
import { useFactory } from '@/src/hooks/extension/plugins/lp/contracts';
import { useGroupActionDynamicTabs } from '@/src/hooks/extension/plugins/group';

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
  tokenAddress?: `0x${string}`; // Token 合约地址（用于动态标签判断）
  actionId?: bigint; // 行动 ID（用于动态标签判断）
  account?: `0x${string}`; // 当前用户地址（用于动态标签判断）
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
  const { extensionAddress, isExtensionAction, tokenAddress, actionId, account } = params;

  // 获取扩展合约的 factory 地址
  const { factoryAddress, isPending: isFactoryPending } = useFactory(extensionAddress as `0x${string}`);

  // 获取扩展配置和类型
  const extensionConfig = useMemo(() => {
    if (!factoryAddress) return null;
    return getExtensionConfigByFactory(factoryAddress);
  }, [factoryAddress]);

  const extensionType = extensionConfig?.type || null;

  // 调用 GROUP_ACTION 的动态标签 hook
  const { tabs: groupActionDynamicTabs, isPending: isGroupActionPending } = useGroupActionDynamicTabs({
    tokenAddress,
    actionId,
    account,
    enabled: extensionType === ExtensionType.GROUP_ACTION,
  });

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

  // 合并静态标签和动态标签
  const tabs = useMemo(() => {
    const allTabs = [...staticTabs];

    // 根据扩展类型添加动态标签
    if (extensionType === ExtensionType.GROUP_ACTION) {
      allTabs.push(...groupActionDynamicTabs);
    }

    // 未来其他扩展类型的动态标签可以在这里添加
    // if (extensionType === ExtensionType.GROUP_SERVICE) {
    //   allTabs.push(...groupServiceDynamicTabs);
    // }

    return allTabs;
  }, [staticTabs, extensionType, groupActionDynamicTabs]);

  // 计算是否正在加载
  const isPending = useMemo(() => {
    if (isFactoryPending) return true;
    if (extensionType === ExtensionType.GROUP_ACTION && isGroupActionPending) return true;
    return false;
  }, [isFactoryPending, extensionType, isGroupActionPending]);

  return {
    tabs,
    isPending,
    extensionType,
  };
};

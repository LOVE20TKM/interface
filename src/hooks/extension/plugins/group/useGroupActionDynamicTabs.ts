/**
 * useGroupActionDynamicTabs - GROUP_ACTION 类型扩展的动态标签 Hook
 *
 * 功能：
 * 1. 判断当前用户是否是链群服务者
 * 2. 如果是链群服务者，返回额外的 "链群管理" 标签
 * 3. 否则返回空数组
 */

import { useMemo } from 'react';

// my hooks
import { useActiveGroupIdsByOwner } from './contracts';

/**
 * Hook 参数接口
 */
interface UseGroupActionDynamicTabsParams {
  tokenAddress?: `0x${string}`; // Token 合约地址
  actionId?: bigint; // 行动 ID
  account?: `0x${string}`; // 当前用户地址
  enabled?: boolean; // 是否启用（用于条件调用）
}

/**
 * Hook 返回值接口
 */
interface UseGroupActionDynamicTabsResult {
  tabs: { key: string; label: string }[]; // 动态标签列表
  isPending: boolean; // 是否正在加载
  isGroupOwner: boolean; // 是否是链群服务者
}

/**
 * GROUP_ACTION 类型扩展的动态标签 Hook
 *
 * 根据用户是否是链群服务者，返回额外的 "链群管理" 标签
 *
 * @param params - Hook 参数
 * @returns 动态标签列表和加载状态
 *
 * @example
 * ```tsx
 * const { tabs, isPending, isGroupOwner } = useGroupActionDynamicTabs({
 *   tokenAddress: '0x...',
 *   actionId: BigInt(1),
 *   account: '0x...',
 *   enabled: true,
 * });
 * ```
 */
export const useGroupActionDynamicTabs = (params: UseGroupActionDynamicTabsParams): UseGroupActionDynamicTabsResult => {
  const { tokenAddress, actionId, account, enabled = true } = params;

  // 判断参数是否完整
  const isParamsValid = !!tokenAddress && actionId !== undefined && !!account && enabled;

  // 获取当前用户作为链群服务者的活跃链群 ID 列表
  const { activeGroupIds, isPending } = useActiveGroupIdsByOwner(
    tokenAddress as `0x${string}`,
    actionId as bigint,
    account as `0x${string}`,
  );

  // 判断是否是链群服务者（拥有至少一个活跃链群）
  const isGroupOwner = useMemo(() => {
    if (!isParamsValid || isPending) {
      return false;
    }
    return !!activeGroupIds && activeGroupIds.length > 0;
  }, [isParamsValid, isPending, activeGroupIds]);

  // 计算动态标签
  const tabs = useMemo(() => {
    if (!isParamsValid) {
      return [];
    }

    // 如果是链群服务者，返回 "链群管理" 标签
    if (isGroupOwner) {
      return [{ key: 'group-manage', label: '链群管理' }];
    }

    return [];
  }, [isParamsValid, isGroupOwner]);

  return {
    tabs,
    isPending: isParamsValid ? isPending : false,
    isGroupOwner,
  };
};

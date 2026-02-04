/**
 * 单个行动指定轮次范围激励数据 Hook
 *
 * 功能：
 * 1. 自动判断是普通行动还是扩展行动
 * 2. 根据行动类型查询对应的激励数据
 * 3. 统一返回格式，简化页面逻辑
 *
 * 使用场景：行动激励详情页（带分页）
 *
 * 使用示例：
 * ```typescript
 * const {
 *   extensionInfo,
 *   rewards,
 *   isLoadingRewards,
 *   isExtensionAction,
 *   isLoading,
 * } = useActionRewardsByRounds({
 *   tokenAddress: token?.address,
 *   actionId,
 *   startRound,
 *   endRound,
 *   enabled: isInitialized,
 * });
 * ```
 */

import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useActionRewardsByAccountByActionIdByRounds } from '@/src/hooks/contracts/useLOVE20MintViewer';
import {
  useExtensionByActionInfoWithCache,
  ExtensionContractInfo,
} from '@/src/hooks/extension/base/composite/useExtensionsByActionInfosWithCache';
import { useExtensionActionRewardsByRounds } from '@/src/hooks/extension/base/composite/useExtensionActionRewardsByRounds';
import { ActionInfo } from '@/src/types/love20types';

/**
 * 统一的激励数据格式
 * 扩展行动返回 mintReward + burnReward，普通行动使用 reward 映射到 mintReward
 */
export interface ActionReward {
  round: bigint;
  /** 铸造激励（普通行动 reward 映射到此字段） */
  mintReward: bigint;
  /** 销毁激励（普通行动此值为 0） */
  burnReward: bigint;
  /** 是否已领取/铸造 */
  claimed: boolean;
}

/**
 * Hook 参数
 */
export interface UseActionRewardsByRoundsParams {
  /** 代币地址 */
  tokenAddress: `0x${string}` | undefined;
  /** 行动信息 */
  actionInfo: ActionInfo | undefined;
  /** 起始轮次 */
  startRound: bigint;
  /** 结束轮次 */
  endRound: bigint;
  /** 是否启用查询（允许页面控制查询时机） */
  enabled: boolean;
}

/**
 * Hook 返回值
 */
export interface UseActionRewardsByRoundsResult {
  /** 扩展信息 */
  extensionInfo?: ExtensionContractInfo;
  /** 是否正在加载扩展信息 */
  isLoadingExtensionInfo: boolean;
  /** 扩展信息查询错误 */
  errorExtensionInfo: any;

  /** 激励数据（统一格式） */
  rewards: ActionReward[];
  /** 是否正在加载激励数据 */
  isLoadingRewards: boolean;
  /** 激励数据查询错误 */
  errorRewards: any;

  /** 是否为扩展行动 */
  isExtensionAction: boolean;
  /** 总加载状态 */
  isLoading: boolean;
  /** 手动刷新函数 */
  refetch: () => void;
}

/**
 * 查询单个行动指定轮次范围的激励数据
 *
 * @param tokenAddress 代币地址
 * @param actionInfo 行动信息
 * @param startRound 起始轮次
 * @param endRound 结束轮次
 * @param enabled 是否启用查询
 * @returns 激励数据和加载状态
 */
export const useActionRewardsByRounds = ({
  tokenAddress,
  actionInfo,
  startRound,
  endRound,
  enabled,
}: UseActionRewardsByRoundsParams): UseActionRewardsByRoundsResult => {
  const { address: account } = useAccount();

  const actionId = actionInfo?.head.id;

  // 第1步：查询扩展合约信息（判断行动类型）
  const {
    contractInfo: extensionInfo,
    isPending: isLoadingExtensionInfo,
    error: errorExtensionInfo,
  } = useExtensionByActionInfoWithCache({
    tokenAddress,
    actionInfo,
  });

  const isExtensionAction = extensionInfo?.isExtension || false;

  // 第2步：查询普通激励（如果不是扩展行动）
  const {
    rewards: coreRewards,
    isPending: isLoadingCoreRewards,
    error: errorLoadingCoreRewards,
    refetch: coreRefetch,
  } = useActionRewardsByAccountByActionIdByRounds(
    !isExtensionAction && enabled && tokenAddress ? tokenAddress : ('0x0' as `0x${string}`),
    !isExtensionAction && enabled && account ? account : ('0x0' as `0x${string}`),
    !isExtensionAction && enabled && actionId !== undefined ? actionId : BigInt(0),
    !isExtensionAction && enabled ? startRound : BigInt(0),
    !isExtensionAction && enabled ? endRound : BigInt(0),
  );

  // 第3步：查询扩展激励（如果是扩展行动）
  const {
    rewards: extensionRewards,
    isPending: isLoadingExtensionRewards,
    error: errorLoadingExtensionRewards,
    refetch: extensionRefetch,
  } = useExtensionActionRewardsByRounds({
    extensionAddress: extensionInfo?.extension,
    startRound,
    endRound,
    enabled: isExtensionAction && enabled,
  });

  // 第4步：合并返回统一格式
  const rewards = useMemo<ActionReward[]>(() => {
    if (isExtensionAction) {
      // 扩展行动直接使用新格式
      return extensionRewards || [];
    }
    // 普通行动：将旧格式映射到新格式
    return (coreRewards || []).map((r) => ({
      round: r.round,
      mintReward: r.reward,
      burnReward: BigInt(0),
      claimed: r.isMinted,
    }));
  }, [isExtensionAction, extensionRewards, coreRewards]);

  const isLoadingRewards = isExtensionAction ? isLoadingExtensionRewards : isLoadingCoreRewards;
  const errorRewards = isExtensionAction ? errorLoadingExtensionRewards : errorLoadingCoreRewards;
  const isLoading = isLoadingExtensionInfo || isLoadingRewards;

  // 统一的 refetch 函数，根据行动类型调用对应的 refetch
  const refetch = useMemo(() => {
    return () => {
      if (isExtensionAction) {
        extensionRefetch?.();
      } else {
        coreRefetch?.();
      }
    };
  }, [isExtensionAction, extensionRefetch, coreRefetch]);

  return {
    extensionInfo,
    isLoadingExtensionInfo,
    errorExtensionInfo,
    rewards,
    isLoadingRewards,
    errorRewards,
    isExtensionAction,
    isLoading,
    refetch,
  };
};

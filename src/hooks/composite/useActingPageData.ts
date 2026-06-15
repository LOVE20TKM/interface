import { useAccount } from 'wagmi';
import { useJoinableActions } from '@/src/hooks/contracts/useLOVE20RoundViewer';
import { useEstimatedActionRewardOfCurrentRound } from '@/src/hooks/contracts/useLOVE20MintViewer';
import { useExtensionsBaseData } from '@/src/hooks/extension';
import {
  mergeJoinableActionsWithExtensionData,
  type ActingPageJoinableAction,
} from '@/src/lib/actingPageData';
import { useMemo } from 'react';

export type { ActingPageJoinableAction } from '@/src/lib/actingPageData';

export interface UseActingPageDataParams {
  tokenAddress: `0x${string}` | undefined;
  currentRound: bigint;
}

export interface UseActingPageDataResult {
  // 行动列表相关
  joinableActions: ActingPageJoinableAction[] | undefined;

  // 统计数据相关
  totalJoinedAmount: bigint; // 含 LP 扩展行动的 ×2 溢价（适用于行动页展示）
  totalJoinedAmountSingleSide: bigint; // 去掉 LP ×2 溢价的单边量（适用于代币占比统计）
  expectedReward: bigint | undefined;

  // 加载状态
  isPending: boolean;
  isPendingActions: boolean;
  isPendingExtension: boolean;
  isPendingReward: boolean;

  // 错误信息
  error: any;
  errorActions: any;
  errorExtension: any;
  errorReward: any;
}

/**
 * 行动页面数据聚合Hook
 *
 * 功能：
 * 1. 获取用户可参与的行动列表
 * 2. 自动查询扩展行动的基础数据（accountsCount, convertedJoinedValue, isConvertedJoinedValueSuccess）
 * 3. 用扩展数据增强行动列表（覆盖 joinedAmount）
 * 4. 提供统一的加载状态和错误处理
 *
 * @param tokenAddress 代币地址
 * @param currentRound 当前轮次
 * @returns 增强后的行动列表、统计数据、加载状态和错误信息
 */
export const useActingPageData = ({ tokenAddress, currentRound }: UseActingPageDataParams): UseActingPageDataResult => {
  const { address: account } = useAccount();

  // 获取用户可参与的行动列表
  const {
    joinableActions: rawActions,
    isPending: isPendingActions,
    error: errorActions,
  } = useJoinableActions(tokenAddress || ('' as `0x${string}`), currentRound || BigInt(0), account as `0x${string}`);

  // 提取 actionInfos
  const actionInfos = useMemo(() => {
    return rawActions?.map((action) => action.action) || [];
  }, [rawActions]);

  // 获取扩展行动的基础数据（accountsCount, convertedJoinedValue）
  const {
    baseData: extensionData,
    isPending: isPendingExtension,
    error: errorExtension,
  } = useExtensionsBaseData({
    tokenAddress,
    actionInfos,
  });

  // 增强 joinableActions 数据：用扩展的 convertedJoinedValue 覆盖原始 joinedAmount
  const joinableActions = useMemo(
    () => mergeJoinableActionsWithExtensionData(rawActions, extensionData),
    [rawActions, extensionData],
  );

  const hasPendingExtensionAmount = useMemo(
    () => joinableActions?.some((action) => action.isExtensionAmountPending) ?? false,
    [joinableActions],
  );

  // 计算所有行动的参与代币数总和（LP 扩展行动含 ×2 溢价，用于行动页展示）
  const totalJoinedAmount = useMemo(() => {
    if (!joinableActions || joinableActions.length === 0) {
      return BigInt(0);
    }

    return joinableActions.reduce((total, action) => {
      return total + action.joinedAmount;
    }, BigInt(0));
  }, [joinableActions]);

  // 计算去掉 LP ×2 溢价的单边参与量（用于代币占比统计，不重复计算 LP 两侧价值）
  const totalJoinedAmountSingleSide = useMemo(() => {
    if (!joinableActions || joinableActions.length === 0) {
      return BigInt(0);
    }

    return joinableActions.reduce((total, action) => {
      // 仅 LP 类型扩展行动的 convertedJoinedValue 含 ×2 溢价，此处还原为单边量
      // 注：rawActions 直接返回时无 isFromTokenLP 字段，故用 in 运算符安全检测
      const isLP = 'isFromTokenLP' in action && action.isFromTokenLP === true;
      const amount = isLP ? action.joinedAmount / BigInt(2) : action.joinedAmount;
      return total + amount;
    }, BigInt(0));
  }, [joinableActions]);

  // 获取预计新增铸币
  const {
    reward: expectedReward,
    isPending: isPendingReward,
    error: errorReward,
  } = useEstimatedActionRewardOfCurrentRound(tokenAddress || ('' as `0x${string}`));

  return {
    // 行动列表相关
    joinableActions,

    // 统计数据相关
    totalJoinedAmount,
    totalJoinedAmountSingleSide,
    expectedReward,

    // 加载状态
    isPending: isPendingActions || isPendingExtension || hasPendingExtensionAmount || isPendingReward,
    isPendingActions,
    isPendingExtension: isPendingExtension || hasPendingExtensionAmount,
    isPendingReward,

    // 错误信息
    error: errorActions || errorExtension || errorReward,
    errorActions,
    errorExtension,
    errorReward,
  };
};

import { useAccount } from 'wagmi';
import { useJoinableActions } from '@/src/hooks/contracts/useLOVE20RoundViewer';
import { useEstimatedActionRewardOfCurrentRound } from '@/src/hooks/contracts/useLOVE20MintViewer';
import { useExtensionsBaseData } from '@/src/hooks/extension';
import { useMemo } from 'react';

export interface UseActingPageDataParams {
  tokenAddress: `0x${string}` | undefined;
  currentRound: bigint;
}

export interface UseActingPageDataResult {
  // 行动列表相关（已增强扩展数据）
  joinableActions: any[] | undefined;

  // 统计数据相关
  totalJoinedAmount: bigint;
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
 * 2. 自动查询扩展行动的基础数据（accountsCount, joinedValue）
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

  // 提取 actionIds
  const actionIds = useMemo(() => {
    return rawActions?.map((action) => action.action.head.id) || [];
  }, [rawActions]);

  // 获取扩展行动的基础数据（accountsCount, joinedValue）
  const {
    baseData: extensionData,
    isPending: isPendingExtension,
    error: errorExtension,
  } = useExtensionsBaseData({
    tokenAddress,
    actionIds,
  });

  // 增强 joinableActions 数据：用扩展的 joinedValue 覆盖原始 joinedAmount
  const joinableActions = useMemo(() => {
    if (!rawActions) return undefined;
    if (!extensionData || extensionData.length === 0) return rawActions;

    return rawActions.map((action, index) => {
      const extension = extensionData[index];

      // 如果是扩展行动且有 joinedValue 数据，使用扩展数据覆盖
      if (extension?.isExtension && extension.joinedValue !== undefined) {
        return {
          ...action,
          joinedAmount: extension.joinedValue, // 使用扩展的参与值
          accountsCount: extension.accountsCount, // 添加参与人数
          isExtension: true,
          extensionAddress: extension.extension,
        };
      }

      // 非扩展行动，返回原始数据
      return {
        ...action,
        isExtension: false,
      };
    });
  }, [rawActions, extensionData]);

  // 计算所有行动的参与代币数总和
  const totalJoinedAmount = useMemo(() => {
    if (!joinableActions || joinableActions.length === 0) {
      return BigInt(0);
    }

    return joinableActions.reduce((total, action) => {
      return total + action.joinedAmount;
    }, BigInt(0));
  }, [joinableActions]);

  // 获取预计新增铸币
  const {
    reward: expectedReward,
    isPending: isPendingReward,
    error: errorReward,
  } = useEstimatedActionRewardOfCurrentRound(tokenAddress || ('' as `0x${string}`));

  return {
    // 行动列表相关（已增强扩展数据）
    joinableActions,

    // 统计数据相关
    totalJoinedAmount,
    expectedReward,

    // 加载状态
    isPending: isPendingActions || isPendingExtension || isPendingReward,
    isPendingActions,
    isPendingExtension,
    isPendingReward,

    // 错误信息
    error: errorActions || errorExtension || errorReward,
    errorActions,
    errorExtension,
    errorReward,
  };
};

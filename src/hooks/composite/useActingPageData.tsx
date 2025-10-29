import { useAccount } from 'wagmi';
import { useJoinableActions } from '@/src/hooks/contracts/useLOVE20RoundViewer';
import { useEstimatedActionRewardOfCurrentRound } from '@/src/hooks/contracts/useLOVE20MintViewer';
import { useActionsJoinedAmount } from './useActionsJoinedAmount';
import { useMemo } from 'react';

export interface UseActingPageDataParams {
  tokenAddress: `0x${string}` | undefined;
  currentRound: bigint;
}

export interface UseActingPageDataResult {
  // 行动列表相关
  joinableActions: any[] | undefined;
  getJoinedAmount: (index: number) => bigint;

  // 统计数据相关
  totalJoinedAmount: bigint;
  expectedReward: bigint | undefined;

  // 加载状态
  isPending: boolean;
  isPendingActions: boolean;
  isPendingJoinedAmount: boolean;
  isPendingReward: boolean;

  // 错误信息
  error: any;
  errorActions: any;
  errorJoinedAmount: any;
  errorReward: any;
}

/**
 * 行动页面数据聚合Hook
 *
 * 功能：
 * 1. 统一获取页面所需的所有数据
 * 2. 避免子组件重复调用相同的 hooks
 * 3. 提供统一的加载状态和错误处理
 *
 * @param tokenAddress 代币地址
 * @param currentRound 当前轮次
 * @returns 页面所需的所有数据、加载状态和错误信息
 */
export const useActingPageData = ({ tokenAddress, currentRound }: UseActingPageDataParams): UseActingPageDataResult => {
  const { address: account } = useAccount();

  // 获取用户可参与的行动列表
  const {
    joinableActions,
    isPending: isPendingActions,
    error: errorActions,
  } = useJoinableActions(tokenAddress || ('' as `0x${string}`), currentRound || BigInt(0), account as `0x${string}`);

  // 获取每个行动的参与代币数（自动处理扩展协议）
  const {
    getJoinedAmount,
    isPending: isPendingJoinedAmount,
    error: errorJoinedAmount,
  } = useActionsJoinedAmount({
    tokenAddress,
    joinableActions,
  });

  // 计算所有行动的参与代币数总和
  const totalJoinedAmount = useMemo(() => {
    if (!joinableActions || joinableActions.length === 0) {
      return BigInt(0);
    }

    return joinableActions.reduce((total, _, index) => {
      return total + getJoinedAmount(index);
    }, BigInt(0));
  }, [joinableActions, getJoinedAmount]);

  // 获取预计新增铸币
  const {
    reward: expectedReward,
    isPending: isPendingReward,
    error: errorReward,
  } = useEstimatedActionRewardOfCurrentRound(tokenAddress || ('' as `0x${string}`));

  return {
    // 行动列表相关
    joinableActions,
    getJoinedAmount,

    // 统计数据相关
    totalJoinedAmount,
    expectedReward,

    // 加载状态
    isPending: isPendingActions || isPendingJoinedAmount || isPendingReward,
    isPendingActions,
    isPendingJoinedAmount,
    isPendingReward,

    // 错误信息
    error: errorActions || errorJoinedAmount || errorReward,
    errorActions,
    errorJoinedAmount,
    errorReward,
  };
};

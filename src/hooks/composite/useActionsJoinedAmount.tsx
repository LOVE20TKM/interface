import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionStakeLpAbi } from '@/src/abis/LOVE20ExtensionStakeLp';
import { JoinableAction } from '@/src/types/love20types';
import { useActionsExtensionInfo } from './useActionsExtensionInfo';

export interface UseActionsJoinedAmountParams {
  tokenAddress: `0x${string}` | undefined;
  joinableActions: JoinableAction[] | undefined;
}

export interface UseActionsJoinedAmountResult {
  getJoinedAmount: (index: number) => bigint;
  isPending: boolean;
  error: any;
}

/**
 * 批量获取行动参与代币数的复合Hook
 *
 * 功能：
 * 1. 自动获取行动的扩展信息
 * 2. 如果行动有扩展协议，批量查询扩展协议的 joinedValue
 * 3. 如果行动没有扩展协议，使用原来的 joinedAmount
 * 4. 提供统一的 getJoinedAmount 方法获取参与代币数
 *
 * @param tokenAddress 代币地址
 * @param joinableActions 可参与的行动列表
 * @returns getJoinedAmount 方法、加载状态和错误信息
 */
export const useActionsJoinedAmount = ({
  tokenAddress,
  joinableActions,
}: UseActionsJoinedAmountParams): UseActionsJoinedAmountResult => {
  // 获取行动的扩展信息
  const actionIds = useMemo(() => {
    return joinableActions?.map((action) => action.action.head.id) || [];
  }, [joinableActions]);

  const {
    extensionInfos,
    isPending: isPendingExtension,
    error: errorExtension,
  } = useActionsExtensionInfo({
    tokenAddress,
    actionIds,
  });
  // 批量获取扩展协议的 joinedValue
  const extensionContracts = useMemo(() => {
    if (!extensionInfos || extensionInfos.length === 0) return [];

    return extensionInfos
      .filter((info) => info.isExtension && info.extensionAddress)
      .map((info) => ({
        address: info.extensionAddress!,
        abi: LOVE20ExtensionStakeLpAbi,
        functionName: 'joinedValue',
        args: [],
      }));
  }, [extensionInfos]);

  const {
    data: extensionJoinedValues,
    isPending: isPendingJoinedValues,
    error: errorJoinedValues,
  } = useReadContracts({
    contracts: extensionContracts as any,
    query: {
      enabled: extensionContracts.length > 0,
    },
  });

  /**
   * 获取指定行动的参与代币数
   * 如果行动有扩展协议，使用扩展协议的 joinedValue
   * 否则使用原来的 joinedAmount
   */
  const getJoinedAmount = useMemo(
    () =>
      (index: number): bigint => {
        if (!joinableActions || !extensionInfos || index >= joinableActions.length) {
          return BigInt(0);
        }

        const extensionInfo = extensionInfos[index];

        // 如果有扩展协议，使用扩展协议的值
        if (extensionInfo?.isExtension && extensionInfo.extensionAddress) {
          // 找到对应的扩展值索引
          const extensionIndex = extensionInfos
            .slice(0, index)
            .filter((info) => info.isExtension && info.extensionAddress).length;

          const extensionValue = extensionJoinedValues?.[extensionIndex]?.result;
          if (extensionValue !== undefined && extensionValue !== null) {
            return BigInt(extensionValue.toString());
          }
        }

        // 没有扩展协议或扩展值未加载，使用原来的值
        return joinableActions[index].joinedAmount;
      },
    [joinableActions, extensionInfos, extensionJoinedValues],
  );

  return {
    getJoinedAmount,
    isPending: isPendingExtension || isPendingJoinedValues,
    error: errorExtension || errorJoinedValues,
  };
};

'use client';

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { useExtensions } from '@/src/hooks/contracts/useLOVE20ExtensionCenter';
import { LOVE20ExtensionCenterAbi } from '@/src/abis/LOVE20ExtensionCenter';
import { LOVE20RoundViewerAbi } from '@/src/abis/LOVE20RoundViewer';
import { ActionInfo } from '@/src/types/love20types';
import { safeToBigInt } from '@/src/lib/clientUtils';

const EXTENSION_CENTER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_CENTER as `0x${string}`;
const ROUND_VIEWER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PERIPHERAL_ROUNDVIEWER as `0x${string}`;

export interface ExtensionActionData {
  extensionAddress: `0x${string}`;
  actionId: bigint;
  actionInfo?: ActionInfo;
}

/**
 * 获取扩展行动的完整信息
 * 使用批量合约调用优化性能
 *
 * 流程：
 * 1. 获取所有扩展地址
 * 2. 批量获取每个扩展的actionId和tokenAddress
 * 3. 批量获取行动详细信息
 */
export const useExtensionActionsFullData = (tokenAddress: `0x${string}`) => {
  // 步骤1: 获取所有扩展地址
  const { extensions, isPending: extensionsPending, error: extensionsError } = useExtensions(tokenAddress);

  // 调试日志
  console.log('useExtensionActionsFullData - tokenAddress:', tokenAddress);
  console.log('useExtensionActionsFullData - extensions:', extensions);
  console.log('useExtensionActionsFullData - extensionsPending:', extensionsPending);
  console.log('useExtensionActionsFullData - extensionsError:', extensionsError);

  // 步骤2: 构建批量调用 - 获取每个扩展的extensionInfo
  const extensionInfoContracts = useMemo(() => {
    if (!extensions || extensions.length === 0) return [];

    return extensions.map((extensionAddress) => ({
      address: EXTENSION_CENTER_ADDRESS,
      abi: LOVE20ExtensionCenterAbi,
      functionName: 'extensionInfo' as const,
      args: [extensionAddress],
    }));
  }, [extensions]);

  // 批量获取extensionInfo
  const {
    data: extensionInfosData,
    isPending: isPendingExtensionInfo,
    error: errorExtensionInfo,
  } = useReadContracts({
    contracts: extensionInfoContracts as any,
    query: {
      enabled: !extensionsPending && extensionInfoContracts.length > 0,
    },
  });

  // 步骤3: 解析extensionInfo并提取actionIds
  const { extensionWithActionIds, actionIds } = useMemo(() => {
    if (!extensions || !extensionInfosData || extensionInfosData.length === 0) {
      return { extensionWithActionIds: [], actionIds: [] };
    }

    const extensionData: Array<{ extensionAddress: `0x${string}`; actionId: bigint }> = [];
    const ids: bigint[] = [];

    extensions.forEach((extensionAddress, index) => {
      const result = extensionInfosData[index];
      if (result?.status === 'success' && result.result) {
        const [tokenAddr, actionIdRaw] = result.result as [string, bigint];
        const actionId = safeToBigInt(actionIdRaw);

        if (actionId !== undefined) {
          extensionData.push({ extensionAddress, actionId });
          ids.push(actionId);
        }
      }
    });

    return { extensionWithActionIds: extensionData, actionIds: ids };
  }, [extensions, extensionInfosData]);

  // 步骤4: 构建批量调用 - 获取行动详细信息
  const actionInfosContract = useMemo(() => {
    if (!tokenAddress || actionIds.length === 0) return [];

    return [
      {
        address: ROUND_VIEWER_ADDRESS,
        abi: LOVE20RoundViewerAbi,
        functionName: 'actionInfosByIds' as const,
        args: [tokenAddress, actionIds],
      },
    ];
  }, [tokenAddress, actionIds]);

  // 批量获取行动信息
  const {
    data: actionInfosData,
    isPending: isPendingActionInfos,
    error: errorActionInfos,
  } = useReadContracts({
    contracts: actionInfosContract as any,
    query: {
      enabled: !extensionsPending && !isPendingExtensionInfo && actionInfosContract.length > 0,
    },
  });

  // 步骤5: 组合最终数据
  const extensionActionsData: ExtensionActionData[] = useMemo(() => {
    if (extensionWithActionIds.length === 0) return [];

    const actionInfos = actionInfosData?.[0]?.status === 'success' ? actionInfosData[0].result : undefined;

    return extensionWithActionIds.map(({ extensionAddress, actionId }, index) => {
      const actionInfo = actionInfos ? (actionInfos as any[])[index] : undefined;

      return {
        extensionAddress,
        actionId,
        actionInfo: actionInfo as ActionInfo | undefined,
      };
    });
  }, [extensionWithActionIds, actionInfosData]);

  // 汇总加载状态和错误
  // 如果没有扩展，直接返回完成状态
  const hasNoExtensions = !extensionsPending && (!extensions || extensions.length === 0);
  const isPending = hasNoExtensions ? false : extensionsPending || isPendingExtensionInfo || isPendingActionInfos;
  const error = extensionsError || errorExtensionInfo || errorActionInfos;

  // 调试日志
  console.log('useExtensionActionsFullData - final state:', {
    hasNoExtensions,
    isPending,
    extensionsPending,
    isPendingExtensionInfo,
    isPendingActionInfos,
    extensionActionsData: extensionActionsData.length,
  });

  return {
    extensionActionsData,
    isPending,
    error,
  };
};

// hooks/extension/plugins/group/composite/useExtensionActionParam.ts
// 缓存获取行动整体实时数据

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20GroupManagerAbi } from '@/src/abis/LOVE20GroupManager';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useExtensionActionConstCache } from './useExtensionActionConstCache';

export interface ExtensionActionParam {
  // 常量数据
  tokenAddress: `0x${string}`;
  stakeTokenAddress: `0x${string}`;
  stakeTokenSymbol: string | undefined;
  joinTokenAddress: `0x${string}`;
  joinTokenSymbol: string | undefined;
  maxJoinAmountRatio: bigint; // 单个行动者最大参与代币占比（wei，1e28=100%）
  maxVerifyCapacityFactor: bigint; // 验证容量系数（wei）
  groupActivationStakeAmount: bigint; // 激活需质押代币数量
  // 实时数据
  joinMaxAmount: bigint; // 单个行动者最大参与代币数
}

export interface UseExtensionActionParamParams {
  actionId: bigint;
  extensionAddress: `0x${string}` | undefined;
}

export interface UseExtensionActionParamResult {
  params: ExtensionActionParam | undefined;
  isPending: boolean;
  error: any;
}

/**
 * Hook: 缓存获取行动整体实时数据
 *
 * 功能：
 * 1. 合并常量缓存数据（包括容量因子）
 * 2. 获取行动(总)单地址参与最大代币数
 * 3. 获取激活需质押代币数量
 */
export const useExtensionActionParam = ({
  actionId,
  extensionAddress,
}: UseExtensionActionParamParams): UseExtensionActionParamResult => {
  // 获取常量缓存数据
  const {
    constants,
    isPending: isConstPending,
    error: constError,
  } = useExtensionActionConstCache({ extensionAddress, actionId });

  // 一次批量读取：joinMaxAmount
  const realtimeContracts = useMemo(() => {
    if (!extensionAddress) return [];
    if (!constants?.tokenAddress) return [];
    if (actionId === undefined) return [];

    const tokenAddress = constants.tokenAddress;
    return [
      {
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_MANAGER,
        abi: LOVE20GroupManagerAbi,
        functionName: 'calculateJoinMaxAmount',
        args: [tokenAddress, actionId],
      },
    ];
  }, [extensionAddress, constants?.tokenAddress, actionId]);

  const {
    data: realtimeData,
    isPending: isRealtimePending,
    error: realtimeError,
  } = useReadContracts({
    contracts: realtimeContracts as any,
    query: {
      enabled: realtimeContracts.length > 0,
    },
  });

  // 合并数据
  const params = useMemo(() => {
    if (!constants) return undefined;
    const joinMaxAmount = realtimeData?.[0]?.result ? safeToBigInt(realtimeData[0].result) : BigInt(0);

    return {
      ...constants,
      joinMaxAmount,
    };
  }, [constants, realtimeData]);

  return {
    params: params as ExtensionActionParam | undefined,
    isPending: isConstPending || isRealtimePending,
    error: constError || realtimeError,
  };
};

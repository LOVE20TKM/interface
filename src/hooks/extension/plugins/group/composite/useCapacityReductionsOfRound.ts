// hooks/extension/plugins/group/composite/useCapacityReductionsOfRound.ts
// 批量获取指定轮次和链群ID列表的容量衰减系数

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { GroupVerifyAbi } from '@/src/abis/GroupVerify';
import { safeToBigInt } from '@/src/lib/clientUtils';

const GROUP_VERIFY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_VERIFY as `0x${string}`;

export interface UseCapacityReductionsOfRoundParams {
  extensionAddress: `0x${string}` | undefined;
  round: bigint | undefined;
  groupIds: bigint[] | undefined;
}

export interface UseCapacityReductionsOfRoundResult {
  capacityReductions: Map<bigint, bigint>; // groupId -> capacityReduction
  isPending: boolean;
  error: any;
}

/**
 * Hook: 批量获取指定轮次和链群ID列表的容量衰减系数
 *
 * 算法：
 * 1. 使用 useReadContracts 批量调用 capacityReductionByGroupId 获取每个链群的容量衰减系数
 * 2. 将结果按 groupId 映射为 Map 返回
 */
export const useCapacityReductionsOfRound = ({
  extensionAddress,
  round,
  groupIds,
}: UseCapacityReductionsOfRoundParams): UseCapacityReductionsOfRoundResult => {
  // 构建批量查询合约调用
  const capacityReductionContracts = useMemo(() => {
    if (!extensionAddress || round === undefined || !groupIds || groupIds.length === 0) return [];

    const contracts = [];
    for (const groupId of groupIds) {
      contracts.push({
        address: GROUP_VERIFY_CONTRACT_ADDRESS,
        abi: GroupVerifyAbi,
        functionName: 'capacityReductionRate' as const,
        args: [extensionAddress, round, groupId],
      });
    }

    return contracts;
  }, [extensionAddress, round, groupIds]);

  const {
    data: capacityReductionData,
    isPending,
    error,
  } = useReadContracts({
    contracts: capacityReductionContracts as any,
    query: {
      enabled:
        !!extensionAddress &&
        round !== undefined &&
        !!groupIds &&
        groupIds.length > 0 &&
        capacityReductionContracts.length > 0,
    },
  });

  // 创建容量衰减系数的 Map，按 groupId 映射
  const capacityReductions = useMemo(() => {
    const map = new Map<bigint, bigint>();
    if (!groupIds || !capacityReductionData || capacityReductionData.length === 0) return map;

    groupIds.forEach((groupId, index) => {
      const result = capacityReductionData[index]?.result;
      if (result !== undefined && result !== null) {
        map.set(groupId, safeToBigInt(result));
      }
    });

    return map;
  }, [groupIds, capacityReductionData]);

  // 计算最终的 pending 状态
  // 如果没有 groupIds 或 contracts 为空，则不需要等待查询
  const finalIsPending = useMemo(() => {
    if (!groupIds || groupIds.length === 0) return false;
    if (capacityReductionContracts.length === 0) return false;
    return isPending;
  }, [groupIds, capacityReductionContracts.length, isPending]);

  return {
    capacityReductions,
    isPending: finalIsPending,
    error,
  };
};

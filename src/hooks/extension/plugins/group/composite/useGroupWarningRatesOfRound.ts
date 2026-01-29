// hooks/extension/plugins/group/composite/useGroupWarningRatesOfRound.ts
// 获取指定轮次、指定链群的不信任率与验证衰减率（批量 RPC）

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { GroupVerifyAbi } from '@/src/abis/GroupVerify';
import { safeToBigInt } from '@/src/lib/clientUtils';

const GROUP_VERIFY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_VERIFY as `0x${string}`;

export interface UseGroupWarningRatesOfRoundParams {
  extensionAddress: `0x${string}` | undefined;
  round: bigint | undefined;
  groupId: bigint | undefined;
}

export interface UseGroupWarningRatesOfRoundResult {
  /** 不信任率（WAD 1e18 比例，1e18 = 100%） */
  distrustRate: bigint | undefined;
  /** 验证衰减率（WAD 1e18 比例，1e18 = 100%） */
  capacityDecayRate: bigint | undefined;
  isPending: boolean;
  error: any;
}

/**
 * Hook：批量读取链群警告所需的两个比例
 *
 * - distrustRateByGroupId(extension, round, groupId)
 * - capacityDecayRate(extension, round, groupId)
 */
export function useGroupWarningRatesOfRound({
  extensionAddress,
  round,
  groupId,
}: UseGroupWarningRatesOfRoundParams): UseGroupWarningRatesOfRoundResult {
  const contracts = useMemo(() => {
    if (!extensionAddress || !round || !groupId) return [];

    return [
      {
        address: GROUP_VERIFY_CONTRACT_ADDRESS,
        abi: GroupVerifyAbi,
        functionName: 'distrustRateByGroupId' as const,
        args: [extensionAddress, round, groupId] as const,
      },
      {
        address: GROUP_VERIFY_CONTRACT_ADDRESS,
        abi: GroupVerifyAbi,
        functionName: 'capacityDecayRateByGroupId' as const,
        args: [extensionAddress, round, groupId] as const,
      },
    ];
  }, [extensionAddress, round, groupId]);

  const { data, isPending, error } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: contracts.length > 0,
    },
  });

  const result = useMemo(() => {
    if (!data || data.length < 2) {
      return {
        distrustRate: undefined,
        capacityDecayRate: undefined,
      };
    }

    return {
      distrustRate: data[0]?.status === 'success' ? safeToBigInt(data[0]?.result) : undefined,
      capacityDecayRate: data[1]?.status === 'success' ? safeToBigInt(data[1]?.result) : undefined,
    };
  }, [data]);

  const finalIsPending = useMemo(() => {
    if (contracts.length === 0) return false;
    return isPending;
  }, [contracts.length, isPending]);

  return {
    distrustRate: result.distrustRate,
    capacityDecayRate: result.capacityDecayRate,
    isPending: finalIsPending,
    error,
  };
}

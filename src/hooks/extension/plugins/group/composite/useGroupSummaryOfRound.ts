// hooks/extension/plugins/group/composite/useGroupSummaryOfRound.ts
// 批量获取某轮某群的汇总数据（总激励、总得分、总参与代币数）

import { useMemo } from 'react';
import { useUniversalReadContracts } from '@/src/lib/universalReadContract';
import { ExtensionGroupActionAbi } from '@/src/abis/ExtensionGroupAction';
import { GroupVerifyAbi } from '@/src/abis/GroupVerify';
import { GroupJoinAbi } from '@/src/abis/GroupJoin';
import { safeToBigInt } from '@/src/lib/clientUtils';

const GROUP_VERIFY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_VERIFY as `0x${string}`;
const GROUP_JOIN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_JOIN as `0x${string}`;

export interface UseGroupSummaryOfRoundParams {
  extensionAddress: `0x${string}` | undefined;
  round: bigint | undefined;
  groupId: bigint | undefined;
}

export interface UseGroupSummaryOfRoundResult {
  totalReward: bigint;
  totalFinalScore: bigint;
  totalJoinedAmount: bigint;
  isPending: boolean;
  error: any;
}

/**
 * Hook: 批量获取某轮某群的 3 个汇总数据
 * - generatedActionRewardByGroupId → 总激励
 * - totalAccountScore → 总得分
 * - totalJoinedAmountByGroupId → 总参与代币数
 */
export const useGroupSummaryOfRound = ({
  extensionAddress,
  round,
  groupId,
}: UseGroupSummaryOfRoundParams): UseGroupSummaryOfRoundResult => {
  const contracts = useMemo(() => {
    if (!extensionAddress || round === undefined || groupId === undefined) return [];

    return [
      {
        address: extensionAddress,
        abi: ExtensionGroupActionAbi,
        functionName: 'generatedActionRewardByGroupId',
        args: [round, groupId],
      },
      {
        address: GROUP_VERIFY_CONTRACT_ADDRESS,
        abi: GroupVerifyAbi,
        functionName: 'totalAccountScore',
        args: [extensionAddress, round, groupId],
      },
      {
        address: GROUP_JOIN_CONTRACT_ADDRESS,
        abi: GroupJoinAbi,
        functionName: 'totalJoinedAmountByGroupId',
        args: [extensionAddress, round, groupId],
      },
    ];
  }, [extensionAddress, round, groupId]);

  const { data, isPending, error } = useUniversalReadContracts({
    contracts: contracts as any,
    query: {
      enabled: !!extensionAddress && !!round && groupId !== undefined && contracts.length > 0,
    },
  });

  const totalReward = useMemo(() => safeToBigInt(data?.[0]?.result), [data]);
  const totalFinalScore = useMemo(() => safeToBigInt(data?.[1]?.result), [data]);
  const totalJoinedAmount = useMemo(() => safeToBigInt(data?.[2]?.result), [data]);

  return {
    totalReward,
    totalFinalScore,
    totalJoinedAmount,
    isPending,
    error,
  };
};

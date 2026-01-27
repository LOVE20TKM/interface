// hooks/extension/plugins/group/composite/useGroupActionRewardsExtra.ts
// 批量获取链群行动中用户在多个轮次的得分和链群ID

import { useMemo } from 'react';
import { useReadContracts, useAccount } from 'wagmi';
import { GroupVerifyAbi } from '@/src/abis/GroupVerify';
import { GroupJoinAbi } from '@/src/abis/GroupJoin';
import { safeToBigInt } from '@/src/lib/clientUtils';

const GROUP_VERIFY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_VERIFY as `0x${string}`;
const GROUP_JOIN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_JOIN as `0x${string}`;

export interface UseGroupActionRewardsExtraParams {
  extensionAddress: `0x${string}` | undefined;
  rounds: bigint[];
  enabled?: boolean;
}

export interface UseGroupActionRewardsExtraResult {
  scoreMap: Map<string, bigint>; // key = round.toString(), value = score
  groupIdMap: Map<string, bigint>; // key = round.toString(), value = groupId
  isPending: boolean;
  error: any;
}

/**
 * Hook: 批量获取链群行动中用户在多个轮次的得分和链群ID
 *
 * 使用 useReadContracts 批量调用：
 * 1. GroupVerify.originScoreByAccount(extension, round, account) - 获取得分
 * 2. GroupJoin.groupIdByAccountByRound(extension, round, account) - 获取链群ID
 */
export const useGroupActionRewardsExtra = ({
  extensionAddress,
  rounds,
  enabled = true,
}: UseGroupActionRewardsExtraParams): UseGroupActionRewardsExtraResult => {
  const { address: account } = useAccount();

  // 构建批量调用合约（得分 + 链群ID）
  const contracts = useMemo(() => {
    if (!extensionAddress || !account || rounds.length === 0 || !enabled) {
      return [];
    }

    const allContracts = [];
    for (const round of rounds) {
      // 查询得分
      allContracts.push({
        address: GROUP_VERIFY_CONTRACT_ADDRESS,
        abi: GroupVerifyAbi,
        functionName: 'originScoreByAccount',
        args: [extensionAddress, round, account],
      });
      // 查询链群ID
      allContracts.push({
        address: GROUP_JOIN_CONTRACT_ADDRESS,
        abi: GroupJoinAbi,
        functionName: 'groupIdByAccountByRound',
        args: [extensionAddress, round, account],
      });
    }
    return allContracts;
  }, [extensionAddress, account, rounds, enabled]);

  const {
    data: allData,
    isPending,
    error,
  } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: enabled && contracts.length > 0,
    },
  });

  // 解析数据，构建 Map
  const scoreMap = useMemo(() => {
    const result = new Map<string, bigint>();

    if (!allData || rounds.length === 0) {
      return result;
    }

    // 每个轮次有2个查询结果：得分（索引 0, 2, 4...）和链群ID（索引 1, 3, 5...）
    for (let i = 0; i < rounds.length; i++) {
      const scoreIndex = i * 2;
      const score = safeToBigInt(allData[scoreIndex]?.result);
      result.set(rounds[i].toString(), score);
    }

    return result;
  }, [allData, rounds]);

  const groupIdMap = useMemo(() => {
    const result = new Map<string, bigint>();

    if (!allData || rounds.length === 0) {
      return result;
    }

    // 每个轮次有2个查询结果：得分（索引 0, 2, 4...）和链群ID（索引 1, 3, 5...）
    for (let i = 0; i < rounds.length; i++) {
      const groupIdIndex = i * 2 + 1;
      const groupId = safeToBigInt(allData[groupIdIndex]?.result);
      result.set(rounds[i].toString(), groupId);
    }

    return result;
  }, [allData, rounds]);

  return {
    scoreMap,
    groupIdMap,
    isPending: enabled && contracts.length > 0 ? isPending : false,
    error,
  };
};

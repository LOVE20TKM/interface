// hooks/extension/plugins/lp/composite/useLpRewardsExtra.ts
// 批量获取LP行动中用户在多个轮次的溢出激励（burnReward）

import { useMemo } from 'react';
import { useReadContracts, useAccount } from 'wagmi';
import { ExtensionLpAbi } from '@/src/abis/ExtensionLp';
import { safeToBigInt } from '@/src/lib/clientUtils';

export interface UseLpRewardsExtraParams {
  extensionAddress: `0x${string}` | undefined;
  rounds: bigint[];
  enabled?: boolean;
}

export interface UseLpRewardsExtraResult {
  burnRewardMap: Map<string, bigint>; // key = round.toString(), value = burnReward
  isPending: boolean;
  error: any;
}

/**
 * Hook: 批量获取LP行动中用户在多个轮次的溢出激励
 *
 * 使用 useReadContracts 批量调用 ExtensionLp.rewardInfoByAccount(round, account)
 * 返回值: (mintReward, burnReward, isClaimed)，我们只需要 burnReward
 */
export const useLpRewardsExtra = ({
  extensionAddress,
  rounds,
  enabled = true,
}: UseLpRewardsExtraParams): UseLpRewardsExtraResult => {
  const { address: account } = useAccount();

  // 构建批量调用合约
  const contracts = useMemo(() => {
    if (!extensionAddress || !account || rounds.length === 0 || !enabled) {
      return [];
    }

    return rounds.map((round) => ({
      address: extensionAddress,
      abi: ExtensionLpAbi,
      functionName: 'rewardInfoByAccount',
      args: [round, account],
    }));
  }, [extensionAddress, account, rounds, enabled]);

  const {
    data: rewardData,
    isPending,
    error,
  } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: enabled && contracts.length > 0,
    },
  });

  // 解析数据，构建 Map
  // rewardInfoByAccount 返回 (mintReward, burnReward, isClaimed)
  const burnRewardMap = useMemo(() => {
    const result = new Map<string, bigint>();

    if (!rewardData || rounds.length === 0) {
      return result;
    }

    for (let i = 0; i < rounds.length; i++) {
      const rewardInfo = rewardData[i]?.result as [bigint, bigint, boolean] | undefined;
      if (rewardInfo) {
        const [, burnReward] = rewardInfo; // 取第二个元素 burnReward
        // 忽略很小的 burnReward 值（小于 1e11 时认为是 0，避免精度误差）
        const rawBurnReward = safeToBigInt(burnReward);
        const filteredBurnReward = rawBurnReward < BigInt(1e11) ? BigInt(0) : rawBurnReward;
        result.set(rounds[i].toString(), filteredBurnReward);
      } else {
        result.set(rounds[i].toString(), BigInt(0));
      }
    }

    return result;
  }, [rewardData, rounds]);

  return {
    burnRewardMap,
    isPending: enabled && contracts.length > 0 ? isPending : false,
    error,
  };
};

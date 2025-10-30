import { useMemo } from 'react';
import { useAccount, useReadContracts } from 'wagmi';
import { LOVE20ExtensionStakeLpAbi } from '@/src/abis/LOVE20ExtensionStakeLp';
import { LOVE20JoinAbi } from '@/src/abis/LOVE20Join';
import { safeToBigInt } from '@/src/lib/clientUtils';

const JOIN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_JOIN as `0x${string}`;

export interface StakeLpReward {
  extensionAddress: `0x${string}`;
  round: bigint;
  reward: bigint;
  isMinted: boolean;
}

export interface UseStakeLpRewardsByLastRoundsParams {
  extensionAddresses: `0x${string}`[];
  lastRounds: bigint;
}

export interface UseStakeLpRewardsByLastRoundsResult {
  rewardsMap: Map<`0x${string}`, StakeLpReward[]>;
  isPending: boolean;
  error: any;
}

/**
 * 批量获取质押LP扩展行动的激励数据
 *
 * 功能：
 * 1. 获取当前轮次
 * 2. 批量查询多个扩展合约的最近N轮激励
 * 3. 按扩展地址分组返回
 *
 * @param extensionAddresses 扩展合约地址列表
 * @param lastRounds 查询最近多少轮
 * @returns 按扩展地址分组的激励数据
 */
export const useStakeLpRewardsByLastRounds = ({
  extensionAddresses,
  lastRounds,
}: UseStakeLpRewardsByLastRoundsParams): UseStakeLpRewardsByLastRoundsResult => {
  const { address: account } = useAccount();

  // 步骤1: 获取当前轮次
  const currentRoundContract = useMemo(() => {
    return [
      {
        address: JOIN_CONTRACT_ADDRESS,
        abi: LOVE20JoinAbi,
        functionName: 'currentRound',
        args: [],
      },
    ];
  }, []);

  const {
    data: currentRoundData,
    isPending: isPendingCurrentRound,
    error: errorCurrentRound,
  } = useReadContracts({
    contracts: currentRoundContract as any,
    query: {
      enabled: extensionAddresses.length > 0,
    },
  });

  const currentRound = useMemo(() => {
    if (!currentRoundData || currentRoundData.length === 0) return undefined;
    return safeToBigInt(currentRoundData[0]?.result);
  }, [currentRoundData]);

  // 步骤2: 构建批量查询合约列表
  // 为每个扩展地址查询最近 lastRounds 轮的激励
  const rewardContracts = useMemo(() => {
    if (!account || !currentRound || currentRound === BigInt(0) || extensionAddresses.length === 0) {
      return [];
    }

    const contracts: any[] = [];

    for (const extensionAddress of extensionAddresses) {
      // 计算起始轮次
      const startRound = currentRound > lastRounds ? currentRound - lastRounds + BigInt(1) : BigInt(1);

      // 为每一轮创建查询
      for (let round = startRound; round <= currentRound; round++) {
        contracts.push({
          address: extensionAddress,
          abi: LOVE20ExtensionStakeLpAbi,
          functionName: 'rewardByAccount',
          args: [round, account],
        });
      }
    }

    return contracts;
  }, [account, currentRound, extensionAddresses, lastRounds]);

  // 步骤3: 批量查询激励数据
  const {
    data: rewardsData,
    isPending: isPendingRewards,
    error: errorRewards,
  } = useReadContracts({
    contracts: rewardContracts as any,
    query: {
      enabled: rewardContracts.length > 0,
    },
  });

  console.log('rewardsData', rewardsData);
  console.log('extensionAddresses', extensionAddresses);
  console.log('currentRound', currentRound);
  console.log('lastRounds', lastRounds);

  // 步骤4: 解析数据并按扩展地址分组
  const rewardsMap = useMemo(() => {
    const map = new Map<`0x${string}`, StakeLpReward[]>();

    if (!rewardsData || !currentRound || currentRound === BigInt(0)) {
      return map;
    }

    let dataIndex = 0;
    for (const extensionAddress of extensionAddresses) {
      const rewards: StakeLpReward[] = [];

      // 计算起始轮次
      const startRound = currentRound > lastRounds ? currentRound - lastRounds + BigInt(1) : BigInt(1);
      const roundsCount = Number(currentRound - startRound + BigInt(1));

      // 解析该扩展地址的所有轮次数据
      for (let i = 0; i < roundsCount; i++) {
        const result = rewardsData[dataIndex + i];
        if (!result?.result) continue;

        const [reward, isMinted] = result.result as [bigint, boolean];
        const round = startRound + BigInt(i);

        // 只保存有激励的轮次
        if (reward > BigInt(0)) {
          rewards.push({
            extensionAddress,
            round,
            reward: safeToBigInt(reward),
            isMinted: isMinted as boolean,
          });
        }
      }

      // 按轮次倒序排序
      if (rewards.length > 0) {
        rewards.sort((a, b) => (a.round > b.round ? -1 : 1));
      }

      map.set(extensionAddress, rewards);
      dataIndex += roundsCount;
    }

    return map;
  }, [rewardsData, extensionAddresses, currentRound, lastRounds]);

  // 如果没有扩展地址，不需要加载任何数据，直接返回空结果
  const hasExtensions = extensionAddresses.length > 0;
  const isPending = hasExtensions ? isPendingCurrentRound || isPendingRewards : false;
  const error = errorCurrentRound || errorRewards;

  return {
    rewardsMap,
    isPending,
    error,
  };
};

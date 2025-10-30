import { useMemo } from 'react';
import { useAccount, useReadContracts } from 'wagmi';
import { LOVE20ExtensionStakeLpAbi } from '@/src/abis/LOVE20ExtensionStakeLp';
import { safeToBigInt } from '@/src/lib/clientUtils';

export interface ExtensionActionReward {
  round: bigint;
  reward: bigint;
  isMinted: boolean;
}

export interface UseExtensionActionRewardsByRoundsParams {
  extensionAddress: `0x${string}` | undefined;
  factoryAddress: `0x${string}` | undefined;
  startRound: bigint;
  endRound: bigint;
  enabled: boolean;
}

export interface UseExtensionActionRewardsByRoundsResult {
  rewards: ExtensionActionReward[];
  isPending: boolean;
  error: any;
}

/**
 * 根据扩展类型批量获取扩展行动的激励数据
 *
 * 功能：
 * 1. 根据扩展类型（factory地址）使用不同的查询策略
 * 2. 支持质押LP扩展行动
 * 3. 易于扩展：新增扩展类型时只需添加新的分支
 *
 * @param extensionAddress 扩展合约地址
 * @param factoryAddress 扩展工厂地址（用于判断扩展类型）
 * @param startRound 起始轮次
 * @param endRound 结束轮次
 * @param enabled 是否启用查询
 * @returns 激励数据列表、加载状态和错误信息
 */
export const useExtensionActionRewardsByRounds = ({
  extensionAddress,
  factoryAddress,
  startRound,
  endRound,
  enabled,
}: UseExtensionActionRewardsByRoundsParams): UseExtensionActionRewardsByRoundsResult => {
  const { address: account } = useAccount();

  const EXTENSION_FACTORY_STAKELP = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_FACTORY_STAKELP as `0x${string}`;

  // 判断扩展类型
  const extensionType = useMemo(() => {
    if (!factoryAddress) return null;
    if (factoryAddress.toLowerCase() === EXTENSION_FACTORY_STAKELP?.toLowerCase()) {
      return 'STAKE_LP';
    }
    // 未来可以在这里添加其他扩展类型
    return null;
  }, [factoryAddress, EXTENSION_FACTORY_STAKELP]);

  // 构建批量查询合约列表
  const contracts = useMemo(() => {
    if (!extensionAddress || !account || !enabled || !extensionType || endRound < startRound) {
      return [];
    }

    const calls: any[] = [];

    // 根据扩展类型构建不同的查询
    switch (extensionType) {
      case 'STAKE_LP':
        // 质押LP扩展：使用 rewardByAccount 方法
        for (let round = startRound; round <= endRound; round++) {
          calls.push({
            address: extensionAddress,
            abi: LOVE20ExtensionStakeLpAbi,
            functionName: 'rewardByAccount',
            args: [round, account],
          });
        }
        break;

      // 未来可以在这里添加其他扩展类型的查询逻辑
      // case 'OTHER_TYPE':
      //   ...
      //   break;

      default:
        // 未知的扩展类型，不查询
        break;
    }

    return calls;
  }, [extensionAddress, account, enabled, extensionType, startRound, endRound]);

  // 批量查询激励数据
  const {
    data: rewardsData,
    isPending,
    error,
  } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: contracts.length > 0,
    },
  });

  // 解析查询结果
  const rewards = useMemo(() => {
    if (!rewardsData || rewardsData.length === 0) {
      return [];
    }

    const result: ExtensionActionReward[] = [];

    // 根据扩展类型解析不同的返回数据格式
    switch (extensionType) {
      case 'STAKE_LP':
        // 质押LP扩展：rewardByAccount 返回 (reward, isMinted)
        for (let i = 0; i < rewardsData.length; i++) {
          const roundData = rewardsData[i];
          if (!roundData?.result) continue;

          const [reward, isMinted] = roundData.result as [bigint, boolean];
          const round = startRound + BigInt(i);

          result.push({
            round,
            reward: safeToBigInt(reward),
            isMinted: isMinted as boolean,
          });
        }
        break;

      // 未来可以在这里添加其他扩展类型的解析逻辑
      // case 'OTHER_TYPE':
      //   ...
      //   break;

      default:
        // 未知的扩展类型，返回空数组
        break;
    }

    // 按轮次倒序排序
    return result.sort((a, b) => (a.round > b.round ? -1 : 1));
  }, [rewardsData, extensionType, startRound]);

  return {
    rewards,
    isPending,
    error,
  };
};

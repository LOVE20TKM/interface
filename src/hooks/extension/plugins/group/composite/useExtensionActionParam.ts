// hooks/extension/plugins/group/composite/useExtensionActionParam.ts
// 缓存获取行动整体实时数据

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionGroupActionAbi } from '@/src/abis/LOVE20ExtensionGroupAction';
import { LOVE20TokenAbi } from '@/src/abis/LOVE20Token';
import { LOVE20StakeAbi } from '@/src/abis/LOVE20Stake';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useExtensionActionConstCache } from './useExtensionActionConstCache';

export interface ExtensionActionParam {
  // 常量数据
  tokenAddress: `0x${string}`;
  minGovVoteRatioBps: bigint; // 最小治理票占比
  capacityMultiplier: bigint; // 容量倍数
  stakeTokenAddress: `0x${string}`;
  stakingMultiplier: bigint; // 质押倍数
  maxJoinAmountMultiplier: bigint; // 单个行动者最大参与代币数倍数
  minJoinAmount: bigint; // 单个行动者最小参与代币数
  // 实时数据
  joinMaxAmount: bigint; // 单个行动者最大参与代币数
  minStake: bigint; // 最小质押代币量
}

export interface UseExtensionActionParamParams {
  extensionAddress: `0x${string}` | undefined;
}

export interface UseExtensionActionParamResult {
  params: ExtensionActionParam | undefined;
  isPending: boolean;
  error: any;
}

const STAKE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_STAKE as `0x${string}` | undefined;
const BPS_DENOMINATOR = BigInt(10000);

/**
 * 计算链群行动的最小质押量（与合约保持一致）
 *
 * minCapacity = totalMinted * minGovVoteRatioBps * capacityMultiplier / 1e4
 * minStake = minCapacity / stakingMultiplier
 */
function calcMinStake(params: {
  totalMinted: bigint;
  minGovVoteRatioBps: bigint;
  capacityMultiplier: bigint;
  stakingMultiplier: bigint;
}): bigint {
  const { totalMinted, minGovVoteRatioBps, capacityMultiplier, stakingMultiplier } = params;
  if (stakingMultiplier <= BigInt(0)) return BigInt(0);

  const minCapacity = (totalMinted * minGovVoteRatioBps * capacityMultiplier) / BPS_DENOMINATOR;
  return minCapacity / stakingMultiplier;
}

/**
 * Hook: 缓存获取行动整体实时数据
 *
 * 功能：
 * 1. 合并常量缓存数据
 * 2. 获取行动(总)单地址参与最大代币数
 * 3. 计算最小质押量（基于 totalSupply 与扩展常量）
 */
export const useExtensionActionParam = ({
  extensionAddress,
}: UseExtensionActionParamParams): UseExtensionActionParamResult => {
  // 获取常量缓存数据
  const {
    constants,
    isPending: isConstPending,
    error: constError,
  } = useExtensionActionConstCache({ extensionAddress });

  // 一次批量读取：joinMaxAmount + totalSupply + govVotesNum
  // tokenAddress 属于扩展基本常量，由 useExtensionActionConstCache 提供
  const realtimeContracts = useMemo(() => {
    if (!extensionAddress) return [];
    if (!constants?.tokenAddress) return [];
    if (!STAKE_CONTRACT_ADDRESS) return [];

    const tokenAddress = constants.tokenAddress;
    return [
      {
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'calculateJoinMaxAmount',
      },
      {
        address: tokenAddress,
        abi: LOVE20TokenAbi,
        functionName: 'totalSupply',
      },
      // {
      //   address: STAKE_CONTRACT_ADDRESS,
      //   abi: LOVE20StakeAbi,
      //   functionName: 'govVotesNum',
      //   args: [tokenAddress],
      // },
    ];
  }, [extensionAddress, constants?.tokenAddress]);

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
    const totalMinted = realtimeData?.[1]?.result ? safeToBigInt(realtimeData[1].result) : BigInt(0);
    // const totalGovVotes = realtimeData?.[2]?.result ? safeToBigInt(realtimeData[2].result) : BigInt(0);

    const minStake = calcMinStake({
      totalMinted,
      minGovVoteRatioBps: constants.minGovVoteRatioBps,
      capacityMultiplier: constants.capacityMultiplier,
      stakingMultiplier: constants.stakingMultiplier,
    });

    return {
      ...constants,
      joinMaxAmount,
      minStake,
    };
  }, [constants, realtimeData]);

  return {
    params: params as ExtensionActionParam | undefined,
    isPending: isConstPending || isRealtimePending,
    error: constError || realtimeError,
  };
};

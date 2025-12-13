// hooks/extension/plugins/group/composite/useExtensionActionConstCache.ts
// 缓存获取行动基本常量数据

import { useMemo, useEffect } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionGroupActionAbi } from '@/src/abis/LOVE20ExtensionGroupAction';
import { safeToBigInt } from '@/src/lib/clientUtils';

export interface ExtensionActionConst {
  tokenAddress: `0x${string}`;
  minGovVoteRatioBps: bigint; // 最小治理票占比
  capacityMultiplier: bigint; // 容量倍数
  stakeTokenAddress: `0x${string}`;
  stakingMultiplier: bigint; // 质押倍数
  maxJoinAmountMultiplier: bigint; // 单个行动者最大参与代币数倍数
  minJoinAmount: bigint; // 单个行动者最小参与代币数
}

export interface UseExtensionActionConstCacheParams {
  extensionAddress: `0x${string}` | undefined;
}

export interface UseExtensionActionConstCacheResult {
  constants: ExtensionActionConst | undefined;
  isPending: boolean;
  error: any;
}

/**
 * Hook: 缓存获取行动基本常量数据
 *
 * 功能：
 * 1. 批量获取扩展行动的各项常量参数
 * 2. 使用 LocalStorage 缓存数据，减少重复请求
 * 3. 包括：最小治理票占比、容量倍数、质押代币地址、质押倍数、最大参与代币倍数、最小参与代币量
 */
export const useExtensionActionConstCache = ({
  extensionAddress,
}: UseExtensionActionConstCacheParams): UseExtensionActionConstCacheResult => {
  // 尝试从缓存读取
  const cachedData = useMemo(() => {
    if (!extensionAddress) return null;

    try {
      const cacheKey = `extension_const_${extensionAddress}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        const parsed = JSON.parse(cached);
        // 检查缓存是否过期（24小时）
        const cacheTime = parsed.timestamp || 0;
        const now = Date.now();
        if (now - cacheTime < 24 * 60 * 60 * 1000) {
          return {
            tokenAddress: parsed.tokenAddress as `0x${string}`,
            minGovVoteRatioBps: BigInt(parsed.minGovVoteRatioBps),
            capacityMultiplier: BigInt(parsed.capacityMultiplier),
            stakeTokenAddress: parsed.stakeTokenAddress as `0x${string}`,
            stakingMultiplier: BigInt(parsed.stakingMultiplier),
            maxJoinAmountMultiplier: BigInt(parsed.maxJoinAmountMultiplier),
            minJoinAmount: BigInt(parsed.minJoinAmount),
          };
        }
      }
    } catch (error) {
      console.error('Failed to read from cache:', error);
    }

    return null;
  }, [extensionAddress]);

  // 构建批量查询合约
  const contracts = useMemo(() => {
    if (!extensionAddress || cachedData) return [];

    return [
      {
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'tokenAddress',
      },
      {
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'MIN_GOV_VOTE_RATIO_BPS',
      },
      {
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'CAPACITY_MULTIPLIER',
      },
      {
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'STAKE_TOKEN_ADDRESS',
      },
      {
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'STAKING_MULTIPLIER',
      },
      {
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'MAX_JOIN_AMOUNT_MULTIPLIER',
      },
      {
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'MIN_JOIN_AMOUNT',
      },
    ];
  }, [extensionAddress, cachedData]);

  // 批量读取合约数据
  const {
    data: contractData,
    isPending,
    error,
  } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: !!extensionAddress && contracts.length > 0,
    },
  });

  // 解析合约数据
  const constants = useMemo(() => {
    // 如果有缓存数据，直接返回
    if (cachedData) return cachedData;

    // 如果没有合约数据，返回 undefined
    if (!contractData || contractData.length < 7) return undefined;

    return {
      tokenAddress: contractData[0]?.result as `0x${string}`,
      minGovVoteRatioBps: safeToBigInt(contractData[1]?.result),
      capacityMultiplier: safeToBigInt(contractData[2]?.result),
      stakeTokenAddress: contractData[3]?.result as `0x${string}` | undefined,
      stakingMultiplier: safeToBigInt(contractData[4]?.result),
      maxJoinAmountMultiplier: safeToBigInt(contractData[5]?.result),
      minJoinAmount: safeToBigInt(contractData[6]?.result),
    };
  }, [contractData, cachedData]);

  // 缓存数据到 LocalStorage
  useEffect(() => {
    if (!extensionAddress || !constants || cachedData) return;

    try {
      const cacheKey = `extension_const_${extensionAddress}`;
      const cacheValue = {
        tokenAddress: constants.tokenAddress,
        minGovVoteRatioBps: constants.minGovVoteRatioBps?.toString(),
        capacityMultiplier: constants.capacityMultiplier?.toString(),
        stakeTokenAddress: constants.stakeTokenAddress,
        stakingMultiplier: constants.stakingMultiplier?.toString(),
        maxJoinAmountMultiplier: constants.maxJoinAmountMultiplier?.toString(),
        minJoinAmount: constants.minJoinAmount?.toString(),
        timestamp: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheValue));
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  }, [constants, extensionAddress, cachedData]);

  return {
    constants: constants as ExtensionActionConst | undefined,
    isPending: cachedData ? false : isPending,
    error: cachedData ? null : error,
  };
};

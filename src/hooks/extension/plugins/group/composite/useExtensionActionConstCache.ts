// hooks/extension/plugins/group/composite/useExtensionActionConstCache.ts
// 缓存获取行动基本常量数据

import { useMemo, useEffect } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionGroupActionAbi } from '@/src/abis/LOVE20ExtensionGroupAction';
import { safeToBigInt } from '@/src/lib/clientUtils';

export interface ExtensionActionConst {
  tokenAddress: `0x${string}`;
  actionId: bigint;
  stakeTokenAddress: `0x${string}`;
  maxJoinAmountMultiplier: bigint; // 单个行动者最大参与代币数倍数
  verifyCapacityMultiplier: bigint; // 验证容量倍数
}

export interface UseExtensionActionConstCacheParams {
  extensionAddress: `0x${string}` | undefined;
  actionId: bigint | undefined;
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
 * 3. 包括：质押代币地址、最大参与代币倍数、容量因子
 */
export const useExtensionActionConstCache = ({
  extensionAddress,
  actionId,
}: UseExtensionActionConstCacheParams): UseExtensionActionConstCacheResult => {
  // 尝试从缓存读取
  const cachedData = useMemo(() => {
    if (!extensionAddress || actionId === undefined) return null;

    try {
      const cacheKey = `extension_const_${extensionAddress}_${actionId.toString()}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        const parsed = JSON.parse(cached);
        // 检查缓存是否过期（24小时）
        const cacheTime = parsed.timestamp || 0;
        const now = Date.now();
        if (now - cacheTime < 24 * 60 * 60 * 1000) {
          return {
            tokenAddress: parsed.tokenAddress as `0x${string}`,
            actionId: BigInt(parsed.actionId),
            stakeTokenAddress: parsed.stakeTokenAddress as `0x${string}`,
            maxJoinAmountMultiplier: BigInt(parsed.maxJoinAmountMultiplier),
            verifyCapacityMultiplier: BigInt(parsed.verifyCapacityMultiplier),
          };
        }
      }
    } catch (error) {
      console.error('Failed to read from cache:', error);
    }

    return null;
  }, [extensionAddress, actionId]);

  // 构建批量查询合约
  const contracts = useMemo(() => {
    if (!extensionAddress || actionId === undefined || cachedData) return [];

    return [
      {
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'tokenAddress',
      },
      {
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'STAKE_TOKEN_ADDRESS',
      },
      {
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'MAX_JOIN_AMOUNT_MULTIPLIER',
      },
      {
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'VERIFY_CAPACITY_MULTIPLIER',
      },
    ];
  }, [extensionAddress, actionId, cachedData]);

  // 批量读取合约数据
  const {
    data: contractData,
    isPending,
    error,
  } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: !!extensionAddress && actionId !== undefined && contracts.length > 0,
    },
  });

  // 解析合约数据
  const constants = useMemo(() => {
    // 如果有缓存数据，直接返回
    if (cachedData) return cachedData;

    // 如果 actionId 未定义，返回 undefined
    if (actionId === undefined) return undefined;

    // 如果没有合约数据，返回 undefined
    if (!contractData || contractData.length < 4) return undefined;

    return {
      tokenAddress: contractData[0]?.result as `0x${string}`,
      actionId: actionId,
      stakeTokenAddress: contractData[1]?.result as `0x${string}` | undefined,
      maxJoinAmountMultiplier: safeToBigInt(contractData[2]?.result),
      verifyCapacityMultiplier: safeToBigInt(contractData[3]?.result),
    };
  }, [contractData, cachedData, actionId]);

  // 缓存数据到 LocalStorage
  useEffect(() => {
    if (!extensionAddress || actionId === undefined || !constants || cachedData) return;

    try {
      const cacheKey = `extension_const_${extensionAddress}_${actionId.toString()}`;
      const cacheValue = {
        tokenAddress: constants.tokenAddress,
        actionId: constants.actionId?.toString(),
        stakeTokenAddress: constants.stakeTokenAddress,
        maxJoinAmountMultiplier: constants.maxJoinAmountMultiplier?.toString(),
        verifyCapacityMultiplier: constants.verifyCapacityMultiplier?.toString(),
        timestamp: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheValue));
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  }, [constants, extensionAddress, actionId, cachedData]);

  return {
    constants: constants as ExtensionActionConst | undefined,
    isPending: cachedData ? false : isPending,
    error: cachedData ? null : error,
  };
};

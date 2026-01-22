// hooks/extension/plugins/group/composite/useExtensionActionConstCache.ts
// 缓存获取行动基本常量数据

import { useMemo, useEffect } from 'react';
import { useReadContracts } from 'wagmi';
import { ExtensionGroupActionAbi } from '@/src/abis/ExtensionGroupAction';
import { LOVE20TokenAbi } from '@/src/abis/LOVE20Token';
import { safeToBigInt } from '@/src/lib/clientUtils';

export interface ExtensionActionConst {
  tokenAddress: `0x${string}`;
  actionId: bigint;
  // stakeTokenAddress 已删除 - 质押代币就是 tokenAddress
  stakeTokenSymbol: string | undefined; // tokenAddress 的 symbol
  joinTokenAddress: `0x${string}`;
  joinTokenSymbol: string | undefined;
  maxJoinAmountRatio: bigint; // 单个行动者最大参与代币占比（wei，1e28=100%）
  maxVerifyCapacityFactor: bigint; // 验证容量系数（wei）
  groupActivationStakeAmount: bigint; // 激活需质押代币数量
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
            // stakeTokenAddress 已删除，质押代币就是 tokenAddress
            stakeTokenSymbol: parsed.stakeTokenSymbol as string | undefined,
            joinTokenAddress: parsed.joinTokenAddress as `0x${string}`,
            joinTokenSymbol: parsed.joinTokenSymbol as string | undefined,
            maxJoinAmountRatio: BigInt(parsed.maxJoinAmountRatio || parsed.maxJoinAmountMultiplier || 0),
            maxVerifyCapacityFactor: BigInt(parsed.maxVerifyCapacityFactor || parsed.verifyCapacityMultiplier || 0),
            groupActivationStakeAmount: BigInt(parsed.groupActivationStakeAmount),
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
        abi: ExtensionGroupActionAbi,
        functionName: 'TOKEN_ADDRESS',
      },
      {
        address: extensionAddress,
        abi: ExtensionGroupActionAbi,
        functionName: 'JOIN_TOKEN_ADDRESS',
      },
      {
        address: extensionAddress,
        abi: ExtensionGroupActionAbi,
        functionName: 'MAX_JOIN_AMOUNT_RATIO',
      },
      {
        address: extensionAddress,
        abi: ExtensionGroupActionAbi,
        functionName: 'MAX_VERIFY_CAPACITY_FACTOR',
      },
      {
        address: extensionAddress,
        abi: ExtensionGroupActionAbi,
        functionName: 'ACTIVATION_STAKE_AMOUNT',
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

  // 解析合约数据，获取基础常量
  const baseConstants = useMemo(() => {
    // 如果有缓存数据，直接返回（但不包含 symbol，需要单独查询）
    if (cachedData) {
      // 如果缓存中有 symbol，直接返回完整数据
      if (cachedData.joinTokenSymbol !== undefined && cachedData.stakeTokenSymbol !== undefined) {
        return cachedData;
      }
      // 否则返回基础数据，symbol 需要单独查询
      return {
        ...cachedData,
        joinTokenSymbol: cachedData.joinTokenSymbol,
        stakeTokenSymbol: cachedData.stakeTokenSymbol,
      };
    }

    // 如果 actionId 未定义，返回 undefined
    if (actionId === undefined) return undefined;

    // 如果没有合约数据，返回 undefined
    if (!contractData || contractData.length < 5) return undefined;

    const tokenAddress = contractData[0]?.result as `0x${string}`;
    const joinTokenAddress = contractData[1]?.result as `0x${string}` | undefined;

    return {
      tokenAddress: tokenAddress,
      actionId: actionId,
      // stakeTokenAddress 字段已删除
      stakeTokenSymbol: undefined, // tokenAddress 的 symbol，需要单独查询
      joinTokenAddress: joinTokenAddress,
      joinTokenSymbol: undefined, // 需要单独查询
      maxJoinAmountRatio: safeToBigInt(contractData[2]?.result),
      maxVerifyCapacityFactor: safeToBigInt(contractData[3]?.result),
      groupActivationStakeAmount: safeToBigInt(contractData[4]?.result),
    };
  }, [contractData, cachedData, actionId]);

  // 构建 symbol 查询合约
  const symbolContracts = useMemo(() => {
    if (!baseConstants) return [];
    if (cachedData && cachedData.joinTokenSymbol !== undefined && cachedData.stakeTokenSymbol !== undefined) {
      return [];
    }

    const contracts: any[] = [];
    // 使用 tokenAddress 查询 symbol（因为 stake 和 token 现在是同一个）
    if (baseConstants.tokenAddress) {
      contracts.push({
        address: baseConstants.tokenAddress,
        abi: LOVE20TokenAbi,
        functionName: 'symbol',
      });
    }
    if (baseConstants.joinTokenAddress) {
      contracts.push({
        address: baseConstants.joinTokenAddress,
        abi: LOVE20TokenAbi,
        functionName: 'symbol',
      });
    }
    return contracts;
  }, [baseConstants, cachedData]);

  // 批量读取 symbol 数据
  const {
    data: symbolData,
    isPending: isPendingSymbol,
    error: errorSymbol,
  } = useReadContracts({
    contracts: symbolContracts as any,
    query: {
      enabled: symbolContracts.length > 0,
    },
  });

  // 合并 symbol 到 constants
  const constants = useMemo(() => {
    if (!baseConstants) return undefined;

    // 如果缓存数据中已经有 symbol，直接返回
    if (cachedData && cachedData.joinTokenSymbol !== undefined && cachedData.stakeTokenSymbol !== undefined) {
      return cachedData;
    }

    // 解析 symbol 数据
    let stakeTokenSymbol: string | undefined = undefined;
    let joinTokenSymbol: string | undefined = undefined;

    if (symbolData && symbolData.length > 0) {
      stakeTokenSymbol = symbolData[0]?.result as string | undefined;
      joinTokenSymbol = symbolData[1]?.result as string | undefined;
    }

    // 如果缓存中有部分 symbol，使用缓存的值
    if (cachedData) {
      stakeTokenSymbol = cachedData.stakeTokenSymbol ?? stakeTokenSymbol;
      joinTokenSymbol = cachedData.joinTokenSymbol ?? joinTokenSymbol;
    }

    // 否则合并查询到的 symbol
    return {
      ...baseConstants,
      stakeTokenSymbol: stakeTokenSymbol,
      joinTokenSymbol: joinTokenSymbol,
    };
  }, [baseConstants, symbolData, cachedData]);

  // 缓存数据到 LocalStorage
  useEffect(() => {
    if (!extensionAddress || actionId === undefined || !constants || cachedData) return;

    try {
      const cacheKey = `extension_const_${extensionAddress}_${actionId.toString()}`;
      const cacheValue = {
        tokenAddress: constants.tokenAddress,
        actionId: constants.actionId?.toString(),
        stakeTokenSymbol: constants.stakeTokenSymbol,
        joinTokenAddress: constants.joinTokenAddress,
        joinTokenSymbol: constants.joinTokenSymbol,
        maxJoinAmountRatio: constants.maxJoinAmountRatio?.toString(),
        maxVerifyCapacityFactor: constants.maxVerifyCapacityFactor?.toString(),
        groupActivationStakeAmount: constants.groupActivationStakeAmount?.toString(),
        timestamp: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheValue));
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  }, [constants, extensionAddress, actionId, cachedData]);

  return {
    constants: constants as ExtensionActionConst | undefined,
    isPending:
      cachedData && cachedData.joinTokenSymbol !== undefined && cachedData.stakeTokenSymbol !== undefined
        ? false
        : isPending || isPendingSymbol,
    error:
      cachedData && cachedData.joinTokenSymbol !== undefined && cachedData.stakeTokenSymbol !== undefined
        ? null
        : error || errorSymbol,
  };
};

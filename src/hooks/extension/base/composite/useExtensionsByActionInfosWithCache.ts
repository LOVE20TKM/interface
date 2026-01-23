/**
 * 批量验证行动是否为扩展行动（基于 ActionInfo，带缓存）
 *
 * 功能概述：
 * 1. 根据 actionInfos 批量验证是否为扩展行动
 * 2. 返回扩展地址、factory地址、参与代币信息和验证结果
 * 3. 使用 LocalStorage 永久缓存验证结果
 * 4. 使用 useReadContracts 批量调用优化性能
 *
 * 验证算法：
 * 1. 从行动详情中获取白名单地址（whiteListAddress）
 * 2. 如果白名单地址为零地址，则不是扩展行动
 * 3. 调用白名单地址的 factory() 方法获取 factory 地址
 * 4. 检查 factory 地址是否在配置的 factory 列表中
 * 5. 调用 factory 的 exists(whitelist) 方法验证扩展是否合法
 * 6. 批量获取 joinedAmountTokenAddress 和判断是否为 LP token
 * 7. 批量获取 joinedAmountTokenSymbol（LP token 或普通 token）
 *
 * 使用示例：
 * ```typescript
 * const { contractInfos, isPending } = useExtensionsByActionInfosWithCache({
 *   tokenAddress,
 *   actionInfos: [actionInfo1, actionInfo2, actionInfo3],
 * });
 *
 * // contractInfos: [
 * //   {
 * //     actionId: 1n,
 * //     extension: '0x...',
 * //     isExtension: true,
 * //     factory: { type: 'LP', name: 'LP Factory', address: '0x...' },
 * //     joinedAmountTokenAddress: '0x...',
 * //     joinedAmountTokenIsLP: true,
 * //     joinedAmountTokenSymbol: 'LP(USDC,ETH)'
 * //   },
 * //   { actionId: 2n, isExtension: false },
 * //   ...
 * // ]
 * ```
 */

import { useMemo, useEffect, useState } from 'react';
import { useReadContracts } from 'wagmi';
import { IExtensionAbi } from '@/src/abis/IExtension';
import { ExtensionFactoryBaseAbi } from '@/src/abis/ExtensionFactoryBase';
import { UniswapV2PairAbi } from '@/src/abis/UniswapV2Pair';
import { LOVE20TokenAbi } from '@/src/abis/LOVE20Token';
import { getExtensionConfigByFactory, getExtensionConfigs, ExtensionType } from '@/src/config/extensionConfig';
import { ActionInfo } from '@/src/types/love20types';

// ==================== 常量定义 ====================

/** 合约信息缓存键前缀 */
const CONTRACT_CACHE_KEY_PREFIX = 'love20:extension:contract:';

// ==================== 类型定义 ====================

/**
 * Factory 工厂信息
 */
export interface FactoryInfo {
  type: ExtensionType;
  name: string;
  address: `0x${string}`;
}

/**
 * 扩展合约信息
 */
export interface ExtensionContractInfo {
  actionId: bigint;
  isExtension: boolean;
  factory?: FactoryInfo;
  extension?: `0x${string}`;
  joinedAmountTokenAddress?: `0x${string}`; // 参与金额计价代币地址
  joinedAmountTokenIsLP?: boolean; // 该代币是否为 UniswapV2 LP token
  joinedAmountTokenSymbol?: string; // 参与金额代币符号（LP token 格式为 "LP(token0Symbol,token1Symbol)"）
}

/**
 * 合约信息缓存项（永久缓存，不设置过期时间）
 */
interface ContractCacheItem {
  data: {
    extensionAddress: string;
    factoryAddress: string;
    factoryName: string;
    factoryType: string;
    joinedAmountTokenAddress?: string;
    joinedAmountTokenIsLP?: boolean;
    joinedAmountTokenSymbol?: string;
  };
}

/**
 * Hook 参数接口（批量）
 */
export interface UseExtensionsByActionInfosWithCacheParams {
  tokenAddress: `0x${string}` | undefined;
  actionInfos: ActionInfo[];
}

/**
 * Hook 返回结果接口（批量）
 */
export interface UseExtensionsByActionInfosWithCacheResult {
  contractInfos: ExtensionContractInfo[];
  isPending: boolean;
  error: any;
}

/**
 * Hook 参数接口（单个）
 */
export interface UseExtensionByActionInfoWithCacheParams {
  tokenAddress: `0x${string}` | undefined;
  actionInfo: ActionInfo | undefined;
}

/**
 * Hook 返回结果接口（单个）
 */
export interface UseExtensionByActionInfoWithCacheResult {
  contractInfo: ExtensionContractInfo | undefined;
  isPending: boolean;
  error: any;
}

// ==================== 缓存工具函数 ====================

/**
 * 构建合约信息缓存键
 */
function buildContractCacheKey(tokenAddress: string, actionId: bigint): string {
  return `${CONTRACT_CACHE_KEY_PREFIX}${tokenAddress.toLowerCase()}:${actionId.toString()}`;
}

/**
 * 从 localStorage 读取合约信息缓存（永久缓存，无过期时间）
 */
function getCachedContractInfo(tokenAddress: string, actionId: bigint): ContractCacheItem | null {
  if (typeof window === 'undefined') return null;

  try {
    const key = buildContractCacheKey(tokenAddress, actionId);
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const item: ContractCacheItem = JSON.parse(cached);
    return item;
  } catch (error) {
    console.error('读取扩展合约信息缓存失败:', error);
    return null;
  }
}

/**
 * 保存合约信息到 localStorage（永久缓存）
 */
function setCachedContractInfo(
  tokenAddress: string,
  actionId: bigint,
  extensionAddress: string,
  factoryAddress: string,
  factoryName: string,
  factoryType: string,
  joinedAmountTokenAddress?: string,
  joinedAmountTokenIsLP?: boolean,
  joinedAmountTokenSymbol?: string,
): void {
  if (typeof window === 'undefined') return;

  try {
    const key = buildContractCacheKey(tokenAddress, actionId);
    const item: ContractCacheItem = {
      data: {
        extensionAddress,
        factoryAddress,
        factoryName,
        factoryType,
        joinedAmountTokenAddress,
        joinedAmountTokenIsLP,
        joinedAmountTokenSymbol,
      },
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error('保存扩展合约信息缓存失败:', error);
  }
}

/**
 * 清除合约信息缓存
 */
export function clearContractInfoCache(tokenAddress: string, actionId: bigint): void {
  if (typeof window === 'undefined') return;

  try {
    const key = buildContractCacheKey(tokenAddress, actionId);
    localStorage.removeItem(key);
    console.log(`🗑️ 清除合约信息缓存: ActionId ${actionId}`);
  } catch (error) {
    console.error('清除扩展合约信息缓存失败:', error);
  }
}

// ==================== 主 Hooks ====================

/**
 * 批量获取扩展合约信息（带缓存）
 *
 * 新的验证逻辑：
 * 1. 从行动详情中获取白名单地址（whiteListAddress）
 * 2. 如果白名单地址为零地址，则不是扩展行动
 * 3. 调用白名单地址的 factory() 方法获取 factory 地址
 * 4. 检查 factory 地址是否在配置的 factory 列表中
 * 5. 调用 factory 的 exists(whitelist) 方法验证扩展是否合法
 * 6. 批量获取 joinedAmountTokenAddress 和判断是否为 LP token
 * 7. 批量获取 joinedAmountTokenSymbol
 *
 * @param tokenAddress 代币地址
 * @param actionInfos 行动信息列表
 * @returns 扩展合约信息列表、加载状态和错误信息
 */
export const useExtensionsByActionInfosWithCache = ({
  tokenAddress,
  actionInfos,
}: UseExtensionsByActionInfosWithCacheParams): UseExtensionsByActionInfosWithCacheResult => {
  const [refreshKey, setRefreshKey] = useState(0);

  // 步骤1: 检查缓存，分离出需要请求的 actionInfos
  const { cachedData, uncachedActionInfos } = useMemo(() => {
    if (!tokenAddress || actionInfos.length === 0) {
      return { cachedData: new Map<bigint, ExtensionContractInfo>(), uncachedActionInfos: [] };
    }

    const cached = new Map<bigint, ExtensionContractInfo>();
    const uncached: ActionInfo[] = [];

    for (const actionInfo of actionInfos) {
      const actionId = actionInfo.head.id;
      const cacheItem = getCachedContractInfo(tokenAddress, actionId);

      if (cacheItem) {
        const isExtensionZero = cacheItem.data.extensionAddress === '0x0000000000000000000000000000000000000000';

        // 验证缓存完整性：如果有扩展地址但没有 factory 地址，认为缓存无效
        if (!isExtensionZero && !cacheItem.data.factoryAddress) {
          console.log(`⚠️ ActionId ${actionId} 合约信息缓存不完整（缺少factory），清除缓存重新查询`);
          clearContractInfoCache(tokenAddress, actionId);
          uncached.push(actionInfo);
          continue;
        }

        // 验证缓存完整性：如果是扩展但缺少 joinedAmountTokenAddress，认为缓存无效
        if (!isExtensionZero && cacheItem.data.joinedAmountTokenAddress === undefined) {
          console.log(`⚠️ ActionId ${actionId} 合约信息缓存缺少 joinedAmountTokenAddress，清除缓存重新查询`);
          clearContractInfoCache(tokenAddress, actionId);
          uncached.push(actionInfo);
          continue;
        }

        // 验证缓存完整性：如果是扩展但缺少 joinedAmountTokenSymbol，认为缓存无效
        if (!isExtensionZero && cacheItem.data.joinedAmountTokenSymbol === undefined) {
          console.log(`⚠️ ActionId ${actionId} 合约信息缓存缺少 joinedAmountTokenSymbol，清除缓存重新查询`);
          clearContractInfoCache(tokenAddress, actionId);
          uncached.push(actionInfo);
          continue;
        }

        cached.set(actionId, {
          actionId,
          isExtension: !isExtensionZero,
          factory: !isExtensionZero
            ? {
                type: (cacheItem.data.factoryType || ExtensionType.LP) as ExtensionType,
                name: cacheItem.data.factoryName || '未知类型',
                address: cacheItem.data.factoryAddress as `0x${string}`,
              }
            : undefined,
          extension: !isExtensionZero ? (cacheItem.data.extensionAddress as `0x${string}`) : undefined,
          joinedAmountTokenAddress:
            !isExtensionZero && cacheItem.data.joinedAmountTokenAddress
              ? (cacheItem.data.joinedAmountTokenAddress as `0x${string}`)
              : undefined,
          joinedAmountTokenIsLP: !isExtensionZero ? cacheItem.data.joinedAmountTokenIsLP : undefined,
          joinedAmountTokenSymbol: !isExtensionZero ? cacheItem.data.joinedAmountTokenSymbol : undefined,
        });
      } else {
        uncached.push(actionInfo);
      }
    }

    return { cachedData: cached, uncachedActionInfos: uncached };
  }, [tokenAddress, actionInfos, refreshKey]);

  // 步骤2: 过滤出有白名单地址的行动，并构建批量查询 factory 地址的调用
  const { validWhitelistInfos, factoryContracts } = useMemo(() => {
    if (!tokenAddress || uncachedActionInfos.length === 0) {
      return { validWhitelistInfos: [], factoryContracts: [] };
    }

    const infos: Array<{ actionInfo: ActionInfo; whitelistAddress: `0x${string}` }> = [];
    const contracts: any[] = [];

    for (const actionInfo of uncachedActionInfos) {
      const whitelistAddress = actionInfo.body.whiteListAddress;

      // 如果白名单地址是零地址，跳过
      if (!whitelistAddress || whitelistAddress === '0x0000000000000000000000000000000000000000') {
        continue;
      }

      infos.push({ actionInfo, whitelistAddress });

      // 调用白名单地址的 factory() 方法
      contracts.push({
        address: whitelistAddress,
        abi: IExtensionAbi,
        functionName: 'FACTORY_ADDRESS' as const,
        args: [],
      });
    }

    return { validWhitelistInfos: infos, factoryContracts: contracts };
  }, [tokenAddress, uncachedActionInfos]);

  // 步骤3: 批量读取 factory 地址
  const {
    data: factoryAddressesData,
    isPending: isPending1,
    error: error1,
  } = useReadContracts({
    contracts: factoryContracts as any,
    query: {
      enabled: !!tokenAddress && factoryContracts.length > 0,
    },
  });

  // 步骤4: 获取配置的 factory 列表，并构建 exists 验证调用
  const existsContracts = useMemo(() => {
    if (!factoryAddressesData || factoryAddressesData.length === 0) return [];

    const configuredFactories = getExtensionConfigs();
    const factoryAddressSet = new Set(configuredFactories.map((c) => c.factoryAddress.toLowerCase()));
    const contracts: any[] = [];

    for (let i = 0; i < factoryAddressesData.length; i++) {
      const factoryAddress = factoryAddressesData[i]?.result as `0x${string}` | undefined;
      const whitelistInfo = validWhitelistInfos[i];

      // 检查 factory 地址是否在配置列表中
      if (!factoryAddress || !factoryAddressSet.has(factoryAddress.toLowerCase())) {
        continue;
      }

      // 调用 factory.exists(whitelistAddress) 验证
      contracts.push({
        address: factoryAddress,
        abi: ExtensionFactoryBaseAbi, // 所有 factory 都有相同的 exists 接口
        functionName: 'exists' as const,
        args: [whitelistInfo.whitelistAddress],
      });
    }

    return contracts;
  }, [factoryAddressesData, validWhitelistInfos]);

  // 步骤5: 批量调用 exists 验证
  const {
    data: existsData,
    isPending: isPending2,
    error: error2,
  } = useReadContracts({
    contracts: existsContracts as any,
    query: {
      enabled: existsContracts.length > 0,
    },
  });

  // 步骤5.5: 构建 joinedAmountTokenAddress 查询（仅查询 exists 验证通过的扩展）
  const joinedAmountTokenAddressContracts = useMemo(() => {
    if (!existsData || existsData.length === 0 || !factoryAddressesData) return [];

    const configuredFactories = getExtensionConfigs();
    const factoryAddressSet = new Set(configuredFactories.map((c) => c.factoryAddress.toLowerCase()));
    const contracts: any[] = [];
    let existsIndex = 0;

    for (let i = 0; i < factoryAddressesData.length; i++) {
      const factoryAddress = factoryAddressesData[i]?.result as `0x${string}` | undefined;
      const whitelistInfo = validWhitelistInfos[i];

      // 跳过不在配置中的 factory
      if (!factoryAddress || !factoryAddressSet.has(factoryAddress.toLowerCase())) {
        continue;
      }

      // 检查 exists 验证结果
      const existsResult = existsData[existsIndex]?.result as boolean | undefined;
      existsIndex++;

      // 只为 exists 返回 true 的扩展查询 joinedAmountTokenAddress
      if (existsResult === true && whitelistInfo.whitelistAddress) {
        contracts.push({
          address: whitelistInfo.whitelistAddress,
          abi: IExtensionAbi,
          functionName: 'joinedAmountTokenAddress' as const,
          args: [],
        });
      }
    }

    return contracts;
  }, [existsData, factoryAddressesData, validWhitelistInfos]);

  // 步骤5.6: 批量查询 joinedAmountTokenAddress
  const {
    data: joinedAmountTokenAddressData,
    isPending: isPending3,
    error: error3,
  } = useReadContracts({
    contracts: joinedAmountTokenAddressContracts as any,
    query: {
      enabled: joinedAmountTokenAddressContracts.length > 0,
    },
  });

  // 步骤5.7: 构建 LP factory 检查查询（仅检查非零的 joinedAmountTokenAddress）
  const lpFactoryCheckContracts = useMemo(() => {
    if (!joinedAmountTokenAddressData || joinedAmountTokenAddressData.length === 0) return [];

    const uniswapV2FactoryAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_FACTORY;
    // 如果未配置 UniswapV2 factory 地址，跳过 LP 检查
    if (!uniswapV2FactoryAddress) {
      console.warn('⚠️ NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_FACTORY 未配置，跳过 LP 检测');
      return [];
    }

    const contracts: any[] = [];

    for (let i = 0; i < joinedAmountTokenAddressData.length; i++) {
      const tokenAddress = joinedAmountTokenAddressData[i]?.result as `0x${string}` | undefined;

      // 跳过零地址或 undefined
      if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
        continue;
      }

      // 调用 factory() 方法检查是否为 UniswapV2Pair
      contracts.push({
        address: tokenAddress,
        abi: UniswapV2PairAbi,
        functionName: 'factory' as const,
        args: [],
      });
    }

    return contracts;
  }, [joinedAmountTokenAddressData]);

  // 步骤5.8: 批量查询 LP token 的 factory 地址
  const {
    data: lpFactoryData,
    isPending: isPending4,
    error: error4,
  } = useReadContracts({
    contracts: lpFactoryCheckContracts as any,
    query: {
      enabled: lpFactoryCheckContracts.length > 0,
    },
  });

  // 步骤5.9: 构建 LP token0/token1 索引映射和批量查询（仅 LP token）
  const { joinedTokenNonZeroIndexMap, lpTokenIndexMap } = useMemo(() => {
    const nonZeroMap = new Map<number, number>();
    const lpMap = new Map<number, number>();

    if (!joinedAmountTokenAddressData || !lpFactoryData) {
      return { joinedTokenNonZeroIndexMap: nonZeroMap, lpTokenIndexMap: lpMap };
    }

    const uniswapV2FactoryAddressLower = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_FACTORY?.toLowerCase();
    if (!uniswapV2FactoryAddressLower) return { joinedTokenNonZeroIndexMap: nonZeroMap, lpTokenIndexMap: lpMap };

    let nonZeroIndex = 0;
    let lpIndex = 0;

    joinedAmountTokenAddressData.forEach((result, joinedTokenIdx) => {
      const tokenAddr = result?.result as `0x${string}` | undefined;
      if (!tokenAddr || tokenAddr === '0x0000000000000000000000000000000000000000') {
        return;
      }

      nonZeroMap.set(joinedTokenIdx, nonZeroIndex);
      const factoryResult = lpFactoryData?.[nonZeroIndex];
      if (factoryResult?.status === 'success' && factoryResult.result) {
        const lpFactory = (factoryResult.result as string).toLowerCase();
        if (lpFactory === uniswapV2FactoryAddressLower) {
          lpMap.set(joinedTokenIdx, lpIndex);
          lpIndex++;
        }
      }
      nonZeroIndex++;
    });

    return { joinedTokenNonZeroIndexMap: nonZeroMap, lpTokenIndexMap: lpMap };
  }, [joinedAmountTokenAddressData, lpFactoryData]);

  const lpToken0Token1Contracts = useMemo(() => {
    if (!joinedAmountTokenAddressData || lpTokenIndexMap.size === 0) return [];

    const contracts: any[] = [];
    joinedAmountTokenAddressData.forEach((result, joinedTokenIdx) => {
      const lpIndex = lpTokenIndexMap.get(joinedTokenIdx);
      if (lpIndex === undefined) return;

      const tokenAddress = result?.result as `0x${string}` | undefined;
      if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') return;

      // token0
      contracts.push({
        address: tokenAddress,
        abi: UniswapV2PairAbi,
        functionName: 'token0' as const,
        args: [],
      });
      // token1
      contracts.push({
        address: tokenAddress,
        abi: UniswapV2PairAbi,
        functionName: 'token1' as const,
        args: [],
      });
    });

    return contracts;
  }, [joinedAmountTokenAddressData, lpTokenIndexMap]);

  const {
    data: lpToken0Token1Data,
    isPending: isPending5,
    error: error5,
  } = useReadContracts({
    contracts: lpToken0Token1Contracts as any,
    query: {
      enabled: lpToken0Token1Contracts.length > 0,
    },
  });

  // 步骤5.10: 构建 symbol 批量查询（LP: token0/token1 symbols; 非LP: token symbol）
  const { tokenSymbolContracts, lpSymbolIndexMap, nonLpSymbolIndexMap } = useMemo(() => {
    if (!joinedAmountTokenAddressData) {
      return {
        tokenSymbolContracts: [],
        lpSymbolIndexMap: new Map<number, { token0: number; token1: number }>(),
        nonLpSymbolIndexMap: new Map<number, number>(),
      };
    }

    const contracts: any[] = [];
    const lpSymMap = new Map<number, { token0: number; token1: number }>();
    const nonLpSymMap = new Map<number, number>();
    let symbolIndex = 0;

    joinedAmountTokenAddressData.forEach((result, joinedTokenIdx) => {
      const tokenAddr = result?.result as `0x${string}` | undefined;
      if (!tokenAddr || tokenAddr === '0x0000000000000000000000000000000000000000') return;

      const lpIndex = lpTokenIndexMap.get(joinedTokenIdx);
      if (lpIndex !== undefined) {
        // LP token: 读取 token0 和 token1 的 symbol
        const token0Res = lpToken0Token1Data?.[lpIndex * 2];
        const token1Res = lpToken0Token1Data?.[lpIndex * 2 + 1];

        const token0Addr =
          token0Res?.status === 'success' ? (token0Res.result as `0x${string}` | undefined) : undefined;
        const token1Addr =
          token1Res?.status === 'success' ? (token1Res.result as `0x${string}` | undefined) : undefined;

        const indexInfo: { token0?: number; token1?: number } = {};

        if (token0Addr) {
          contracts.push({
            address: token0Addr,
            abi: LOVE20TokenAbi,
            functionName: 'symbol' as const,
            args: [],
          });
          indexInfo.token0 = symbolIndex;
          symbolIndex++;
        }

        if (token1Addr) {
          contracts.push({
            address: token1Addr,
            abi: LOVE20TokenAbi,
            functionName: 'symbol' as const,
            args: [],
          });
          indexInfo.token1 = symbolIndex;
          symbolIndex++;
        }

        if (indexInfo.token0 !== undefined || indexInfo.token1 !== undefined) {
          lpSymMap.set(joinedTokenIdx, indexInfo as { token0: number; token1: number });
        }
      } else {
        // 非 LP token: 读取 token symbol
        contracts.push({
          address: tokenAddr,
          abi: LOVE20TokenAbi,
          functionName: 'symbol' as const,
          args: [],
        });
        nonLpSymMap.set(joinedTokenIdx, symbolIndex);
        symbolIndex++;
      }
    });

    return {
      tokenSymbolContracts: contracts,
      lpSymbolIndexMap: lpSymMap,
      nonLpSymbolIndexMap: nonLpSymMap,
    };
  }, [joinedAmountTokenAddressData, lpTokenIndexMap, lpToken0Token1Data]);

  const {
    data: tokenSymbolData,
    isPending: isPending6,
    error: error6,
  } = useReadContracts({
    contracts: tokenSymbolContracts as any,
    query: {
      enabled: tokenSymbolContracts.length > 0,
    },
  });

  // 步骤6: 组合结果并缓存
  useEffect(() => {
    if (!tokenAddress || uncachedActionInfos.length === 0) return;

    // 等待 factory 查询完成
    if (factoryContracts.length > 0 && isPending1) return;

    // 等待 exists 验证完成
    if (existsContracts.length > 0 && isPending2) return;

    // 等待 joinedAmountTokenAddress 查询完成
    if (joinedAmountTokenAddressContracts.length > 0 && isPending3) return;

    // 等待 LP factory 检查完成
    if (lpFactoryCheckContracts.length > 0 && isPending4) return;

    // 等待 LP token0/token1 查询完成
    if (lpToken0Token1Contracts.length > 0 && isPending5) return;

    // 等待 token symbol 查询完成
    if (tokenSymbolContracts.length > 0 && isPending6) return;

    const configuredFactories = getExtensionConfigs();
    const factoryAddressSet = new Set(configuredFactories.map((c) => c.factoryAddress.toLowerCase()));
    const uniswapV2FactoryAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_FACTORY?.toLowerCase();

    let cachedCount = 0;
    let validWhitelistIndex = 0;
    let existsIndex = 0;
    let joinedTokenIndex = 0;
    let lpFactoryCheckIndex = 0;

    for (const actionInfo of uncachedActionInfos) {
      const actionId = actionInfo.head.id;
      const whitelistAddress = actionInfo.body.whiteListAddress;

      // 如果白名单地址是零地址，标记为非扩展并缓存
      if (!whitelistAddress || whitelistAddress === '0x0000000000000000000000000000000000000000') {
        setCachedContractInfo(
          tokenAddress,
          actionId,
          '0x0000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000',
          '',
          '',
          undefined,
          undefined,
          undefined,
        );
        cachedCount++;
        continue;
      }

      // 获取 factory 地址
      const factoryAddress = factoryAddressesData?.[validWhitelistIndex]?.result as `0x${string}` | undefined;
      validWhitelistIndex++;

      // 如果没有获取到 factory 地址，或 factory 地址不在配置列表中，标记为非扩展
      if (!factoryAddress || !factoryAddressSet.has(factoryAddress.toLowerCase())) {
        setCachedContractInfo(
          tokenAddress,
          actionId,
          '0x0000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000',
          '',
          '',
          undefined,
          undefined,
          undefined,
        );
        cachedCount++;
        continue;
      }

      // 检查 exists 验证结果
      const existsResult = existsData?.[existsIndex]?.result as boolean | undefined;
      existsIndex++;

      // 如果 exists 返回 false 或未定义，标记为非扩展
      if (existsResult !== true) {
        setCachedContractInfo(
          tokenAddress,
          actionId,
          '0x0000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000',
          '',
          '',
          undefined,
          undefined,
          undefined,
        );
        cachedCount++;
        continue;
      }

      // exists 返回 true，确认为合法扩展
      const config = getExtensionConfigByFactory(factoryAddress);
      const factoryName = config?.name || '未知类型';
      const factoryType = config?.type || ExtensionType.LP;

      // 获取 joinedAmountTokenAddress
      const joinedTokenResult = joinedAmountTokenAddressData?.[joinedTokenIndex];

      // 检查 joinedAmountTokenAddress 查询是否成功
      if (!joinedTokenResult || joinedTokenResult.status !== 'success') {
        // 查询失败，不缓存此 action，下次重新查询
        console.warn(`⚠️ ActionId ${actionId} 的 joinedAmountTokenAddress 查询失败，跳过缓存`);
        joinedTokenIndex++;
        continue;
      }

      const joinedAmountTokenAddress = joinedTokenResult.result as `0x${string}` | undefined;
      joinedTokenIndex++;

      // 判断是否为 LP token
      let joinedAmountTokenIsLP = false;
      if (
        joinedAmountTokenAddress &&
        joinedAmountTokenAddress !== '0x0000000000000000000000000000000000000000' &&
        uniswapV2FactoryAddress
      ) {
        const lpFactoryResult = lpFactoryData?.[lpFactoryCheckIndex];

        // 检查 LP factory 查询是否成功
        if (lpFactoryResult && lpFactoryResult.status === 'success' && lpFactoryResult.result) {
          const lpFactory = (lpFactoryResult.result as `0x${string}`).toLowerCase();
          if (lpFactory === uniswapV2FactoryAddress) {
            joinedAmountTokenIsLP = true;
          }
        }
        // 无论成功失败都要递增索引
        lpFactoryCheckIndex++;
      }

      // 组合 joinedAmountTokenSymbol
      let joinedAmountTokenSymbol = 'UNKNOWN';
      if (joinedAmountTokenAddress && joinedAmountTokenAddress !== '0x0000000000000000000000000000000000000000') {
        if (joinedAmountTokenIsLP) {
          // LP token: 读取 token0/token1 symbols
          const lpSymIndexes = lpSymbolIndexMap.get(joinedTokenIndex - 1);
          if (lpSymIndexes) {
            const token0SymbolRes =
              lpSymIndexes.token0 !== undefined ? tokenSymbolData?.[lpSymIndexes.token0] : undefined;
            const token1SymbolRes =
              lpSymIndexes.token1 !== undefined ? tokenSymbolData?.[lpSymIndexes.token1] : undefined;

            const token0Symbol =
              token0SymbolRes?.status === 'success' && token0SymbolRes.result
                ? (token0SymbolRes.result as string)
                : 'UNKNOWN';
            const token1Symbol =
              token1SymbolRes?.status === 'success' && token1SymbolRes.result
                ? (token1SymbolRes.result as string)
                : 'UNKNOWN';

            joinedAmountTokenSymbol = `LP(${token0Symbol},${token1Symbol})`;
          }
        } else {
          // 非 LP token: 直接读取 symbol
          const symIndex = nonLpSymbolIndexMap.get(joinedTokenIndex - 1);
          if (symIndex !== undefined) {
            const symbolRes = tokenSymbolData?.[symIndex];
            if (symbolRes?.status === 'success' && symbolRes.result) {
              joinedAmountTokenSymbol = symbolRes.result as string;
            }
          }
        }
      }

      // 缓存完整信息
      setCachedContractInfo(
        tokenAddress,
        actionId,
        whitelistAddress,
        factoryAddress,
        factoryName,
        factoryType,
        joinedAmountTokenAddress,
        joinedAmountTokenIsLP,
        joinedAmountTokenSymbol,
      );
      cachedCount++;
    }

    // 缓存更新后，触发重新读取
    if (cachedCount > 0) {
      console.log(`✅ 成功缓存 ${cachedCount} 个扩展合约信息（含 joinedAmountTokenSymbol）`);
      setRefreshKey((prev) => prev + 1);
    }
  }, [
    tokenAddress,
    uncachedActionInfos,
    factoryContracts,
    existsContracts,
    joinedAmountTokenAddressContracts,
    lpFactoryCheckContracts,
    lpToken0Token1Contracts,
    tokenSymbolContracts,
    factoryAddressesData,
    existsData,
    joinedAmountTokenAddressData,
    lpFactoryData,
    lpToken0Token1Data,
    tokenSymbolData,
    lpSymbolIndexMap,
    nonLpSymbolIndexMap,
    isPending1,
    isPending2,
    isPending3,
    isPending4,
    isPending5,
    isPending6,
  ]);

  // 步骤7: 合并缓存数据和新数据
  const contractInfos = useMemo(() => {
    const results: ExtensionContractInfo[] = [];

    for (const actionInfo of actionInfos) {
      const actionId = actionInfo.head.id;

      // 优先从缓存读取
      const cached = cachedData.get(actionId);
      if (cached) {
        results.push(cached);
        continue;
      }

      // 数据还未加载，返回默认值
      results.push({
        actionId,
        isExtension: false,
      });
    }

    return results;
  }, [actionInfos, cachedData]);

  // 计算 isPending：只有当对应的 contracts 数组不为空时，才检查对应的 isPending 状态
  // 如果 contracts 数组为空，则认为该阶段已完成（isPending 为 false）
  const isPending =
    uncachedActionInfos.length > 0
      ? (factoryContracts.length > 0 ? isPending1 : false) ||
        (existsContracts.length > 0 ? isPending2 : false) ||
        (joinedAmountTokenAddressContracts.length > 0 ? isPending3 : false) ||
        (lpFactoryCheckContracts.length > 0 ? isPending4 : false) ||
        (lpToken0Token1Contracts.length > 0 ? isPending5 : false) ||
        (tokenSymbolContracts.length > 0 ? isPending6 : false)
      : false;
  const error = error1 || error2 || error3 || error4 || error5 || error6;

  return {
    contractInfos,
    isPending,
    error,
  };
};

/**
 * 获取单个行动的扩展合约信息（带缓存）
 *
 * 封装批量 Hook，简化单个行动的查询
 *
 * @param tokenAddress 代币地址
 * @param actionInfo 行动信息
 * @returns 扩展合约信息、加载状态和错误信息
 */
export const useExtensionByActionInfoWithCache = ({
  tokenAddress,
  actionInfo,
}: UseExtensionByActionInfoWithCacheParams): UseExtensionByActionInfoWithCacheResult => {
  const actionInfos = useMemo(() => (actionInfo !== undefined ? [actionInfo] : []), [actionInfo]);

  const { contractInfos, isPending, error } = useExtensionsByActionInfosWithCache({
    tokenAddress,
    actionInfos,
  });

  const contractInfo = useMemo(() => {
    if (actionInfo === undefined) return undefined;
    return contractInfos.find((info) => info.actionId === actionInfo.head.id);
  }, [contractInfos, actionInfo]);

  return {
    contractInfo,
    isPending,
    error,
  };
};

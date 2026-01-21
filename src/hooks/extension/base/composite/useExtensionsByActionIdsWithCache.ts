/**
 * 批量验证行动是否为扩展行动（带缓存）
 *
 * 功能概述：
 * 1. 根据 actionIds 批量验证是否为扩展行动
 * 2. 返回扩展地址、factory地址、参与代币信息和验证结果
 * 3. 使用 LocalStorage 永久缓存验证结果
 * 4. 使用 useReadContracts 批量调用优化性能
 *
 * 验证算法（四步骤）：
 * 1. 批量从 ExtensionCenter.extension() 获取扩展地址
 * 2. 批量调用扩展合约的 factory() 方法获取 factory 地址
 * 3. 检查 factory 地址是否在配置的 factory 列表中
 * 4. 批量获取 joinedAmountTokenAddress、判断是否为 LP token，并补齐 joinedAmountTokenSymbol
 *
 * 使用示例：
 * ```typescript
 * const { extensions, isPending } = useExtensionsByActionIdsWithCache({
 *   token,
 *   actionIds: [1n, 2n, 3n],
 * });
 *
 * // extensions: [
 * //   {
 * //     actionId: 1n,
 * //     extensionAddress: '0x...',
 * //     isExtension: true,
 * //     factoryAddress: '0x...',
 * //     joinedAmountTokenAddress: '0x...',
 * //     joinedAmountTokenIsLP: false,
 * //     joinedAmountTokenSymbol: 'USDT'
 * //   },
 * //   { actionId: 2n, isExtension: false },
 * //   { actionId: 3n, extensionAddress: '0x...', isExtension: true, ... }
 * // ]
 * ```
 */

import { useMemo, useEffect, useState } from 'react';
import { useReadContracts } from 'wagmi';
import { ExtensionCenterAbi } from '@/src/abis/ExtensionCenter';
import { IExtensionAbi } from '@/src/abis/IExtension';
import { LOVE20TokenAbi } from '@/src/abis/LOVE20Token';
import { UniswapV2PairAbi } from '@/src/abis/UniswapV2Pair';
import { isKnownFactory } from '@/src/config/extensionConfig';
import { Token } from '@/src/contexts/TokenContext';

// ==================== 常量定义 ====================

/** ExtensionCenter 合约地址 */
const EXTENSION_CENTER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_CENTER as `0x${string}`;

/** 零地址常量 */
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`;

/** 缓存键前缀 */
const CACHE_KEY_PREFIX = 'extension_validation_';

// ==================== 类型定义 ====================

/**
 * 扩展验证信息
 */
export interface ExtensionValidationInfo {
  actionId: bigint;
  extensionAddress?: `0x${string}`;
  isExtension: boolean;
  factoryAddress?: `0x${string}`;
  joinedAmountTokenAddress?: `0x${string}`; // 参与金额计价代币地址
  joinedAmountTokenIsLP?: boolean; // 该代币是否为 UniswapV2 LP token
  joinedAmountTokenSymbol?: string; // 参与金额计价代币 Symbol（LP: LP(token0Symbol,token1Symbol)）
}

/**
 * 缓存项结构（永久缓存，不设置过期时间）
 */
interface CacheItem {
  data: {
    extensionAddress: string; // "0x0..." 表示非扩展
    isExtension: boolean;
    factoryAddress?: string;
    joinedAmountTokenAddress?: string;
    joinedAmountTokenIsLP?: boolean;
    joinedAmountTokenSymbol?: string;
  };
}

/**
 * Hook 参数接口
 */
export interface UseExtensionsByActionIdsWithCacheParams {
  token: Token;
  actionIds: bigint[];
  enabled?: boolean;
}

/**
 * Hook 返回结果接口
 */
export interface UseExtensionsByActionIdsWithCacheResult {
  extensions: ExtensionValidationInfo[];
  isPending: boolean;
  error: Error | null;
}

/**
 * 阶段间传递的扩展信息
 */
interface ExtensionInfo {
  actionId: bigint;
  extensionAddress: `0x${string}`;
  arrayIndex: number; // 用于结果回溯
}

/**
 * 阶段间传递的 Factory 信息
 */
interface FactoryInfo {
  actionId: bigint;
  extensionAddress: `0x${string}`;
  factoryAddress: `0x${string}`;
  arrayIndex: number;
}

// ==================== 缓存工具函数 ====================

/**
 * 构建缓存键
 */
function buildCacheKey(tokenAddress: string, actionId: bigint): string {
  return `${CACHE_KEY_PREFIX}${tokenAddress.toLowerCase()}:${actionId.toString()}`;
}

/**
 * 从 localStorage 读取缓存的验证结果
 */
function getCachedExtensionValidation(tokenAddress: string, actionId: bigint): ExtensionValidationInfo | null {
  if (typeof window === 'undefined') return null;

  try {
    const key = buildCacheKey(tokenAddress, actionId);
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const item: CacheItem = JSON.parse(cached);
    return {
      actionId,
      extensionAddress:
        item.data.extensionAddress !== ZERO_ADDRESS ? (item.data.extensionAddress as `0x${string}`) : undefined,
      isExtension: item.data.isExtension,
      factoryAddress: item.data.factoryAddress ? (item.data.factoryAddress as `0x${string}`) : undefined,
      joinedAmountTokenAddress: item.data.joinedAmountTokenAddress
        ? (item.data.joinedAmountTokenAddress as `0x${string}`)
        : undefined,
      joinedAmountTokenIsLP: item.data.joinedAmountTokenIsLP,
      joinedAmountTokenSymbol: item.data.joinedAmountTokenSymbol,
    };
  } catch (error) {
    console.error('读取扩展验证缓存失败:', error);
    return null;
  }
}

/**
 * 保存验证结果到 localStorage
 */
function setCachedExtensionValidation(
  tokenAddress: string,
  actionId: bigint,
  extensionAddress: `0x${string}`,
  isExtension: boolean,
  factoryAddress?: `0x${string}`,
  joinedAmountTokenAddress?: `0x${string}`,
  joinedAmountTokenIsLP?: boolean,
  joinedAmountTokenSymbol?: string,
): void {
  if (typeof window === 'undefined') return;

  try {
    const key = buildCacheKey(tokenAddress, actionId);
    const item: CacheItem = {
      data: {
        extensionAddress,
        isExtension,
        factoryAddress,
        joinedAmountTokenAddress,
        joinedAmountTokenIsLP,
        joinedAmountTokenSymbol,
      },
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error('保存扩展验证缓存失败:', error);
  }
}

/**
 * 清除缓存
 */
export function clearExtensionValidationCache(tokenAddress: string, actionId: bigint): void {
  if (typeof window === 'undefined') return;

  try {
    const key = buildCacheKey(tokenAddress, actionId);
    localStorage.removeItem(key);
    console.log(`🗑️ 清除扩展验证缓存: ActionId ${actionId}`);
  } catch (error) {
    console.error('清除扩展验证缓存失败:', error);
  }
}

// ==================== 主 Hook ====================

/**
 * 批量验证行动是否为扩展行动（带缓存）
 *
 * @param token - Token 对象
 * @param actionIds - 要验证的行动 ID 列表
 * @param enabled - 是否启用查询（默认 true）
 * @returns 扩展验证信息列表、加载状态和错误信息
 */
export const useExtensionsByActionIdsWithCache = ({
  token,
  actionIds,
  enabled = true,
}: UseExtensionsByActionIdsWithCacheParams): UseExtensionsByActionIdsWithCacheResult => {
  const tokenAddress = token.address;
  const [refreshKey, setRefreshKey] = useState(0);

  // 检查是否有有效的 actionIds
  const hasActionIds = !!actionIds && actionIds.length > 0;

  // ==================== 阶段 0: 缓存检查 ====================

  const { cachedData, uncachedActionIds } = useMemo(() => {
    if (!enabled || !hasActionIds || !tokenAddress) {
      return {
        cachedData: new Map<bigint, ExtensionValidationInfo>(),
        uncachedActionIds: [],
      };
    }

    const cached = new Map<bigint, ExtensionValidationInfo>();
    const uncached: bigint[] = [];

    actionIds.forEach((actionId) => {
      const cachedInfo = getCachedExtensionValidation(tokenAddress, actionId);
      if (cachedInfo !== null) {
        // 验证缓存完整性（向后兼容）
        if (cachedInfo.isExtension) {
          // 如果是扩展行动，必须有完整的新字段
          if (
            !cachedInfo.factoryAddress ||
            cachedInfo.joinedAmountTokenAddress === undefined ||
            cachedInfo.joinedAmountTokenSymbol === undefined
          ) {
            console.log(`⚠️ ActionId ${actionId} 缓存不完整（缺少新字段），清除缓存重新查询`);
            clearExtensionValidationCache(tokenAddress, actionId);
            uncached.push(actionId);
            return;
          }
        }
        cached.set(actionId, cachedInfo);
      } else {
        uncached.push(actionId);
      }
    });

    return {
      cachedData: cached,
      uncachedActionIds: uncached,
    };
  }, [tokenAddress, actionIds, enabled, hasActionIds, refreshKey]);

  // ==================== 阶段 1: 批量获取扩展地址 ====================

  const extensionContracts = useMemo(() => {
    if (!enabled || !hasActionIds || !tokenAddress || uncachedActionIds.length === 0) {
      return [];
    }

    return uncachedActionIds.map((actionId) => ({
      address: EXTENSION_CENTER_ADDRESS,
      abi: ExtensionCenterAbi,
      functionName: 'extension' as const,
      args: [tokenAddress, actionId] as const,
    }));
  }, [tokenAddress, uncachedActionIds, enabled, hasActionIds]);

  const {
    data: extensionAddressesData,
    isPending: isPending1,
    error: error1,
  } = useReadContracts({
    contracts: extensionContracts as any,
    query: {
      enabled: enabled && hasActionIds && extensionContracts.length > 0,
    },
  });

  // 过滤出非零地址的扩展（零地址表示非扩展行动）
  const validExtensions = useMemo(() => {
    if (!extensionAddressesData || extensionAddressesData.length === 0) return [];

    const extensions: ExtensionInfo[] = [];

    extensionAddressesData.forEach((result, index) => {
      if (result?.status === 'success') {
        const extensionAddress = result.result as `0x${string}`;
        const actionId = uncachedActionIds[index];

        // 只保留非零地址的扩展
        if (extensionAddress && extensionAddress !== ZERO_ADDRESS) {
          extensions.push({
            actionId,
            extensionAddress,
            arrayIndex: index,
          });
        }
      }
    });

    return extensions;
  }, [extensionAddressesData, uncachedActionIds]);

  // ==================== 阶段 2: 批量获取 Factory 地址 ====================

  const factoryContracts = useMemo(() => {
    if (validExtensions.length === 0) return [];

    return validExtensions.map((info) => ({
      address: info.extensionAddress,
      abi: IExtensionAbi,
      functionName: 'FACTORY_ADDRESS' as const,
      args: [],
    }));
  }, [validExtensions]);

  const {
    data: factoryAddressesData,
    isPending: isPending2,
    error: error2,
  } = useReadContracts({
    contracts: factoryContracts as any,
    query: {
      enabled: factoryContracts.length > 0,
    },
  });

  // 过滤出已知 Factory 的扩展
  const knownFactoryExtensions = useMemo(() => {
    if (!factoryAddressesData || factoryAddressesData.length === 0) return [];

    const extensions: FactoryInfo[] = [];

    factoryAddressesData.forEach((result, index) => {
      if (result?.status === 'success') {
        const factoryAddress = result.result as `0x${string}`;
        const extensionInfo = validExtensions[index];

        // 只保留已知 Factory 的扩展
        if (factoryAddress && isKnownFactory(factoryAddress)) {
          extensions.push({
            actionId: extensionInfo.actionId,
            extensionAddress: extensionInfo.extensionAddress,
            factoryAddress,
            arrayIndex: extensionInfo.arrayIndex,
          });
        }
      }
    });

    return extensions;
  }, [factoryAddressesData, validExtensions]);

  // 将阶段结果提前映射，减少 useEffect 内部样板代码
  const validExtensionMap = useMemo(() => {
    const map = new Map<number, ExtensionInfo>();
    validExtensions.forEach((info) => {
      map.set(info.arrayIndex, info);
    });
    return map;
  }, [validExtensions]);

  const knownFactoryMap = useMemo(() => {
    const map = new Map<number, FactoryInfo & { knownFactoryIndex: number }>();
    knownFactoryExtensions.forEach((info, knownFactoryIndex) => {
      map.set(info.arrayIndex, { ...info, knownFactoryIndex });
    });
    return map;
  }, [knownFactoryExtensions]);

  // ==================== 阶段 3: 批量获取 joinedAmountToken 信息（地址/LP/符号） ====================

  // 阶段 3.1: 批量获取 joinedAmountTokenAddress（只对 knownFactoryExtensions 查询）
  const joinedAmountTokenAddressContracts = useMemo(() => {
    if (knownFactoryExtensions.length === 0) return [];

    return knownFactoryExtensions.map((info) => ({
      address: info.extensionAddress,
      abi: IExtensionAbi,
      functionName: 'joinedAmountTokenAddress' as const,
      args: [],
    }));
  }, [knownFactoryExtensions]);

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

  // 阶段 3.2: 批量读取 joinedAmountToken 的 factory（用于判断是否为 UniswapV2 LP）
  const uniswapV2FactoryAddressLower = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_FACTORY?.toLowerCase();

  const joinedTokenFactoryCheckContracts = useMemo(() => {
    if (!joinedAmountTokenAddressData || joinedAmountTokenAddressData.length === 0) return [];

    if (!uniswapV2FactoryAddressLower) {
      console.warn('⚠️ NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_FACTORY 未配置，跳过 LP 检测');
      return [];
    }

    const contracts: any[] = [];
    joinedAmountTokenAddressData.forEach((result) => {
      const tokenAddress = result?.result as `0x${string}` | undefined;
      // 跳过零地址
      if (!tokenAddress || tokenAddress === ZERO_ADDRESS) return;

      contracts.push({
        address: tokenAddress,
        abi: UniswapV2PairAbi,
        functionName: 'factory' as const,
        args: [],
      });
    });

    return contracts;
  }, [joinedAmountTokenAddressData, uniswapV2FactoryAddressLower]);

  const {
    data: joinedTokenFactoryData,
    isPending: isPending4,
    error: error4,
  } = useReadContracts({
    contracts: joinedTokenFactoryCheckContracts as any,
    query: {
      enabled: joinedTokenFactoryCheckContracts.length > 0,
    },
  });

  // joinedAmountTokenAddressData 里仅非零地址会被打包进 joinedTokenFactoryCheckContracts，所以需要一个索引回溯映射
  const joinedTokenNonZeroIndexMap = useMemo(() => {
    const map = new Map<number, number>();
    let nonZeroIndex = 0;
    joinedAmountTokenAddressData?.forEach((result, knownFactoryIdx) => {
      const tokenAddr = result?.result as `0x${string}` | undefined;
      if (tokenAddr && tokenAddr !== ZERO_ADDRESS) {
        map.set(knownFactoryIdx, nonZeroIndex);
        nonZeroIndex++;
      }
    });
    return map;
  }, [joinedAmountTokenAddressData]);

  // 计算“哪些 knownFactoryIdx 对应的是 LP”，并为后续 token0/token1 批量读取分配 lpIndex（0..n-1）
  const lpKnownFactoryIndexToLpIndexMap = useMemo(() => {
    const map = new Map<number, number>();
    if (!uniswapV2FactoryAddressLower || !joinedTokenFactoryData) return map;

    let lpIndex = 0;
    joinedAmountTokenAddressData?.forEach((joinedTokenResult, knownFactoryIdx) => {
      const joinedAmountTokenAddress = joinedTokenResult?.result as `0x${string}` | undefined;
      if (!joinedAmountTokenAddress || joinedAmountTokenAddress === ZERO_ADDRESS) return;

      const nonZeroIndex = joinedTokenNonZeroIndexMap.get(knownFactoryIdx);
      if (nonZeroIndex === undefined) return;

      const factoryResult = joinedTokenFactoryData?.[nonZeroIndex];
      if (factoryResult?.status !== 'success' || !factoryResult.result) return;

      const factoryAddress = (factoryResult.result as string).toLowerCase();
      if (factoryAddress === uniswapV2FactoryAddressLower) {
        map.set(knownFactoryIdx, lpIndex);
        lpIndex++;
      }
    });

    return map;
  }, [joinedAmountTokenAddressData, joinedTokenFactoryData, joinedTokenNonZeroIndexMap, uniswapV2FactoryAddressLower]);

  // 阶段 3.3: 批量读取 LP 的 token0/token1（仅对已确认的 LP token）
  const lpToken0Token1Contracts = useMemo(() => {
    if (!joinedAmountTokenAddressData || joinedAmountTokenAddressData.length === 0) return [];
    if (lpKnownFactoryIndexToLpIndexMap.size === 0) return [];

    const contracts: any[] = [];
    joinedAmountTokenAddressData.forEach((result, knownFactoryIdx) => {
      if (!lpKnownFactoryIndexToLpIndexMap.has(knownFactoryIdx)) return;

      const pairAddress = result?.result as `0x${string}` | undefined;
      if (!pairAddress || pairAddress === ZERO_ADDRESS) return;

      // 顺序固定：token0 -> token1（便于索引回溯：2*i / 2*i+1）
      contracts.push({
        address: pairAddress,
        abi: UniswapV2PairAbi,
        functionName: 'token0' as const,
        args: [],
      });
      contracts.push({
        address: pairAddress,
        abi: UniswapV2PairAbi,
        functionName: 'token1' as const,
        args: [],
      });
    });

    return contracts;
  }, [joinedAmountTokenAddressData, lpKnownFactoryIndexToLpIndexMap]);

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

  // 阶段 3.4: 批量读取 symbol（非 LP: joinedAmountToken；LP: token0+token1）
  const {
    tokenSymbolContracts,
    nonLpSymbolIndexMap,
    lpUnderlyingSymbolIndexMap,
    needsTokenSymbolRead,
    canBuildTokenSymbolContracts,
  } = useMemo(() => {
    const contracts: any[] = [];
    const nonLpSymbolIndexMap = new Map<number, number>();
    const lpUnderlyingSymbolIndexMap = new Map<number, { token0?: number; token1?: number }>();

    const hasLpTokens = lpKnownFactoryIndexToLpIndexMap.size > 0;

    // 统计非 LP 且非零 joinedAmountToken 的数量（用于决定是否需要 symbol 读取）
    let nonLpTokenCount = 0;
    joinedAmountTokenAddressData?.forEach((result, knownFactoryIdx) => {
      const tokenAddr = result?.result as `0x${string}` | undefined;
      if (!tokenAddr || tokenAddr === ZERO_ADDRESS) return;
      if (hasLpTokens && lpKnownFactoryIndexToLpIndexMap.has(knownFactoryIdx)) return;
      nonLpTokenCount++;
    });

    const needsTokenSymbolRead = nonLpTokenCount > 0 || hasLpTokens;
    const canBuildTokenSymbolContracts = !hasLpTokens || !!lpToken0Token1Data;

    // LP 存在时，为保证“一个 symbol 批量调用覆盖所有需求”，这里会等待 token0/token1 数据准备好再构建 contracts
    if (!needsTokenSymbolRead || !canBuildTokenSymbolContracts) {
      return {
        tokenSymbolContracts: [],
        nonLpSymbolIndexMap,
        lpUnderlyingSymbolIndexMap,
        needsTokenSymbolRead,
        canBuildTokenSymbolContracts,
      };
    }

    // 非 LP：直接读取 joinedAmountToken.symbol
    joinedAmountTokenAddressData?.forEach((result, knownFactoryIdx) => {
      const tokenAddr = result?.result as `0x${string}` | undefined;
      if (!tokenAddr || tokenAddr === ZERO_ADDRESS) return;
      if (hasLpTokens && lpKnownFactoryIndexToLpIndexMap.has(knownFactoryIdx)) return;

      nonLpSymbolIndexMap.set(knownFactoryIdx, contracts.length);
      contracts.push({
        address: tokenAddr,
        abi: LOVE20TokenAbi,
        functionName: 'symbol' as const,
        args: [],
      });
    });

    // LP：读取 token0/token1 的 symbol
    const lpTokenCount = lpKnownFactoryIndexToLpIndexMap.size;
    for (let lpIndex = 0; lpIndex < lpTokenCount; lpIndex++) {
      const token0Res = lpToken0Token1Data?.[lpIndex * 2];
      const token1Res = lpToken0Token1Data?.[lpIndex * 2 + 1];

      const token0Addr = token0Res?.status === 'success' ? (token0Res.result as `0x${string}` | undefined) : undefined;
      const token1Addr = token1Res?.status === 'success' ? (token1Res.result as `0x${string}` | undefined) : undefined;

      const indexInfo: { token0?: number; token1?: number } = {};

      if (token0Addr && token0Addr !== ZERO_ADDRESS) {
        indexInfo.token0 = contracts.length;
        contracts.push({
          address: token0Addr,
          abi: LOVE20TokenAbi,
          functionName: 'symbol' as const,
          args: [],
        });
      }

      if (token1Addr && token1Addr !== ZERO_ADDRESS) {
        indexInfo.token1 = contracts.length;
        contracts.push({
          address: token1Addr,
          abi: LOVE20TokenAbi,
          functionName: 'symbol' as const,
          args: [],
        });
      }

      lpUnderlyingSymbolIndexMap.set(lpIndex, indexInfo);
    }

    return {
      tokenSymbolContracts: contracts,
      nonLpSymbolIndexMap,
      lpUnderlyingSymbolIndexMap,
      needsTokenSymbolRead,
      canBuildTokenSymbolContracts,
    };
  }, [joinedAmountTokenAddressData, lpKnownFactoryIndexToLpIndexMap, lpToken0Token1Data]);

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

  // ==================== 阶段 4: 保存验证结果到缓存 ====================

  useEffect(() => {
    if (!tokenAddress || uncachedActionIds.length === 0) return;

    // 等待扩展地址查询完成
    if (extensionContracts.length > 0 && isPending1) return;

    // 等待 factory 地址查询完成
    if (factoryContracts.length > 0 && isPending2) return;

    // 等待 joinedAmountTokenAddress 查询完成
    if (joinedAmountTokenAddressContracts.length > 0 && isPending3) return;

    // 等待 joinedAmountToken factory 检查完成（用于判断 LP）
    if (joinedTokenFactoryCheckContracts.length > 0 && isPending4) return;

    // 等待 LP 的 token0/token1 读取完成
    if (lpToken0Token1Contracts.length > 0 && isPending5) return;

    // LP 存在但 token0/token1 还没返回时，不要继续（否则无法构建 LP(...)）
    if (lpKnownFactoryIndexToLpIndexMap.size > 0 && !lpToken0Token1Data) return;

    // 等待 symbol 批量读取完成（如果需要）
    if (needsTokenSymbolRead && !canBuildTokenSymbolContracts) return;
    if (tokenSymbolContracts.length > 0 && isPending6) return;

    let cachedCount = 0;

    const readSymbolOrUnknown = (symbolResult: any): string => {
      if (!symbolResult || symbolResult.status !== 'success') return 'UNKNOWN';
      const value = symbolResult.result;
      if (typeof value !== 'string') return 'UNKNOWN';
      const trimmed = value.trim();
      return trimmed ? trimmed : 'UNKNOWN';
    };

    // 遍历所有未缓存的 actionIds，构建验证结果并缓存
    uncachedActionIds.forEach((actionId, index) => {
      const extensionResult = extensionAddressesData?.[index];

      // 情况 1: RPC 调用失败，不缓存
      if (!extensionResult || extensionResult.status !== 'success') {
        return;
      }

      const extensionAddress = extensionResult.result as `0x${string}`;

      // 情况 2: 零地址，标记为非扩展并缓存
      if (!extensionAddress || extensionAddress === ZERO_ADDRESS) {
        setCachedExtensionValidation(tokenAddress, actionId, ZERO_ADDRESS, false);
        cachedCount++;
        return;
      }

      // 情况 3: 非零地址，但不在 validExtensions 中（可能 factory 调用失败），不缓存
      if (!validExtensionMap.has(index)) {
        return;
      }

      // 情况 4: 有扩展地址，但 factory 不在已知列表中，标记为非扩展并缓存
      const knownFactoryInfo = knownFactoryMap.get(index);
      if (!knownFactoryInfo) {
        setCachedExtensionValidation(tokenAddress, actionId, ZERO_ADDRESS, false);
        cachedCount++;
        return;
      }

      // 情况 5: factory 已知，获取完整信息
      const knownFactoryIdx = knownFactoryInfo.knownFactoryIndex;

      // 获取 joinedAmountTokenAddress
      const joinedTokenResult = joinedAmountTokenAddressData?.[knownFactoryIdx];
      if (!joinedTokenResult || joinedTokenResult.status !== 'success') {
        // 查询失败，不缓存
        console.warn(`⚠️ ActionId ${actionId} 的 joinedAmountTokenAddress 查询失败，跳过缓存`);
        return;
      }

      const joinedAmountTokenAddress = joinedTokenResult.result as `0x${string}`;

      // 判断是否为 LP token
      const joinedAmountTokenIsLP =
        !!uniswapV2FactoryAddressLower &&
        joinedAmountTokenAddress !== ZERO_ADDRESS &&
        lpKnownFactoryIndexToLpIndexMap.has(knownFactoryIdx);

      // 生成 joinedAmountTokenSymbol
      let joinedAmountTokenSymbol = 'UNKNOWN';
      if (!joinedAmountTokenAddress || joinedAmountTokenAddress === ZERO_ADDRESS) {
        joinedAmountTokenSymbol = 'UNKNOWN';
      } else if (joinedAmountTokenIsLP) {
        const lpIndex = lpKnownFactoryIndexToLpIndexMap.get(knownFactoryIdx);
        if (lpIndex !== undefined) {
          const indexInfo = lpUnderlyingSymbolIndexMap.get(lpIndex);
          const token0Symbol =
            indexInfo?.token0 !== undefined ? readSymbolOrUnknown(tokenSymbolData?.[indexInfo.token0]) : 'UNKNOWN';
          const token1Symbol =
            indexInfo?.token1 !== undefined ? readSymbolOrUnknown(tokenSymbolData?.[indexInfo.token1]) : 'UNKNOWN';
          joinedAmountTokenSymbol = `LP(${token0Symbol},${token1Symbol})`;
        } else {
          joinedAmountTokenSymbol = 'UNKNOWN';
        }
      } else {
        const symbolIndex = nonLpSymbolIndexMap.get(knownFactoryIdx);
        joinedAmountTokenSymbol =
          symbolIndex !== undefined ? readSymbolOrUnknown(tokenSymbolData?.[symbolIndex]) : 'UNKNOWN';
      }

      // 情况 6: 所有验证通过，标记为扩展并缓存完整信息
      setCachedExtensionValidation(
        tokenAddress,
        actionId,
        extensionAddress,
        true,
        knownFactoryInfo.factoryAddress,
        joinedAmountTokenAddress,
        joinedAmountTokenIsLP,
        joinedAmountTokenSymbol,
      );
      cachedCount++;
    });

    // 缓存更新后，触发重新读取
    if (cachedCount > 0) {
      console.log(`✅ 成功缓存 ${cachedCount} 个扩展验证结果（含新字段）`);
      setRefreshKey((prev) => prev + 1);
    }
  }, [
    tokenAddress,
    uncachedActionIds,
    extensionContracts.length,
    factoryContracts.length,
    joinedAmountTokenAddressContracts.length,
    joinedTokenFactoryCheckContracts.length,
    lpToken0Token1Contracts.length,
    tokenSymbolContracts.length,
    extensionAddressesData,
    validExtensionMap,
    knownFactoryMap,
    joinedAmountTokenAddressData,
    joinedTokenFactoryData,
    lpToken0Token1Data,
    tokenSymbolData,
    uniswapV2FactoryAddressLower,
    lpKnownFactoryIndexToLpIndexMap,
    nonLpSymbolIndexMap,
    lpUnderlyingSymbolIndexMap,
    needsTokenSymbolRead,
    canBuildTokenSymbolContracts,
    isPending1,
    isPending2,
    isPending3,
    isPending4,
    isPending5,
    isPending6,
  ]);

  // ==================== 合并缓存数据和新数据 ====================

  const extensions = useMemo(() => {
    const results: ExtensionValidationInfo[] = [];

    actionIds.forEach((actionId) => {
      // 优先从缓存读取
      const cached = cachedData.get(actionId);
      if (cached) {
        results.push(cached);
        return;
      }

      // 数据还未加载，返回默认值
      results.push({
        actionId,
        isExtension: false,
      });
    });

    return results;
  }, [actionIds, cachedData]);

  // ==================== 计算 isPending 状态 ====================

  const isPending = useMemo(() => {
    if (!enabled || !hasActionIds) {
      return false;
    }

    // 如果没有未缓存的数据，直接返回 false
    if (uncachedActionIds.length === 0) return false;

    // 阶段 1：等待扩展地址查询
    if (extensionContracts.length > 0 && isPending1) return true;

    // 如果没有有效扩展，提前返回 false
    if (validExtensions.length === 0) return false;

    // 阶段 2：等待 factory 地址查询
    if (factoryContracts.length > 0 && isPending2) return true;

    // 如果没有已知 factory，提前返回 false
    if (knownFactoryExtensions.length === 0) return false;

    // 阶段 3.1：等待 joinedAmountTokenAddress 查询
    if (joinedAmountTokenAddressContracts.length > 0 && isPending3) return true;

    // 阶段 3.2：等待 joinedAmountToken factory 检查（用于判断 LP）
    if (joinedTokenFactoryCheckContracts.length > 0 && isPending4) return true;

    // 阶段 3.3：等待 LP token0/token1 读取
    if (lpToken0Token1Contracts.length > 0 && isPending5) return true;

    // 阶段 3.4：等待 symbol 批量读取
    if (needsTokenSymbolRead && !canBuildTokenSymbolContracts) return true;
    return tokenSymbolContracts.length > 0 && isPending6;
  }, [
    enabled,
    hasActionIds,
    uncachedActionIds.length,
    extensionContracts.length,
    isPending1,
    validExtensions.length,
    factoryContracts.length,
    isPending2,
    knownFactoryExtensions.length,
    joinedAmountTokenAddressContracts.length,
    isPending3,
    joinedTokenFactoryCheckContracts.length,
    isPending4,
    lpToken0Token1Contracts.length,
    isPending5,
    needsTokenSymbolRead,
    canBuildTokenSymbolContracts,
    tokenSymbolContracts.length,
    isPending6,
  ]);

  const error = error1 || error2 || error3 || error4 || error5 || error6 || null;

  return {
    extensions,
    isPending,
    error,
  };
};

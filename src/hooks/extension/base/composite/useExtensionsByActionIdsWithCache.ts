/**
 * 批量验证行动是否为扩展行动（带缓存）
 *
 * 功能概述：
 * 1. 根据 actionIds 批量验证是否为扩展行动
 * 2. 返回扩展地址和验证结果
 * 3. 使用 LocalStorage 永久缓存验证结果
 * 4. 使用 useReadContracts 批量调用优化性能
 *
 * 验证算法（四步骤）：
 * 1. 批量从 LOVE20ExtensionCenter.extension() 获取扩展地址
 * 2. 批量调用扩展合约的 factory() 方法获取 factory 地址
 * 3. 检查 factory 地址是否在配置的 factory 列表中
 * 4. 调用 factory.exists(extensionAddress) 方法验证扩展是否合法
 *
 * 使用示例：
 * ```typescript
 * const { extensions, isPending } = useExtensionsByActionIdsWithCache({
 *   token,
 *   actionIds: [1n, 2n, 3n],
 * });
 *
 * // extensions: [
 * //   { actionId: 1n, extensionAddress: '0x...', isExtension: true },
 * //   { actionId: 2n, isExtension: false },
 * //   { actionId: 3n, extensionAddress: '0x...', isExtension: true }
 * // ]
 * ```
 */

import { useMemo, useEffect, useState } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionCenterAbi } from '@/src/abis/LOVE20ExtensionCenter';
import { ILOVE20ExtensionAbi } from '@/src/abis/ILOVE20Extension';
import { LOVE20ExtensionFactoryBaseAbi } from '@/src/abis/LOVE20ExtensionFactoryBase';
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
}

/**
 * 缓存项结构（永久缓存，不设置过期时间）
 */
interface CacheItem {
  data: {
    extensionAddress: string; // "0x0..." 表示非扩展
    isExtension: boolean;
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
): void {
  if (typeof window === 'undefined') return;

  try {
    const key = buildCacheKey(tokenAddress, actionId);
    const item: CacheItem = {
      data: {
        extensionAddress,
        isExtension,
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
      abi: LOVE20ExtensionCenterAbi,
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
      abi: ILOVE20ExtensionAbi,
      functionName: 'factory' as const,
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

  // ==================== 阶段 3: 批量验证扩展存在性 ====================

  const existsContracts = useMemo(() => {
    if (knownFactoryExtensions.length === 0) return [];

    return knownFactoryExtensions.map((info) => ({
      address: info.factoryAddress,
      abi: LOVE20ExtensionFactoryBaseAbi,
      functionName: 'exists' as const,
      args: [info.extensionAddress] as const,
    }));
  }, [knownFactoryExtensions]);

  const {
    data: existsData,
    isPending: isPending3,
    error: error3,
  } = useReadContracts({
    contracts: existsContracts as any,
    query: {
      enabled: existsContracts.length > 0,
    },
  });

  // ==================== 阶段 4: 保存验证结果到缓存 ====================

  useEffect(() => {
    if (!tokenAddress || uncachedActionIds.length === 0) return;

    // 等待扩展地址查询完成
    if (extensionContracts.length > 0 && isPending1) return;

    // 等待 factory 地址查询完成
    if (factoryContracts.length > 0 && isPending2) return;

    // 等待 exists 验证完成
    if (existsContracts.length > 0 && isPending3) return;

    let cachedCount = 0;

    // 构建验证结果的映射（用于快速查找）
    const validExtensionMap = new Map<number, ExtensionInfo>();
    validExtensions.forEach((info, index) => {
      validExtensionMap.set(info.arrayIndex, info);
    });

    const knownFactoryMap = new Map<number, FactoryInfo>();
    knownFactoryExtensions.forEach((info, index) => {
      knownFactoryMap.set(info.arrayIndex, info);
    });

    const existsResultMap = new Map<number, boolean>();
    if (existsData) {
      existsData.forEach((result, index) => {
        if (result?.status === 'success') {
          const factoryInfo = knownFactoryExtensions[index];
          existsResultMap.set(factoryInfo.arrayIndex, result.result as boolean);
        }
      });
    }

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
      if (!knownFactoryMap.has(index)) {
        setCachedExtensionValidation(tokenAddress, actionId, ZERO_ADDRESS, false);
        cachedCount++;
        return;
      }

      // 情况 5: factory 已知，但 exists 验证失败或返回 false，标记为非扩展并缓存
      const existsResult = existsResultMap.get(index);
      if (existsResult !== true) {
        setCachedExtensionValidation(tokenAddress, actionId, ZERO_ADDRESS, false);
        cachedCount++;
        return;
      }

      // 情况 6: 所有验证通过，标记为扩展并缓存
      setCachedExtensionValidation(tokenAddress, actionId, extensionAddress, true);
      cachedCount++;
    });

    // 缓存更新后，触发重新读取
    if (cachedCount > 0) {
      console.log(`✅ 成功缓存 ${cachedCount} 个扩展验证结果`);
      setRefreshKey((prev) => prev + 1);
    }
  }, [
    tokenAddress,
    uncachedActionIds,
    extensionContracts.length,
    factoryContracts.length,
    existsContracts.length,
    extensionAddressesData,
    validExtensions,
    knownFactoryExtensions,
    existsData,
    isPending1,
    isPending2,
    isPending3,
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

    // 阶段 3：等待 exists 验证
    return existsContracts.length > 0 && isPending3;
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
    existsContracts.length,
    isPending3,
  ]);

  const error = error1 || error2 || error3 || null;

  return {
    extensions,
    isPending,
    error,
  };
};

/**
 * 扩展行动数据查询 Hooks
 *
 * 功能概述：
 * 1. 提供批量和单个行动的扩展信息查询
 * 2. 合约信息使用 LocalStorage 永久缓存（不会变化）
 * 3. 基础数据实时查询（不缓存，每次从链上读取）
 * 4. 使用 useReadContracts 批量调用优化性能
 *
 * 主要 Hooks：
 * - useExtensionsContractInfo: 批量获取扩展合约信息（有缓存）
 * - useExtensionContractInfo: 获取单个行动的扩展合约信息（有缓存）
 * - useExtensionsBaseData: 批量获取扩展基础数据（无缓存，实时查询）
 * - useExtensionBaseData: 获取单个行动的扩展基础数据（无缓存，实时查询）
 *
 * 使用示例：
 * ```typescript
 * // 批量查询合约信息（永久缓存）
 * const { contractInfos, isPending } = useExtensionsContractInfo({
 *   tokenAddress,
 *   actionIds: [1n, 2n, 3n],
 * });
 *
 * // 单个查询
 * const { contractInfo } = useExtensionContractInfo({
 *   tokenAddress,
 *   actionId: 1n,
 * });
 *
 * // 查询基础数据（实时查询，不缓存）
 * const { baseData } = useExtensionsBaseData({
 *   tokenAddress,
 *   actionIds: [1n, 2n],
 * });
 * ```
 */

import { useMemo, useEffect, useState } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionCenterAbi } from '@/src/abis/LOVE20ExtensionCenter';
import { LOVE20ExtensionLpAbi } from '@/src/abis/LOVE20ExtensionLp';
import { getExtensionConfigByFactory, ExtensionType } from '@/src/config/extensionConfig';
import { safeToBigInt } from '@/src/lib/clientUtils';

const EXTENSION_CENTER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_CENTER as `0x${string}`;

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
}

/**
 * 扩展基础数据
 */
export interface ExtensionBaseData {
  actionId: bigint;
  isExtension: boolean;
  extension?: `0x${string}`;
  accountsCount?: bigint;
  joinedValue?: bigint;
}

// ==================== 缓存相关 ====================

/** 合约信息缓存键前缀 */
const CONTRACT_CACHE_KEY_PREFIX = 'love20:extension:contract:';

/**
 * 合约信息缓存项（永久缓存，不设置过期时间）
 */
interface ContractCacheItem {
  data: {
    extensionAddress: string;
    factoryAddress: string;
    factoryName: string;
    factoryType: string;
  };
}

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

// ==================== Hook 1: 批量获取扩展合约信息 ====================

export interface UseExtensionsContractInfoParams {
  tokenAddress: `0x${string}` | undefined;
  actionIds: bigint[];
}

export interface UseExtensionsContractInfoResult {
  contractInfos: ExtensionContractInfo[];
  isPending: boolean;
  error: any;
}

/**
 * Hook 1: 批量获取扩展合约信息
 *
 * 功能：
 * 1. 批量查询多个行动的扩展合约信息
 * 2. 使用 localStorage 永久缓存结果（合约信息不会变化）
 * 3. 合并多个 RPC 调用为批量调用
 *
 * @param tokenAddress 代币地址
 * @param actionIds 行动ID列表
 * @returns 扩展合约信息列表、加载状态和错误信息
 */
export const useExtensionsContractInfo = ({
  tokenAddress,
  actionIds,
}: UseExtensionsContractInfoParams): UseExtensionsContractInfoResult => {
  const [refreshKey, setRefreshKey] = useState(0);

  // 步骤1: 检查缓存，分离出需要请求的 actionIds
  const { cachedData, uncachedActionIds } = useMemo(() => {
    if (!tokenAddress || actionIds.length === 0) {
      return { cachedData: new Map<bigint, ExtensionContractInfo>(), uncachedActionIds: [] };
    }

    const cached = new Map<bigint, ExtensionContractInfo>();
    const uncached: bigint[] = [];

    for (const actionId of actionIds) {
      const cacheItem = getCachedContractInfo(tokenAddress, actionId);

      if (cacheItem) {
        const isExtensionZero = cacheItem.data.extensionAddress === '0x0000000000000000000000000000000000000000';

        // 验证缓存完整性：如果有扩展地址但没有 factory 地址，认为缓存无效
        // 注意：factoryType 可以为空（未在配置中注册的工厂），这不影响扩展功能
        if (!isExtensionZero && !cacheItem.data.factoryAddress) {
          console.log(`⚠️ ActionId ${actionId} 合约信息缓存不完整，清除缓存重新查询`);
          clearContractInfoCache(tokenAddress, actionId);
          uncached.push(actionId);
          continue;
        }

        cached.set(actionId, {
          actionId,
          isExtension: !isExtensionZero,
          factory: !isExtensionZero
            ? {
                type: (cacheItem.data.factoryType || ExtensionType.LP) as ExtensionType,
                name: cacheItem.data.factoryName || 'LP行动',
                address: cacheItem.data.factoryAddress as `0x${string}`,
              }
            : undefined,
          extension: !isExtensionZero ? (cacheItem.data.extensionAddress as `0x${string}`) : undefined,
        });
      } else {
        uncached.push(actionId);
      }
    }

    return { cachedData: cached, uncachedActionIds: uncached };
  }, [tokenAddress, actionIds, refreshKey]);

  // 步骤2: 构建批量合约调用列表 - 查询扩展地址
  const extensionContracts = useMemo(() => {
    if (!tokenAddress || uncachedActionIds.length === 0) return [];

    return uncachedActionIds.map((actionId) => ({
      address: EXTENSION_CENTER_ADDRESS,
      abi: LOVE20ExtensionCenterAbi,
      functionName: 'extension' as const,
      args: [tokenAddress, actionId],
    }));
  }, [tokenAddress, uncachedActionIds]);

  // 步骤3: 批量读取扩展地址
  const {
    data: extensionAddressesData,
    isPending: isPending1,
    error: error1,
  } = useReadContracts({
    contracts: extensionContracts as any,
    query: {
      enabled: !!tokenAddress && extensionContracts.length > 0,
    },
  });

  // 步骤4: 根据扩展地址，构建批量查询 factory 地址的合约列表
  const factoryContracts = useMemo(() => {
    if (!extensionAddressesData) return [];

    const calls: any[] = [];

    for (let i = 0; i < extensionAddressesData.length; i++) {
      const result = extensionAddressesData[i];
      const extensionAddress = result?.result as `0x${string}` | undefined;

      // 如果是非零地址，查询 factory
      if (extensionAddress && extensionAddress !== '0x0000000000000000000000000000000000000000') {
        calls.push({
          address: extensionAddress,
          abi: LOVE20ExtensionLpAbi,
          functionName: 'factory' as const,
          args: [],
        });
      }
    }

    return calls;
  }, [extensionAddressesData]);

  // 步骤5: 批量读取 factory 地址
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

  // 步骤6: 组合结果并缓存
  useEffect(() => {
    if (!tokenAddress || !extensionAddressesData) return;

    // 检查是否有需要查询 factory 的扩展地址
    let hasExtensionNeedingFactory = false;
    for (let i = 0; i < uncachedActionIds.length; i++) {
      const extensionAddress = extensionAddressesData[i]?.result as `0x${string}` | undefined;
      if (extensionAddress && extensionAddress !== '0x0000000000000000000000000000000000000000') {
        hasExtensionNeedingFactory = true;
        break;
      }
    }

    // 如果有扩展地址需要查询 factory，但 factory 数据还在 pending，则等待
    if (hasExtensionNeedingFactory && isPending2) {
      return;
    }

    let factoryIndex = 0;
    let cachedCount = 0;

    for (let i = 0; i < uncachedActionIds.length; i++) {
      const actionId = uncachedActionIds[i];
      const extensionAddress = extensionAddressesData[i]?.result as `0x${string}` | undefined;

      let factoryAddress: `0x${string}` | undefined = undefined;
      let factoryName = '';
      let factoryType = '';

      if (extensionAddress && extensionAddress !== '0x0000000000000000000000000000000000000000') {
        // 有扩展地址，获取对应的 factory
        if (factoryAddressesData && factoryAddressesData[factoryIndex]) {
          factoryAddress = factoryAddressesData[factoryIndex]?.result as `0x${string}` | undefined;

          // 根据 factory 地址获取配置信息，如果找不到配置则使用默认值
          if (factoryAddress) {
            const config = getExtensionConfigByFactory(factoryAddress);
            factoryName = config?.name || 'LP行动';
            factoryType = config?.type || ExtensionType.LP;
          }
        }
        factoryIndex++;
      }

      // 保存到缓存（即使是零地址也缓存，避免重复查询）
      setCachedContractInfo(
        tokenAddress,
        actionId,
        extensionAddress || '0x0000000000000000000000000000000000000000',
        factoryAddress || '0x0000000000000000000000000000000000000000',
        factoryName,
        factoryType,
      );
      cachedCount++;
    }

    // 缓存更新后，触发重新读取
    if (cachedCount > 0) {
      console.log(`✅ 成功缓存 ${cachedCount} 个扩展合约信息`);
      setRefreshKey((prev) => prev + 1);
    }
  }, [tokenAddress, uncachedActionIds, extensionAddressesData, factoryAddressesData, isPending2]);

  // 步骤7: 合并缓存数据和新数据
  const contractInfos = useMemo(() => {
    const results: ExtensionContractInfo[] = [];

    for (const actionId of actionIds) {
      // 优先从缓存读取
      const cached = cachedData.get(actionId);
      if (cached) {
        results.push(cached);
        continue;
      }

      // 从当前查询结果读取
      const index = uncachedActionIds.indexOf(actionId);
      if (index !== -1 && extensionAddressesData && extensionAddressesData[index]) {
        const extensionAddress = extensionAddressesData[index]?.result as `0x${string}` | undefined;
        const isZeroAddress = !extensionAddress || extensionAddress === '0x0000000000000000000000000000000000000000';

        let factoryInfo: FactoryInfo | undefined = undefined;
        if (!isZeroAddress && factoryAddressesData) {
          // 找到对应的 factory 索引
          let factoryIndex = 0;
          for (let i = 0; i < index; i++) {
            const prevExtAddr = extensionAddressesData[i]?.result as `0x${string}` | undefined;
            if (prevExtAddr && prevExtAddr !== '0x0000000000000000000000000000000000000000') {
              factoryIndex++;
            }
          }

          const factoryAddress = factoryAddressesData[factoryIndex]?.result as `0x${string}` | undefined;
          if (factoryAddress) {
            const config = getExtensionConfigByFactory(factoryAddress);
            // 如果找到配置则使用配置，否则使用默认值
            factoryInfo = {
              type: config?.type || ExtensionType.LP,
              name: config?.name || 'LP行动',
              address: factoryAddress,
            };
          }
        }

        results.push({
          actionId,
          isExtension: !isZeroAddress,
          factory: factoryInfo,
          extension: !isZeroAddress ? extensionAddress : undefined,
        });
      } else {
        // 数据还未加载，返回默认值
        results.push({
          actionId,
          isExtension: false,
        });
      }
    }

    return results;
  }, [actionIds, cachedData, uncachedActionIds, extensionAddressesData, factoryAddressesData]);

  const isPending = (extensionContracts.length > 0 && isPending1) || (factoryContracts.length > 0 && isPending2);
  const error = error1 || error2;

  return {
    contractInfos,
    isPending: uncachedActionIds.length > 0 ? isPending : false,
    error,
  };
};

// ==================== Hook 2: 单个行动的扩展合约信息 ====================

export interface UseExtensionContractInfoParams {
  tokenAddress: `0x${string}` | undefined;
  actionId: bigint | undefined;
}

export interface UseExtensionContractInfoResult {
  contractInfo: ExtensionContractInfo | undefined;
  isPending: boolean;
  error: any;
}

/**
 * Hook 2: 获取单个行动的扩展合约信息
 *
 * 封装 Hook 1，简化单个行动的查询
 *
 * @param tokenAddress 代币地址
 * @param actionId 行动ID
 * @returns 扩展合约信息、加载状态和错误信息
 */
export const useExtensionContractInfo = ({
  tokenAddress,
  actionId,
}: UseExtensionContractInfoParams): UseExtensionContractInfoResult => {
  const actionIds = useMemo(() => (actionId !== undefined ? [actionId] : []), [actionId]);

  const { contractInfos, isPending, error } = useExtensionsContractInfo({
    tokenAddress,
    actionIds,
  });

  const contractInfo = useMemo(() => {
    if (actionId === undefined) return undefined;
    return contractInfos.find((info) => info.actionId === actionId);
  }, [contractInfos, actionId]);

  return {
    contractInfo,
    isPending,
    error,
  };
};

// ==================== Hook 3: 批量获取扩展基础数据 ====================

export interface UseExtensionsBaseDataParams {
  tokenAddress: `0x${string}` | undefined;
  actionIds: bigint[];
}

export interface UseExtensionsBaseDataResult {
  baseData: ExtensionBaseData[];
  isPending: boolean;
  error: any;
}

/**
 * Hook 3: 批量获取扩展基础数据
 *
 * 功能：
 * 1. 使用 Hook 1 获取扩展合约信息
 * 2. 批量查询扩展行动的参与统计数据（不缓存，每次实时查询）
 *
 * @param tokenAddress 代币地址
 * @param actionIds 行动ID列表
 * @returns 扩展基础数据列表、加载状态和错误信息
 */
export const useExtensionsBaseData = ({
  tokenAddress,
  actionIds,
}: UseExtensionsBaseDataParams): UseExtensionsBaseDataResult => {
  // 步骤1: 使用 Hook 1 获取合约信息
  const {
    contractInfos,
    isPending: isPendingContract,
    error: errorContract,
  } = useExtensionsContractInfo({
    tokenAddress,
    actionIds,
  });

  // 步骤2: 构建扩展地址列表（只处理有扩展的行动）
  const { extensionAddresses, actionIdMap } = useMemo(() => {
    if (!tokenAddress || actionIds.length === 0 || contractInfos.length === 0) {
      return {
        extensionAddresses: [],
        actionIdMap: new Map<number, bigint>(),
      };
    }

    const extensions: `0x${string}`[] = [];
    const idMap = new Map<number, bigint>();

    for (const contractInfo of contractInfos) {
      // 只处理扩展行动
      if (contractInfo.isExtension && contractInfo.extension) {
        idMap.set(extensions.length, contractInfo.actionId);
        extensions.push(contractInfo.extension);
      }
    }

    return {
      extensionAddresses: extensions,
      actionIdMap: idMap,
    };
  }, [tokenAddress, actionIds, contractInfos]);

  // 步骤3: 构建批量合约调用列表
  const dynamicContracts = useMemo(() => {
    if (extensionAddresses.length === 0) return [];

    const contracts: any[] = [];

    for (const extensionAddress of extensionAddresses) {
      // 添加 accountsCount 查询
      contracts.push({
        address: extensionAddress,
        abi: LOVE20ExtensionLpAbi,
        functionName: 'accountsCount' as const,
        args: [],
      });

      // 添加 joinedValue 查询
      contracts.push({
        address: extensionAddress,
        abi: LOVE20ExtensionLpAbi,
        functionName: 'joinedValue' as const,
        args: [],
      });
    }

    return contracts;
  }, [extensionAddresses]);

  // 步骤4: 批量读取基础数据（实时查询，不缓存）
  const {
    data: dynamicContractsData,
    isPending: isPendingDynamic,
    error: errorDynamic,
  } = useReadContracts({
    contracts: dynamicContracts as any,
    query: {
      enabled: dynamicContracts.length > 0,
    },
  });

  // 步骤5: 解析查询结果并组合数据
  const baseData = useMemo(() => {
    const results: ExtensionBaseData[] = [];

    for (const actionId of actionIds) {
      const contractInfo = contractInfos.find((info) => info.actionId === actionId);

      // 如果不是扩展行动，直接返回基本信息
      if (!contractInfo?.isExtension || !contractInfo.extension) {
        results.push({
          actionId,
          isExtension: false,
        });
        continue;
      }

      // 找到对应的扩展地址索引
      let extensionIndex = -1;
      for (let i = 0; i < extensionAddresses.length; i++) {
        const mappedActionId = actionIdMap.get(i);
        if (mappedActionId === actionId) {
          extensionIndex = i;
          break;
        }
      }

      // 如果找到了扩展地址且有查询结果
      if (extensionIndex !== -1 && dynamicContractsData) {
        const accountsCountResult = dynamicContractsData[extensionIndex * 2];
        const joinedValueResult = dynamicContractsData[extensionIndex * 2 + 1];

        results.push({
          actionId,
          isExtension: true,
          extension: contractInfo.extension,
          accountsCount: safeToBigInt(accountsCountResult?.result),
          joinedValue: safeToBigInt(joinedValueResult?.result),
        });
      } else {
        // 数据还在加载中
        results.push({
          actionId,
          isExtension: true,
          extension: contractInfo.extension,
        });
      }
    }

    return results;
  }, [actionIds, contractInfos, extensionAddresses, actionIdMap, dynamicContractsData]);

  const isPending = isPendingContract || (dynamicContracts.length > 0 && isPendingDynamic);
  const error = errorContract || errorDynamic;

  return {
    baseData,
    isPending,
    error,
  };
};

// ==================== Hook 4: 单个行动的扩展基础数据 ====================

export interface UseExtensionBaseDataParams {
  tokenAddress: `0x${string}` | undefined;
  actionId: bigint | undefined;
}

export interface UseExtensionBaseDataResult {
  baseData: ExtensionBaseData | undefined;
  isPending: boolean;
  error: any;
}

/**
 * Hook 4: 获取单个行动的扩展基础数据
 *
 * 封装 Hook 3，简化单个行动的查询
 *
 * @param tokenAddress 代币地址
 * @param actionId 行动ID
 * @returns 扩展基础数据、加载状态和错误信息
 */
export const useExtensionBaseData = ({
  tokenAddress,
  actionId,
}: UseExtensionBaseDataParams): UseExtensionBaseDataResult => {
  const actionIds = useMemo(() => (actionId !== undefined ? [actionId] : []), [actionId]);

  const {
    baseData: allBaseData,
    isPending,
    error,
  } = useExtensionsBaseData({
    tokenAddress,
    actionIds,
  });

  const baseData = useMemo(() => {
    if (actionId === undefined) return undefined;
    return allBaseData.find((data) => data.actionId === actionId);
  }, [allBaseData, actionId]);

  return {
    baseData,
    isPending,
    error,
  };
};

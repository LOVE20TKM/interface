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
import { IExtensionAbi } from '@/src/abis/IExtension';
import { ExtensionLpAbi } from '@/src/abis/ExtensionLp';
import { ExtensionFactoryBaseAbi } from '@/src/abis/ExtensionFactoryBase';
import { getExtensionConfigByFactory, getExtensionConfigs, ExtensionType } from '@/src/config/extensionConfig';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { ActionInfo } from '@/src/types/love20types';

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
  actionInfos: ActionInfo[];
}

export interface UseExtensionsContractInfoResult {
  contractInfos: ExtensionContractInfo[];
  isPending: boolean;
  error: any;
}

/**
 * Hook 1: 批量获取扩展合约信息
 *
 * 新的验证逻辑：
 * 1. 从行动详情中获取白名单地址（whiteListAddress）
 * 2. 如果白名单地址为零地址，则不是扩展行动
 * 3. 调用白名单地址的 factory() 方法获取 factory 地址
 * 4. 检查 factory 地址是否在配置的 factory 列表中
 * 5. 调用 factory 的 exists(whitelist) 方法验证扩展是否合法
 *
 * @param tokenAddress 代币地址
 * @param actionInfos 行动信息列表
 * @returns 扩展合约信息列表、加载状态和错误信息
 */
export const useExtensionsContractInfo = ({
  tokenAddress,
  actionInfos,
}: UseExtensionsContractInfoParams): UseExtensionsContractInfoResult => {
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
          console.log(`⚠️ ActionId ${actionId} 合约信息缓存不完整，清除缓存重新查询`);
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
        functionName: 'factory' as const,
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

  // 步骤6: 组合结果并缓存
  useEffect(() => {
    if (!tokenAddress || uncachedActionInfos.length === 0) return;

    // 等待 factory 查询完成
    if (factoryContracts.length > 0 && isPending1) return;

    // 等待 exists 验证完成
    if (existsContracts.length > 0 && isPending2) return;

    const configuredFactories = getExtensionConfigs();
    const factoryAddressSet = new Set(configuredFactories.map((c) => c.factoryAddress.toLowerCase()));

    let cachedCount = 0;
    let validWhitelistIndex = 0;
    let existsIndex = 0;

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
        );
        cachedCount++;
        continue;
      }

      // exists 返回 true，确认为合法扩展
      const config = getExtensionConfigByFactory(factoryAddress);
      const factoryName = config?.name || '未知类型';
      const factoryType = config?.type || ExtensionType.LP;

      setCachedContractInfo(tokenAddress, actionId, whitelistAddress, factoryAddress, factoryName, factoryType);
      cachedCount++;
    }

    // 缓存更新后，触发重新读取
    if (cachedCount > 0) {
      console.log(`✅ 成功缓存 ${cachedCount} 个扩展合约信息`);
      setRefreshKey((prev) => prev + 1);
    }
  }, [
    tokenAddress,
    uncachedActionInfos,
    factoryContracts,
    existsContracts,
    factoryAddressesData,
    existsData,
    isPending1,
    isPending2,
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

  const isPending =
    uncachedActionInfos.length > 0
      ? (factoryContracts.length > 0 && isPending1) || (existsContracts.length > 0 && isPending2)
      : false;
  const error = error1 || error2;

  return {
    contractInfos,
    isPending,
    error,
  };
};

// ==================== Hook 2: 单个行动的扩展合约信息 ====================

export interface UseExtensionContractInfoParams {
  tokenAddress: `0x${string}` | undefined;
  actionInfo: ActionInfo | undefined;
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
 * @param actionInfo 行动信息
 * @returns 扩展合约信息、加载状态和错误信息
 */
export const useExtensionContractInfo = ({
  tokenAddress,
  actionInfo,
}: UseExtensionContractInfoParams): UseExtensionContractInfoResult => {
  const actionInfos = useMemo(() => (actionInfo !== undefined ? [actionInfo] : []), [actionInfo]);

  const { contractInfos, isPending, error } = useExtensionsContractInfo({
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

// ==================== Hook 3: 批量获取扩展基础数据 ====================

export interface UseExtensionsBaseDataParams {
  tokenAddress: `0x${string}` | undefined;
  actionInfos: ActionInfo[];
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
 * @param actionInfos 行动信息列表
 * @returns 扩展基础数据列表、加载状态和错误信息
 */
export const useExtensionsBaseData = ({
  tokenAddress,
  actionInfos,
}: UseExtensionsBaseDataParams): UseExtensionsBaseDataResult => {
  // 步骤1: 使用 Hook 1 获取合约信息
  const {
    contractInfos,
    isPending: isPendingContract,
    error: errorContract,
  } = useExtensionsContractInfo({
    tokenAddress,
    actionInfos,
  });

  // 步骤2: 构建扩展地址列表（只处理有扩展的行动）
  const { extensionAddresses, actionIdMap } = useMemo(() => {
    if (!tokenAddress || actionInfos.length === 0 || contractInfos.length === 0) {
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
  }, [tokenAddress, actionInfos, contractInfos]);

  // 步骤3: 构建批量合约调用列表
  const dynamicContracts = useMemo(() => {
    if (extensionAddresses.length === 0) return [];

    const contracts: any[] = [];

    for (const extensionAddress of extensionAddresses) {
      // 添加 accountsCount 查询
      contracts.push({
        address: extensionAddress,
        abi: ExtensionLpAbi,
        functionName: 'accountsCount' as const,
        args: [],
      });

      // 添加 joinedValue 查询
      contracts.push({
        address: extensionAddress,
        abi: ExtensionLpAbi,
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

    for (const actionInfo of actionInfos) {
      const actionId = actionInfo.head.id;
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
  }, [actionInfos, contractInfos, extensionAddresses, actionIdMap, dynamicContractsData]);

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
  actionInfo: ActionInfo | undefined;
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
 * @param actionInfo 行动信息
 * @returns 扩展基础数据、加载状态和错误信息
 */
export const useExtensionBaseData = ({
  tokenAddress,
  actionInfo,
}: UseExtensionBaseDataParams): UseExtensionBaseDataResult => {
  const actionInfos = useMemo(() => (actionInfo !== undefined ? [actionInfo] : []), [actionInfo]);

  const {
    baseData: allBaseData,
    isPending,
    error,
  } = useExtensionsBaseData({
    tokenAddress,
    actionInfos,
  });

  const baseData = useMemo(() => {
    if (actionInfo === undefined) return undefined;
    return allBaseData.find((data) => data.actionId === actionInfo.head.id);
  }, [allBaseData, actionInfo]);

  return {
    baseData,
    isPending,
    error,
  };
};

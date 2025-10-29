import { useMemo, useEffect, useState } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionCenterAbi } from '@/src/abis/LOVE20ExtensionCenter';
import { LOVE20ExtensionStakeLpAbi } from '@/src/abis/LOVE20ExtensionStakeLp';

const EXTENSION_CENTER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_CENTER as `0x${string}`;
const CACHE_KEY_PREFIX = 'love20:extension:';
const CACHE_EXPIRY_MS = 1000 * 60 * 60; // 1小时缓存

// 清除指定行动的缓存
function clearCachedExtensionInfo(tokenAddress: string, actionId: bigint): void {
  if (typeof window === 'undefined') return;

  try {
    const key = buildCacheKey(tokenAddress, actionId);
    localStorage.removeItem(key);
    console.log(`🗑️ 清除缓存: ActionId ${actionId}`);
  } catch (error) {
    console.error('清除扩展信息缓存失败:', error);
  }
}

// 扩展信息类型
export interface ActionExtensionInfo {
  actionId: bigint;
  isExtension: boolean;
  extensionAddress?: `0x${string}`;
  factoryAddress?: `0x${string}`;
}

// 缓存项类型
interface CacheItem {
  data: {
    extensionAddress: string;
    factoryAddress: string;
  };
  timestamp: number;
}

// 构建缓存键
function buildCacheKey(tokenAddress: string, actionId: bigint): string {
  return `${CACHE_KEY_PREFIX}${tokenAddress.toLowerCase()}:${actionId.toString()}`;
}

// 从localStorage读取缓存
function getCachedExtensionInfo(tokenAddress: string, actionId: bigint): CacheItem | null {
  if (typeof window === 'undefined') return null;

  try {
    const key = buildCacheKey(tokenAddress, actionId);
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const item: CacheItem = JSON.parse(cached);
    const now = Date.now();

    // 检查是否过期
    if (now - item.timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(key);
      return null;
    }

    return item;
  } catch (error) {
    console.error('读取扩展信息缓存失败:', error);
    return null;
  }
}

// 保存到localStorage
function setCachedExtensionInfo(
  tokenAddress: string,
  actionId: bigint,
  extensionAddress: string,
  factoryAddress: string,
): void {
  if (typeof window === 'undefined') return;

  try {
    const key = buildCacheKey(tokenAddress, actionId);
    const item: CacheItem = {
      data: {
        extensionAddress,
        factoryAddress,
      },
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error('保存扩展信息缓存失败:', error);
  }
}

export interface UseActionsExtensionInfoParams {
  tokenAddress: `0x${string}` | undefined;
  actionIds: bigint[];
}

export interface UseActionsExtensionInfoResult {
  extensionInfos: ActionExtensionInfo[];
  isPending: boolean;
  error: any;
}

/**
 * 批量获取行动扩展信息的复合Hook
 *
 * 功能：
 * 1. 批量查询多个行动的扩展信息
 * 2. 使用localStorage缓存结果（1小时有效期）
 * 3. 合并多个RPC调用为一次批量调用
 *
 * @param tokenAddress 代币地址
 * @param actionIds 行动ID列表
 * @returns 扩展信息列表、加载状态和错误信息
 */
export const useActionsExtensionInfo = ({
  tokenAddress,
  actionIds,
}: UseActionsExtensionInfoParams): UseActionsExtensionInfoResult => {
  // 用于强制刷新的状态
  const [refreshKey, setRefreshKey] = useState(0);

  // 步骤1: 检查缓存，分离出需要请求的actionIds
  const { cachedData, uncachedActionIds } = useMemo(() => {
    if (!tokenAddress || actionIds.length === 0) {
      return { cachedData: new Map<bigint, ActionExtensionInfo>(), uncachedActionIds: [] };
    }

    const cached = new Map<bigint, ActionExtensionInfo>();
    const uncached: bigint[] = [];

    for (const actionId of actionIds) {
      const cacheItem = getCachedExtensionInfo(tokenAddress, actionId);

      if (cacheItem) {
        // 从缓存读取
        const isExtensionZero = cacheItem.data.extensionAddress === '0x0000000000000000000000000000000000000000';
        const isFactoryZero = cacheItem.data.factoryAddress === '0x0000000000000000000000000000000000000000';

        // 验证缓存完整性：如果有扩展地址但没有 factory 地址，认为缓存无效
        if (!isExtensionZero && isFactoryZero) {
          console.log(`⚠️ ActionId ${actionId} 缓存数据不完整（有扩展但无 factory），清除缓存重新查询`);
          clearCachedExtensionInfo(tokenAddress, actionId);
          uncached.push(actionId);
          continue;
        }

        cached.set(actionId, {
          actionId,
          isExtension: !isExtensionZero,
          extensionAddress: !isExtensionZero ? (cacheItem.data.extensionAddress as `0x${string}`) : undefined,
          factoryAddress: !isExtensionZero ? (cacheItem.data.factoryAddress as `0x${string}`) : undefined,
        });
      } else {
        uncached.push(actionId);
      }
    }

    return { cachedData: cached, uncachedActionIds: uncached };
  }, [tokenAddress, actionIds, refreshKey]);

  // 步骤2: 构建合约调用列表
  const contracts = useMemo(() => {
    if (!tokenAddress || uncachedActionIds.length === 0) return [];

    const calls: any[] = [];

    // 为每个未缓存的actionId添加查询
    for (const actionId of uncachedActionIds) {
      // 查询扩展合约地址
      calls.push({
        address: EXTENSION_CENTER_ADDRESS,
        abi: LOVE20ExtensionCenterAbi,
        functionName: 'extension',
        args: [tokenAddress, actionId],
      });
    }

    return calls;
  }, [tokenAddress, uncachedActionIds]);

  // 步骤3: 批量读取扩展地址
  const {
    data: extensionAddressesData,
    isPending: isPending1,
    error: error1,
  } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: !!tokenAddress && contracts.length > 0,
    },
  });

  // 步骤4: 根据扩展地址，继续查询factory地址
  const factoryContracts = useMemo(() => {
    if (!extensionAddressesData) return [];

    const calls: any[] = [];
    const validExtensions: string[] = [];

    for (let i = 0; i < extensionAddressesData.length; i++) {
      const result = extensionAddressesData[i];
      const extensionAddress = result?.result as `0x${string}` | undefined;

      // 如果是非零地址，查询factory
      if (extensionAddress && extensionAddress !== '0x0000000000000000000000000000000000000000') {
        validExtensions.push(extensionAddress);
        calls.push({
          address: extensionAddress,
          abi: LOVE20ExtensionStakeLpAbi,
          functionName: 'factory',
          args: [],
        });
      } else {
        // 占位，保持索引对应
        calls.push(null);
      }
    }

    const validCalls = calls.filter((c) => c !== null);
    return validCalls;
  }, [extensionAddressesData, uncachedActionIds]);

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

  // 步骤5: 组合结果并缓存
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
      console.log('⏳ Factory 查询还在进行中，等待完成后再缓存');
      return;
    }

    let factoryIndex = 0;
    let cachedCount = 0;

    for (let i = 0; i < uncachedActionIds.length; i++) {
      const actionId = uncachedActionIds[i];
      const extensionAddress = extensionAddressesData[i]?.result as `0x${string}` | undefined;

      let factoryAddress: `0x${string}` | undefined = undefined;

      if (extensionAddress && extensionAddress !== '0x0000000000000000000000000000000000000000') {
        // 有扩展地址，获取对应的factory
        if (factoryAddressesData && factoryAddressesData[factoryIndex]) {
          factoryAddress = factoryAddressesData[factoryIndex]?.result as `0x${string}` | undefined;
        }
        factoryIndex++;
      }

      // 保存到缓存（即使是零地址也缓存，避免重复查询）
      setCachedExtensionInfo(
        tokenAddress,
        actionId,
        extensionAddress || '0x0000000000000000000000000000000000000000',
        factoryAddress || '0x0000000000000000000000000000000000000000',
      );
      cachedCount++;
    }

    // 缓存更新后，触发重新读取
    if (cachedCount > 0) {
      console.log(`✅ 成功缓存 ${cachedCount} 个扩展信息，触发刷新`);
      setRefreshKey((prev) => prev + 1);
    }
  }, [tokenAddress, uncachedActionIds, extensionAddressesData, factoryAddressesData, isPending2]);

  // 步骤6: 合并缓存数据和新数据
  const extensionInfos = useMemo(() => {
    const results: ActionExtensionInfo[] = [];

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

        let factoryAddress: `0x${string}` | undefined = undefined;
        if (!isZeroAddress && factoryAddressesData) {
          // 找到对应的factory索引
          let factoryIndex = 0;
          for (let i = 0; i < index; i++) {
            const prevExtAddr = extensionAddressesData[i]?.result as `0x${string}` | undefined;
            if (prevExtAddr && prevExtAddr !== '0x0000000000000000000000000000000000000000') {
              factoryIndex++;
            }
          }
          factoryAddress = factoryAddressesData[factoryIndex]?.result as `0x${string}` | undefined;
        }

        results.push({
          actionId,
          isExtension: !isZeroAddress,
          extensionAddress: !isZeroAddress ? extensionAddress : undefined,
          factoryAddress: !isZeroAddress ? factoryAddress : undefined,
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

  const isPending = isPending1 || isPending2;
  const error = error1 || error2;

  return {
    extensionInfos,
    isPending: uncachedActionIds.length > 0 ? isPending : false,
    error,
  };
};

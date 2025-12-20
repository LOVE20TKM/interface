import { useMemo, useEffect } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20GroupAbi } from '@/src/abis/LOVE20Group';

// 合约地址
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP as `0x${string}`;

// 缓存 key 前缀
const CACHE_KEY_PREFIX = 'group_name_';

/**
 * 构建缓存 key
 */
function buildCacheKey(groupId: bigint): string {
  return `${CACHE_KEY_PREFIX}${groupId.toString()}`;
}

/**
 * 缓存项结构
 */
interface CacheItem {
  data: string | null; // null 表示空字符串或未定义
}

/**
 * 从 localStorage 读取缓存的群名称
 */
function getCachedGroupName(groupId: bigint): string | undefined | null {
  if (typeof window === 'undefined') return null;

  try {
    const key = buildCacheKey(groupId);
    const cached = localStorage.getItem(key);
    if (cached === null) return null; // 缓存不存在

    const item: CacheItem = JSON.parse(cached);
    return item.data === null ? undefined : item.data;
  } catch (error) {
    console.error('读取群名称缓存失败:', error);
    return null; // 解析失败，返回 null 表示需要重新获取
  }
}

/**
 * 保存群名称到 localStorage
 */
function setCachedGroupName(groupId: bigint, groupName: string | undefined): void {
  if (typeof window === 'undefined') return;

  try {
    const key = buildCacheKey(groupId);
    const item: CacheItem = {
      data: groupName === undefined ? null : groupName,
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error('保存群名称缓存失败:', error);
  }
}

// ==================== Hook 接口 ====================

export interface UseGroupNamesWithCacheParams {
  groupIds: bigint[] | undefined;
  enabled?: boolean;
}

export interface UseGroupNamesWithCacheResult {
  groupNameMap: Map<bigint, string | undefined>;
  isPending: boolean;
  error: Error | null;
}

/**
 * 根据 groupIds 批量获取群名称（带缓存）
 * 
 * 功能：
 * 1. 先从 localStorage 读取缓存
 * 2. 只对未缓存的 groupIds 发起 RPC 请求
 * 3. RPC 请求成功后，将结果保存到缓存
 * 4. 返回群名称 Map，方便快速查找
 * 
 * @param groupIds - 群 ID 数组（tokenId）
 * @param enabled - 是否启用查询（默认 true）
 * @returns 群名称 Map、加载状态和错误信息
 */
export const useGroupNamesWithCache = ({
  groupIds,
  enabled = true,
}: UseGroupNamesWithCacheParams): UseGroupNamesWithCacheResult => {
  // 检查是否有有效的 groupIds
  const hasGroupIds = !!groupIds && groupIds.length > 0;

  // 步骤1: 检查缓存，分离出已缓存和未缓存的 groupIds
  const { cachedData, uncachedGroupIds } = useMemo(() => {
    if (!enabled || !hasGroupIds) {
      return {
        cachedData: new Map<bigint, string | undefined>(),
        uncachedGroupIds: [],
      };
    }

    const cached = new Map<bigint, string | undefined>();
    const uncached: bigint[] = [];

    groupIds!.forEach((groupId) => {
      const cachedName = getCachedGroupName(groupId);
      // null 表示缓存不存在或解析失败，需要重新获取
      if (cachedName !== null) {
        cached.set(groupId, cachedName);
      } else {
        uncached.push(groupId);
      }
    });

    return {
      cachedData: cached,
      uncachedGroupIds: uncached,
    };
  }, [groupIds, enabled, hasGroupIds]);

  // 步骤2: 构建批量合约调用配置（仅未缓存的 groupIds）
  const contracts = useMemo(() => {
    if (!enabled || !hasGroupIds || uncachedGroupIds.length === 0) {
      return [];
    }

    return uncachedGroupIds.map((groupId) => ({
      address: CONTRACT_ADDRESS,
      abi: LOVE20GroupAbi,
      functionName: 'groupNameOf' as const,
      args: [groupId],
    }));
  }, [uncachedGroupIds, enabled, hasGroupIds]);

  // 步骤3: 使用 useReadContracts 进行批量调用
  const {
    data: contractResults,
    isPending: isRpcPending,
    error: rpcError,
  } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: enabled && hasGroupIds && contracts.length > 0,
    },
  });

  // 步骤4: 处理 RPC 返回结果，保存到缓存
  useEffect(() => {
    if (!contractResults || uncachedGroupIds.length === 0) return;

    contractResults.forEach((result, index) => {
      if (result?.status === 'success') {
        const groupId = uncachedGroupIds[index];
        const groupName = result.result as string | undefined;
        
        // 保存到缓存
        setCachedGroupName(groupId, groupName);
      }
    });
  }, [contractResults, uncachedGroupIds]);

  // 步骤5: 处理 RPC 结果，构建 RPC 数据 Map
  const rpcDataMap = useMemo(() => {
    const map = new Map<bigint, string | undefined>();
    
    if (contractResults && uncachedGroupIds.length > 0) {
      contractResults.forEach((result, index) => {
        const groupId = uncachedGroupIds[index];
        if (result?.status === 'success') {
          map.set(groupId, result.result as string | undefined);
        }
      });
    }
    
    return map;
  }, [contractResults, uncachedGroupIds]);

  // 步骤6: 合并缓存数据和 RPC 数据，构建 Map
  const groupNameMap = useMemo(() => {
    const map = new Map<bigint, string | undefined>();

    if (!enabled || !hasGroupIds) {
      return map;
    }

    // 确保所有 groupIds 都在 Map 中
    groupIds!.forEach((groupId) => {
      // 优先从缓存获取
      if (cachedData.has(groupId)) {
        map.set(groupId, cachedData.get(groupId));
      } 
      // 如果缓存中没有，从 RPC 结果获取
      else if (rpcDataMap.has(groupId)) {
        map.set(groupId, rpcDataMap.get(groupId));
      }
      // 如果都没有（RPC 还在加载或失败），暂时不添加到 Map
      // 调用方应该检查 isPending 状态，等待数据加载完成
    });

    return map;
  }, [groupIds, cachedData, rpcDataMap, enabled, hasGroupIds]);

  // 计算加载状态：如果有未缓存的 groupIds 且 RPC 正在加载，则为 pending
  const isPending = useMemo(() => {
    if (!enabled || !hasGroupIds) {
      return false;
    }
    return uncachedGroupIds.length > 0 && isRpcPending;
  }, [enabled, hasGroupIds, uncachedGroupIds.length, isRpcPending]);

  return {
    groupNameMap,
    isPending,
    error: rpcError || null,
  };
};


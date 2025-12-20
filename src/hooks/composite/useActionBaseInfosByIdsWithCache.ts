import { useMemo, useEffect } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20SubmitAbi } from '@/src/abis/LOVE20Submit';
import { ActionInfo, ActionBaseInfo } from '@/src/types/love20types';

// 合约地址
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_SUBMIT as `0x${string}`;

// 缓存 key 前缀
const CACHE_KEY_PREFIX = 'action_base_info_';

/**
 * 构建缓存 key
 */
function buildCacheKey(tokenAddress: string, actionId: bigint): string {
  return `${CACHE_KEY_PREFIX}${tokenAddress.toLowerCase()}_${actionId.toString()}`;
}

/**
 * 缓存项结构（序列化后的格式，bigint 转为 string）
 */
interface CacheItem {
  data: {
    head: {
      id: string;
      author: `0x${string}`;
      createAtBlock: string;
    };
    body: {
      minStake: string;
      maxRandomAccounts: string;
      whiteListAddress: `0x${string}`;
      title: string;
      verificationKeys: string[];
      verificationInfoGuides: string[];
    };
  };
}

/**
 * 从 localStorage 读取缓存的行动基本信息
 */
function getCachedActionBaseInfo(tokenAddress: string, actionId: bigint): ActionBaseInfo | null {
  if (typeof window === 'undefined') return null;

  try {
    const key = buildCacheKey(tokenAddress, actionId);
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const item: CacheItem = JSON.parse(cached);

    // 转换 bigint 字段
    return {
      head: {
        id: BigInt(item.data.head.id),
        author: item.data.head.author as `0x${string}`,
        createAtBlock: BigInt(item.data.head.createAtBlock),
      },
      body: {
        minStake: BigInt(item.data.body.minStake),
        maxRandomAccounts: BigInt(item.data.body.maxRandomAccounts),
        whiteListAddress: item.data.body.whiteListAddress as `0x${string}`,
        title: item.data.body.title,
        verificationKeys: item.data.body.verificationKeys,
        verificationInfoGuides: item.data.body.verificationInfoGuides,
      },
    };
  } catch (error) {
    console.error('读取行动基本信息缓存失败:', error);
    return null;
  }
}

/**
 * 将 ActionInfo 转换为 ActionBaseInfo（去掉 verificationRule）
 */
function convertToActionBaseInfo(actionInfo: ActionInfo): ActionBaseInfo {
  return {
    head: actionInfo.head,
    body: {
      minStake: actionInfo.body.minStake,
      maxRandomAccounts: actionInfo.body.maxRandomAccounts,
      whiteListAddress: actionInfo.body.whiteListAddress,
      title: actionInfo.body.title,
      verificationKeys: actionInfo.body.verificationKeys,
      verificationInfoGuides: actionInfo.body.verificationInfoGuides,
    },
  };
}

/**
 * 保存行动基本信息到 localStorage
 */
function setCachedActionBaseInfo(tokenAddress: string, actionId: bigint, actionBaseInfo: ActionBaseInfo): void {
  if (typeof window === 'undefined') return;

  try {
    const key = buildCacheKey(tokenAddress, actionId);
    const item: CacheItem = {
      data: {
        head: {
          id: actionBaseInfo.head.id.toString(),
          author: actionBaseInfo.head.author,
          createAtBlock: actionBaseInfo.head.createAtBlock.toString(),
        },
        body: {
          minStake: actionBaseInfo.body.minStake.toString(),
          maxRandomAccounts: actionBaseInfo.body.maxRandomAccounts.toString(),
          whiteListAddress: actionBaseInfo.body.whiteListAddress,
          title: actionBaseInfo.body.title,
          verificationKeys: actionBaseInfo.body.verificationKeys,
          verificationInfoGuides: actionBaseInfo.body.verificationInfoGuides,
        },
      },
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error('保存行动基本信息缓存失败:', error);
  }
}

// ==================== Hook 接口 ====================

export interface UseActionBaseInfosByIdsWithCacheParams {
  tokenAddress: `0x${string}` | undefined;
  actionIds: bigint[];
  enabled?: boolean;
}

export interface UseActionBaseInfosByIdsWithCacheResult {
  actionInfos: ActionBaseInfo[];
  isPending: boolean;
  error: Error | null;
}

/**
 * 根据 actionIds 批量获取行动基本信息（带缓存）
 *
 * 功能：
 * 1. 先从 localStorage 读取缓存
 * 2. 只对未缓存的 actionIds 发起 RPC 请求
 * 3. RPC 请求成功后，将结果保存到缓存
 * 4. 返回按 actionIds 顺序排列的行动基本信息数组
 *
 * @param tokenAddress - 代币地址
 * @param actionIds - 行动 ID 数组
 * @param enabled - 是否启用查询（默认 true）
 * @returns 行动基本信息数组、加载状态和错误信息
 */
export const useActionBaseInfosByIdsWithCache = ({
  tokenAddress,
  actionIds,
  enabled = true,
}: UseActionBaseInfosByIdsWithCacheParams): UseActionBaseInfosByIdsWithCacheResult => {
  // 步骤1: 检查缓存，分离出已缓存和未缓存的 actionIds
  const { cachedData, uncachedActionIds } = useMemo(() => {
    if (!enabled || !tokenAddress || actionIds.length === 0) {
      return {
        cachedData: new Map<bigint, ActionBaseInfo>(),
        uncachedActionIds: [],
      };
    }

    const cached = new Map<bigint, ActionBaseInfo>();
    const uncached: bigint[] = [];

    actionIds.forEach((actionId) => {
      const cachedInfo = getCachedActionBaseInfo(tokenAddress, actionId);
      if (cachedInfo) {
        cached.set(actionId, cachedInfo);
      } else {
        uncached.push(actionId);
      }
    });

    return {
      cachedData: cached,
      uncachedActionIds: uncached,
    };
  }, [tokenAddress, actionIds, enabled]);

  // 步骤2: 构建批量合约调用配置（仅未缓存的 actionIds）
  const contracts = useMemo(() => {
    if (!enabled || !tokenAddress || uncachedActionIds.length === 0) {
      return [];
    }

    return uncachedActionIds.map((actionId) => ({
      address: CONTRACT_ADDRESS,
      abi: LOVE20SubmitAbi,
      functionName: 'actionInfo' as const,
      args: [tokenAddress, actionId],
    }));
  }, [tokenAddress, uncachedActionIds, enabled]);

  // 步骤3: 使用 useReadContracts 进行批量调用
  const {
    data: contractResults,
    isPending: isRpcPending,
    error: rpcError,
  } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: enabled && contracts.length > 0,
    },
  });

  // 步骤4: 处理 RPC 返回结果，转换为 ActionBaseInfo 并保存到缓存
  useEffect(() => {
    if (!tokenAddress || !contractResults || uncachedActionIds.length === 0) return;

    contractResults.forEach((result, index) => {
      if (result?.status === 'success' && result.result) {
        const actionInfo = result.result as ActionInfo;
        const actionId = uncachedActionIds[index];

        // 转换为 ActionBaseInfo（去掉 verificationRule）
        const actionBaseInfo = convertToActionBaseInfo(actionInfo);

        // 保存到缓存
        setCachedActionBaseInfo(tokenAddress, actionId, actionBaseInfo);
      }
    });
  }, [tokenAddress, contractResults, uncachedActionIds]);

  // 步骤5: 处理 RPC 结果，构建 RPC 数据 Map
  const rpcDataMap = useMemo(() => {
    const map = new Map<bigint, ActionBaseInfo>();

    if (contractResults && uncachedActionIds.length > 0) {
      contractResults.forEach((result, index) => {
        const actionId = uncachedActionIds[index];
        if (result?.status === 'success' && result.result) {
          const actionInfo = result.result as ActionInfo;
          map.set(actionId, convertToActionBaseInfo(actionInfo));
        }
      });
    }

    return map;
  }, [contractResults, uncachedActionIds]);

  // 步骤6: 合并缓存数据和 RPC 数据，按 actionIds 顺序返回
  const actionInfos = useMemo(() => {
    if (!enabled || !tokenAddress || actionIds.length === 0) {
      return [];
    }

    const result: ActionBaseInfo[] = [];

    for (const actionId of actionIds) {
      // 优先从缓存获取
      const cached = cachedData.get(actionId);
      if (cached) {
        result.push(cached);
        continue;
      }

      // 如果缓存中没有，从 RPC 结果获取
      const rpcData = rpcDataMap.get(actionId);
      if (rpcData) {
        result.push(rpcData);
        continue;
      }

      // 如果都没有（RPC 还在加载或失败），暂时不添加
      // 注意：这会导致数组长度可能小于 actionIds.length
      // 调用方应该检查 isPending 状态，等待数据加载完成
    }

    return result;
  }, [actionIds, cachedData, rpcDataMap, tokenAddress, enabled]);

  // 计算加载状态：如果有未缓存的 actionIds 且 RPC 正在加载，则为 pending
  const isPending = useMemo(() => {
    if (!enabled || !tokenAddress || actionIds.length === 0) {
      return false;
    }
    return uncachedActionIds.length > 0 && isRpcPending;
  }, [enabled, tokenAddress, actionIds.length, uncachedActionIds.length, isRpcPending]);

  return {
    actionInfos,
    isPending,
    error: rpcError || null,
  };
};

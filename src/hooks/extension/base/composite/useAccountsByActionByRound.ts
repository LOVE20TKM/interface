/**
 * 行动轮次参与地址查询 Hook
 *
 * 职责：
 * - 查询某个行动的某个轮次的所有参与者地址列表
 * - 先获取总数，再批量获取地址
 * - 使用 useReadContracts 优化批量查询性能
 *
 * 使用示例：
 * ```typescript
 * const { accounts, count, isPending, error } = useAccountsByActionByRound({
 *   tokenAddress: '0x...',
 *   actionId: BigInt(1),
 *   round: BigInt(2)
 * });
 * // accounts: ['0xabc...', '0xdef...', ...]
 * ```
 */

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionCenterAbi } from '@/src/abis/LOVE20ExtensionCenter';
import { useAccountsByRoundCount } from '@/src/hooks/extension/base/contracts/useLOVE20ExtensionCenter';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_CENTER as `0x${string}`;

// ==================== 类型定义 ====================

/**
 * Hook 参数
 */
export interface UseAccountsByActionByRoundParams {
  /** Token 地址 */
  tokenAddress: `0x${string}` | undefined;
  /** Action ID */
  actionId: bigint | undefined;
  /** 轮次 */
  round: bigint | undefined;
}

/**
 * Hook 返回值
 */
export interface UseAccountsByActionByRoundResult {
  /** 参与者地址列表 */
  accounts: `0x${string}`[];
  /** 参与者总数 */
  count: bigint | undefined;
  /** 加载状态 */
  isPending: boolean;
  /** 错误信息 */
  error: Error | null;
}

// ==================== Hook 实现 ====================

/**
 * 获取某个行动的某个轮次的所有参与者地址列表
 *
 * @param params - Hook 参数
 * @returns 参与者地址列表及总数
 */
export function useAccountsByActionByRound(params: UseAccountsByActionByRoundParams): UseAccountsByActionByRoundResult {
  const { tokenAddress, actionId, round } = params;

  // ==========================================
  // 第一步：查询参与者总数
  // ==========================================
  const {
    count,
    isPending: isCountPending,
    error: countError,
  } = useAccountsByRoundCount(tokenAddress || '0x0', actionId || BigInt(0), round || BigInt(0));

  // ==========================================
  // 第二步：批量查询所有地址
  // ==========================================
  const accountsContracts = useMemo(() => {
    // 如果还没有 count，或 count 为 0，返回空数组
    if (!count || count === BigInt(0)) {
      return [];
    }

    // 为每个索引构建一个查询配置
    const countNum = Number(count);
    return Array.from({ length: countNum }, (_, index) => ({
      address: CONTRACT_ADDRESS,
      abi: LOVE20ExtensionCenterAbi,
      functionName: 'accountsByRoundAtIndex' as const,
      args:
        tokenAddress && actionId !== undefined && round !== undefined
          ? [tokenAddress, actionId, BigInt(index), round]
          : undefined,
    }));
  }, [count, tokenAddress, actionId, round]);

  const {
    data: accountsData,
    isPending: isAccountsPending,
    error: accountsError,
  } = useReadContracts({
    contracts: accountsContracts,
    query: {
      // 只有在获得 count 且 count > 0 时才启用
      enabled: !!count && count > BigInt(0) && accountsContracts.length > 0,
    },
  });

  // ==========================================
  // 解析地址列表
  // ==========================================
  const accounts = useMemo(() => {
    // 如果没有数据或 count 为 0，返回空数组
    if (!accountsData || !count || count === BigInt(0)) {
      return [];
    }

    // 解析每个查询结果
    const result: `0x${string}`[] = [];
    for (let i = 0; i < accountsData.length; i++) {
      const data = accountsData[i];
      if (data?.status === 'success') {
        result.push(data.result as `0x${string}`);
      }
    }
    return result;
  }, [accountsData, count]);

  // ==========================================
  // 返回结果
  // ==========================================
  return {
    accounts,
    count,
    // 如果 count 为 0 或 undefined，则只看第一步的 pending 状态
    // 如果 count > 0，则需要等待两步都完成
    isPending: count === undefined || count === BigInt(0) ? isCountPending : isCountPending || isAccountsPending,
    error: countError || accountsError || null,
  };
}

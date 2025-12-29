/**
 * 根据轮次获取指定链群的所有参与账号地址列表
 *
 * 职责：
 * - 获取指定轮次、指定链群的所有参与账号地址
 * - 先通过 accountCountByGroupIdByRound 获取账号总数
 * - 再通过 accountByGroupIdAndIndexByRound 批量获取每个账号地址
 *
 * 使用示例：
 * ```typescript
 * const { accounts, isPending, error } = useAccountsByGroupIdByRound({
 *   extensionAddress: '0x...',
 *   groupId: BigInt(1),
 *   round: BigInt(5)
 * });
 * // accounts: ['0x123...', '0x456...', ...]
 * ```
 */

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { useAccountCountByGroupIdByRound } from '../contracts/useLOVE20ExtensionGroupAction';
import { LOVE20ExtensionGroupActionAbi } from '@/src/abis/LOVE20ExtensionGroupAction';
import { safeToBigInt } from '@/src/lib/clientUtils';

// ==================== 类型定义 ====================

/**
 * Hook 参数
 */
export interface UseAccountsByGroupIdByRoundParams {
  /** 扩展合约地址 */
  extensionAddress: `0x${string}`;
  /** 链群NFT */
  groupId: bigint;
  /** 轮次 */
  round: bigint;
}

/**
 * Hook 返回值
 */
export interface UseAccountsByGroupIdByRoundResult {
  /** 账号地址列表 */
  accounts: `0x${string}`[];
  /** 加载状态 */
  isPending: boolean;
  /** 错误信息 */
  error: any;
}

// ==================== Hook 实现 ====================

/**
 * 获取指定轮次、指定链群的所有参与账号地址列表
 *
 * @param params - Hook 参数
 * @returns 账号地址列表及加载状态
 *
 * @description
 * 分两步获取账号列表：
 * 1. 调用 accountCountByGroupIdByRound(groupId, round) 获取账号总数 count
 * 2. 使用 useReadContracts 批量调用 accountByGroupIdAndIndexByRound(groupId, index, round) 获取从 0 到 count-1 位置的所有账号
 *
 * @example
 * ```typescript
 * // 获取第5轮、链群1的所有参与账号
 * const { accounts, isPending } = useAccountsByGroupIdByRound({
 *   extensionAddress: '0x123...',
 *   groupId: BigInt(1),
 *   round: BigInt(5)
 * });
 *
 * if (!isPending && accounts) {
 *   console.log('参与账号数量:', accounts.length);
 *   console.log('账号列表:', accounts);
 * }
 * ```
 */
export function useAccountsByGroupIdByRound(
  params: UseAccountsByGroupIdByRoundParams,
): UseAccountsByGroupIdByRoundResult {
  const { extensionAddress, groupId, round } = params;

  // 第一步：获取账号总数
  const {
    count,
    isPending: isPendingCount,
    error: errorCount,
  } = useAccountCountByGroupIdByRound(extensionAddress, groupId, round);

  // 转换为数字类型
  const accountCount = useMemo(() => {
    if (!count) return BigInt(0);
    return safeToBigInt(count);
  }, [count]);

  // 第二步：构建批量查询合约调用
  const accountsContracts = useMemo(() => {
    if (accountCount === BigInt(0)) return [];

    const contracts = [];
    for (let i = BigInt(0); i < accountCount; i++) {
      contracts.push({
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'accountByGroupIdAndIndexByRound',
        args: [groupId, i, round],
      });
    }

    return contracts;
  }, [extensionAddress, groupId, round, accountCount]);

  // 第三步：批量获取账号地址
  const {
    data: accountsData,
    isPending: isAccountsPending,
    error: accountsError,
  } = useReadContracts({
    contracts: accountsContracts as any,
    query: {
      enabled: accountCount > BigInt(0) && accountsContracts.length > 0,
    },
  });

  // 解析账号地址列表
  const accounts = useMemo(() => {
    if (!accountsData) return [];
    return accountsData.map((v) => v.result as `0x${string}`).filter((addr) => !!addr);
  }, [accountsData]);

  // 计算最终的 pending 状态
  // 如果账号数为 0，则不需要等待账号列表的加载
  const finalIsPending = useMemo(() => {
    if (isPendingCount) return true;
    if (accountCount === BigInt(0)) return false;
    return isAccountsPending;
  }, [isPendingCount, accountCount, isAccountsPending]);

  return {
    accounts,
    isPending: finalIsPending,
    error: errorCount || accountsError,
  };
}

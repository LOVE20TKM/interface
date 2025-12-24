/**
 * 批量获取某个链群、某个轮次的地址信息
 *
 * 职责：
 * - 获取指定轮次、指定链群的所有参与账号地址
 * - 批量获取每个账号的参与信息（joinInfo），包括参与代币数和轮次
 * - 返回包含完整参与信息的账号列表
 *
 * 使用示例：
 * ```typescript
 * const { accountInfos, isPending, error } = useAccountInfosByGroupIdByRound({
 *   extensionAddress: '0x...',
 *   groupId: BigInt(1),
 *   round: BigInt(5)
 * });
 * // accountInfos: [
 * //   { address: '0x123...', joinedRound: 5n, amount: 100n, groupId: 1n },
 * //   { address: '0x456...', joinedRound: 5n, amount: 200n, groupId: 1n },
 * //   ...
 * // ]
 * ```
 */

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { useAccountsByGroupIdByRound } from './useAccountsByGroupIdByRound';
import { LOVE20ExtensionGroupActionAbi } from '@/src/abis/LOVE20ExtensionGroupAction';
import { safeToBigInt } from '@/src/lib/clientUtils';

// ==================== 类型定义 ====================

/**
 * 账号参与信息
 */
export interface AccountJoinInfo {
  /** 账号地址 */
  address: `0x${string}`;
  /** 参与的轮次 */
  joinedRound: bigint;
  /** 参与的代币数量 */
  amount: bigint;
  /** 参与的链群 ID */
  groupId: bigint;
}

/**
 * Hook 参数
 */
export interface UseAccountInfosByGroupIdByRoundParams {
  /** 扩展合约地址 */
  extensionAddress: `0x${string}`;
  /** 链群 ID */
  groupId: bigint;
  /** 轮次 */
  round: bigint;
}

/**
 * Hook 返回值
 */
export interface UseAccountInfosByGroupIdByRoundResult {
  /** 账号参与信息列表 */
  accountInfos: AccountJoinInfo[];
  /** 加载状态 */
  isPending: boolean;
  /** 错误信息 */
  error: any;
}

// ==================== Hook 实现 ====================

/**
 * 批量获取指定轮次、指定链群的所有参与账号及其参与信息
 *
 * @param params - Hook 参数
 * @returns 账号参与信息列表及加载状态
 *
 * @description
 * 分两步获取账号信息：
 * 1. 使用 useAccountsByGroupIdByRound 获取所有参与账号地址列表
 * 2. 使用 useReadContracts 批量调用 joinInfo(account) 获取每个账号的参与信息
 *
 * joinInfo 返回值结构：
 * - [0]: joinedRound - 参与的轮次
 * - [1]: amount - 参与的代币数量
 * - [2]: groupId - 参与的链群 ID
 *
 * @example
 * ```typescript
 * // 获取第5轮、链群1的所有参与账号及其信息
 * const { accountInfos, isPending } = useAccountInfosByGroupIdByRound({
 *   extensionAddress: '0x123...',
 *   groupId: BigInt(1),
 *   round: BigInt(5)
 * });
 *
 * if (!isPending && accountInfos) {
 *   console.log('参与账号数量:', accountInfos.length);
 *   accountInfos.forEach(info => {
 *     console.log('地址:', info.address);
 *     console.log('参与数量:', info.amount);
 *     console.log('参与轮次:', info.joinedRound);
 *     console.log('链群 ID:', info.groupId);
 *   });
 * }
 * ```
 */
export function useAccountInfosByGroupIdByRound(
  params: UseAccountInfosByGroupIdByRoundParams,
): UseAccountInfosByGroupIdByRoundResult {
  const { extensionAddress, groupId, round } = params;

  // 第一步：获取所有参与账号地址列表
  const {
    accounts,
    isPending: isPendingAccounts,
    error: errorAccounts,
  } = useAccountsByGroupIdByRound({
    extensionAddress,
    groupId,
    round,
  });

  // 第二步：构建批量查询 joinInfo 的合约调用
  const joinInfoContracts = useMemo(() => {
    if (!accounts || accounts.length === 0) return [];

    return accounts.map((account) => ({
      address: extensionAddress,
      abi: LOVE20ExtensionGroupActionAbi,
      functionName: 'joinInfo',
      args: [account],
    }));
  }, [extensionAddress, accounts]);

  // 第三步：批量获取每个账号的 joinInfo
  const {
    data: joinInfosData,
    isPending: isJoinInfosPending,
    error: joinInfosError,
  } = useReadContracts({
    contracts: joinInfoContracts as any,
    query: {
      enabled: accounts.length > 0 && joinInfoContracts.length > 0,
    },
  });

  // 第四步：解析并组合账号信息
  const accountInfos = useMemo(() => {
    if (!accounts || !joinInfosData || accounts.length === 0) return [];

    const infos: AccountJoinInfo[] = [];

    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      const joinInfoResult = joinInfosData[i];

      if (!joinInfoResult || !joinInfoResult.result) {
        continue;
      }

      // joinInfo 返回 [joinedRound, amount, groupId]
      const [joinedRound, amount, joinedGroupId] = joinInfoResult.result as [bigint, bigint, bigint];

      infos.push({
        address: account,
        joinedRound: safeToBigInt(joinedRound),
        amount: safeToBigInt(amount),
        groupId: safeToBigInt(joinedGroupId),
      });
    }

    return infos;
  }, [accounts, joinInfosData]);

  // 计算最终的 pending 状态
  const finalIsPending = useMemo(() => {
    if (isPendingAccounts) return true;
    if (accounts.length === 0) return false;
    return isJoinInfosPending;
  }, [isPendingAccounts, accounts, isJoinInfosPending]);

  return {
    accountInfos,
    isPending: finalIsPending,
    error: errorAccounts || joinInfosError,
  };
}

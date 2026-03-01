// hooks/extension/plugins/group/composite/useAllGroupsAccountsOfAction.ts
// 批量获取一个行动所有链群的成员地址，单次 useReadContracts 完成

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { GroupJoinAbi } from '@/src/abis/GroupJoin';
import { GroupBasicInfo } from './useExtensionGroupInfosOfAction';

const GROUP_JOIN_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_JOIN as `0x${string}`;

export interface UseAllGroupsAccountsOfActionParams {
  extensionAddress: `0x${string}` | undefined;
  round: bigint | undefined;
  /** 已含 accountCount 的链群列表（来自 useExtensionGroupInfosOfAction） */
  groups: GroupBasicInfo[];
}

export interface UseAllGroupsAccountsOfActionResult {
  /** groupId.toString() -> 成员地址列表 */
  groupAccountsMap: Map<string, `0x${string}`[]>;
  /** 全部地址（跨链群去重） */
  allAccounts: `0x${string}`[];
  isPending: boolean;
  error: any;
}

/**
 * 批量获取行动下所有链群的成员地址
 *
 * 利用 GroupBasicInfo.accountCount 预知各群成员数，
 * 将所有 accountsByGroupIdAtIndex 调用合并成一次 useReadContracts 请求。
 */
export function useAllGroupsAccountsOfAction({
  extensionAddress,
  round,
  groups,
}: UseAllGroupsAccountsOfActionParams): UseAllGroupsAccountsOfActionResult {
  // 构建批量调用：遍历每个群的每个索引
  const contracts = useMemo(() => {
    if (!extensionAddress || !round || groups.length === 0) return [];

    const calls: any[] = [];
    for (const group of groups) {
      const count = Number(group.accountCount);
      for (let i = 0; i < count; i++) {
        calls.push({
          address: GROUP_JOIN_ADDRESS,
          abi: GroupJoinAbi,
          functionName: 'accountsByGroupIdAtIndex',
          args: [extensionAddress, round, group.groupId, BigInt(i)],
        });
      }
    }
    return calls;
  }, [extensionAddress, round, groups]);

  const {
    data,
    isPending,
    error,
  } = useReadContracts({
    contracts,
    query: {
      enabled: contracts.length > 0,
    },
  });

  // 将扁平结果按群还原为 Map
  const groupAccountsMap = useMemo(() => {
    const map = new Map<string, `0x${string}`[]>();
    if (!data || groups.length === 0) return map;

    let offset = 0;
    for (const group of groups) {
      const count = Number(group.accountCount);
      const accounts = data
        .slice(offset, offset + count)
        .map((r) => r.result as `0x${string}`)
        .filter(Boolean);
      map.set(group.groupId.toString(), accounts);
      offset += count;
    }
    return map;
  }, [data, groups]);

  // 所有地址（去重），用于批量查询验证信息
  const allAccounts = useMemo(() => {
    const seen = new Set<string>();
    const result: `0x${string}`[] = [];
    for (const accounts of groupAccountsMap.values()) {
      for (const addr of accounts) {
        const lower = addr.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          result.push(addr);
        }
      }
    }
    return result;
  }, [groupAccountsMap]);

  // 没有成员时不需要等待
  const finalIsPending = useMemo(() => {
    if (contracts.length === 0) return false;
    return isPending;
  }, [contracts.length, isPending]);

  return {
    groupAccountsMap,
    allAccounts,
    isPending: finalIsPending,
    error,
  };
}

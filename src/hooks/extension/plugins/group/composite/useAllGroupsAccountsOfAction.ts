// hooks/extension/plugins/group/composite/useAllGroupsAccountsOfAction.ts
// 批量获取一个行动所有链群的成员地址（支持分批加载与失败重试）

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GroupJoinAbi } from '@/src/abis/GroupJoin';
import { readContractsInBatchesWithRetry } from '@/src/lib/readContractsInBatches';
import { GroupBasicInfo } from './useExtensionGroupInfosOfAction';

const GROUP_JOIN_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_JOIN as `0x${string}`;

// Thinkium RPC 对大批量读取更敏感，控制每批调用数
const ACCOUNT_BATCH_SIZE = 25;

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

export function useAllGroupsAccountsOfAction({
  extensionAddress,
  round,
  groups,
}: UseAllGroupsAccountsOfActionParams): UseAllGroupsAccountsOfActionResult {
  const queryEnabled = !!extensionAddress && !!round && groups.length > 0;

  const groupDescriptors = useMemo(
    () =>
      groups.map((group) => ({
        groupId: group.groupId.toString(),
        accountCount: Number(group.accountCount),
      })),
    [groups],
  );

  const { data, isPending, error } = useQuery({
    queryKey: [
      'allGroupsAccountsOfAction',
      extensionAddress,
      round?.toString(),
      groupDescriptors.map((group) => `${group.groupId}:${group.accountCount}`).join(','),
    ],
    queryFn: async () => {
      const entries: Array<{
        contract: any;
        resultIndex: number;
        meta: {
          groupId: string;
          accountIndex: number;
        };
      }> = [];

      let nextResultIndex = 0;
      for (const group of groups) {
        const count = Number(group.accountCount);
        for (let accountIndex = 0; accountIndex < count; accountIndex++) {
          entries.push({
            contract: {
              address: GROUP_JOIN_ADDRESS,
              abi: GroupJoinAbi,
              functionName: 'accountsByGroupIdAtIndex',
              args: [extensionAddress, round, group.groupId, BigInt(accountIndex)],
            },
            resultIndex: nextResultIndex++,
            meta: {
              groupId: group.groupId.toString(),
              accountIndex,
            },
          });
        }
      }

      if (entries.length === 0) {
        return {
          groupAccountsRecord: {} as Record<string, `0x${string}`[]>,
          allAccounts: [] as `0x${string}`[],
        };
      }

      const { results, failures } = await readContractsInBatchesWithRetry(entries, {
        batchSize: ACCOUNT_BATCH_SIZE,
      });

      if (failures.length > 0) {
        const failedGroupIds = [...new Set(failures.map((failure) => failure.meta?.groupId).filter(Boolean))];
        const failedGroupText =
          failedGroupIds.length > 0
            ? ` 失败链群: ${failedGroupIds.slice(0, 8).join(', ')}${failedGroupIds.length > 8 ? ' ...' : ''}`
            : '';
        throw new Error(`链群成员地址读取失败（${failures.length}/${entries.length}）。${failedGroupText}`);
      }

      const groupAccountsRecord: Record<string, (`0x${string}` | undefined)[]> = {};
      for (const group of groups) {
        groupAccountsRecord[group.groupId.toString()] = new Array(Number(group.accountCount)).fill(undefined);
      }

      entries.forEach((entry) => {
        const result = results[entry.resultIndex];
        if (result?.status !== 'success') {
          throw new Error(`链群 #${entry.meta.groupId} 的成员地址结果不完整，请稍后重试`);
        }

        groupAccountsRecord[entry.meta.groupId][entry.meta.accountIndex] = result.result as `0x${string}`;
      });

      const finalizedRecord: Record<string, `0x${string}`[]> = {};
      const mismatchedGroups: string[] = [];

      for (const group of groups) {
        const groupId = group.groupId.toString();
        const expectedCount = Number(group.accountCount);
        const accounts = (groupAccountsRecord[groupId] || []).filter((account): account is `0x${string}` => !!account);

        if (accounts.length !== expectedCount) {
          mismatchedGroups.push(`#${groupId}(${accounts.length}/${expectedCount})`);
        }

        finalizedRecord[groupId] = accounts;
      }

      if (mismatchedGroups.length > 0) {
        throw new Error(
          `链群成员地址数量不完整：${mismatchedGroups.slice(0, 8).join(', ')}${
            mismatchedGroups.length > 8 ? ' ...' : ''
          }`,
        );
      }

      const seen = new Set<string>();
      const allAccounts: `0x${string}`[] = [];

      Object.values(finalizedRecord).forEach((accounts) => {
        accounts.forEach((account) => {
          const lower = account.toLowerCase();
          if (!seen.has(lower)) {
            seen.add(lower);
            allAccounts.push(account);
          }
        });
      });

      return {
        groupAccountsRecord: finalizedRecord,
        allAccounts,
      };
    },
    enabled: queryEnabled,
    retry: false,
  });

  const groupAccountsMap = useMemo(() => {
    const map = new Map<string, `0x${string}`[]>();
    if (!data?.groupAccountsRecord) return map;

    Object.entries(data.groupAccountsRecord).forEach(([groupId, accounts]) => {
      map.set(groupId, accounts);
    });
    return map;
  }, [data]);

  return {
    groupAccountsMap,
    allAccounts: data?.allAccounts || [],
    isPending,
    error: error || null,
  };
}

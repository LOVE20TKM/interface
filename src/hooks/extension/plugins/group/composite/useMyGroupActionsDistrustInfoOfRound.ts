// hooks/extension/plugins/group/composite/useMyGroupActionsDistrustInfoOfRound.ts
// “我的链群”面板：按行动维度聚合服务者的不信任票信息（批量 RPC + 行动标题）

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';

import { GroupVerifyAbi } from '@/src/abis/GroupVerify';
import { LOVE20VoteAbi } from '@/src/abis/LOVE20Vote';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useActionBaseInfosByIdsWithCache } from '@/src/hooks/composite/useActionBaseInfosByIdsWithCache';

const GROUP_VERIFY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_VERIFY as `0x${string}`;
const VOTE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_VOTE as `0x${string}`;

export interface ActionExtensionPair {
  actionId: bigint;
  extensionAddress: `0x${string}`;
}

export interface MyGroupActionDistrustInfo {
  actionId: bigint;
  actionTitle: string;
  /** 不信任票数（原始值） */
  distrustVotes: bigint;
  /** 总票数（原始值） */
  totalVotes: bigint;
  /** 不信任率百分比（0-100） */
  distrustRatioPercent: number;
}

export interface UseMyGroupActionsDistrustInfoOfRoundParams {
  tokenAddress: `0x${string}` | undefined;
  round: bigint | undefined;
  groupOwner: `0x${string}` | undefined;
  pairs: ActionExtensionPair[] | undefined;
}

export interface UseMyGroupActionsDistrustInfoOfRoundResult {
  items: MyGroupActionDistrustInfo[];
  isPending: boolean;
  error: any;
}

/**
 * Hook：按行动维度获取“服务者被投不信任率”
 *
 * - 不信任票：GroupVerify.distrustVotesByGroupOwner(extension, round, groupOwner)
 * - 分母：LOVE20Vote.votesNumByActionId(tokenAddress, round, actionId)
 * - 标题：useActionBaseInfosByIdsWithCache
 */
export function useMyGroupActionsDistrustInfoOfRound({
  tokenAddress,
  round,
  groupOwner,
  pairs,
}: UseMyGroupActionsDistrustInfoOfRoundParams): UseMyGroupActionsDistrustInfoOfRoundResult {
  // 去重 pairs（避免同一 action/extension 重复触发 RPC）
  const uniquePairs = useMemo<ActionExtensionPair[]>(() => {
    if (!pairs || pairs.length === 0) return [];
    const map = new Map<string, ActionExtensionPair>();
    for (const p of pairs) {
      map.set(`${p.actionId.toString()}-${p.extensionAddress.toLowerCase()}`, p);
    }
    return Array.from(map.values());
  }, [pairs]);

  const actionIds = useMemo<bigint[]>(() => {
    const set = new Set<string>();
    const ids: bigint[] = [];
    for (const p of uniquePairs) {
      const key = p.actionId.toString();
      if (set.has(key)) continue;
      set.add(key);
      ids.push(p.actionId);
    }
    return ids;
  }, [uniquePairs]);

  const contracts = useMemo(() => {
    if (!tokenAddress || round === undefined || !groupOwner || uniquePairs.length === 0) return [];

    const distrustVoteContracts = uniquePairs.map((p) => ({
      address: GROUP_VERIFY_CONTRACT_ADDRESS,
      abi: GroupVerifyAbi,
      functionName: 'distrustVotesByGroupOwner' as const,
      args: [p.extensionAddress, round, groupOwner] as const,
    }));

    const totalVoteContracts = actionIds.map((actionId) => ({
      address: VOTE_CONTRACT_ADDRESS,
      abi: LOVE20VoteAbi,
      functionName: 'votesNumByActionId' as const,
      args: [tokenAddress, round, actionId] as const,
    }));

    return [...distrustVoteContracts, ...totalVoteContracts];
  }, [tokenAddress, round, groupOwner, uniquePairs, actionIds]);

  const {
    data: combinedData,
    isPending: isPendingRead,
    error: readError,
  } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: contracts.length > 0,
    },
  });

  const {
    actionInfos,
    isPending: isPendingActionInfos,
    error: actionInfosError,
  } = useActionBaseInfosByIdsWithCache({
    tokenAddress,
    actionIds,
  });

  const items = useMemo<MyGroupActionDistrustInfo[]>(() => {
    if (uniquePairs.length === 0 || actionIds.length === 0) return [];
    if (!combinedData) return [];

    const N = uniquePairs.length;

    const distrustVotesByPairKey = new Map<string, bigint>();
    for (let i = 0; i < N; i++) {
      const p = uniquePairs[i];
      const key = `${p.actionId.toString()}-${p.extensionAddress.toLowerCase()}`;
      const item = combinedData[i];
      const votes = item?.status === 'success' ? safeToBigInt(item.result) : BigInt(0);
      distrustVotesByPairKey.set(key, votes);
    }

    const totalVotesByActionId = new Map<string, bigint>();
    for (let j = 0; j < actionIds.length; j++) {
      const actionId = actionIds[j];
      const item = combinedData[N + j];
      const total = item?.status === 'success' ? safeToBigInt(item.result) : BigInt(0);
      totalVotesByActionId.set(actionId.toString(), total);
    }

    const titleByActionId = new Map<string, string>();
    if (actionInfos && actionInfos.length > 0) {
      for (const info of actionInfos) {
        const id = info?.head?.id;
        if (id === undefined) continue;
        titleByActionId.set(id.toString(), info?.body?.title || `行动 #${id.toString()}`);
      }
    }

    // 以 uniquePairs 为基础按 action 输出（一个 action 对应一个 extension）
    return uniquePairs
      .map((p) => {
        const pairKey = `${p.actionId.toString()}-${p.extensionAddress.toLowerCase()}`;
        const distrustVotes = distrustVotesByPairKey.get(pairKey) ?? BigInt(0);
        const totalVotes = totalVotesByActionId.get(p.actionId.toString()) ?? BigInt(0);

        const distrustRatioPercent = totalVotes > BigInt(0) ? (Number(distrustVotes) / Number(totalVotes)) * 100 : 0;

        return {
          actionId: p.actionId,
          actionTitle: titleByActionId.get(p.actionId.toString()) || `行动 #${p.actionId.toString()}`,
          distrustVotes,
          totalVotes,
          distrustRatioPercent,
        };
      })
      .sort((a, b) => (a.actionId > b.actionId ? -1 : 1));
  }, [uniquePairs, actionIds, combinedData, actionInfos]);

  const isPending = useMemo(() => {
    if (!tokenAddress || round === undefined || !groupOwner) return false;
    if (uniquePairs.length === 0) return false;
    return isPendingRead || isPendingActionInfos;
  }, [tokenAddress, round, groupOwner, uniquePairs.length, isPendingRead, isPendingActionInfos]);

  return {
    items,
    isPending,
    error: readError || actionInfosError,
  };
}

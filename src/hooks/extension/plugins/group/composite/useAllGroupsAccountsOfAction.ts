// hooks/extension/plugins/group/composite/useAllGroupsAccountsOfAction.ts
// 批量获取一个行动所有链群的成员地址（支持分批加载，避免单次请求过大导致超时）

import { useMemo, useState, useEffect, useRef } from 'react';
import { useUniversalReadContracts } from '@/src/lib/universalReadContract';
import { GroupJoinAbi } from '@/src/abis/GroupJoin';
import { GroupBasicInfo } from './useExtensionGroupInfosOfAction';

const GROUP_JOIN_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_JOIN as `0x${string}`;

// 每批最多请求的合约调用数量
const BATCH_SIZE = 100;

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
 * 将所有 accountsByGroupIdAtIndex 调用按 BATCH_SIZE 分批请求，避免超时。
 */
export function useAllGroupsAccountsOfAction({
  extensionAddress,
  round,
  groups,
}: UseAllGroupsAccountsOfActionParams): UseAllGroupsAccountsOfActionResult {
  // 将所有合约调用按 BATCH_SIZE 分批
  const allBatches = useMemo(() => {
    if (!extensionAddress || !round || groups.length === 0) return [];

    const allCalls: any[] = [];
    for (const group of groups) {
      const count = Number(group.accountCount);
      for (let i = 0; i < count; i++) {
        allCalls.push({
          address: GROUP_JOIN_ADDRESS,
          abi: GroupJoinAbi,
          functionName: 'accountsByGroupIdAtIndex',
          args: [extensionAddress, round, group.groupId, BigInt(i)],
        });
      }
    }

    const batches: any[][] = [];
    for (let i = 0; i < allCalls.length; i += BATCH_SIZE) {
      batches.push(allCalls.slice(i, i + BATCH_SIZE));
    }
    return batches;
  }, [extensionAddress, round, groups]);

  // 当前正在请求的批次索引
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  // 累积的所有批次结果
  const [accumulatedResults, setAccumulatedResults] = useState<any[]>([]);
  // 是否所有批次都已完成
  const [allBatchesDone, setAllBatchesDone] = useState(false);
  // 检测参数变化时重置
  const prevBatchKeyRef = useRef<string>('');

  const totalBatches = allBatches.length;

  // 当参数变化时重置状态
  const batchKey = useMemo(
    () => `${extensionAddress}-${round}-${groups.map((g) => `${g.groupId}:${g.accountCount}`).join(',')}`,
    [extensionAddress, round, groups],
  );

  useEffect(() => {
    if (batchKey !== prevBatchKeyRef.current) {
      prevBatchKeyRef.current = batchKey;
      setCurrentBatchIndex(0);
      setAccumulatedResults([]);
      setAllBatchesDone(false);
    }
  }, [batchKey]);

  // 当前批次的合约调用
  const currentBatchContracts = useMemo(() => {
    if (allBatchesDone || currentBatchIndex >= totalBatches) {
      return [];
    }
    return allBatches[currentBatchIndex] || [];
  }, [allBatches, currentBatchIndex, totalBatches, allBatchesDone]);

  // 请求当前批次
  const {
    data: batchResult,
    error: batchError,
    isSuccess: isBatchSuccess,
  } = useUniversalReadContracts({
    contracts: currentBatchContracts,
    query: {
      enabled: currentBatchContracts.length > 0 && !allBatchesDone,
    },
  });

  // 当前批次完成后，累积结果并推进到下一批
  useEffect(() => {
    if (!isBatchSuccess || !batchResult || allBatchesDone) return;
    if (currentBatchIndex >= totalBatches) return;

    setAccumulatedResults((prev) => {
      const expectedLength = currentBatchIndex * BATCH_SIZE;
      if (prev.length > expectedLength) return prev;
      return [...prev, ...batchResult];
    });

    if (currentBatchIndex + 1 >= totalBatches) {
      setAllBatchesDone(true);
    } else {
      setCurrentBatchIndex((prev) => prev + 1);
    }
  }, [isBatchSuccess, batchResult, currentBatchIndex, totalBatches, allBatchesDone]);

  // 整体状态
  const isPending = totalBatches > 0 && !allBatchesDone;
  const data = allBatchesDone ? accumulatedResults : null;

  // 将扁平结果按群还原为 Map
  const groupAccountsMap = useMemo(() => {
    const map = new Map<string, `0x${string}`[]>();
    if (!data || groups.length === 0) return map;

    let offset = 0;
    for (const group of groups) {
      const count = Number(group.accountCount);
      const accounts = data
        .slice(offset, offset + count)
        .map((r: any) => r.result as `0x${string}`)
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

  return {
    groupAccountsMap,
    allAccounts,
    isPending,
    error: batchError || null,
  };
}

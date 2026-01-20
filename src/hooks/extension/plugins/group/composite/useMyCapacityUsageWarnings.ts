// hooks/extension/plugins/group/composite/useMyCapacityUsageWarnings.ts
// “我的链群”面板：按行动维度提示服务者最大容量使用率（批量 RPC）

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';

import { GroupManagerAbi } from '@/src/abis/GroupManager';
import { GroupJoinAbi } from '@/src/abis/GroupJoin';
import { safeToBigInt } from '@/src/lib/clientUtils';

const GROUP_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_MANAGER as `0x${string}`;
const GROUP_JOIN_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_JOIN as `0x${string}`;

/**
 * 行动与扩展地址（一个行动通常对应一个 extension）
 */
export interface ActionExtensionPair {
  actionId: bigint;
  extensionAddress: `0x${string}`;
}

export interface CapacityUsageWarnItem {
  actionId: bigint;
  extensionAddress: `0x${string}`;
  /** 使用率基点：9900 = 99.00% */
  usageBps: bigint;
  /** 使用率百分比（0-∞），用于 UI 展示 */
  usagePercent: number;
  /** 分子：服务者总参与量 */
  totalJoinedAmountByOwner: bigint;
  /** 分母：服务者最大验证容量 */
  maxVerifyCapacity: bigint;
}

export interface UseMyCapacityUsageWarningsParams {
  owner: `0x${string}` | undefined;
  pairs: ActionExtensionPair[] | undefined;
  /** 默认 9900（99.00%） */
  thresholdBps?: bigint;
}

export interface UseMyCapacityUsageWarningsResult {
  warnItems: CapacityUsageWarnItem[];
  isPending: boolean;
  error: any;
}

/**
 * Hook：批量获取“最大容量使用率>=阈值”的告警列表（按行动维度输出）
 *
 * - 分子：GroupJoin.totalJoinedAmountByGroupOwner(extension, owner)
 * - 分母：GroupManager.maxVerifyCapacityByOwner(extension, owner)
 *
 * 注意：阈值判断用 BigInt 基点计算，避免大数转 Number 造成精度问题。
 */
export function useMyCapacityUsageWarnings({
  owner,
  pairs,
  thresholdBps = BigInt(9900),
}: UseMyCapacityUsageWarningsParams): UseMyCapacityUsageWarningsResult {
  // 去重 pairs（避免重复触发 RPC）
  const uniquePairs = useMemo<ActionExtensionPair[]>(() => {
    if (!pairs || pairs.length === 0) return [];
    const map = new Map<string, ActionExtensionPair>();
    for (const p of pairs) {
      map.set(`${p.actionId.toString()}-${p.extensionAddress.toLowerCase()}`, p);
    }
    return Array.from(map.values());
  }, [pairs]);

  // 对 extensionAddress 去重（同一个 extension 的容量使用率相同）
  const uniqueExtensions = useMemo<`0x${string}`[]>(() => {
    if (uniquePairs.length === 0) return [];
    const map = new Map<string, `0x${string}`>();
    for (const p of uniquePairs) {
      map.set(p.extensionAddress.toLowerCase(), p.extensionAddress);
    }
    return Array.from(map.values());
  }, [uniquePairs]);

  const contracts = useMemo(() => {
    if (!owner || uniqueExtensions.length === 0) return [];

    const arr: any[] = [];
    for (const extensionAddress of uniqueExtensions) {
      // 分母：最大验证容量
      arr.push({
        address: GROUP_MANAGER_ADDRESS,
        abi: GroupManagerAbi,
        functionName: 'maxVerifyCapacityByOwner' as const,
        args: [extensionAddress, owner] as const,
      });

      // 分子：服务者总参与量
      arr.push({
        address: GROUP_JOIN_ADDRESS,
        abi: GroupJoinAbi,
        functionName: 'totalJoinedAmountByGroupOwner' as const,
        args: [extensionAddress, owner] as const,
      });
    }

    return arr;
  }, [owner, uniqueExtensions]);

  const { data, isPending, error } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: !!owner && uniqueExtensions.length > 0 && contracts.length > 0,
    },
  });

  const warnItems = useMemo<CapacityUsageWarnItem[]>(() => {
    if (!data || uniqueExtensions.length === 0 || uniquePairs.length === 0) return [];

    // extension -> { max, total, bps }
    const byExtension = new Map<string, { max: bigint; total: bigint; bps: bigint; percent: number }>();

    for (let i = 0; i < uniqueExtensions.length; i++) {
      const extensionAddress = uniqueExtensions[i];
      const base = i * 2;

      const maxItem = data[base];
      const totalItem = data[base + 1];

      const max =
        maxItem?.status === 'success' && maxItem.result !== undefined ? safeToBigInt(maxItem.result) : BigInt(0);
      const total =
        totalItem?.status === 'success' && totalItem.result !== undefined ? safeToBigInt(totalItem.result) : BigInt(0);

      const bps = max > BigInt(0) ? (total * BigInt(10000)) / max : BigInt(0);
      const percent = Number(bps) / 100;

      byExtension.set(extensionAddress.toLowerCase(), { max, total, bps, percent });
    }

    return uniquePairs
      .map((p) => {
        const ext = byExtension.get(p.extensionAddress.toLowerCase());
        const maxVerifyCapacity = ext?.max ?? BigInt(0);
        const totalJoinedAmountByOwner = ext?.total ?? BigInt(0);
        const usageBps = ext?.bps ?? BigInt(0);
        const usagePercent = ext?.percent ?? 0;

        return {
          actionId: p.actionId,
          extensionAddress: p.extensionAddress,
          usageBps,
          usagePercent,
          totalJoinedAmountByOwner,
          maxVerifyCapacity,
        };
      })
      .filter((x) => x.usageBps >= thresholdBps)
      .sort((a, b) => (a.actionId > b.actionId ? -1 : 1));
  }, [data, uniqueExtensions, uniquePairs, thresholdBps]);

  const finalIsPending = useMemo(() => {
    if (!owner) return false;
    if (uniqueExtensions.length === 0) return false;
    if (contracts.length === 0) return false;
    return isPending;
  }, [owner, uniqueExtensions.length, contracts.length, isPending]);

  return {
    warnItems,
    isPending: finalIsPending,
    error,
  };
}

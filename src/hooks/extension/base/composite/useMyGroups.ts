/**
 * 复合 Hook: 获取用户拥有的所有链群 NFT
 */

import { useEffect, useMemo, useState } from 'react';
import { useUniversalReadContracts } from '@/src/lib/universalReadContract';
import { LOVE20GroupAbi } from '@/src/abis/LOVE20Group';
import { useBalanceOf } from '@/src/hooks/extension/base/contracts/useLOVE20Group';
import { useGroupNamesWithCache } from '@/src/hooks/extension/base/composite/useGroupNamesWithCache';
import { safeToBigInt } from '@/src/lib/clientUtils';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP as `0x${string}`;

export interface GroupNFT {
  tokenId: bigint;
  groupName: string;
}

export function useMyGroups(account: `0x${string}` | undefined) {
  // 如果没有账户，balance 查询会被禁用
  const hasAccount = !!account;

  // 首先获取用户拥有的 NFT 数量
  const {
    balance,
    isPending: isBalancePending,
    error: balanceError,
  } = useBalanceOf(
    account || '0x0000000000000000000000000000000000000000',
    hasAccount, // 只有在有账户时才启用查询
  );

  // 根据数量批量查询每个 tokenId 和 groupName
  // 注意：BigInt(0) 在 JavaScript 中是 falsy，所以需要显式检查 undefined
  const nftCount = hasAccount && balance !== undefined ? Number(balance) : 0;

  const contracts = [];
  for (let i = 0; i < nftCount; i++) {
    // 获取 tokenId
    contracts.push({
      address: CONTRACT_ADDRESS,
      abi: LOVE20GroupAbi,
      functionName: 'tokenOfOwnerByIndex',
      args: [account!, BigInt(i)],
    });
  }

  const {
    data: tokenIdsData,
    isPending: isTokenIdsPending,
    error: tokenIdsError,
  } = useUniversalReadContracts({
    contracts,
    query: {
      enabled: hasAccount && nftCount > 0,
    },
  });

  // 获取每个 tokenId 的 groupName
  const tokenIds = useMemo(
    () =>
      tokenIdsData
        ?.map((item) => (item.result !== undefined ? safeToBigInt(item.result) : undefined))
        .filter((tokenId): tokenId is bigint => tokenId !== undefined),
    [tokenIdsData],
  );

  const {
    groupNameMap,
    isPending: isGroupNamesPending,
    error: groupNamesError,
  } = useGroupNamesWithCache({
    groupIds: tokenIds,
    enabled: hasAccount && !!tokenIds && tokenIds.length > 0,
  });

  // 组合结果
  const myGroups: GroupNFT[] =
    hasAccount && tokenIds
      ? tokenIds.map((tokenId) => ({
          tokenId,
          groupName: groupNameMap.get(tokenId) || '',
        }))
      : [];

  // 如果没有账户，直接返回非 pending 状态
  // 当 nftCount 为 0 时，后续的查询会被禁用，所以不应该检查它们的 pending 状态
  const isPending = hasAccount
    ? isBalancePending || (nftCount > 0 && (isTokenIdsPending || isGroupNamesPending))
    : false;
  const error = hasAccount ? balanceError || tokenIdsError || groupNamesError : undefined;

  return {
    myGroups,
    balance: hasAccount && balance !== undefined ? balance : BigInt(0),
    isPending,
    error,
  };
}

export function useMyGroupsPage(account: `0x${string}` | undefined, limit: number = 10) {
  const hasAccount = !!account;

  const {
    balance,
    isPending: isBalancePending,
    error: balanceError,
  } = useBalanceOf(
    account || '0x0000000000000000000000000000000000000000',
    hasAccount,
  );

  const nftCount = hasAccount && balance !== undefined ? Number(balance) : 0;
  const safeLimit = Math.max(0, Math.min(limit, nftCount));

  const tokenIdContracts = [];
  for (let i = 0; i < safeLimit; i++) {
    tokenIdContracts.push({
      address: CONTRACT_ADDRESS,
      abi: LOVE20GroupAbi,
      functionName: 'tokenOfOwnerByIndex',
      args: [account!, BigInt(i)],
    });
  }

  const {
    data: tokenIdsData,
    isPending: isTokenIdsPending,
    error: tokenIdsError,
  } = useUniversalReadContracts({
    contracts: tokenIdContracts,
    query: {
      enabled: hasAccount && safeLimit > 0,
    },
  });

  const tokenIds = useMemo(
    () =>
      tokenIdsData
        ?.map((item) => (item.result !== undefined ? safeToBigInt(item.result) : undefined))
        .filter((tokenId): tokenId is bigint => tokenId !== undefined),
    [tokenIdsData],
  );

  const {
    groupNameMap,
    isPending: isGroupNamesPending,
    error: groupNamesError,
  } = useGroupNamesWithCache({
    groupIds: tokenIds,
    enabled: hasAccount && !!tokenIds && tokenIds.length > 0,
  });

  const completeMyGroups = useMemo<GroupNFT[]>(() => {
    if (!hasAccount || !tokenIds || tokenIds.length === 0) return [];
    if (!tokenIds.every((tokenId) => groupNameMap.has(tokenId))) return [];

    return tokenIds.map((tokenId) => ({
      tokenId,
      groupName: groupNameMap.get(tokenId) || '',
    }));
  }, [groupNameMap, hasAccount, tokenIds]);

  const [stableMyGroups, setStableMyGroups] = useState<GroupNFT[]>([]);

  useEffect(() => {
    setStableMyGroups([]);
  }, [account]);

  useEffect(() => {
    if (!hasAccount || safeLimit === 0) {
      setStableMyGroups([]);
      return;
    }

    if (completeMyGroups.length === safeLimit) {
      setStableMyGroups(completeMyGroups);
    }
  }, [completeMyGroups, hasAccount, safeLimit]);

  const isPending = hasAccount
    ? isBalancePending || (safeLimit > 0 && (isTokenIdsPending || isGroupNamesPending))
    : false;
  const error = hasAccount ? balanceError || tokenIdsError || groupNamesError : undefined;

  return {
    myGroups: stableMyGroups,
    balance: hasAccount && balance !== undefined ? balance : BigInt(0),
    hasMore: safeLimit < nftCount,
    loadedCount: stableMyGroups.length,
    isPending,
    error,
  };
}

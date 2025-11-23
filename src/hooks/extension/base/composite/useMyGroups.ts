/**
 * 复合 Hook: 获取用户拥有的所有链群 NFT
 */

import { useReadContracts } from 'wagmi';
import { LOVE20GroupAbi } from '@/src/abis/LOVE20Group';
import { useBalanceOf } from '@/src/hooks/extension/base/contracts/useLOVE20Group';
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
  } = useReadContracts({
    contracts,
    query: {
      enabled: hasAccount && nftCount > 0,
    },
  });

  // 获取每个 tokenId 的 groupName
  const tokenIds = tokenIdsData
    ?.map((item) => (item.result ? safeToBigInt(item.result) : undefined))
    .filter(Boolean) as bigint[];

  const groupNameContracts =
    tokenIds?.map((tokenId) => ({
      address: CONTRACT_ADDRESS,
      abi: LOVE20GroupAbi,
      functionName: 'groupNameOf',
      args: [tokenId],
    })) || [];

  const {
    data: groupNamesData,
    isPending: isGroupNamesPending,
    error: groupNamesError,
  } = useReadContracts({
    contracts: groupNameContracts,
    query: {
      enabled: hasAccount && tokenIds && tokenIds.length > 0,
    },
  });

  // 组合结果
  const myGroups: GroupNFT[] =
    hasAccount && tokenIds
      ? tokenIds.map((tokenId, index) => ({
          tokenId,
          groupName: (groupNamesData?.[index]?.result as string) || '',
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

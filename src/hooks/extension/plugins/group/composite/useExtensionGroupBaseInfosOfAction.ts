// hooks/extension/plugins/group/composite/useExtensionGroupBaseInfosOfAction.ts
// 批量获取链群基本信息列表（只包含 GroupId、群组名称、owner地址）

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20GroupAbi } from '@/src/abis/LOVE20Group';
import { useGroupManagerAddress } from '../contracts';
import { useActiveGroupIds } from '../contracts/useLOVE20GroupManager';

const GROUP_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP as `0x${string}`;

export interface GroupBaseInfo {
  groupId: bigint;
  groupName: string;
  owner: `0x${string}`;
}

export interface UseExtensionGroupBaseInfosOfActionParams {
  extensionAddress: `0x${string}` | undefined;
  tokenAddress: `0x${string}` | undefined;
  actionId: bigint | undefined;
}

export interface UseExtensionGroupBaseInfosOfActionResult {
  groups: GroupBaseInfo[];
  isPending: boolean;
  error: any;
}

/**
 * Hook: 批量获取链群基本信息列表
 *
 * 功能：
 * 1. 获取所有活跃链群NFT（使用 useActiveGroupIds）
 * 2. 批量获取每个链群的基本信息（GroupId、群组名称、owner地址）
 */
export const useExtensionGroupBaseInfosOfAction = ({
  extensionAddress,
  tokenAddress,
  actionId,
}: UseExtensionGroupBaseInfosOfActionParams): UseExtensionGroupBaseInfosOfActionResult => {
  // 获取 GroupManager 合约地址
  const { groupManagerAddress, isPending: isGroupManagerPending } = useGroupManagerAddress(
    extensionAddress as `0x${string}`,
  );

  // 获取活跃链群NFT列表
  const {
    activeGroupIds,
    isPending: isGroupIdsPending,
    error: groupIdsError,
  } = useActiveGroupIds(tokenAddress as `0x${string}`, actionId !== undefined ? actionId : BigInt(0));

  // 批量获取每个群组的名称和 owner
  const detailContracts = useMemo(() => {
    if (!activeGroupIds || activeGroupIds.length === 0) return [];

    const contracts = [];

    for (const groupId of activeGroupIds) {
      // 获取群组名称（通过 LOVE20Group 合约）
      contracts.push({
        address: GROUP_CONTRACT_ADDRESS,
        abi: LOVE20GroupAbi,
        functionName: 'groupNameOf',
        args: [groupId],
      });

      // 获取群组拥有者（通过 LOVE20Group 合约）
      contracts.push({
        address: GROUP_CONTRACT_ADDRESS,
        abi: LOVE20GroupAbi,
        functionName: 'ownerOf',
        args: [groupId],
      });
    }

    return contracts;
  }, [activeGroupIds]);

  const {
    data: detailData,
    isPending: isDetailPending,
    error: detailError,
  } = useReadContracts({
    contracts: detailContracts as any,
    query: {
      enabled: !!activeGroupIds && activeGroupIds.length > 0 && detailContracts.length > 0,
    },
  });

  // 解析群组基本信息
  const groups = useMemo(() => {
    if (!detailData || !activeGroupIds || activeGroupIds.length === 0) return [];

    const result: GroupBaseInfo[] = [];

    for (let i = 0; i < activeGroupIds.length; i++) {
      const baseIndex = i * 2;
      const groupName = detailData[baseIndex]?.result as string | undefined;
      const owner = detailData[baseIndex + 1]?.result as `0x${string}` | undefined;

      if (!groupName || !owner) continue;

      result.push({
        groupId: activeGroupIds[i],
        groupName,
        owner,
      });
    }

    return result;
  }, [detailData, activeGroupIds]);

  // 计算最终的 isPending 状态
  const isPending = useMemo(() => {
    // 如果 GroupManager 地址还在加载，返回 true
    if (isGroupManagerPending) return true;
    // 如果 tokenAddress 或 actionId 不存在，返回 true（等待前置条件）
    if (!tokenAddress || actionId === undefined) return true;
    // 如果 groupManagerAddress 不存在，且已经加载完成，说明没有 groupManager，返回 false（没有链群）
    if (!groupManagerAddress && !isGroupManagerPending) {
      return false;
    }
    // 如果链群NFT列表还在加载中，返回 true
    if (isGroupIdsPending) return true;
    // 如果没有链群（activeGroupIds 为空或 undefined），且查询已完成，返回 false
    if ((!activeGroupIds || activeGroupIds.length === 0) && !isGroupIdsPending) {
      return false;
    }
    // 如果有链群，需要等待详细信息加载完成
    if (activeGroupIds && activeGroupIds.length > 0) {
      return isDetailPending;
    }
    // 其他情况，返回 true
    return true;
  }, [
    isGroupManagerPending,
    isGroupIdsPending,
    isDetailPending,
    activeGroupIds,
    tokenAddress,
    actionId,
    groupManagerAddress,
  ]);

  return {
    groups,
    isPending,
    error: groupIdsError || detailError,
  };
};

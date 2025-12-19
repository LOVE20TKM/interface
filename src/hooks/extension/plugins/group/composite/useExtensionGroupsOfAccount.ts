// hooks/extension/plugins/group/composite/useExtensionGroupsOfAccount.ts
// 获取一个账号的所有链群

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionGroupActionAbi } from '@/src/abis/LOVE20ExtensionGroupAction';
import { LOVE20GroupManagerAbi } from '@/src/abis/LOVE20GroupManager';
import { LOVE20GroupAbi } from '@/src/abis/LOVE20Group';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useGroupManagerAddress, useTokenAddress } from '../contracts';

const GROUP_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP as `0x${string}`;

export interface AccountGroupInfo {
  groupId: bigint;
  groupName: string;
  description: string;
  maxCapacity: bigint;
  totalJoinedAmount: bigint;
  minJoinAmount: bigint;
  maxJoinAmount: bigint;
  isActive: boolean;
  activatedRound: bigint;
  deactivatedRound: bigint;
}

export interface UseExtensionGroupsOfAccountParams {
  extensionAddress: `0x${string}` | undefined;
  actionId: bigint | undefined;
  account: `0x${string}` | undefined;
}

export interface UseExtensionGroupsOfAccountResult {
  groups: AccountGroupInfo[];
  isPending: boolean;
  error: any;
}

/**
 * Hook: 获取一个账号的所有链群
 *
 * 功能：
 * 1. 获取账号的所有活跃链群ID（通过 GroupManager.activeGroupIdsByOwner）
 * 2. 批量获取每个链群的详细信息：
 *    - 链群基本信息（通过 GroupManager.groupInfo）
 *    - 链群名称（通过 Group.groupNameOf）
 *    - 参与代币量（通过 ExtensionGroupAction.totalJoinedAmountByGroupId）
 */
export const useExtensionGroupsOfAccount = ({
  extensionAddress,
  actionId,
  account,
}: UseExtensionGroupsOfAccountParams): UseExtensionGroupsOfAccountResult => {
  // 获取 GroupManager 合约地址和 tokenAddress
  const { groupManagerAddress, isPending: isGroupManagerPending } = useGroupManagerAddress(
    extensionAddress as `0x${string}`,
  );
  const { tokenAddress, isPending: isTokenAddressPending } = useTokenAddress(extensionAddress as `0x${string}`);

  // 第一步：获取账号的所有活跃链群ID列表
  const groupIdsContract = useMemo(() => {
    if (!groupManagerAddress || !tokenAddress || actionId === undefined || !account) return [];

    return [
      {
        address: groupManagerAddress,
        abi: LOVE20GroupManagerAbi,
        functionName: 'activeGroupIdsByOwner',
        args: [tokenAddress, actionId, account],
      },
    ];
  }, [groupManagerAddress, tokenAddress, actionId, account]);

  const {
    data: groupIdsData,
    isPending: isGroupIdsPending,
    error: groupIdsError,
  } = useReadContracts({
    contracts: groupIdsContract as any,
    query: {
      enabled: !!groupManagerAddress && !!tokenAddress && actionId !== undefined && !!account && groupIdsContract.length > 0,
    },
  });

  // 解析链群ID列表
  const groupIds = useMemo(() => {
    if (!groupIdsData || !groupIdsData[0]?.result) return [];
    return groupIdsData[0].result as bigint[];
  }, [groupIdsData]);

  // 第二步：批量获取每个链群的详细信息
  const detailContracts = useMemo(() => {
    if (!groupManagerAddress || !tokenAddress || !extensionAddress || actionId === undefined || groupIds.length === 0) return [];

    const contracts = [];

    for (const groupId of groupIds) {
      // 获取链群信息（从 GroupManager）
      contracts.push({
        address: groupManagerAddress,
        abi: LOVE20GroupManagerAbi,
        functionName: 'groupInfo',
        args: [tokenAddress, actionId, groupId],
      });

      // 获取链群名称（通过 LOVE20Group 合约）
      contracts.push({
        address: GROUP_CONTRACT_ADDRESS,
        abi: LOVE20GroupAbi,
        functionName: 'groupNameOf',
        args: [groupId],
      });

      // 获取参与代币量（通过 ExtensionGroupAction.totalJoinedAmountByGroupId）
      contracts.push({
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'totalJoinedAmountByGroupId',
        args: [groupId],
      });
    }

    return contracts;
  }, [groupManagerAddress, tokenAddress, extensionAddress, actionId, groupIds]);

  const {
    data: detailData,
    isPending: isDetailPending,
    error: detailError,
  } = useReadContracts({
    contracts: detailContracts as any,
    query: {
      enabled:
        !!groupManagerAddress &&
        !!tokenAddress &&
        !!extensionAddress &&
        actionId !== undefined &&
        detailContracts.length > 0,
    },
  });

  // 解析链群详细信息
  const groups = useMemo(() => {
    if (!detailData || groupIds.length === 0) return [];

    const result: AccountGroupInfo[] = [];

    for (let i = 0; i < groupIds.length; i++) {
      const baseIndex = i * 3;
      // GroupManager 的 groupInfo 返回 9 个字段: [groupId, description, maxCapacity, minJoinAmount, maxJoinAmount, maxAccounts, isActive, activatedRound, deactivatedRound]
      const groupInfoData = detailData[baseIndex]?.result as
        | [bigint, string, bigint, bigint, bigint, bigint, boolean, bigint, bigint]
        | undefined;
      const groupName = detailData[baseIndex + 1]?.result as string | undefined;
      const totalJoinedAmount = detailData[baseIndex + 2]?.result;

      if (!groupInfoData || !groupName) continue;

      // GroupManager groupInfo 字段: [groupId, description, maxCapacity, minJoinAmount, maxJoinAmount, maxAccounts, isActive, activatedRound, deactivatedRound]
      result.push({
        groupId: groupIds[i],
        groupName,
        description: groupInfoData[1],
        maxCapacity: safeToBigInt(groupInfoData[2]),
        totalJoinedAmount: safeToBigInt(totalJoinedAmount),
        minJoinAmount: safeToBigInt(groupInfoData[3]),
        maxJoinAmount: safeToBigInt(groupInfoData[4]),
        isActive: groupInfoData[6],
        activatedRound: safeToBigInt(groupInfoData[7]),
        deactivatedRound: safeToBigInt(groupInfoData[8]),
      });
    }

    return result;
  }, [detailData, groupIds]);

  // 计算最终的 isPending 状态
  const isPending = useMemo(() => {
    // 如果前置条件（groupManagerAddress 和 tokenAddress）还在加载，返回 true
    if (isGroupManagerPending || isTokenAddressPending) return true;
    // 如果 tokenAddress、actionId 或 account 不存在，返回 true（等待前置条件）
    if (!tokenAddress || actionId === undefined || !account) return true;
    // 如果 groupManagerAddress 不存在，且已经加载完成，说明没有 groupManager，返回 false
    if (!groupManagerAddress && !isGroupManagerPending) {
      return false;
    }
    // 如果 groupManagerAddress 存在，检查链群ID列表的加载状态
    if (groupManagerAddress) {
      // 如果链群ID列表还在加载，返回 true
      if (isGroupIdsPending) return true;
      // 如果没有链群（groupIds 为空），且链群ID列表查询已完成，返回 false
      if (groupIds.length === 0 && !isGroupIdsPending) {
        return false;
      }
      // 如果有链群，需要等待详细信息加载完成
      if (groupIds.length > 0) {
        return isDetailPending;
      }
    }
    // 其他情况，返回 true
    return true;
  }, [
    isGroupManagerPending,
    isTokenAddressPending,
    isGroupIdsPending,
    isDetailPending,
    groupIds.length,
    tokenAddress,
    actionId,
    account,
    groupManagerAddress,
  ]);

  return {
    groups,
    isPending,
    error: groupIdsError || detailError,
  };
};


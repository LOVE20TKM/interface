// hooks/extension/plugins/group/composite/useExtensionGroupsOfAction.ts
// 批量获取链群列表基本数据

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionGroupActionAbi } from '@/src/abis/LOVE20ExtensionGroupAction';
import { LOVE20GroupManagerAbi } from '@/src/abis/LOVE20GroupManager';
import { LOVE20GroupAbi } from '@/src/abis/LOVE20Group';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useGroupManagerAddress } from '../contracts';
import { useExtensionActionConstCache } from './useExtensionActionConstCache';

const GROUP_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP as `0x${string}`;

export interface GroupBasicInfo {
  groupId: bigint;
  groupName: string;
  owner: `0x${string}`;
  capacity: bigint;
  accountCount: bigint;
  totalJoinedAmount: bigint;
  isActive: boolean;
  // 最大最小参与量
  groupMinJoinAmount: bigint;
  groupMaxJoinAmount: bigint;
  actionMinJoinAmount: bigint;
  actionMaxJoinAmount: bigint;
  actualMinJoinAmount: bigint;
  actualMaxJoinAmount: bigint;
}

export interface UseExtensionGroupsOfActionParams {
  extensionAddress: `0x${string}` | undefined;
  tokenAddress: `0x${string}` | undefined;
  actionId: bigint | undefined;
}

export interface UseExtensionGroupsOfActionResult {
  groups: GroupBasicInfo[];
  isPending: boolean;
  error: any;
}

/**
 * Hook: 批量获取链群列表基本数据
 *
 * 功能：
 * 1. 获取所有活跃链群ID
 * 2. 批量获取每个链群的基本信息（名称、服务者、参与数据）
 * 3. 计算实际最大/最小参与代币量
 */
export const useExtensionGroupsOfAction = ({
  extensionAddress,
  tokenAddress,
  actionId,
}: UseExtensionGroupsOfActionParams): UseExtensionGroupsOfActionResult => {
  // 获取常量配置（用于获取 actionMinJoinAmount）
  const {
    constants,
    isPending: isConstPending,
    error: constError,
  } = useExtensionActionConstCache({ extensionAddress, actionId });

  // 获取 GroupManager 合约地址
  const { groupManagerAddress, isPending: isGroupManagerPending } = useGroupManagerAddress(
    extensionAddress as `0x${string}`,
  );

  // 第一步：批量获取活跃链群ID列表和行动最大参与代币量
  const firstBatchContracts = useMemo(() => {
    if (!groupManagerAddress || !tokenAddress || actionId === undefined) return [];

    return [
      // 获取活跃链群ID列表
      {
        address: groupManagerAddress,
        abi: LOVE20GroupManagerAbi,
        functionName: 'activeGroupIds',
        args: [tokenAddress, actionId],
      },
      // 获取行动最大参与代币量
      {
        address: groupManagerAddress,
        abi: LOVE20GroupManagerAbi,
        functionName: 'calculateJoinMaxAmount',
        args: [tokenAddress, actionId],
      },
    ];
  }, [groupManagerAddress, tokenAddress, actionId]);

  const {
    data: firstBatchData,
    isPending: isFirstBatchPending,
    error: firstBatchError,
  } = useReadContracts({
    contracts: firstBatchContracts as any,
    query: {
      enabled: !!groupManagerAddress && !!tokenAddress && actionId !== undefined && firstBatchContracts.length > 0,
    },
  });

  // 解析群组ID列表和行动最大参与代币量
  const groupIds = useMemo(() => {
    if (!firstBatchData || !firstBatchData[0]?.result) return [];
    return firstBatchData[0].result as bigint[];
  }, [firstBatchData]);

  const actionMaxJoinAmount = useMemo(() => {
    if (!firstBatchData || !firstBatchData[1]?.result) return BigInt(0);
    return safeToBigInt(firstBatchData[1].result);
  }, [firstBatchData]);

  // 第二步：批量获取每个群组的详细信息
  const detailContracts = useMemo(() => {
    if (!groupManagerAddress || !tokenAddress || actionId === undefined || groupIds.length === 0) return [];

    const contracts = [];

    for (const groupId of groupIds) {
      // 获取群组信息（从 GroupManager）
      contracts.push({
        address: groupManagerAddress,
        abi: LOVE20GroupManagerAbi,
        functionName: 'groupInfo',
        args: [tokenAddress, actionId, groupId],
      });

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

      // 获取群组总加入数量
      contracts.push({
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'totalJoinedAmountByGroupId',
        args: [groupId],
      });

      // 获取群组成员数量
      contracts.push({
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'accountsByGroupIdCount',
        args: [groupId],
      });
    }

    return contracts;
  }, [groupManagerAddress, tokenAddress, actionId, extensionAddress, groupIds]);

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
        actionId !== undefined &&
        !!extensionAddress &&
        detailContracts.length > 0,
    },
  });

  // 解析群组详细信息
  const groups = useMemo(() => {
    if (!detailData || groupIds.length === 0 || !constants) return [];

    const result: GroupBasicInfo[] = [];
    // 获取行动最小参与量
    const actionMinJoinAmount = constants.minJoinAmount;

    for (let i = 0; i < groupIds.length; i++) {
      const baseIndex = i * 5;
      // GroupManager 的 groupInfo 返回 9 个字段（不包含 totalJoinedAmount）
      const groupInfoData = detailData[baseIndex]?.result as
        | [bigint, string, bigint, bigint, bigint, bigint, boolean, bigint, bigint]
        | undefined;
      const groupName = detailData[baseIndex + 1]?.result as string | undefined;
      const owner = detailData[baseIndex + 2]?.result as `0x${string}` | undefined;
      const totalJoinedAmount = detailData[baseIndex + 3]?.result as bigint | undefined;
      const accountCount = detailData[baseIndex + 4]?.result;

      if (!groupInfoData || !groupName || !owner) continue;

      // GroupManager groupInfo 字段: [groupId, description, stakedAmount, capacity, groupMinJoinAmount, groupMaxJoinAmount, isActive, activatedRound, deactivatedRound]
      const groupMinJoinAmount = safeToBigInt(groupInfoData[4]);
      const groupMaxJoinAmount = safeToBigInt(groupInfoData[5]);

      // 计算实际最小参与量
      // 如果群设置的最小参与量不为0，则实际最小 = max(群设置, 行动最小)
      // 如果群设置的最小参与量为0，则实际最小 = 行动最小
      const actualMinJoinAmount =
        groupMinJoinAmount > BigInt(0) && groupMinJoinAmount > actionMinJoinAmount
          ? groupMinJoinAmount
          : actionMinJoinAmount;

      // 计算实际最大参与量
      // 如果群设置的最大参与量不为0，则实际最大 = min(群设置, 行动最大)
      // 如果群设置的最大参与量为0，则实际最大 = 行动最大
      const actualMaxJoinAmount =
        groupMaxJoinAmount > BigInt(0) && groupMaxJoinAmount < actionMaxJoinAmount
          ? groupMaxJoinAmount
          : actionMaxJoinAmount;

      result.push({
        groupId: groupIds[i],
        groupName,
        owner,
        capacity: safeToBigInt(groupInfoData[3]),
        accountCount: safeToBigInt(accountCount),
        totalJoinedAmount: safeToBigInt(totalJoinedAmount),
        isActive: groupInfoData[6],
        // 最大最小参与量
        groupMinJoinAmount,
        groupMaxJoinAmount,
        actionMinJoinAmount,
        actionMaxJoinAmount,
        actualMinJoinAmount,
        actualMaxJoinAmount,
      });
    }

    return result;
  }, [detailData, groupIds, constants, actionMaxJoinAmount]);

  // 计算最终的 isPending 状态
  // 如果 groupIds 为空且已经获取完成，则不需要等待 detailPending
  const isPending = useMemo(() => {
    // 如果常量数据还在加载，返回 true
    if (isConstPending) return true;
    // 如果第一步（获取活跃链群ID列表和行动最大参与量）还在加载，返回 true
    if (isFirstBatchPending) return true;
    // 如果 GroupManager 地址还在加载，返回 true
    if (isGroupManagerPending) return true;
    // 如果 tokenAddress 或 actionId 不存在，返回 true（等待前置条件）
    if (!tokenAddress || actionId === undefined) return true;
    // 如果 groupManagerAddress 不存在，且已经加载完成（isGroupManagerPending 为 false），说明没有 groupManager，返回 false（没有链群）
    if (!groupManagerAddress && !isGroupManagerPending) {
      return false;
    }
    // 如果 groupManagerAddress 存在，检查链群ID列表的加载状态
    if (groupManagerAddress) {
      // 如果没有链群（groupIds 为空），且查询已完成，返回 false
      if (groupIds.length === 0 && !isFirstBatchPending) {
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
    isConstPending,
    isFirstBatchPending,
    isGroupManagerPending,
    isDetailPending,
    groupIds.length,
    tokenAddress,
    actionId,
    groupManagerAddress,
  ]);

  return {
    groups,
    isPending,
    error: constError || firstBatchError || detailError,
  };
};

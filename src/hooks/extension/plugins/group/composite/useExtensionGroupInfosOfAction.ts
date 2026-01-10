// hooks/extension/plugins/group/composite/useExtensionGroupInfosOfAction.ts
// 批量获取链群列表完整信息

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { GroupJoinAbi } from '@/src/abis/GroupJoin';
import { GroupManagerAbi } from '@/src/abis/GroupManager';
import { LOVE20GroupAbi } from '@/src/abis/LOVE20Group';
import { safeToBigInt } from '@/src/lib/clientUtils';

const GROUP_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP as `0x${string}`;
const GROUP_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_MANAGER as `0x${string}`;
const GROUP_JOIN_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_JOIN as `0x${string}`;

export interface GroupBasicInfo {
  groupId: bigint;
  groupName: string;
  description: string;
  owner: `0x${string}`;
  maxCapacity: bigint;
  minJoinAmount: bigint;
  maxJoinAmount: bigint;
  maxAccounts: bigint;
  isActive: boolean;
  activatedRound: bigint;
  deactivatedRound: bigint;

  // 补充计算信息
  actionMaxJoinAmount: bigint; //行动最大参与代币量
  actualMinJoinAmount: bigint; //实际最小参与代币量（综合考虑链群、全局）
  actualMaxJoinAmount: bigint; //实际最大参与代币量（综合考虑链群、全局）
  accountCount: bigint; //当前参与地址数
  totalJoinedAmount: bigint; //当前参与代币量
}

export interface UseExtensionGroupInfosOfActionParams {
  extensionAddress: `0x${string}` | undefined;
}

export interface UseExtensionGroupInfosOfActionResult {
  groups: GroupBasicInfo[];
  isPending: boolean;
  error: any;
}

/**
 * Hook: 批量获取链群列表完整信息
 *
 * 功能：
 * 1. 获取所有活跃链群NFT
 * 2. 批量获取每个链群的完整信息（名称、服务者、参与数据、容量等）
 * 3. 计算实际最大/最小参与代币量（从 groupInfo 直接获取）
 */
export const useExtensionGroupInfosOfAction = ({
  extensionAddress,
}: UseExtensionGroupInfosOfActionParams): UseExtensionGroupInfosOfActionResult => {
  // 第一步：批量获取活跃链群NFT列表和行动最大参与代币量
  const firstBatchContracts = useMemo(() => {
    if (!extensionAddress) return [];

    return [
      // 获取活跃链群NFT列表
      {
        address: GROUP_MANAGER_ADDRESS,
        abi: GroupManagerAbi,
        functionName: 'activeGroupIds',
        args: [extensionAddress],
      },
      // 获取行动最大参与代币量
      {
        address: GROUP_MANAGER_ADDRESS,
        abi: GroupManagerAbi,
        functionName: 'maxJoinAmount',
        args: [extensionAddress],
      },
    ];
  }, [extensionAddress]);

  const {
    data: firstBatchData,
    isPending: isFirstBatchPending,
    error: firstBatchError,
  } = useReadContracts({
    contracts: firstBatchContracts as any,
    query: {
      enabled: !!extensionAddress && firstBatchContracts.length > 0,
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
  // 新版合约：totalJoinedAmountByGroupId 和 accountsByGroupIdCount 移到 GroupJoin
  const detailContracts = useMemo(() => {
    if (!extensionAddress || groupIds.length === 0) return [];

    const contracts = [];

    for (const groupId of groupIds) {
      // 获取群组信息（从 GroupManager）
      contracts.push({
        address: GROUP_MANAGER_ADDRESS,
        abi: GroupManagerAbi,
        functionName: 'groupInfo',
        args: [extensionAddress, groupId],
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

      // 获取群组总加入数量（新版合约移到 GroupJoin）
      contracts.push({
        address: GROUP_JOIN_ADDRESS,
        abi: GroupJoinAbi,
        functionName: 'totalJoinedAmountByGroupId',
        args: [extensionAddress, groupId],
      });

      // 获取群组成员数量（新版合约移到 GroupJoin）
      contracts.push({
        address: GROUP_JOIN_ADDRESS,
        abi: GroupJoinAbi,
        functionName: 'accountsByGroupIdCount',
        args: [extensionAddress, groupId],
      });
    }

    return contracts;
  }, [extensionAddress, groupIds]);

  const {
    data: detailData,
    isPending: isDetailPending,
    error: detailError,
  } = useReadContracts({
    contracts: detailContracts as any,
    query: {
      enabled: !!extensionAddress && detailContracts.length > 0,
    },
  });

  // 解析群组详细信息
  const groups = useMemo(() => {
    if (!detailData || groupIds.length === 0) return [];

    const result: GroupBasicInfo[] = [];

    for (let i = 0; i < groupIds.length; i++) {
      const baseIndex = i * 5;
      // GroupManager 的 groupInfo 返回 9 个字段: [groupId, description, maxCapacity, minJoinAmount, maxJoinAmount, maxAccounts, isActive, activatedRound, deactivatedRound]
      const groupInfoData = detailData[baseIndex]?.result as
        | [bigint, string, bigint, bigint, bigint, bigint, boolean, bigint, bigint]
        | undefined;
      const groupName = detailData[baseIndex + 1]?.result as string | undefined;
      const owner = detailData[baseIndex + 2]?.result as `0x${string}` | undefined;
      const totalJoinedAmount = detailData[baseIndex + 3]?.result as bigint | undefined;
      const accountCount = detailData[baseIndex + 4]?.result;

      if (!groupInfoData || !groupName || !owner) continue;

      // GroupManager groupInfo 字段: [groupId, description, maxCapacity, minJoinAmount, maxJoinAmount, maxAccounts, isActive, activatedRound, deactivatedRound]
      const description = groupInfoData[1];
      const maxCapacity = safeToBigInt(groupInfoData[2]);
      const minJoinAmount = safeToBigInt(groupInfoData[3]);
      const maxJoinAmount = safeToBigInt(groupInfoData[4]);
      const maxAccounts = safeToBigInt(groupInfoData[5]);
      const isActive = groupInfoData[6];
      const activatedRound = safeToBigInt(groupInfoData[7]);
      const deactivatedRound = safeToBigInt(groupInfoData[8]);

      // 计算实际最小参与量
      const actualMinJoinAmount = minJoinAmount;

      // 计算实际最大参与量
      // 如果群设置的最大参与量不为0，则实际最大 = min(群设置, 行动最大)
      // 如果群设置的最大参与量为0，则实际最大 = 行动最大
      const actualMaxJoinAmount =
        maxJoinAmount > BigInt(0) && maxJoinAmount < actionMaxJoinAmount ? maxJoinAmount : actionMaxJoinAmount;

      result.push({
        groupId: groupIds[i],
        groupName,
        description,
        owner,
        maxCapacity,
        accountCount: safeToBigInt(accountCount),
        totalJoinedAmount: safeToBigInt(totalJoinedAmount),
        isActive: groupInfoData[6],
        activatedRound,
        deactivatedRound,
        // 最大最小参与量
        minJoinAmount,
        maxJoinAmount,
        maxAccounts,
        actionMaxJoinAmount,
        actualMinJoinAmount,
        actualMaxJoinAmount,
      });
    }

    return result;
  }, [detailData, groupIds, actionMaxJoinAmount]);

  // 计算最终的 isPending 状态
  // 如果 groupIds 为空且已经获取完成，则不需要等待 detailPending
  const isPending = useMemo(() => {
    // 如果第一步（获取活跃链群NFT列表和行动最大参与量）还在加载，返回 true
    if (isFirstBatchPending) return true;
    // 如果 tokenAddress 或 actionId 不存在，返回 true（等待前置条件）
    if (!extensionAddress) return true;
    // 如果没有链群（groupIds 为空），且查询已完成，返回 false
    if (groupIds.length === 0 && !isFirstBatchPending) {
      return false;
    }
    // 如果有链群，需要等待详细信息加载完成
    if (groupIds.length > 0) {
      return isDetailPending;
    }
    // 其他情况，返回 true
    return true;
  }, [isFirstBatchPending, isDetailPending, groupIds.length, extensionAddress]);

  return {
    groups,
    isPending,
    error: firstBatchError || detailError,
  };
};

// hooks/extension/plugins/group/composite/useExtensionGroupDetail.ts
// 获取一个链群详情数据

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionGroupActionAbi } from '@/src/abis/LOVE20ExtensionGroupAction';
import { LOVE20GroupManagerAbi } from '@/src/abis/LOVE20GroupManager';
import { LOVE20GroupAbi } from '@/src/abis/LOVE20Group';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useGroupManagerAddress, useTokenAddress } from '../contracts';

const GROUP_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP as `0x${string}`;

export interface GroupDetailInfo {
  // 基本信息
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
  totalJoinedAmount: bigint; // 当前参与代币量
  accountCount: bigint; //当前参与地址数
  remainingCapacity: bigint; // 剩余容量
}

export interface UseExtensionGroupDetailParams {
  extensionAddress: `0x${string}` | undefined;
  actionId: bigint | undefined;
  groupId: bigint | undefined;
}

export interface UseExtensionGroupDetailResult {
  groupDetail: GroupDetailInfo | undefined;
  isPending: boolean;
  error: any;
}

/**
 * Hook: 获取一个链群详情数据
 *
 * 功能：
 * 1. 获取链群基本信息
 * 2. 计算实际最大/最小参与代币量
 */
export const useExtensionGroupDetail = ({
  extensionAddress,
  actionId,
  groupId,
}: UseExtensionGroupDetailParams): UseExtensionGroupDetailResult => {
  // 获取 GroupManager 合约地址
  const { groupManagerAddress } = useGroupManagerAddress(extensionAddress as `0x${string}`);

  // 获取 tokenAddress
  const { tokenAddress, isPending: isTokenAddressPending } = useTokenAddress(extensionAddress as `0x${string}`);

  // 批量获取链群详细信息
  const detailContracts = useMemo(() => {
    if (!groupManagerAddress || !extensionAddress || !tokenAddress || actionId === undefined || groupId === undefined)
      return [];

    return [
      // 获取群组名称
      {
        address: GROUP_CONTRACT_ADDRESS,
        abi: LOVE20GroupAbi,
        functionName: 'groupNameOf',
        args: [groupId],
      },
      // 获取群组拥有者
      {
        address: GROUP_CONTRACT_ADDRESS,
        abi: LOVE20GroupAbi,
        functionName: 'ownerOf',
        args: [groupId],
      },
      // 获取行动最大参与代币量
      {
        address: groupManagerAddress,
        abi: LOVE20GroupManagerAbi,
        functionName: 'calculateJoinMaxAmount',
        args: [tokenAddress, actionId],
      },
      // 获取总加入数量
      {
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'totalJoinedAmountByGroupId',
        args: [groupId],
      },
      // 获取群组成员数量
      {
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'accountsByGroupIdCount',
        args: [groupId],
      },
      // 获取群组信息
      {
        address: groupManagerAddress,
        abi: LOVE20GroupManagerAbi,
        functionName: 'groupInfo',
        args: [tokenAddress, actionId, groupId],
      },
    ];
  }, [groupManagerAddress, extensionAddress, tokenAddress, actionId, groupId]);

  const {
    data: detailData,
    isPending: isDetailPending,
    error: detailError,
  } = useReadContracts({
    contracts: detailContracts as any,
    query: {
      enabled:
        !!groupManagerAddress &&
        !!extensionAddress &&
        !!tokenAddress &&
        actionId !== undefined &&
        groupId !== undefined &&
        detailContracts.length > 0,
    },
  });

  // console.log('Group Detail Data:', detailData);

  // 解析数据
  const groupDetail = useMemo(() => {
    if (!detailData || detailData.length < 6) return undefined;

    const groupName = detailData[0]?.result as string | undefined;
    const ownerAddress = detailData[1]?.result as `0x${string}` | undefined;
    const actionMaxJoinAmount = safeToBigInt(detailData[2]?.result);
    const totalJoinedAmount = safeToBigInt(detailData[3]?.result);
    const accountCount = safeToBigInt(detailData[4]?.result);
    const groupInfoData = detailData[5]?.result as
      | [bigint, string, bigint, bigint, bigint, bigint, boolean, bigint, bigint]
      | undefined;

    if (!groupInfoData || !groupName || !ownerAddress) return undefined;

    // 解析 groupInfo: [groupId, description, maxCapacity, minJoinAmount, maxJoinAmount, maxAccounts, isActive, activatedRound, deactivatedRound]
    const groupId = safeToBigInt(groupInfoData[0]);
    const description = groupInfoData[1];
    const maxCapacity = safeToBigInt(groupInfoData[2]);
    const minJoinAmount = safeToBigInt(groupInfoData[3]);
    const maxJoinAmount = safeToBigInt(groupInfoData[4]);
    const maxAccounts = safeToBigInt(groupInfoData[5]);
    const isActive = groupInfoData[6];
    const activatedRound = safeToBigInt(groupInfoData[7]);
    const deactivatedRound = safeToBigInt(groupInfoData[8]);
    const remainingCapacity = maxCapacity - totalJoinedAmount;

    // 计算实际最小参与量
    // 如果群设置的最小参与量为0，则使用默认值（可以为0）
    const actualMinJoinAmount = minJoinAmount;

    // 计算实际最大参与量
    // 如果群设置的最大参与量不为0，则实际最大 = min(群设置, 行动最大)
    // 如果群设置的最大参与量为0，则实际最大 = 行动最大
    const actualMaxJoinAmount =
      maxJoinAmount > BigInt(0) && maxJoinAmount < actionMaxJoinAmount ? maxJoinAmount : actionMaxJoinAmount;

    return {
      groupId,
      groupName,
      description,
      owner: ownerAddress,
      maxCapacity,
      accountCount,
      totalJoinedAmount,
      remainingCapacity,
      isActive,
      activatedRound,
      deactivatedRound,
      minJoinAmount,
      maxJoinAmount,
      maxAccounts,
      actionMaxJoinAmount,
      actualMinJoinAmount,
      actualMaxJoinAmount,
    };
  }, [detailData]);

  return {
    groupDetail: groupDetail as GroupDetailInfo | undefined,
    isPending: isTokenAddressPending || isDetailPending,
    error: detailError,
  };
};

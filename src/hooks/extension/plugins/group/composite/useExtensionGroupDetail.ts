// hooks/extension/plugins/group/composite/useExtensionGroupDetail.ts
// 获取一个链群详情数据

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionGroupActionAbi } from '@/src/abis/LOVE20ExtensionGroupAction';
import { LOVE20GroupManagerAbi } from '@/src/abis/LOVE20GroupManager';
import { LOVE20GroupAbi } from '@/src/abis/LOVE20Group';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useExtensionActionConstCache } from './useExtensionActionConstCache';
import { useGroupManagerAddress } from '../contracts';

const GROUP_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP as `0x${string}`;

export interface GroupDetailInfo {
  // 基本信息
  groupId: bigint;
  groupName: string;
  description: string;
  owner: `0x${string}`;
  stakedAmount: bigint;
  capacity: bigint;
  totalJoinedAmount: bigint;
  remainingCapacity: bigint; // 剩余容量
  isActive: boolean;
  activatedRound: bigint;
  deactivatedRound: bigint;
  // 最大最小参与量
  groupMinJoinAmount: bigint;
  groupMaxJoinAmount: bigint;
  actionMinJoinAmount: bigint;
  actionMaxJoinAmount: bigint;
  actualMinJoinAmount: bigint;
  actualMaxJoinAmount: bigint;
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
  // 获取常量配置
  const {
    constants,
    isPending: isConstPending,
    error: constError,
  } = useExtensionActionConstCache({ extensionAddress, actionId });

  // 获取 GroupManager 合约地址
  const { groupManagerAddress } = useGroupManagerAddress(extensionAddress as `0x${string}`);

  // 从 constants 中获取 tokenAddress
  const tokenAddress = constants?.tokenAddress;

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
    if (!detailData || !constants || detailData.length < 5) return undefined;

    const groupName = detailData[0]?.result as string | undefined;
    const ownerAddress = detailData[1]?.result as `0x${string}` | undefined;
    const actionMaxJoinAmount = safeToBigInt(detailData[2]?.result);
    const totalJoinedAmount = safeToBigInt(detailData[3]?.result);

    const groupInfoData = detailData[4]?.result as
      | [bigint, string, bigint, bigint, bigint, bigint, bigint, boolean, bigint, bigint]
      | undefined;

    if (!groupInfoData || !groupName || !ownerAddress) return undefined;

    // 解析 groupInfo
    const groupId = safeToBigInt(groupInfoData[0]);
    const description = groupInfoData[1];
    const stakedAmount = safeToBigInt(groupInfoData[2]);
    const capacity = safeToBigInt(groupInfoData[3]);
    const groupMinJoinAmount = safeToBigInt(groupInfoData[4]);
    const groupMaxJoinAmount = safeToBigInt(groupInfoData[5]);
    const groupMaxAccounts = safeToBigInt(groupInfoData[6]);
    const isActive = groupInfoData[7];
    const activatedRound = safeToBigInt(groupInfoData[8]);
    const deactivatedRound = safeToBigInt(groupInfoData[9]);
    const remainingCapacity = capacity - totalJoinedAmount;

    // 获取行动最小参与量
    const actionMinJoinAmount = constants.minJoinAmount;

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

    return {
      groupId,
      groupName,
      description,
      owner: ownerAddress,
      stakedAmount,
      capacity,
      totalJoinedAmount,
      remainingCapacity,
      isActive,
      activatedRound,
      deactivatedRound,
      groupMinJoinAmount,
      groupMaxJoinAmount,
      actionMinJoinAmount,
      actionMaxJoinAmount,
      actualMinJoinAmount,
      actualMaxJoinAmount,
    };
  }, [detailData, constants]);

  return {
    groupDetail: groupDetail as GroupDetailInfo | undefined,
    isPending: isConstPending || isDetailPending,
    error: constError || detailError,
  };
};

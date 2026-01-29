// hooks/extension/plugins/group/composite/useExtensionGroupDetail.ts
// 获取一个链群详情数据

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { GroupJoinAbi } from '@/src/abis/GroupJoin';
import { GroupManagerAbi } from '@/src/abis/GroupManager';
import { LOVE20GroupAbi } from '@/src/abis/LOVE20Group';
import { safeToBigInt } from '@/src/lib/clientUtils';

const GROUP_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP as `0x${string}`;
const GROUP_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_MANAGER as `0x${string}`;
const GROUP_JOIN_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_JOIN as `0x${string}`;

export interface GroupDetailInfo {
  // 基本信息
  groupId: bigint;
  groupName: string;
  description: string;
  owner: `0x${string}`;
  maxCapacity: bigint;
  minJoinAmount: bigint;
  maxJoinAmount: bigint; //链群设置最大参与量
  maxAccounts: bigint; //链群设置最大参与地址数
  isActive: boolean;
  activatedRound: bigint;
  deactivatedRound: bigint;

  // 补充计算信息
  actionMaxJoinAmount: bigint; //行动最大参与代币量
  actualMinJoinAmount: bigint; //实际最小参与代币量（综合考虑链群、全局）
  actualMaxJoinAmount: bigint; //实际最大参与代币量（综合考虑链群、全局）
  totalJoinedAmount: bigint; // 当前参与代币量
  accountCount: bigint; //当前参与地址数
  remainingCapacity: bigint; // 链群剩余容量

  // 服务者容量信息
  ownerMaxVerifyCapacity: bigint; // 服务者最大验证容量
  ownerTotalJoinedAmount: bigint; // 服务者所有链群的总参与量
  ownerRemainingCapacity: bigint; // 服务者剩余验证容量
}

export interface UseExtensionGroupDetailParams {
  extensionAddress: `0x${string}` | undefined;
  groupId: bigint | undefined;
  round: bigint | undefined;
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
  groupId,
  round,
}: UseExtensionGroupDetailParams): UseExtensionGroupDetailResult => {
  // 批量获取链群详细信息
  // 新版合约：totalJoinedAmountByGroupId 和 accountsByGroupIdCount 移到 GroupJoin
  const detailContracts = useMemo(() => {
    if (!extensionAddress || groupId === undefined || !round) return [];

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
        address: GROUP_MANAGER_ADDRESS,
        abi: GroupManagerAbi,
        functionName: 'maxJoinAmount',
        args: [extensionAddress],
      },
      // 获取总加入数量（新版合约移到 GroupJoin）
      {
        address: GROUP_JOIN_ADDRESS,
        abi: GroupJoinAbi,
        functionName: 'totalJoinedAmountByGroupId',
        args: [extensionAddress, round, groupId],
      },
      // 获取群组成员数量（新版合约移到 GroupJoin）
      {
        address: GROUP_JOIN_ADDRESS,
        abi: GroupJoinAbi,
        functionName: 'accountsByGroupIdCount',
        args: [extensionAddress, round, groupId],
      },
      // 获取群组信息
      {
        address: GROUP_MANAGER_ADDRESS,
        abi: GroupManagerAbi,
        functionName: 'groupInfo',
        args: [extensionAddress, groupId],
      },
    ];
  }, [extensionAddress, groupId, round]);

  const {
    data: detailData,
    isPending: isDetailPending,
    error: detailError,
  } = useReadContracts({
    contracts: detailContracts as any,
    query: {
      enabled: !!extensionAddress && groupId !== undefined && !!round && detailContracts.length > 0,
    },
  });

  // 从第一轮数据中提取 owner 地址
  const ownerAddress = useMemo(() => {
    if (!detailData || detailData.length < 2) return undefined;
    return detailData[1]?.result as `0x${string}` | undefined;
  }, [detailData]);

  // 第二轮：获取服务者容量信息（依赖 owner）
  const ownerContracts = useMemo(() => {
    if (!extensionAddress || !ownerAddress) return [];

    return [
      // 获取服务者最大验证容量
      {
        address: GROUP_MANAGER_ADDRESS,
        abi: GroupManagerAbi,
        functionName: 'maxVerifyCapacityByOwner',
        args: [extensionAddress, ownerAddress],
      },
      // 获取服务者总参与量
      {
        address: GROUP_JOIN_ADDRESS,
        abi: GroupJoinAbi,
        functionName: 'totalJoinedAmountByGroupOwner',
        args: [extensionAddress, ownerAddress],
      },
    ];
  }, [extensionAddress, ownerAddress]);

  const {
    data: ownerData,
    isPending: isOwnerPending,
    error: ownerError,
  } = useReadContracts({
    contracts: ownerContracts as any,
    query: {
      enabled: !!extensionAddress && !!ownerAddress && ownerContracts.length > 0,
    },
  });

  // 解析数据
  const groupDetail = useMemo(() => {
    if (!detailData || detailData.length < 6) return undefined;

    const groupName = detailData[0]?.result as string | undefined;
    const ownerAddress = detailData[1]?.result as `0x${string}` | undefined;
    const actionMaxJoinAmount = safeToBigInt(detailData[2]?.result);
    const totalJoinedAmount = safeToBigInt(detailData[3]?.result);
    const accountCount = safeToBigInt(detailData[4]?.result);
    const groupInfoData = detailData[5]?.result as
      | {
          groupId: bigint;
          description: string;
          maxCapacity: bigint;
          minJoinAmount: bigint;
          maxJoinAmount: bigint;
          maxAccounts: bigint;
          isActive: boolean;
          activatedRound: bigint;
          deactivatedRound: bigint;
        }
      | undefined;

    if (!groupInfoData || !groupName || !ownerAddress) return undefined;

    const groupId = safeToBigInt(groupInfoData.groupId);
    const description = groupInfoData.description;
    const maxCapacity = safeToBigInt(groupInfoData.maxCapacity);
    const minJoinAmount = safeToBigInt(groupInfoData.minJoinAmount);
    const maxJoinAmount = safeToBigInt(groupInfoData.maxJoinAmount);
    const maxAccounts = safeToBigInt(groupInfoData.maxAccounts);
    const isActive = groupInfoData.isActive;
    const activatedRound = safeToBigInt(groupInfoData.activatedRound);
    const deactivatedRound = safeToBigInt(groupInfoData.deactivatedRound);
    const remainingCapacity = maxCapacity - totalJoinedAmount;

    // 计算实际最小参与量
    // 如果群设置的最小参与量为0，则使用默认值（可以为0）
    const actualMinJoinAmount = minJoinAmount;

    // 计算实际最大参与量
    // 如果群设置的最大参与量不为0，则实际最大 = min(群设置, 行动最大)
    // 如果群设置的最大参与量为0，则实际最大 = 行动最大
    const actualMaxJoinAmount =
      maxJoinAmount > BigInt(0) && maxJoinAmount < actionMaxJoinAmount ? maxJoinAmount : actionMaxJoinAmount;

    // ===== 新增：第二轮数据解析 =====
    const ownerMaxVerifyCapacity = safeToBigInt(ownerData?.[0]?.result);
    const ownerTotalJoinedAmount = safeToBigInt(ownerData?.[1]?.result);
    const ownerRemainingCapacity =
      ownerMaxVerifyCapacity > ownerTotalJoinedAmount ? ownerMaxVerifyCapacity - ownerTotalJoinedAmount : BigInt(0);

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
      ownerMaxVerifyCapacity,
      ownerTotalJoinedAmount,
      ownerRemainingCapacity,
    };
  }, [detailData, ownerData]);

  return {
    groupDetail: groupDetail as GroupDetailInfo | undefined,
    isPending: isDetailPending || isOwnerPending,
    error: detailError || ownerError,
  };
};

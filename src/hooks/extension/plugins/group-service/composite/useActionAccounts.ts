// hooks/extension/plugins/group-service/composite/useActionAccounts.tsx
// 获取链群服务行动的参与者列表（所有成员）

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { ExtensionGroupServiceAbi } from '@/src/abis/ExtensionGroupService';
import { ExtensionCenterAbi } from '@/src/abis/ExtensionCenter';
import { GroupManagerAbi } from '@/src/abis/GroupManager';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useGroupNamesWithCache } from '@/src/hooks/extension/base/composite/useGroupNamesWithCache';

const CENTER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_CENTER as `0x${string}`;
const GROUP_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_MANAGER as `0x${string}`;

export interface GroupServiceParticipant {
  address: `0x${string}`;
  joinedRound: bigint;
  groupIds: bigint[]; // 该账户的活跃链群 ID 列表
  groupNames: string[]; // 对应的链群名称列表
}

export interface UseGroupServiceActionAccountsParams {
  extensionAddress: `0x${string}` | undefined;
  tokenAddress: `0x${string}` | undefined;
  actionId: bigint | undefined;
}

export interface UseGroupServiceActionAccountsResult {
  participants: GroupServiceParticipant[];
  isPending: boolean;
  error: any;
}

/**
 * Hook: 获取链群服务行动的参与者列表
 *
 * 功能：
 * 1. 获取行动的所有参与者地址
 * 2. 批量获取每个参与者的加入轮次和激活的链群信息
 * 3. 批量获取所有链群的名称（带缓存优化）
 * 4. 过滤未实际加入的账户（joinedRound === 0）
 *
 * @param extensionAddress - 链群服务扩展合约地址
 * @param tokenAddress - 代币地址
 * @param actionId - 行动ID
 * @returns 所有参与者数据（包括链群信息）、加载状态和错误信息
 */
export const useGroupServiceActionAccounts = ({
  extensionAddress,
  tokenAddress,
  actionId,
}: UseGroupServiceActionAccountsParams): UseGroupServiceActionAccountsResult => {
  // ==========================================
  // 步骤 1: 批量获取基础数据
  // ==========================================
  const basicContracts = useMemo(() => {
    if (!extensionAddress || !tokenAddress || actionId === undefined) return [];

    return [
      // 获取所有参与者地址
      {
        address: CENTER_CONTRACT_ADDRESS,
        abi: ExtensionCenterAbi,
        functionName: 'accounts',
        args: [tokenAddress, actionId],
      },
    ];
  }, [extensionAddress, tokenAddress, actionId]);

  const {
    data: basicData,
    isPending: isBasicPending,
    error: basicError,
  } = useReadContracts({
    contracts: basicContracts as any,
    query: {
      enabled: !!extensionAddress && !!tokenAddress && actionId !== undefined && basicContracts.length > 0,
    },
  });

  // 解析基础数据
  const accounts = useMemo(() => {
    if (!basicData || basicData.length === 0) {
      return [] as `0x${string}`[];
    }

    return (basicData[0]?.result as `0x${string}`[]) || [];
  }, [basicData]);

  // ==========================================
  // 步骤 2: 批量获取每个参与者的详细数据（joinInfo 和 activeGroupIdsByOwner）
  // ==========================================
  const detailContracts = useMemo(() => {
    if (!extensionAddress || !tokenAddress || actionId === undefined || accounts.length === 0) return [];

    const contracts = [];

    for (const account of accounts) {
      // 调用 1: 获取 joinInfo
      contracts.push({
        address: extensionAddress,
        abi: ExtensionGroupServiceAbi,
        functionName: 'joinInfo',
        args: [account],
      });

      // 调用 2: 获取 activeGroupIdsByOwner
      contracts.push({
        address: GROUP_MANAGER_ADDRESS,
        abi: GroupManagerAbi,
        functionName: 'activeGroupIdsByOwner',
        args: [tokenAddress, actionId, account],
      });
    }

    return contracts;
  }, [extensionAddress, tokenAddress, actionId, accounts]);

  const {
    data: detailData,
    isPending: isDetailPending,
    error: detailError,
  } = useReadContracts({
    contracts: detailContracts as any,
    query: {
      enabled: !!extensionAddress && !!tokenAddress && actionId !== undefined && detailContracts.length > 0,
    },
  });

  console.log('detailData', detailData);
  console.log('detailContracts', detailContracts);

  // ==========================================
  // 步骤 3: 提取所有唯一的 groupIds 并获取链群名称
  // ==========================================
  const allGroupIds = useMemo(() => {
    if (!detailData || accounts.length === 0) {
      return [];
    }

    const uniqueGroupIds = new Set<bigint>();

    for (let i = 0; i < accounts.length; i++) {
      const baseIndex = i * 2;
      const groupIdsResult = detailData[baseIndex + 1];

      if (groupIdsResult?.status === 'success' && groupIdsResult.result) {
        const groupIds = groupIdsResult.result as bigint[];
        groupIds.forEach((id) => uniqueGroupIds.add(id));
      }
    }

    return Array.from(uniqueGroupIds);
  }, [detailData, accounts]);

  // 使用缓存 hook 获取链群名称
  const {
    groupNameMap,
    isPending: isGroupNamesPending,
    error: groupNamesError,
  } = useGroupNamesWithCache({
    groupIds: allGroupIds,
    enabled: allGroupIds.length > 0,
  });

  // ==========================================
  // 步骤 4: 组合参与者数据
  // ==========================================
  const participants = useMemo(() => {
    if (!detailData || accounts.length === 0) {
      return [] as GroupServiceParticipant[];
    }

    // 如果有 groupIds 需要获取名称，等待 groupNames 加载完成
    const shouldWaitForGroupNames = allGroupIds.length > 0 && isGroupNamesPending;
    if (shouldWaitForGroupNames) {
      return [] as GroupServiceParticipant[];
    }

    const result: GroupServiceParticipant[] = [];

    // 处理每个参与者
    for (let i = 0; i < accounts.length; i++) {
      const accountAddress = accounts[i];
      const baseIndex = i * 2;

      // 解析 joinedRound (CRITICAL: GroupService 的 joinInfo 返回单个 uint256 值，不是元组)
      const joinInfoResult = detailData[baseIndex];
      const joinedRound = safeToBigInt(joinInfoResult?.result);

      // 过滤掉未实际加入的账户（joinedRound === 0）
      if (joinedRound === BigInt(0)) continue;

      // 解析 groupIds
      const groupIdsResult = detailData[baseIndex + 1];
      const groupIds: bigint[] =
        groupIdsResult?.status === 'success' && groupIdsResult.result ? (groupIdsResult.result as bigint[]) : [];

      // 将 groupIds 映射到 groupNames
      const groupNames: string[] = groupIds.map((groupId) => {
        return groupNameMap.get(groupId) || '';
      });

      result.push({
        address: accountAddress,
        joinedRound,
        groupIds,
        groupNames,
      });
    }

    return result;
  }, [detailData, accounts, allGroupIds, isGroupNamesPending, groupNameMap]);

  // 如果基础数据已加载完成，且没有参与者，则不需要等待详细数据
  const shouldWaitForDetail = accounts && accounts.length > 0;
  const shouldWaitForGroupNames = allGroupIds.length > 0 && isGroupNamesPending;

  const isPending = isBasicPending || (shouldWaitForDetail && isDetailPending) || shouldWaitForGroupNames;

  return {
    participants,
    isPending,
    error: basicError || detailError || groupNamesError,
  };
};

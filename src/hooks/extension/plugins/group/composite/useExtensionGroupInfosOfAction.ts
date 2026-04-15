// hooks/extension/plugins/group/composite/useExtensionGroupInfosOfAction.ts
// 批量获取链群列表完整信息

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUniversalReadContracts } from '@/src/lib/universalReadContract';
import { readContractsInBatchesWithRetry } from '@/src/lib/readContractsInBatches';
import { GroupJoinAbi } from '@/src/abis/GroupJoin';
import { GroupManagerAbi } from '@/src/abis/GroupManager';
import { LOVE20GroupAbi } from '@/src/abis/LOVE20Group';
import { safeToBigInt } from '@/src/lib/clientUtils';

const GROUP_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP as `0x${string}`;
const GROUP_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_MANAGER as `0x${string}`;
const GROUP_JOIN_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_JOIN as `0x${string}`;

// Thinkium RPC 对大批量读取更敏感，控制每批调用数
const DETAIL_BATCH_SIZE = 25;

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
  round: bigint | undefined;
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
  round,
}: UseExtensionGroupInfosOfActionParams): UseExtensionGroupInfosOfActionResult => {
  const firstBatchContracts = useMemo(() => {
    if (!extensionAddress) return [];

    return [
      {
        address: GROUP_MANAGER_ADDRESS,
        abi: GroupManagerAbi,
        functionName: 'activeGroupIds',
        args: [extensionAddress],
      },
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
  } = useUniversalReadContracts({
    contracts: firstBatchContracts as any,
    query: {
      enabled: !!extensionAddress && firstBatchContracts.length > 0,
    },
  });

  const normalizedFirstBatchError = useMemo(() => {
    if (firstBatchError) return firstBatchError;
    return firstBatchData?.find((item) => item?.status === 'failure')?.error || null;
  }, [firstBatchData, firstBatchError]);

  const groupIds = useMemo(() => {
    if (!firstBatchData || firstBatchData[0]?.status !== 'success') return [];
    return firstBatchData[0].result as bigint[];
  }, [firstBatchData]);

  const actionMaxJoinAmount = useMemo(() => {
    if (!firstBatchData || firstBatchData[1]?.status !== 'success') return BigInt(0);
    return safeToBigInt(firstBatchData[1].result);
  }, [firstBatchData]);

  const detailContracts = useMemo(() => {
    if (!extensionAddress || !round || groupIds.length === 0) return [];

    const contracts: any[] = [];

    for (const groupId of groupIds) {
      contracts.push({
        address: GROUP_MANAGER_ADDRESS,
        abi: GroupManagerAbi,
        functionName: 'groupInfo',
        args: [extensionAddress, groupId],
      });
      contracts.push({
        address: GROUP_CONTRACT_ADDRESS,
        abi: LOVE20GroupAbi,
        functionName: 'groupNameOf',
        args: [groupId],
      });
      contracts.push({
        address: GROUP_CONTRACT_ADDRESS,
        abi: LOVE20GroupAbi,
        functionName: 'ownerOf',
        args: [groupId],
      });
      contracts.push({
        address: GROUP_JOIN_ADDRESS,
        abi: GroupJoinAbi,
        functionName: 'totalJoinedAmountByGroupId',
        args: [extensionAddress, round, groupId],
      });
      contracts.push({
        address: GROUP_JOIN_ADDRESS,
        abi: GroupJoinAbi,
        functionName: 'accountsByGroupIdCount',
        args: [extensionAddress, round, groupId],
      });
    }

    return contracts;
  }, [extensionAddress, round, groupIds]);

  const {
    data: groups = [],
    isPending: isDetailPending,
    error: detailError,
  } = useQuery({
    queryKey: [
      'extensionGroupInfosOfAction',
      extensionAddress,
      round?.toString(),
      groupIds.map((groupId) => groupId.toString()).join(','),
      actionMaxJoinAmount.toString(),
    ],
    queryFn: async () => {
      const entries = detailContracts.map((contract, index) => ({
        contract,
        resultIndex: index,
        meta: {
          groupId: groupIds[Math.floor(index / 5)]?.toString(),
        },
      }));

      const { results: detailResults, failures } = await readContractsInBatchesWithRetry(entries, {
        batchSize: DETAIL_BATCH_SIZE,
      });

      if (failures.length > 0) {
        const failedGroupIds = [...new Set(failures.map((failure) => failure.meta?.groupId).filter(Boolean))];
        const failedGroupText =
          failedGroupIds.length > 0
            ? ` 失败链群: ${failedGroupIds.slice(0, 8).join(', ')}${failedGroupIds.length > 8 ? ' ...' : ''}`
            : '';
        throw new Error(`链群详情读取失败（${failures.length}/${detailContracts.length}）。${failedGroupText}`);
      }

      const result: GroupBasicInfo[] = [];

      for (let i = 0; i < groupIds.length; i++) {
        const baseIndex = i * 5;
        const groupInfoResult = detailResults[baseIndex];
        const groupNameResult = detailResults[baseIndex + 1];
        const ownerResult = detailResults[baseIndex + 2];
        const totalJoinedAmountResult = detailResults[baseIndex + 3];
        const accountCountResult = detailResults[baseIndex + 4];

        if (
          groupInfoResult?.status !== 'success' ||
          groupNameResult?.status !== 'success' ||
          ownerResult?.status !== 'success' ||
          totalJoinedAmountResult?.status !== 'success' ||
          accountCountResult?.status !== 'success'
        ) {
          throw new Error(`链群 #${groupIds[i].toString()} 详情不完整，请稍后重试`);
        }

        const groupInfoData = groupInfoResult.result as {
          groupId: bigint;
          description: string;
          maxCapacity: bigint;
          minJoinAmount: bigint;
          maxJoinAmount: bigint;
          maxAccounts: bigint;
          isActive: boolean;
          activatedRound: bigint;
          deactivatedRound: bigint;
        };
        const groupName = groupNameResult.result as string | undefined;
        const owner = ownerResult.result as `0x${string}` | undefined;
        const totalJoinedAmount = totalJoinedAmountResult.result as bigint | undefined;
        const accountCount = accountCountResult.result;

        if (!groupInfoData || groupName === undefined || owner === undefined) {
          throw new Error(`链群 #${groupIds[i].toString()} 详情为空，请稍后重试`);
        }

        const description = groupInfoData.description;
        const maxCapacity = safeToBigInt(groupInfoData.maxCapacity);
        const minJoinAmount = safeToBigInt(groupInfoData.minJoinAmount);
        const maxJoinAmount = safeToBigInt(groupInfoData.maxJoinAmount);
        const maxAccounts = safeToBigInt(groupInfoData.maxAccounts);
        const isActive = groupInfoData.isActive;
        const activatedRound = safeToBigInt(groupInfoData.activatedRound);
        const deactivatedRound = safeToBigInt(groupInfoData.deactivatedRound);

        const actualMinJoinAmount = minJoinAmount;
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
          isActive,
          activatedRound,
          deactivatedRound,
          minJoinAmount,
          maxJoinAmount,
          maxAccounts,
          actionMaxJoinAmount,
          actualMinJoinAmount,
          actualMaxJoinAmount,
        });
      }

      if (result.length !== groupIds.length) {
        throw new Error(`链群详情数量不完整，预期 ${groupIds.length} 个，实际 ${result.length} 个`);
      }

      return result;
    },
    enabled: !!extensionAddress && !!round && groupIds.length > 0 && !normalizedFirstBatchError,
    retry: false,
  });

  const isPending = useMemo(() => {
    if (isFirstBatchPending) return true;
    if (!extensionAddress || !round) return true;
    if (normalizedFirstBatchError) return false;
    if (groupIds.length === 0) return false;
    return isDetailPending;
  }, [isFirstBatchPending, extensionAddress, round, normalizedFirstBatchError, groupIds.length, isDetailPending]);

  return {
    groups,
    isPending,
    error: detailError || normalizedFirstBatchError || null,
  };
};

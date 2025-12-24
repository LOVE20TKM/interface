// hooks/extension/plugins/group/composite/useDistrustVotesOfCurrentRound.ts
// 获取当前验证轮的不信任投票

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20GroupDistrustAbi } from '@/src/abis/LOVE20GroupDistrust';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useExtensionGroupBaseInfosOfAction } from './useExtensionGroupBaseInfosOfAction';

const GROUP_DISTRUST_CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_DISTRUST as `0x${string}`;

export interface DistrustVoteInfo {
  groupOwner: `0x${string}`;
  groupIds: bigint[]; // 该服务者管理的链群列表
  distrustVotes: bigint;
  totalVerifyVotes: bigint;
  distrustRatio: number;
}

export interface UseDistrustVotesOfCurrentRoundParams {
  extensionAddress: `0x${string}` | undefined;
  tokenAddress: `0x${string}` | undefined;
  actionId: bigint | undefined;
  round: bigint | undefined;
}

export interface UseDistrustVotesOfCurrentRoundResult {
  distrustVotes: DistrustVoteInfo[];
  isPending: boolean;
  error: any;
}

/**
 * Hook: 获取当前验证轮的不信任投票
 *
 * 算法：
 * 1. 使用 useExtensionGroupBaseInfosOfAction 获取链群列表
 * 2. 整理链群群主列表（一个群主可能有多个群）
 * 3. 批量 RPC 调用：
 *    - 调用一次 totalVerifyVotes 获取总验证票数
 *    - 对每个群主调用 distrustVotesByGroupOwner 获取不信任票数
 */
export const useDistrustVotesOfCurrentRound = ({
  extensionAddress,
  tokenAddress,
  actionId,
  round,
}: UseDistrustVotesOfCurrentRoundParams): UseDistrustVotesOfCurrentRoundResult => {
  // 第一步：获取链群基本信息列表
  const {
    groups,
    isPending: isGroupsPending,
    error: groupsError,
  } = useExtensionGroupBaseInfosOfAction({
    extensionAddress,
    tokenAddress,
    actionId,
  });

  // 第二步：整理链群群主列表（去重，并记录每个群主管理的群组）
  const groupOwnerMap = useMemo(() => {
    if (!groups || groups.length === 0) return new Map<string, bigint[]>();

    const ownerMap = new Map<string, bigint[]>();

    for (const group of groups) {
      const ownerKey = group.owner.toLowerCase();
      if (!ownerMap.has(ownerKey)) {
        ownerMap.set(ownerKey, []);
      }
      ownerMap.get(ownerKey)!.push(group.groupId);
    }

    return ownerMap;
  }, [groups]);

  const groupOwners = useMemo(() => {
    return Array.from(groupOwnerMap.keys()).map((addr) => addr as `0x${string}`);
  }, [groupOwnerMap]);

  // 第三步：批量获取每个群主的不信任票数和总验证票数
  const distrustContracts = useMemo(() => {
    if (!tokenAddress || !extensionAddress || round === undefined || groupOwners.length === 0) return [];

    const contracts = [];

    // 首先获取总验证票数（只需要调用一次）
    contracts.push({
      address: GROUP_DISTRUST_CONTRACT_ADDRESS,
      abi: LOVE20GroupDistrustAbi,
      functionName: 'totalVerifyVotes',
      args: [tokenAddress, actionId, round],
    });

    // 然后获取每个群主的不信任票数
    for (const owner of groupOwners) {
      contracts.push({
        address: GROUP_DISTRUST_CONTRACT_ADDRESS,
        abi: LOVE20GroupDistrustAbi,
        functionName: 'distrustVotesByGroupOwner',
        args: [tokenAddress, actionId, round, owner],
      });
    }

    return contracts;
  }, [tokenAddress, extensionAddress, round, groupOwners]);

  const {
    data: distrustData,
    isPending: isDistrustPending,
    error: distrustError,
  } = useReadContracts({
    contracts: distrustContracts as any,
    query: {
      enabled:
        !!tokenAddress &&
        !!extensionAddress &&
        round !== undefined &&
        groupOwners.length > 0 &&
        distrustContracts.length > 0,
    },
  });

  // 解析数据
  const distrustVotes = useMemo(() => {
    if (!distrustData || groupOwners.length === 0) return [];

    // 第一个调用是 totalVerifyVotes（所有群主共享）
    const totalVerifyVotes = safeToBigInt(distrustData[0]?.result);

    const result: DistrustVoteInfo[] = [];

    for (let i = 0; i < groupOwners.length; i++) {
      const owner = groupOwners[i];

      // distrustVotes 从索引 1 开始（索引 0 是 totalVerifyVotes）
      const distrustVotesNum = safeToBigInt(distrustData[i + 1]?.result);

      // 如果该群主收到的不信任投票数为0，则过滤掉
      if (distrustVotesNum === BigInt(0)) {
        continue;
      }

      const distrustRatio = totalVerifyVotes > BigInt(0) ? Number(distrustVotesNum) / Number(totalVerifyVotes) : 0;

      // 获取该群主管理的链群列表
      const groupIds = groupOwnerMap.get(owner.toLowerCase()) || [];

      result.push({
        groupOwner: owner,
        groupIds,
        distrustVotes: distrustVotesNum,
        totalVerifyVotes,
        distrustRatio,
      });
    }

    return result;
  }, [distrustData, groupOwners, groupOwnerMap]);

  // 计算最终的 pending 状态
  const finalIsPending = useMemo(() => {
    // 如果链群列表还在加载中，返回 true
    if (isGroupsPending) return true;
    // 如果没有链群（groups 为空），返回 false
    if (!groups || groups.length === 0) return false;
    // 如果没有群主（groupOwners 为空），返回 false
    if (groupOwners.length === 0) return false;
    // 如果不信任票数据还在加载中，返回 true
    return isDistrustPending;
  }, [isGroupsPending, groups, groupOwners.length, isDistrustPending]);

  return {
    distrustVotes,
    isPending: finalIsPending,
    error: groupsError || distrustError,
  };
};

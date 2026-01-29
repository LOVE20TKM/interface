// hooks/extension/plugins/group/composite/useDistrustVotesOfRound.ts
// 获取指定轮次的不信任投票
// TODO: 有多个RPC可以合并

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { GroupVerifyAbi } from '@/src/abis/GroupVerify';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useDistrustGroupOwners } from '@/src/hooks/extension/plugins/group/contracts/useGroupVerify';
import { useVotesNumByActionId } from '@/src/hooks/contracts/useLOVE20Vote';

const GROUP_VERIFY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_VERIFY as `0x${string}`;

export interface DistrustVoteInfo {
  groupOwner: `0x${string}`;
  groupIds: bigint[]; // 该服务者管理的链群列表
  distrustVotes: bigint;
  totalVotes: bigint;
  distrustRatio: number;
}

export interface UseDistrustVotesOfRoundParams {
  actionId: bigint;
  extensionAddress: `0x${string}` | undefined;
  tokenAddress: `0x${string}` | undefined;
  round: bigint | undefined;
}

export interface UseDistrustVotesOfRoundResult {
  distrustVotes: DistrustVoteInfo[];
  isPending: boolean;
  error: any;
}

/**
 * Hook: 获取指定轮次的不信任投票
 *
 * 算法：
 * 1. 使用 useDistrustGroupOwners 获取指定轮次被投不信任票的群主列表
 * 2. 批量调用 groupIdsByVerifier 获取每个群主管理的链群NFT列表
 * 3. 使用 useVotesNum 从 LOVE20Vote 合约获取某轮次的总投票数
 * 4. 批量 RPC 调用：
 *    - 对每个群主调用 distrustVotesByGroupOwner 获取不信任票数
 * 5. 计算每个群主的不信任率并返回
 */
export const useDistrustVotesOfRound = ({
  actionId,
  extensionAddress,
  tokenAddress,
  round,
}: UseDistrustVotesOfRoundParams): UseDistrustVotesOfRoundResult => {
  // 第一步：获取被投不信任票的群主列表
  const {
    groupOwners,
    isPending: isGroupOwnersPending,
    error: groupOwnersError,
  } = useDistrustGroupOwners(extensionAddress as `0x${string}`, !!round ? round : BigInt(0));

  // 第二步：批量获取每个群主的链群NFT列表
  // 新版合约 groupIdsByVerifier 使用 extensionAddress, round, groupOwner 参数
  const groupIdsContracts = useMemo(() => {
    if (!extensionAddress || round === undefined || !groupOwners || groupOwners.length === 0) return [];

    const contracts = [];
    for (const groupOwner of groupOwners) {
      contracts.push({
        address: GROUP_VERIFY_CONTRACT_ADDRESS,
        abi: GroupVerifyAbi,
        functionName: 'groupIdsByVerifier',
        args: [extensionAddress, round, groupOwner],
      });
    }

    return contracts;
  }, [extensionAddress, round, groupOwners]);

  const {
    data: groupIdsData,
    isPending: isGroupIdsPending,
    error: groupIdsError,
  } = useReadContracts({
    contracts: groupIdsContracts as any,
    query: {
      enabled: !!extensionAddress && !!round && !!groupOwners && groupOwners.length > 0,
    },
  });

  // 解析群主和其对应的链群NFT列表
  const groupOwnerGroupMap = useMemo(() => {
    if (!groupOwners || !groupIdsData) return new Map<string, bigint[]>();

    const map = new Map<string, bigint[]>();
    groupOwners.forEach((groupOwner, index) => {
      const groupIds = (groupIdsData[index]?.result as bigint[]) || [];
      map.set(groupOwner.toLowerCase(), groupIds);
    });

    return map;
  }, [groupOwners, groupIdsData]);

  // 第三步：从 LOVE20Vote 合约获取某轮次的总投票数
  const {
    votesNumByActionId: totalVotes,
    isPending: isTotalVotesPending,
    error: totalVotesError,
  } = useVotesNumByActionId(tokenAddress as `0x${string}`, !!round ? round : BigInt(0), actionId);

  // 第四步：批量获取不信任票数据
  const distrustContracts = useMemo(() => {
    if (!extensionAddress || round === undefined || !groupOwners || groupOwners.length === 0) return [];

    const contracts = [];

    // 获取每个群主的不信任票数
    for (const groupOwner of groupOwners) {
      contracts.push({
        address: GROUP_VERIFY_CONTRACT_ADDRESS,
        abi: GroupVerifyAbi,
        functionName: 'distrustVotesByGroupOwner',
        args: [extensionAddress, round, groupOwner],
      });
    }

    return contracts;
  }, [extensionAddress, round, groupOwners]);

  const {
    data: distrustData,
    isPending: isDistrustPending,
    error: distrustError,
  } = useReadContracts({
    contracts: distrustContracts as any,
    query: {
      enabled: !!extensionAddress && !!round && !!groupOwners && groupOwners.length > 0 && distrustContracts.length > 0,
    },
  });

  // 第五步：解析数据并计算不信任率
  const distrustVotes = useMemo(() => {
    if (!distrustData || !groupOwners || groupOwners.length === 0 || totalVotes === undefined) return [];

    const totalVotesBigInt = totalVotes || BigInt(0);
    const result: DistrustVoteInfo[] = [];

    for (let i = 0; i < groupOwners.length; i++) {
      const groupOwner = groupOwners[i];

      // 获取每个群主的不信任票数
      const distrustVotesNum = safeToBigInt(distrustData[i]?.result);

      // 计算不信任率
      const distrustRatio = totalVotesBigInt > BigInt(0) ? Number(distrustVotesNum) / Number(totalVotesBigInt) : 0;

      // 获取该群主管理的链群列表
      const groupIds = groupOwnerGroupMap.get(groupOwner.toLowerCase()) || [];

      result.push({
        groupOwner: groupOwner,
        groupIds,
        distrustVotes: distrustVotesNum,
        totalVotes: totalVotesBigInt,
        distrustRatio,
      });
    }

    return result;
  }, [distrustData, groupOwners, groupOwnerGroupMap, totalVotes]);

  // 计算最终的 pending 状态
  const finalIsPending = useMemo(() => {
    // 如果群主列表还在加载中，返回 true
    if (isGroupOwnersPending) return true;
    // 如果没有群主，返回 false
    if (!groupOwners || groupOwners.length === 0) return false;
    // 如果链群NFT列表还在加载中，返回 true
    if (isGroupIdsPending) return true;
    // 如果总投票数还在加载中，返回 true
    if (isTotalVotesPending) return true;
    // 如果不信任票数据还在加载中，返回 true
    return isDistrustPending;
  }, [isGroupOwnersPending, groupOwners, isGroupIdsPending, isTotalVotesPending, isDistrustPending]);

  return {
    distrustVotes,
    isPending: finalIsPending,
    error: groupOwnersError || groupIdsError || totalVotesError || distrustError,
  };
};

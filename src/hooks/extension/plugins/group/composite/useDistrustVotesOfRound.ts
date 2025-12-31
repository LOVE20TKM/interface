// hooks/extension/plugins/group/composite/useDistrustVotesOfRound.ts
// 获取指定轮次的不信任投票

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { GroupVerifyAbi } from '@/src/abis/GroupVerify';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useVerifiers } from '@/src/hooks/extension/plugins/group/contracts/useGroupVerify';
import { useGroupNamesWithCache } from '../../../base/composite/useGroupNamesWithCache';
import { useVotesNum } from '@/src/hooks/contracts/useLOVE20Vote';
import type { DistrustVoteInfo } from './useDistrustVotesOfCurrentRound';

const GROUP_VERIFY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_VERIFY as `0x${string}`;

export interface UseDistrustVotesOfRoundParams {
  extensionAddress: `0x${string}` | undefined;
  tokenAddress: `0x${string}` | undefined;
  actionId: bigint | undefined;
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
 * 1. 使用 useVerifiers 获取指定轮次的验证者列表（验证者即为链群服务者）
 * 2. 批量调用 groupIdsByVerifier 获取每个验证者管理的链群NFT列表
 * 3. 使用 useGroupNamesWithCache 批量获取链群名称（带缓存）
 * 4. 使用 useVotesNum 从 LOVE20Vote 合约获取某轮次的总投票数
 * 5. 批量 RPC 调用：
 *    - 对每个验证者调用 distrustVotesByGroupOwner 获取不信任票数
 * 6. 计算每个验证者的不信任率并返回
 */
export const useDistrustVotesOfRound = ({
  extensionAddress,
  tokenAddress,
  actionId,
  round,
}: UseDistrustVotesOfRoundParams): UseDistrustVotesOfRoundResult => {
  // 第一步：获取指定轮次的验证者列表
  // 新版合约 useVerifiers 需要 tokenAddress 和 actionId 参数
  const {
    verifiers,
    isPending: isVerifiersPending,
    error: verifiersError,
  } = useVerifiers(
    tokenAddress as `0x${string}`,
    actionId !== undefined ? actionId : BigInt(0),
    round !== undefined ? round : BigInt(0),
  );

  // 第二步：批量获取每个验证者的链群NFT列表
  // 新版合约 groupIdsByVerifier 移到 GroupVerify，参数顺序变为 tokenAddress, actionId, round, verifier
  const groupIdsContracts = useMemo(() => {
    if (!tokenAddress || actionId === undefined || round === undefined || !verifiers || verifiers.length === 0)
      return [];

    const contracts = [];
    for (const verifier of verifiers) {
      contracts.push({
        address: GROUP_VERIFY_CONTRACT_ADDRESS,
        abi: GroupVerifyAbi,
        functionName: 'groupIdsByVerifier',
        args: [tokenAddress, actionId, round, verifier],
      });
    }

    return contracts;
  }, [tokenAddress, actionId, round, verifiers]);

  const {
    data: groupIdsData,
    isPending: isGroupIdsPending,
    error: groupIdsError,
  } = useReadContracts({
    contracts: groupIdsContracts as any,
    query: {
      enabled: !!extensionAddress && round !== undefined && !!verifiers && verifiers.length > 0,
    },
  });

  // 解析验证者和其对应的链群NFT列表
  const verifierGroupMap = useMemo(() => {
    if (!verifiers || !groupIdsData) return new Map<string, bigint[]>();

    const map = new Map<string, bigint[]>();
    verifiers.forEach((verifier, index) => {
      const groupIds = (groupIdsData[index]?.result as bigint[]) || [];
      map.set(verifier.toLowerCase(), groupIds);
    });

    return map;
  }, [verifiers, groupIdsData]);

  // 收集所有唯一的 groupId
  const allGroupIds = useMemo(() => {
    const ids = new Set<bigint>();
    verifierGroupMap.forEach((groupIds) => {
      groupIds.forEach((id) => ids.add(id));
    });
    return Array.from(ids);
  }, [verifierGroupMap]);

  // 第三步：批量获取链群名称
  const {
    groupNameMap,
    isPending: isGroupNamesPending,
    error: groupNamesError,
  } = useGroupNamesWithCache({
    groupIds: allGroupIds.length > 0 ? allGroupIds : undefined,
    enabled: allGroupIds.length > 0,
  });

  // 第四步：从 LOVE20Vote 合约获取某轮次的总投票数
  const {
    votes: totalVotes,
    isPending: isTotalVotesPending,
    error: totalVotesError,
  } = useVotesNum(tokenAddress as `0x${string}`, round !== undefined ? round : BigInt(0));

  // 第五步：批量获取不信任票数据
  const distrustContracts = useMemo(() => {
    if (!tokenAddress || !extensionAddress || round === undefined || !verifiers || verifiers.length === 0) return [];

    const contracts = [];

    // 获取每个验证者的不信任票数
    for (const verifier of verifiers) {
      contracts.push({
        address: GROUP_VERIFY_CONTRACT_ADDRESS,
        abi: GroupVerifyAbi,
        functionName: 'distrustVotesByGroupOwner',
        args: [tokenAddress, actionId, round, verifier],
      });
    }

    return contracts;
  }, [tokenAddress, extensionAddress, actionId, round, verifiers]);

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
        actionId !== undefined &&
        round !== undefined &&
        !!verifiers &&
        verifiers.length > 0 &&
        distrustContracts.length > 0,
    },
  });

  // 第六步：解析数据并计算不信任率
  const distrustVotes = useMemo(() => {
    if (!distrustData || !verifiers || verifiers.length === 0 || totalVotes === undefined) return [];

    const totalVotesBigInt = totalVotes || BigInt(0);
    const result: DistrustVoteInfo[] = [];

    for (let i = 0; i < verifiers.length; i++) {
      const verifier = verifiers[i];

      // 获取每个验证者的不信任票数
      const distrustVotesNum = safeToBigInt(distrustData[i]?.result);

      // 计算不信任率
      const distrustRatio = totalVotesBigInt > BigInt(0) ? Number(distrustVotesNum) / Number(totalVotesBigInt) : 0;

      // 获取该验证者管理的链群列表
      const groupIds = verifierGroupMap.get(verifier.toLowerCase()) || [];

      result.push({
        groupOwner: verifier,
        groupIds,
        distrustVotes: distrustVotesNum,
        totalVotes: totalVotesBigInt,
        distrustRatio,
      });
    }

    return result;
  }, [distrustData, verifiers, verifierGroupMap, totalVotes]);

  // 计算最终的 pending 状态
  const finalIsPending = useMemo(() => {
    // 如果验证者列表还在加载中，返回 true
    if (isVerifiersPending) return true;
    // 如果没有验证者，返回 false
    if (!verifiers || verifiers.length === 0) return false;
    // 如果链群NFT列表还在加载中，返回 true
    if (isGroupIdsPending) return true;
    // 如果链群名称还在加载中，返回 true
    if (isGroupNamesPending) return true;
    // 如果总投票数还在加载中，返回 true
    if (isTotalVotesPending) return true;
    // 如果不信任票数据还在加载中，返回 true
    return isDistrustPending;
  }, [isVerifiersPending, verifiers, isGroupIdsPending, isGroupNamesPending, isTotalVotesPending, isDistrustPending]);

  return {
    distrustVotes,
    isPending: finalIsPending,
    error: verifiersError || groupIdsError || groupNamesError || totalVotesError || distrustError,
  };
};

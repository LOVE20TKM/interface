// hooks/extension/plugins/group/composite/useDistrustVotesOfRound.ts
// 获取指定轮次的不信任投票

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20GroupDistrustAbi } from '@/src/abis/LOVE20GroupDistrust';
import { LOVE20ExtensionGroupActionAbi } from '@/src/abis/LOVE20ExtensionGroupAction';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useVerifiers } from '@/src/hooks/extension/plugins/group/contracts/useLOVE20ExtensionGroupAction';
import { useGroupNamesWithCache } from '../../../base/composite/useGroupNamesWithCache';
import type { DistrustVoteInfo } from './useDistrustVotesOfCurrentRound';

const GROUP_DISTRUST_CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_DISTRUST as `0x${string}`;

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
 * 4. 批量 RPC 调用：
 *    - 调用一次 totalVerifyVotes 获取总验证票数
 *    - 对每个验证者调用 distrustVotesByGroupOwner 获取不信任票数
 * 5. 计算每个验证者的不信任率并返回
 */
export const useDistrustVotesOfRound = ({
  extensionAddress,
  tokenAddress,
  actionId,
  round,
}: UseDistrustVotesOfRoundParams): UseDistrustVotesOfRoundResult => {
  // 第一步：获取指定轮次的验证者列表
  const {
    verifiers,
    isPending: isVerifiersPending,
    error: verifiersError,
  } = useVerifiers(extensionAddress as `0x${string}`, round !== undefined ? round : BigInt(0));

  // 第二步：批量获取每个验证者的链群NFT列表
  const groupIdsContracts = useMemo(() => {
    if (!extensionAddress || round === undefined || !verifiers || verifiers.length === 0) return [];

    const contracts = [];
    for (const verifier of verifiers) {
      contracts.push({
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'groupIdsByVerifier',
        args: [round, verifier],
      });
    }

    return contracts;
  }, [extensionAddress, round, verifiers]);

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

  // 第四步：批量获取不信任票数据
  const distrustContracts = useMemo(() => {
    if (!tokenAddress || !extensionAddress || round === undefined || !verifiers || verifiers.length === 0) return [];

    const contracts = [];

    // 首先获取总验证票数（只需要调用一次）
    contracts.push({
      address: GROUP_DISTRUST_CONTRACT_ADDRESS,
      abi: LOVE20GroupDistrustAbi,
      functionName: 'totalVerifyVotes',
      args: [tokenAddress, actionId, round],
    });

    // 然后获取每个验证者的不信任票数
    for (const verifier of verifiers) {
      contracts.push({
        address: GROUP_DISTRUST_CONTRACT_ADDRESS,
        abi: LOVE20GroupDistrustAbi,
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

  // 第五步：解析数据并计算不信任率
  const distrustVotes = useMemo(() => {
    if (!distrustData || !verifiers || verifiers.length === 0) return [];

    // 第一个调用是 totalVerifyVotes（所有验证者共享）
    const totalVerifyVotes = safeToBigInt(distrustData[0]?.result);

    const result: DistrustVoteInfo[] = [];

    for (let i = 0; i < verifiers.length; i++) {
      const verifier = verifiers[i];

      // distrustVotes 从索引 1 开始（索引 0 是 totalVerifyVotes）
      const distrustVotesNum = safeToBigInt(distrustData[i + 1]?.result);

      // 计算不信任率
      const distrustRatio = totalVerifyVotes > BigInt(0) ? Number(distrustVotesNum) / Number(totalVerifyVotes) : 0;

      // 获取该验证者管理的链群列表
      const groupIds = verifierGroupMap.get(verifier.toLowerCase()) || [];

      result.push({
        groupOwner: verifier,
        groupIds,
        distrustVotes: distrustVotesNum,
        totalVerifyVotes,
        distrustRatio,
      });
    }

    return result;
  }, [distrustData, verifiers, verifierGroupMap]);

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
    // 如果不信任票数据还在加载中，返回 true
    return isDistrustPending;
  }, [isVerifiersPending, verifiers, isGroupIdsPending, isGroupNamesPending, isDistrustPending]);

  return {
    distrustVotes,
    isPending: finalIsPending,
    error: verifiersError || groupIdsError || groupNamesError || distrustError,
  };
};

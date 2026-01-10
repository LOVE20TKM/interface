// hooks/extension/plugins/group/composite/useDistrustVotesOfGroupOwner.ts
// 获取第n轮某个服务者收到的不信任票明细

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { GroupVerifyAbi } from '@/src/abis/GroupVerify';
import { LOVE20VerifyAbi } from '@/src/abis/LOVE20Verify';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useDistrustVotersByGroupOwner } from '../contracts/useGroupVerify';

const VERIFY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_VERIFY as `0x${string}`;
const GROUP_VERIFY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_VERIFY as `0x${string}`;

export interface VoterDistrustInfo {
  voter: `0x${string}`;
  verifyVotes: bigint;
  distrustVotes: bigint;
  distrustRatio: number;
  reason: string;
}

export interface UseDistrustVotesOfGroupOwnerParams {
  extensionAddress: `0x${string}` | undefined;
  tokenAddress: `0x${string}` | undefined;
  actionId: bigint | undefined;
  round: bigint | undefined;
  groupOwner: `0x${string}` | undefined;
}

export interface UseDistrustVotesOfGroupOwnerResult {
  voterDistrusts: VoterDistrustInfo[];
  isPending: boolean;
  error: any;
}

/**
 * Hook: 获取第n轮某个服务者收到的不信任票明细
 *
 * 算法：
 * 1. 直接获取给该服务者投不信任票的所有投票者地址（通过 useDistrustVotersByGroupOwner）
 * 2. 循环每个投票者：
 *    - 获取当轮投票者的验证票
 *    - 获取投票者给服务者投的不信任票
 *    - 获取投票原因
 */
export const useDistrustVotesOfGroupOwner = ({
  extensionAddress,
  tokenAddress,
  actionId,
  round,
  groupOwner,
}: UseDistrustVotesOfGroupOwnerParams): UseDistrustVotesOfGroupOwnerResult => {
  // 第一步：直接获取给该服务者投不信任票的所有投票者地址
  const {
    voters,
    isPending: isVotersPending,
    error: votersError,
  } = useDistrustVotersByGroupOwner(extensionAddress, round, groupOwner);

  const distrustVoters = useMemo(() => {
    if (!voters) return [];
    return voters.filter((addr) => !!addr);
  }, [voters]);

  // 第二步：获取每个投票者的验证票、不信任票、原因
  const detailContracts = useMemo(() => {
    if (!tokenAddress || round === undefined || !groupOwner || distrustVoters.length === 0) return [];

    const contracts = [];

    for (const voter of distrustVoters) {
      // 获取验证票
      contracts.push({
        address: VERIFY_CONTRACT_ADDRESS,
        abi: LOVE20VerifyAbi,
        functionName: 'scoreByVerifierByActionId',
        args: [tokenAddress, round, voter, actionId],
      });

      // 获取不信任票
      contracts.push({
        address: GROUP_VERIFY_CONTRACT_ADDRESS,
        abi: GroupVerifyAbi,
        functionName: 'distrustVotesByVoterByGroupOwner',
        args: [extensionAddress, round, voter, groupOwner],
      });

      // 获取原因
      contracts.push({
        address: GROUP_VERIFY_CONTRACT_ADDRESS,
        abi: GroupVerifyAbi,
        functionName: 'distrustReason',
        args: [extensionAddress, round, voter, groupOwner],
      });
    }

    return contracts;
  }, [extensionAddress, round, groupOwner, distrustVoters]);

  const {
    data: detailData,
    isPending: isDetailPending,
    error: detailError,
  } = useReadContracts({
    contracts: detailContracts as any,
    query: {
      enabled:
        !!tokenAddress && actionId !== undefined && round !== undefined && !!groupOwner && detailContracts.length > 0,
    },
  });

  // 解析数据
  const voterDistrusts = useMemo(() => {
    if (!detailData || distrustVoters.length === 0) return [];

    const result: VoterDistrustInfo[] = [];

    for (let i = 0; i < distrustVoters.length; i++) {
      const baseIndex = i * 3;
      const verifyVotes = safeToBigInt(detailData[baseIndex]?.result);
      const distrustVotes = safeToBigInt(detailData[baseIndex + 1]?.result);
      const reason = (detailData[baseIndex + 2]?.result as string) || '';

      const distrustRatio = verifyVotes > BigInt(0) ? Number(distrustVotes) / Number(verifyVotes) : 0;

      result.push({
        voter: distrustVoters[i],
        verifyVotes,
        distrustVotes,
        distrustRatio,
        reason,
      });
    }

    return result;
  }, [detailData, distrustVoters]);

  // 计算最终的 pending 状态
  // 如果投票者列表还在加载中，返回 true
  // 如果投票者列表为空，返回 false（不需要等待后续查询）
  // 如果投票者列表不为空，等待详细信息加载完成
  const finalIsPending = useMemo(() => {
    if (isVotersPending) return true;
    if (distrustVoters.length === 0) return false;
    return isDetailPending;
  }, [isVotersPending, distrustVoters.length, isDetailPending]);

  return {
    voterDistrusts,
    isPending: finalIsPending,
    error: votersError || detailError,
  };
};

// hooks/extension/plugins/group/composite/useDistrustVotesOfGroupOwner.ts
// 获取第n轮某个服务者收到的不信任票明细

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20GroupDistrustAbi } from '@/src/abis/LOVE20GroupDistrust';
import { LOVE20VoteAbi } from '@/src/abis/LOVE20Vote';
import { LOVE20VerifyAbi } from '@/src/abis/LOVE20Verify';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useGroupDistrustAddress } from '../contracts';

const VOTE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_VOTE as `0x${string}`;
const VERIFY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_VERIFY as `0x${string}`;

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
 * 1. 获取当轮的行动的投票者（通过 LOVE20Vote 合约）
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
  // 获取 GroupDistrust 合约地址
  const { groupDistrustAddress } = useGroupDistrustAddress(extensionAddress as `0x${string}`);

  // 第一步：获取当轮投票者数量
  const voterCountContract = useMemo(() => {
    if (!tokenAddress || !actionId || round === undefined) return [];

    return [
      {
        address: VOTE_CONTRACT_ADDRESS,
        abi: LOVE20VoteAbi,
        functionName: 'accountsByActionIdCount',
        args: [tokenAddress, round, actionId],
      },
    ];
  }, [tokenAddress, actionId, round]);

  const {
    data: voterCountData,
    isPending: isVoterCountPending,
    error: voterCountError,
  } = useReadContracts({
    contracts: voterCountContract as any,
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined && voterCountContract.length > 0,
    },
  });

  const voterCount = useMemo(() => {
    if (!voterCountData || !voterCountData[0]?.result) return BigInt(0);
    return safeToBigInt(voterCountData[0].result);
  }, [voterCountData]);

  // 第二步：获取所有投票者地址
  const votersContracts = useMemo(() => {
    if (!tokenAddress || !actionId || round === undefined || voterCount === BigInt(0)) return [];

    const contracts = [];
    for (let i = BigInt(0); i < voterCount; i++) {
      contracts.push({
        address: VOTE_CONTRACT_ADDRESS,
        abi: LOVE20VoteAbi,
        functionName: 'accountsByActionIdAtIndex',
        args: [tokenAddress, round, actionId, i],
      });
    }

    return contracts;
  }, [tokenAddress, actionId, round, voterCount]);

  const {
    data: votersData,
    isPending: isVotersPending,
    error: votersError,
  } = useReadContracts({
    contracts: votersContracts as any,
    query: {
      enabled: !!tokenAddress && actionId !== undefined && round !== undefined && votersContracts.length > 0,
    },
  });

  const voters = useMemo(() => {
    if (!votersData) return [];
    return votersData.map((v) => v.result as `0x${string}`).filter((addr) => !!addr);
  }, [votersData]);

  // 第三步：获取每个投票者的验证票、不信任票、原因
  const detailContracts = useMemo(() => {
    if (!groupDistrustAddress || !tokenAddress || !actionId || round === undefined || !groupOwner || voters.length === 0)
      return [];

    const contracts = [];

    for (const voter of voters) {
      // 获取验证票
      contracts.push({
        address: VERIFY_CONTRACT_ADDRESS,
        abi: LOVE20VerifyAbi,
        functionName: 'scoreByVerifierByActionId',
        args: [tokenAddress, round, voter, actionId],
      });

      // 获取不信任票
      contracts.push({
        address: groupDistrustAddress,
        abi: LOVE20GroupDistrustAbi,
        functionName: 'distrustVotesByVoterByGroupOwner',
        args: [tokenAddress, actionId, round, voter, groupOwner],
      });

      // 获取原因
      contracts.push({
        address: groupDistrustAddress,
        abi: LOVE20GroupDistrustAbi,
        functionName: 'distrustReason',
        args: [tokenAddress, actionId, round, voter, groupOwner],
      });
    }

    return contracts;
  }, [groupDistrustAddress, tokenAddress, actionId, round, groupOwner, voters]);

  const {
    data: detailData,
    isPending: isDetailPending,
    error: detailError,
  } = useReadContracts({
    contracts: detailContracts as any,
    query: {
      enabled:
        !!groupDistrustAddress &&
        !!tokenAddress &&
        actionId !== undefined &&
        round !== undefined &&
        !!groupOwner &&
        detailContracts.length > 0,
    },
  });

  // 解析数据
  const voterDistrusts = useMemo(() => {
    if (!detailData || voters.length === 0) return [];

    const result: VoterDistrustInfo[] = [];

    for (let i = 0; i < voters.length; i++) {
      const baseIndex = i * 3;
      const verifyVotes = safeToBigInt(detailData[baseIndex]?.result);
      const distrustVotes = safeToBigInt(detailData[baseIndex + 1]?.result);
      const reason = (detailData[baseIndex + 2]?.result as string) || '';

      const distrustRatio = verifyVotes > BigInt(0) ? Number(distrustVotes) / Number(verifyVotes) : 0;

      result.push({
        voter: voters[i],
        verifyVotes,
        distrustVotes,
        distrustRatio,
        reason,
      });
    }

    return result;
  }, [detailData, voters]);

  return {
    voterDistrusts,
    isPending: isVoterCountPending || isVotersPending || isDetailPending,
    error: voterCountError || votersError || detailError,
  };
};

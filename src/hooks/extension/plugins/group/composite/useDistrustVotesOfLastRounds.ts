// hooks/extension/plugins/group/composite/useDistrustVotesOfLastRounds.ts
// 获取最近 n 轮不信任投票

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionGroupActionAbi } from '@/src/abis/LOVE20ExtensionGroupAction';
import { LOVE20GroupDistrustAbi } from '@/src/abis/LOVE20GroupDistrust';
import { LOVE20VoteAbi } from '@/src/abis/LOVE20Vote';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useGroupDistrustAddress } from '../contracts';

const VOTE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_VOTE as `0x${string}`;

export interface DistrustVoteInfo {
  round: bigint;
  groupOwner: `0x${string}`;
  distrustVotes: bigint;
  totalVerifyVotes: bigint;
  distrustRatio: number;
}

export interface UseDistrustVotesOfLastRoundsParams {
  extensionAddress: `0x${string}` | undefined;
  tokenAddress: `0x${string}` | undefined;
  lastNRounds?: number; // 默认5轮
}

export interface UseDistrustVotesOfLastRoundsResult {
  distrustVotes: DistrustVoteInfo[];
  currentRound: bigint;
  isPending: boolean;
  error: any;
}

/**
 * Hook: 获取最近 n 轮不信任投票
 *
 * 算法：
 * 1. 获取当前验证轮
 * 2. 循环每一轮：
 *    - 获取当轮的验证服务者
 *    - 循环每个服务者：
 *      - 获取服务者的不信任率
 */
export const useDistrustVotesOfLastRounds = ({
  extensionAddress,
  tokenAddress,
  lastNRounds = 5,
}: UseDistrustVotesOfLastRoundsParams): UseDistrustVotesOfLastRoundsResult => {
  // 获取 GroupDistrust 合约地址
  const { groupDistrustAddress } = useGroupDistrustAddress(extensionAddress as `0x${string}`);

  // 第一步：获取当前轮次
  const currentRoundContract = useMemo(() => {
    if (!tokenAddress) return [];

    return [
      {
        address: VOTE_CONTRACT_ADDRESS,
        abi: LOVE20VoteAbi,
        functionName: 'currentRound',
      },
    ];
  }, [tokenAddress]);

  const {
    data: currentRoundData,
    isPending: isCurrentRoundPending,
    error: currentRoundError,
  } = useReadContracts({
    contracts: currentRoundContract as any,
    query: {
      enabled: !!tokenAddress && currentRoundContract.length > 0,
    },
  });

  const currentRound = useMemo(() => {
    if (!currentRoundData || !currentRoundData[0]?.result) return BigInt(0);
    return safeToBigInt(currentRoundData[0].result);
  }, [currentRoundData]);

  // 第二步：获取最近 n 轮的验证者列表
  const verifiersContracts = useMemo(() => {
    if (!extensionAddress || currentRound === BigInt(0)) return [];

    const contracts = [];
    const startRound = currentRound > BigInt(lastNRounds) ? currentRound - BigInt(lastNRounds) + BigInt(1) : BigInt(1);

    for (let i = startRound; i <= currentRound; i++) {
      contracts.push({
        address: extensionAddress,
        abi: LOVE20ExtensionGroupActionAbi,
        functionName: 'verifiers',
        args: [i],
      });
    }

    return contracts;
  }, [extensionAddress, currentRound, lastNRounds]);

  const {
    data: verifiersData,
    isPending: isVerifiersPending,
    error: verifiersError,
  } = useReadContracts({
    contracts: verifiersContracts as any,
    query: {
      enabled: !!extensionAddress && verifiersContracts.length > 0,
    },
  });

  // 第三步：获取每个验证者的不信任票数和总验证票数
  const distrustContracts = useMemo(() => {
    if (!groupDistrustAddress || !tokenAddress || !verifiersData || currentRound === BigInt(0)) return [];

    const contracts = [];
    const startRound = currentRound > BigInt(lastNRounds) ? currentRound - BigInt(lastNRounds) + BigInt(1) : BigInt(1);

    for (let i = 0; i < verifiersData.length; i++) {
      const round = startRound + BigInt(i);
      const verifiers = verifiersData[i]?.result as `0x${string}`[] | undefined;

      if (!verifiers || verifiers.length === 0) continue;

      for (const verifier of verifiers) {
        // 获取不信任票数
        contracts.push({
          address: groupDistrustAddress,
          abi: LOVE20GroupDistrustAbi,
          functionName: 'distrustVotesByGroupOwner',
          args: [tokenAddress, extensionAddress, round, verifier],
        });

        // 获取总验证票数
        contracts.push({
          address: groupDistrustAddress,
          abi: LOVE20GroupDistrustAbi,
          functionName: 'totalVerifyVotes',
          args: [tokenAddress, extensionAddress, round],
        });
      }
    }

    return contracts;
  }, [groupDistrustAddress, tokenAddress, extensionAddress, verifiersData, currentRound, lastNRounds]);

  const {
    data: distrustData,
    isPending: isDistrustPending,
    error: distrustError,
  } = useReadContracts({
    contracts: distrustContracts as any,
    query: {
      enabled: !!groupDistrustAddress && distrustContracts.length > 0,
    },
  });

  // 解析数据
  const distrustVotes = useMemo(() => {
    if (!verifiersData || !distrustData || currentRound === BigInt(0)) return [];

    const result: DistrustVoteInfo[] = [];
    const startRound = currentRound > BigInt(lastNRounds) ? currentRound - BigInt(lastNRounds) + BigInt(1) : BigInt(1);

    let distrustIndex = 0;

    for (let i = 0; i < verifiersData.length; i++) {
      const round = startRound + BigInt(i);
      const verifiers = verifiersData[i]?.result as `0x${string}`[] | undefined;

      if (!verifiers || verifiers.length === 0) continue;

      for (const verifier of verifiers) {
        // 每个verifier有2个调用：distrustVotes和totalVerifyVotes
        const distrustVotesNum = safeToBigInt(distrustData[distrustIndex * 2]?.result);
        const totalVerifyVotes = safeToBigInt(distrustData[distrustIndex * 2 + 1]?.result);
        const distrustRatio =
          totalVerifyVotes > BigInt(0) ? Number(distrustVotesNum) / Number(totalVerifyVotes) : 0;

        result.push({
          round,
          groupOwner: verifier,
          distrustVotes: distrustVotesNum,
          totalVerifyVotes,
          distrustRatio,
        });

        distrustIndex++;
      }
    }

    return result;
  }, [verifiersData, distrustData, currentRound, lastNRounds]);

  return {
    distrustVotes,
    currentRound,
    isPending: isCurrentRoundPending || isVerifiersPending || isDistrustPending,
    error: currentRoundError || verifiersError || distrustError,
  };
};

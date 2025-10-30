// hooks/composite/useStakeLpActionPublicData.tsx
// 获取质押LP行动的实时数据（当前参与标签）

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionStakeLpAbi } from '@/src/abis/LOVE20ExtensionStakeLp';
import { LOVE20StakeAbi } from '@/src/abis/LOVE20Stake';
import { UniswapV2ERC20Abi } from '@/src/abis/UniswapV2ERC20';
import { safeToBigInt } from '@/src/lib/clientUtils';

const STAKE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_STAKE as `0x${string}`;

export interface StakeLpParticipant {
  address: `0x${string}`;
  lpAmount: bigint;
  govVotes: bigint;
  score: bigint;
  lpRatio: number;
  govVotesRatio: number;
  rewardRatio: number;
}

export interface UseStakeLpActionPublicDataParams {
  extensionAddress: `0x${string}` | undefined;
  tokenAddress: `0x${string}` | undefined;
}

export interface UseStakeLpActionPublicDataResult {
  participants: StakeLpParticipant[];
  totalScore: bigint;
  totalLp: bigint;
  totalGovVotes: bigint;
  isPending: boolean;
  error: any;
}

/**
 * Hook: 获取质押LP行动的实时公示数据
 *
 * 用于"当前参与"标签，实时显示所有参与者的状态
 */
export const useStakeLpActionPublicData = ({
  extensionAddress,
  tokenAddress,
}: UseStakeLpActionPublicDataParams): UseStakeLpActionPublicDataResult => {
  // ==========================================
  // 步骤 1: 批量获取基础数据
  // ==========================================
  const basicContracts = useMemo(() => {
    if (!extensionAddress || !tokenAddress) return [];

    return [
      // 获取所有质押者地址
      {
        address: extensionAddress,
        abi: LOVE20ExtensionStakeLpAbi,
        functionName: 'stakers',
      },
      // 获取 LP Token 地址（即 pair 地址）
      {
        address: extensionAddress,
        abi: LOVE20ExtensionStakeLpAbi,
        functionName: 'lpTokenAddress',
      },
      // 获取 govRatioMultiplier
      {
        address: extensionAddress,
        abi: LOVE20ExtensionStakeLpAbi,
        functionName: 'govRatioMultiplier',
      },
      // 获取总治理票数
      {
        address: STAKE_CONTRACT_ADDRESS,
        abi: LOVE20StakeAbi,
        functionName: 'govVotesNum',
        args: [tokenAddress],
      },
    ];
  }, [extensionAddress, tokenAddress]);

  const {
    data: basicData,
    isPending: isBasicPending,
    error: basicError,
  } = useReadContracts({
    contracts: basicContracts as any,
    query: {
      enabled: !!extensionAddress && !!tokenAddress && basicContracts.length > 0,
    },
  });

  // 解析基础数据
  const { stakers, pairAddress, govRatioMultiplier, totalGovVotes } = useMemo(() => {
    if (!basicData || basicData.length < 4) {
      return {
        stakers: [] as `0x${string}`[],
        pairAddress: undefined,
        govRatioMultiplier: undefined,
        totalGovVotes: undefined,
      };
    }

    return {
      stakers: (basicData[0]?.result as `0x${string}`[]) || [],
      pairAddress: basicData[1]?.result as `0x${string}` | undefined,
      govRatioMultiplier: safeToBigInt(basicData[2]?.result),
      totalGovVotes: safeToBigInt(basicData[3]?.result),
    };
  }, [basicData]);

  // ==========================================
  // 步骤 2: 批量获取每个参与者的详细数据
  // ==========================================
  const detailContracts = useMemo(() => {
    if (!extensionAddress || !tokenAddress || !stakers || stakers.length === 0 || !pairAddress) return [];

    const contracts = [];

    // 获取 LP 总供应量
    contracts.push({
      address: pairAddress,
      abi: UniswapV2ERC20Abi,
      functionName: 'totalSupply',
    });

    // 为每个参与者获取数据
    for (const staker of stakers) {
      // 获取质押信息（LP数量）
      contracts.push({
        address: extensionAddress,
        abi: LOVE20ExtensionStakeLpAbi,
        functionName: 'stakeInfo',
        args: [staker],
      });

      // 获取治理票数
      contracts.push({
        address: STAKE_CONTRACT_ADDRESS,
        abi: LOVE20StakeAbi,
        functionName: 'validGovVotes',
        args: [tokenAddress, staker],
      });
    }

    return contracts;
  }, [extensionAddress, tokenAddress, stakers, pairAddress]);

  const {
    data: detailData,
    isPending: isDetailPending,
    error: detailError,
  } = useReadContracts({
    contracts: detailContracts as any,
    query: {
      enabled: !!extensionAddress && !!tokenAddress && detailContracts.length > 0,
    },
  });

  // ==========================================
  // 步骤 3: 计算得分和比例
  // ==========================================
  const result = useMemo(() => {
    if (
      !detailData ||
      !stakers ||
      stakers.length === 0 ||
      !govRatioMultiplier ||
      !totalGovVotes ||
      totalGovVotes === BigInt(0)
    ) {
      return {
        participants: [] as StakeLpParticipant[],
        totalScore: BigInt(0),
        totalLp: BigInt(0),
        totalGovVotes: totalGovVotes || BigInt(0),
      };
    }

    // 获取 LP 总供应量
    const totalLp = safeToBigInt(detailData[0]?.result) || BigInt(0);

    if (totalLp === BigInt(0)) {
      return {
        participants: [] as StakeLpParticipant[],
        totalScore: BigInt(0),
        totalLp: BigInt(0),
        totalGovVotes: totalGovVotes || BigInt(0),
      };
    }

    const participants: StakeLpParticipant[] = [];
    let totalScore = BigInt(0);

    // 处理每个参与者
    for (let i = 0; i < stakers.length; i++) {
      const stakerAddress = stakers[i];
      const stakeInfoIndex = 1 + i * 2;
      const govVotesIndex = stakeInfoIndex + 1;

      const stakeInfoResult = detailData[stakeInfoIndex]?.result as [bigint, bigint] | undefined;
      const govVotesResult = detailData[govVotesIndex]?.result;

      const lpAmount = stakeInfoResult ? safeToBigInt(stakeInfoResult[0]) : BigInt(0);
      const govVotes = safeToBigInt(govVotesResult);

      if (!lpAmount || lpAmount === BigInt(0)) continue;

      // 计算比例（按智能合约算法）
      const lpRatioBigInt = (lpAmount * BigInt(1000000)) / totalLp;
      const govVotesRatioBigInt = (govVotes * BigInt(1000000) * govRatioMultiplier) / totalGovVotes;

      // 得分取两者中较小的
      const score = lpRatioBigInt > govVotesRatioBigInt ? govVotesRatioBigInt : lpRatioBigInt;

      totalScore += score;

      participants.push({
        address: stakerAddress,
        lpAmount,
        govVotes,
        score,
        lpRatio: Number(lpRatioBigInt) / 1000000,
        govVotesRatio: Number(govVotes) / Number(totalGovVotes),
        rewardRatio: 0, // 稍后计算
      });
    }

    // 计算激励占比
    participants.forEach((p) => {
      p.rewardRatio = totalScore > BigInt(0) ? Number(p.score) / Number(totalScore) : 0;
    });

    return {
      participants,
      totalScore,
      totalLp,
      totalGovVotes,
    };
  }, [detailData, stakers, govRatioMultiplier, totalGovVotes]);

  // 如果基础数据已加载完成，且没有 stakers，则不需要等待详细数据
  const shouldWaitForDetail = stakers && stakers.length > 0;
  const isPending = isBasicPending || (shouldWaitForDetail && isDetailPending);

  return {
    ...result,
    isPending,
    error: basicError || detailError,
  };
};

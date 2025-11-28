// hooks/extension/plugins/lp/composite/useLpActionPublicData.tsx
// 获取LP行动的实时公开数据（所有参与者）

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionLpAbi } from '@/src/abis/LOVE20ExtensionLp';
import { LOVE20StakeAbi } from '@/src/abis/LOVE20Stake';
import { UniswapV2ERC20Abi } from '@/src/abis/UniswapV2ERC20';
import { safeToBigInt } from '@/src/lib/clientUtils';

const STAKE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_STAKE as `0x${string}`;

export interface LpParticipant {
  address: `0x${string}`;
  lpAmount: bigint;
  govVotes: bigint;
  score: bigint;
  lpRatio: number;
  govVotesRatio: number;
  rewardRatio: number;
}

export interface UseLpActionPublicDataParams {
  extensionAddress: `0x${string}` | undefined;
  tokenAddress: `0x${string}` | undefined;
}

export interface UseLpActionPublicDataResult {
  participants: LpParticipant[];
  totalScore: bigint;
  totalLp: bigint;
  totalGovVotes: bigint;
  isPending: boolean;
  error: any;
}

/**
 * Hook: 获取 LP 行动的公开数据
 *
 * 功能：
 * 1. 获取所有参与者的质押信息
 * 2. 计算每个参与者的得分和激励占比
 * 3. 用于"当前参与"标签，实时显示所有参与者的状态
 *
 * @param extensionAddress LP 扩展合约地址
 * @param tokenAddress 代币地址
 * @returns 所有参与者数据、加载状态和错误信息
 */
export const useLpActionPublicData = ({
  extensionAddress,
  tokenAddress,
}: UseLpActionPublicDataParams): UseLpActionPublicDataResult => {
  // ==========================================
  // 步骤 1: 批量获取基础数据
  // ==========================================
  const basicContracts = useMemo(() => {
    if (!extensionAddress || !tokenAddress) return [];

    return [
      // 获取所有参与者地址
      {
        address: extensionAddress,
        abi: LOVE20ExtensionLpAbi,
        functionName: 'accounts',
      },
      // 获取 Join Token 地址（即 LP pair 地址）
      {
        address: extensionAddress,
        abi: LOVE20ExtensionLpAbi,
        functionName: 'joinTokenAddress',
      },
      // 获取 govRatioMultiplier
      {
        address: extensionAddress,
        abi: LOVE20ExtensionLpAbi,
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
  const { accounts, joinTokenAddress, govRatioMultiplier, totalGovVotes } = useMemo(() => {
    if (!basicData || basicData.length < 4) {
      return {
        accounts: [] as `0x${string}`[],
        joinTokenAddress: undefined,
        govRatioMultiplier: undefined,
        totalGovVotes: undefined,
      };
    }

    return {
      accounts: (basicData[0]?.result as `0x${string}`[]) || [],
      joinTokenAddress: basicData[1]?.result as `0x${string}` | undefined,
      govRatioMultiplier: safeToBigInt(basicData[2]?.result),
      totalGovVotes: safeToBigInt(basicData[3]?.result),
    };
  }, [basicData]);

  // ==========================================
  // 步骤 2: 批量获取每个参与者的详细数据
  // ==========================================
  const detailContracts = useMemo(() => {
    if (!extensionAddress || !tokenAddress || !accounts || accounts.length === 0 || !joinTokenAddress) return [];

    const contracts = [];

    // 获取 LP Token 总供应量
    contracts.push({
      address: joinTokenAddress,
      abi: UniswapV2ERC20Abi,
      functionName: 'totalSupply',
    });

    // 为每个参与者获取数据
    for (const account of accounts) {
      // 获取加入信息（LP数量）
      contracts.push({
        address: extensionAddress,
        abi: LOVE20ExtensionLpAbi,
        functionName: 'joinInfo',
        args: [account],
      });

      // 获取治理票数
      contracts.push({
        address: STAKE_CONTRACT_ADDRESS,
        abi: LOVE20StakeAbi,
        functionName: 'validGovVotes',
        args: [tokenAddress, account],
      });
    }

    return contracts;
  }, [extensionAddress, tokenAddress, accounts, joinTokenAddress]);

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
      !accounts ||
      accounts.length === 0 ||
      !govRatioMultiplier ||
      !totalGovVotes ||
      totalGovVotes === BigInt(0)
    ) {
      return {
        participants: [] as LpParticipant[],
        totalScore: BigInt(0),
        totalLp: BigInt(0),
        totalGovVotes: totalGovVotes || BigInt(0),
      };
    }

    // 获取 LP Token 总供应量
    const totalLp = safeToBigInt(detailData[0]?.result) || BigInt(0);

    if (totalLp === BigInt(0)) {
      return {
        participants: [] as LpParticipant[],
        totalScore: BigInt(0),
        totalLp: BigInt(0),
        totalGovVotes: totalGovVotes || BigInt(0),
      };
    }

    const participants: LpParticipant[] = [];
    let totalScore = BigInt(0);

    // 处理每个参与者
    for (let i = 0; i < accounts.length; i++) {
      const accountAddress = accounts[i];
      const joinInfoIndex = 1 + i * 2;
      const govVotesIndex = joinInfoIndex + 1;

      const joinInfoResult = detailData[joinInfoIndex]?.result as [bigint, bigint, bigint] | undefined;
      const govVotesResult = detailData[govVotesIndex]?.result;

      const lpAmount = joinInfoResult ? safeToBigInt(joinInfoResult[0]) : BigInt(0);
      const govVotes = safeToBigInt(govVotesResult);

      if (!lpAmount || lpAmount === BigInt(0)) continue;

      // 计算比例（按智能合约算法）
      const lpRatioBigInt = (lpAmount * BigInt(1000000)) / totalLp;
      const govVotesRatioBigInt = (govVotes * BigInt(1000000) * govRatioMultiplier) / totalGovVotes;

      // 得分取两者中较小的
      const score = lpRatioBigInt > govVotesRatioBigInt ? govVotesRatioBigInt : lpRatioBigInt;

      totalScore += score;

      participants.push({
        address: accountAddress,
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
  }, [detailData, accounts, govRatioMultiplier, totalGovVotes]);

  // 如果基础数据已加载完成，且没有参与者，则不需要等待详细数据
  const shouldWaitForDetail = accounts && accounts.length > 0;
  const isPending = isBasicPending || (shouldWaitForDetail && isDetailPending);

  return {
    ...result,
    isPending,
    error: basicError || detailError,
  };
};

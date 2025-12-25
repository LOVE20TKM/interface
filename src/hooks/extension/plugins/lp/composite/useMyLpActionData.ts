import { useMemo } from 'react';
import { useReadContracts, useBlockNumber } from 'wagmi';
import { LOVE20ExtensionLpAbi } from '@/src/abis/LOVE20ExtensionLp';
import { LOVE20StakeAbi } from '@/src/abis/LOVE20Stake';

const STAKE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_STAKE as `0x${string}`;

// 固定精度值
const LP_RATIO_PRECISION = BigInt(100000);

export interface UseMyLpActionDataParams {
  extensionAddress: `0x${string}` | undefined;
  tokenAddress: `0x${string}` | undefined;
  account: `0x${string}` | undefined;
}

export interface UseMyLpActionDataResult {
  // LP加入信息
  joinedAmount: bigint;
  totalJoinedAmount: bigint;
  lpTotalSupply: bigint; // LP Token 总供应量

  // Exit 状态信息
  joinedBlock: bigint; // 加入时的区块
  exitableBlock: bigint; // 可以退出的区块
  currentBlock: bigint; // 当前区块
  waitingBlocks: bigint; // 需要等待的区块数
  canExitNow: boolean; // 是否可以立即退出
  remainingBlocks: bigint; // 还需要等待的区块数

  // 激励占比（0-1 的比例值）
  rewardRatio: number;

  // 治理票信息（用于显示）
  userGovVotes: bigint;
  totalGovVotes: bigint;
  minGovVotes: bigint; // 最小治理票数门槛

  // LP占比（用于显示）
  lpRatio: number; // LP占比百分比

  // 其他信息
  joinTokenAddress: `0x${string}` | undefined;
  govRatioMultiplier: bigint;
  joinedValue: bigint;

  // 加载状态
  isPending: boolean;

  // 错误信息
  error: any;
}

/**
 * LP 行动扩展 - 我的数据聚合 Hook
 *
 * 功能：
 * 1. 批量获取当前用户在 LP 扩展行动中的所有数据
 * 2. 包括用户加入数量、总加入数量、治理票数量、激励占比等信息
 * 3. 使用批量 RPC 调用优化性能
 *
 * @param extensionAddress LP 扩展合约地址
 * @param tokenAddress 代币地址
 * @param account 用户账户地址
 * @returns 用户的 LP 扩展数据、加载状态和错误信息
 */
export const useMyLpActionData = ({
  extensionAddress,
  tokenAddress,
  account,
}: UseMyLpActionDataParams): UseMyLpActionDataResult => {
  // 获取当前区块号
  const { data: currentBlockData, isPending: isPendingBlock } = useBlockNumber({
    watch: true,
  });

  // 构建批量合约调用
  const contracts = useMemo(() => {
    if (!extensionAddress || !tokenAddress || !account) return [];

    return [
      // 0. 获取用户加入信息（包含数量、加入区块、可退出区块）
      {
        address: extensionAddress,
        abi: LOVE20ExtensionLpAbi,
        functionName: 'joinInfo',
        args: [account],
      },
      // 1. 获取总加入数量
      {
        address: extensionAddress,
        abi: LOVE20ExtensionLpAbi,
        functionName: 'totalJoinedAmount',
        args: [],
      },
      // 2. 获取治理比率乘数
      {
        address: extensionAddress,
        abi: LOVE20ExtensionLpAbi,
        functionName: 'govRatioMultiplier',
        args: [],
      },
      // 3. 获取加入值（用于计算激励占比）
      {
        address: extensionAddress,
        abi: LOVE20ExtensionLpAbi,
        functionName: 'joinedValue',
        args: [],
      },
      // 4. 获取 Join Token 地址（即 LP Pair 地址）
      {
        address: extensionAddress,
        abi: LOVE20ExtensionLpAbi,
        functionName: 'joinTokenAddress',
        args: [],
      },
      // 5. 获取用户的有效治理票数
      {
        address: STAKE_CONTRACT_ADDRESS,
        abi: LOVE20StakeAbi,
        functionName: 'validGovVotes',
        args: [tokenAddress, account],
      },
      // 6. 获取总治理票数
      {
        address: STAKE_CONTRACT_ADDRESS,
        abi: LOVE20StakeAbi,
        functionName: 'govVotesNum',
        args: [tokenAddress],
      },
      // 7. 获取需要等待的区块数
      {
        address: extensionAddress,
        abi: LOVE20ExtensionLpAbi,
        functionName: 'waitingBlocks',
        args: [],
      },
      // 8. 获取最小治理票数门槛
      {
        address: extensionAddress,
        abi: LOVE20ExtensionLpAbi,
        functionName: 'minGovVotes',
        args: [],
      },
    ];
  }, [extensionAddress, tokenAddress, account]);

  // 批量读取数据（第一批）
  const { data, isPending, error } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: !!extensionAddress && !!tokenAddress && !!account && contracts.length > 0,
    },
  });

  // 从第一批数据中获取 joinTokenAddress（即 LP pair 地址）
  const joinTokenAddress = useMemo(() => {
    if (!data || !data[4]?.result) return undefined;
    return data[4].result as `0x${string}`;
  }, [data]);

  // 解析数据
  const joinedAmount = useMemo(() => {
    if (!data || !data[0]?.result) return BigInt(0);
    const joinInfo = data[0].result as [bigint, bigint, bigint, bigint];
    return joinInfo[1];
  }, [data]);

  const joinedBlock = useMemo(() => {
    if (!data || !data[0]?.result) return BigInt(0);
    const joinInfo = data[0].result as [bigint, bigint, bigint, bigint];
    return joinInfo[2];
  }, [data]);

  const waitingBlocks = useMemo(() => {
    if (!data || !data[7]?.result) return BigInt(0);
    return BigInt(data[7].result.toString());
  }, [data]);

  const exitableBlock = useMemo(() => {
    // 直接从 joinInfo 中获取 exitableBlock（合约已经计算好了）
    if (!data || !data[0]?.result) return BigInt(0);
    const joinInfo = data[0].result as [bigint, bigint, bigint, bigint];
    return joinInfo[3];
  }, [data]);

  const totalJoinedAmount = useMemo(() => {
    if (!data || !data[1]?.result) return BigInt(0);
    return BigInt(data[1].result.toString());
  }, [data]);

  const govRatioMultiplier = useMemo(() => {
    if (!data || !data[2]?.result) return BigInt(0);
    return BigInt(data[2].result.toString());
  }, [data]);

  const joinedValue = useMemo(() => {
    if (!data || !data[3]?.result) return BigInt(0);
    return BigInt(data[3].result.toString());
  }, [data]);

  const userGovVotes = useMemo(() => {
    if (!data || !data[5]?.result) return BigInt(0);
    return BigInt(data[5].result.toString());
  }, [data]);

  const totalGovVotes = useMemo(() => {
    if (!data || !data[6]?.result) return BigInt(0);
    return BigInt(data[6].result.toString());
  }, [data]);

  const minGovVotes = useMemo(() => {
    if (!data || !data[8]?.result) return BigInt(0);
    return BigInt(data[8].result.toString());
  }, [data]);

  // 计算激励占比（0-1 的比例值）
  const rewardRatio = useMemo(() => {
    // Edge case: user hasn't joined
    if (!joinedAmount || joinedAmount === BigInt(0)) {
      return 0;
    }

    // Edge case: no total joined amount
    if (!totalJoinedAmount || totalJoinedAmount === BigInt(0)) {
      return 0;
    }

    // Calculate LP ratio (tokenRatio)
    const lpRatioBigInt = (joinedAmount * LP_RATIO_PRECISION) / totalJoinedAmount;

    // If govRatioMultiplier is 0, score is just the LP ratio
    if (!govRatioMultiplier || govRatioMultiplier === BigInt(0)) {
      return Number(lpRatioBigInt) / Number(LP_RATIO_PRECISION);
    }

    // Edge case: no total gov votes when multiplier exists
    if (!totalGovVotes || totalGovVotes === BigInt(0)) {
      return 0;
    }

    // Calculate governance votes ratio
    const govVotesRatioBigInt = (userGovVotes * LP_RATIO_PRECISION * govRatioMultiplier) / totalGovVotes;

    // Score is the minimum of LP ratio and gov votes ratio
    const userScore = lpRatioBigInt > govVotesRatioBigInt ? govVotesRatioBigInt : lpRatioBigInt;

    // Convert to ratio (0-1)
    return Number(userScore) / Number(LP_RATIO_PRECISION);
  }, [joinedAmount, totalJoinedAmount, userGovVotes, totalGovVotes, govRatioMultiplier]);

  // 计算 LP 占比（用于显示）
  const lpRatio = useMemo(() => {
    if (!joinedAmount || joinedAmount === BigInt(0) || !totalJoinedAmount || totalJoinedAmount === BigInt(0)) {
      return 0;
    }
    return (Number(joinedAmount) / Number(totalJoinedAmount)) * 100;
  }, [joinedAmount, totalJoinedAmount]);

  // 获取当前区块
  const currentBlock = currentBlockData || BigInt(0);

  // 计算是否可以退出和剩余区块数
  const canExitNow = useMemo(() => {
    // 如果没有加入，则不能退出
    if (!joinedAmount || joinedAmount === BigInt(0)) {
      return false;
    }
    // 判断当前区块高度是否大于等于 exitableBlock
    return currentBlock >= exitableBlock;
  }, [joinedAmount, currentBlock, exitableBlock]);
  const remainingBlocks = useMemo(() => {
    // 如果没有加入，返回0
    if (!joinedAmount || joinedAmount === BigInt(0)) {
      return BigInt(0);
    }

    // 计算还需要等待的区块数
    if (currentBlock >= exitableBlock) {
      return BigInt(0);
    }
    return exitableBlock - currentBlock;
  }, [joinedAmount, currentBlock, exitableBlock]);

  const finalIsPending = isPending || isPendingBlock;

  return {
    joinedAmount,
    totalJoinedAmount,
    lpTotalSupply: BigInt(0), // 已废弃，不再使用
    joinedBlock,
    exitableBlock,
    currentBlock,
    waitingBlocks,
    canExitNow,
    remainingBlocks,
    rewardRatio,
    userGovVotes,
    totalGovVotes,
    minGovVotes,
    lpRatio,
    joinTokenAddress,
    govRatioMultiplier,
    joinedValue,
    isPending: finalIsPending,
    error: error,
  };
};

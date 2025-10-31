import { useMemo } from 'react';
import { useReadContracts, useAccount } from 'wagmi';
import { LOVE20ExtensionStakeLpAbi } from '@/src/abis/LOVE20ExtensionStakeLp';
import { LOVE20StakeAbi } from '@/src/abis/LOVE20Stake';
import { LOVE20JoinAbi } from '@/src/abis/LOVE20Join';
import { UniswapV2PairAbi } from '@/src/abis/UniswapV2Pair';

const STAKE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_STAKE as `0x${string}`;
const JOIN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_JOIN as `0x${string}`;

export interface UseStakeLpActionDataParams {
  extensionAddress: `0x${string}` | undefined;
  tokenAddress: `0x${string}` | undefined;
  account: `0x${string}` | undefined;
}

export interface UseStakeLpActionDataResult {
  // LP质押信息
  stakedAmount: bigint;
  totalStakedAmount: bigint;
  lpTotalSupply: bigint; // LP Token 总供应量

  // Unstake 状态信息
  requestedUnstakeRound: bigint; // 请求解除质押的轮次（0表示未请求）
  currentRound: bigint; // 当前轮次
  waitingPhases: bigint; // 需要等待的阶段数
  canWithdrawAtRound: bigint; // 可以取回LP的轮次
  canWithdrawNow: boolean; // 是否可以立即取回
  remainingRounds: bigint; // 还需要等待的轮次数

  // 激励占比相关 - 通过 calculateScore 计算
  userScore: bigint; // 用户得分
  totalScore: bigint; // 总得分

  // 治理票信息（用于显示）
  userGovVotes: bigint;
  totalGovVotes: bigint;
  minGovVotes: bigint; // 最小治理票数门槛

  // LP占比（用于显示）
  lpRatio: number; // LP占比百分比

  // 其他信息
  lpTokenAddress: `0x${string}` | undefined;
  pairAddress: `0x${string}` | undefined;
  govRatioMultiplier: bigint;
  joinedValue: bigint;

  // 加载状态
  isPending: boolean;

  // 错误信息
  error: any;
}

/**
 * StakeLp 行动扩展的数据聚合Hook
 *
 * 功能：
 * 1. 批量获取 StakeLp 扩展的所有数据
 * 2. 包括用户质押数量、总质押数量、治理票数量、激励占比等信息
 * 3. 使用批量 RPC 调用优化性能
 *
 * @param extensionAddress StakeLp 扩展合约地址
 * @param tokenAddress 代币地址
 * @param account 用户账户地址
 * @returns StakeLp 扩展的所有数据、加载状态和错误信息
 */
export const useStakeLpActionData = ({
  extensionAddress,
  tokenAddress,
  account,
}: UseStakeLpActionDataParams): UseStakeLpActionDataResult => {
  // 构建批量合约调用
  const contracts = useMemo(() => {
    if (!extensionAddress || !tokenAddress || !account) return [];

    return [
      // 0. 获取用户质押信息（包含质押数量和请求取消质押的轮次）
      {
        address: extensionAddress,
        abi: LOVE20ExtensionStakeLpAbi,
        functionName: 'stakeInfo',
        args: [account],
      },
      // 1. 获取总质押数量
      {
        address: extensionAddress,
        abi: LOVE20ExtensionStakeLpAbi,
        functionName: 'totalStakedAmount',
        args: [],
      },
      // 2. 获取治理比率乘数
      {
        address: extensionAddress,
        abi: LOVE20ExtensionStakeLpAbi,
        functionName: 'govRatioMultiplier',
        args: [],
      },
      // 3. 获取加入值（用于计算激励占比）
      {
        address: extensionAddress,
        abi: LOVE20ExtensionStakeLpAbi,
        functionName: 'joinedValue',
        args: [],
      },
      // 4. 获取 LP Token 地址（即 Pair 地址）
      {
        address: extensionAddress,
        abi: LOVE20ExtensionStakeLpAbi,
        functionName: 'lpTokenAddress',
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
      // 7. 获取用户得分和总得分（用于计算实际激励占比）
      {
        address: extensionAddress,
        abi: LOVE20ExtensionStakeLpAbi,
        functionName: 'calculateScore',
        args: [account],
      },
      // 8. 获取需要等待的阶段数
      {
        address: extensionAddress,
        abi: LOVE20ExtensionStakeLpAbi,
        functionName: 'waitingPhases',
        args: [],
      },
      // 9. 获取当前轮次
      {
        address: JOIN_CONTRACT_ADDRESS,
        abi: LOVE20JoinAbi,
        functionName: 'currentRound',
        args: [],
      },
      // 10. 获取最小治理票数门槛
      {
        address: extensionAddress,
        abi: LOVE20ExtensionStakeLpAbi,
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

  // 从第一批数据中获取 lpTokenAddress（即 pair 地址）
  const lpTokenAddress = useMemo(() => {
    if (!data || !data[4]?.result) return undefined;
    return data[4].result as `0x${string}`;
  }, [data]);

  // 构建第二批调用：获取 LP Token 的 totalSupply
  const pairContracts = useMemo(() => {
    if (!lpTokenAddress) return [];
    return [
      {
        address: lpTokenAddress,
        abi: UniswapV2PairAbi,
        functionName: 'totalSupply',
        args: [],
      },
    ];
  }, [lpTokenAddress]);

  // 批量读取数据（第二批）
  const {
    data: pairData,
    isPending: isPendingPair,
    error: errorPair,
  } = useReadContracts({
    contracts: pairContracts as any,
    query: {
      enabled: !!lpTokenAddress && pairContracts.length > 0,
    },
  });

  // 解析数据
  const stakedAmount = useMemo(() => {
    if (!data || !data[0]?.result) return BigInt(0);
    const stakeInfo = data[0].result as [bigint, bigint];
    return stakeInfo[0];
  }, [data]);

  const requestedUnstakeRound = useMemo(() => {
    if (!data || !data[0]?.result) return BigInt(0);
    const stakeInfo = data[0].result as [bigint, bigint];
    return stakeInfo[1];
  }, [data]);

  const totalStakedAmount = useMemo(() => {
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

  const waitingPhases = useMemo(() => {
    if (!data || !data[8]?.result) return BigInt(0);
    return BigInt(data[8].result.toString());
  }, [data]);

  const currentRound = useMemo(() => {
    if (!data || !data[9]?.result) return BigInt(0);
    return BigInt(data[9].result.toString());
  }, [data]);

  const minGovVotes = useMemo(() => {
    if (!data || !data[10]?.result) return BigInt(0);
    return BigInt(data[10].result.toString());
  }, [data]);

  const lpTotalSupply = useMemo(() => {
    if (!pairData || !pairData[0]?.result) return BigInt(0);
    return BigInt(pairData[0].result.toString());
  }, [pairData]);

  // 获取用户得分和总得分（calculateScore 返回 [total, score]）
  const userScore = useMemo(() => {
    if (!data || !data[7]?.result) {
      console.log('🔍 userScore - data[7] 不存在或无结果:', {
        hasData: !!data,
        dataLength: data?.length,
        hasResult: !!data?.[7]?.result,
        data7: data?.[7],
      });
      return BigInt(0);
    }
    const scoreResult = data[7].result as [bigint, bigint];
    console.log('🔍 calculateScore 返回值:', {
      total: scoreResult[0]?.toString(),
      score: scoreResult[1]?.toString(),
      rawResult: data[7].result,
    });

    // 同时打印相关的其他数据
    console.log('🔍 相关数据:', {
      stakedAmount: (data[0]?.result as any)?.[0]?.toString(),
      totalStakedAmount: data[1]?.result?.toString(),
      userGovVotes: data[5]?.result?.toString(),
      totalGovVotes: data[6]?.result?.toString(),
      minGovVotes: data[10]?.result?.toString(),
    });

    return scoreResult[1]; // score 是第二个值
  }, [data]);

  const totalScore = useMemo(() => {
    if (!data || !data[7]?.result) return BigInt(0);
    const scoreResult = data[7].result as [bigint, bigint];
    return scoreResult[0]; // total 是第一个值
  }, [data]);

  // 计算 LP 占比（用于显示）
  const lpRatio = useMemo(() => {
    if (!stakedAmount || stakedAmount === BigInt(0) || !lpTotalSupply || lpTotalSupply === BigInt(0)) {
      return 0;
    }
    return (Number(stakedAmount) / Number(lpTotalSupply)) * 100;
  }, [stakedAmount, lpTotalSupply]);

  // 计算可以取回LP的轮次和状态
  const canWithdrawAtRound = useMemo(() => {
    if (!requestedUnstakeRound || requestedUnstakeRound === BigInt(0)) {
      return BigInt(0);
    }
    return requestedUnstakeRound + waitingPhases + BigInt(1);
  }, [requestedUnstakeRound, waitingPhases]);

  const canWithdrawNow = useMemo(() => {
    if (!requestedUnstakeRound || requestedUnstakeRound === BigInt(0)) {
      return false;
    }
    return currentRound >= canWithdrawAtRound;
  }, [requestedUnstakeRound, currentRound, canWithdrawAtRound]);

  const remainingRounds = useMemo(() => {
    if (!requestedUnstakeRound || requestedUnstakeRound === BigInt(0)) {
      return BigInt(0);
    }
    if (canWithdrawNow) {
      return BigInt(0);
    }
    return canWithdrawAtRound - currentRound;
  }, [requestedUnstakeRound, canWithdrawNow, canWithdrawAtRound, currentRound]);

  // 只有当 lpTokenAddress 存在时，才需要等待第二批数据加载
  const shouldWaitForPairData = !!lpTokenAddress;
  const finalIsPending = isPending || (shouldWaitForPairData && isPendingPair);

  return {
    stakedAmount,
    totalStakedAmount,
    lpTotalSupply,
    requestedUnstakeRound,
    currentRound,
    waitingPhases,
    canWithdrawAtRound,
    canWithdrawNow,
    remainingRounds,
    userScore,
    totalScore,
    userGovVotes,
    totalGovVotes,
    minGovVotes,
    lpRatio,
    lpTokenAddress,
    pairAddress: lpTokenAddress, // pairAddress 就是 lpTokenAddress
    govRatioMultiplier,
    joinedValue,
    isPending: finalIsPending,
    error: error || errorPair,
  };
};

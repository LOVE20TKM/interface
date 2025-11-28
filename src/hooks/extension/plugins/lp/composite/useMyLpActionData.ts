import { useMemo } from 'react';
import { useReadContracts, useBlockNumber } from 'wagmi';
import { LOVE20ExtensionLpAbi } from '@/src/abis/LOVE20ExtensionLp';
import { LOVE20StakeAbi } from '@/src/abis/LOVE20Stake';
import { UniswapV2PairAbi } from '@/src/abis/UniswapV2Pair';

const STAKE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_STAKE as `0x${string}`;

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
      // 7. 获取用户得分和总得分（用于计算实际激励占比）
      {
        address: extensionAddress,
        abi: LOVE20ExtensionLpAbi,
        functionName: 'calculateScore',
        args: [account],
      },
      // 8. 获取需要等待的区块数
      {
        address: extensionAddress,
        abi: LOVE20ExtensionLpAbi,
        functionName: 'waitingBlocks',
        args: [],
      },
      // 9. 获取最小治理票数门槛
      {
        address: extensionAddress,
        abi: LOVE20ExtensionLpAbi,
        functionName: 'minGovVotes',
        args: [],
      },
      // 10. 获取是否可以退出
      {
        address: extensionAddress,
        abi: LOVE20ExtensionLpAbi,
        functionName: 'canExit',
        args: [account],
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

  // 构建第二批调用：获取 LP Token 的 totalSupply
  const pairContracts = useMemo(() => {
    if (!joinTokenAddress) return [];
    return [
      {
        address: joinTokenAddress,
        abi: UniswapV2PairAbi,
        functionName: 'totalSupply',
        args: [],
      },
    ];
  }, [joinTokenAddress]);

  // 批量读取数据（第二批）
  const {
    data: pairData,
    isPending: isPendingPair,
    error: errorPair,
  } = useReadContracts({
    contracts: pairContracts as any,
    query: {
      enabled: !!joinTokenAddress && pairContracts.length > 0,
    },
  });

  // 解析数据
  const joinedAmount = useMemo(() => {
    if (!data || !data[0]?.result) return BigInt(0);
    const joinInfo = data[0].result as [bigint, bigint, bigint];
    return joinInfo[0];
  }, [data]);

  const joinedBlock = useMemo(() => {
    if (!data || !data[0]?.result) return BigInt(0);
    const joinInfo = data[0].result as [bigint, bigint, bigint];
    return joinInfo[1];
  }, [data]);

  const exitableBlock = useMemo(() => {
    if (!data || !data[0]?.result) return BigInt(0);
    const joinInfo = data[0].result as [bigint, bigint, bigint];
    return joinInfo[2];
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

  const waitingBlocks = useMemo(() => {
    if (!data || !data[8]?.result) return BigInt(0);
    return BigInt(data[8].result.toString());
  }, [data]);

  const minGovVotes = useMemo(() => {
    if (!data || !data[9]?.result) return BigInt(0);
    return BigInt(data[9].result.toString());
  }, [data]);

  const canExitFromContract = useMemo(() => {
    if (!data || !data[10]?.result) return false;
    return data[10].result as boolean;
  }, [data]);

  const lpTotalSupply = useMemo(() => {
    if (!pairData || !pairData[0]?.result) return BigInt(0);
    return BigInt(pairData[0].result.toString());
  }, [pairData]);

  // 获取用户得分和总得分（calculateScore 返回 [total, score]）
  const userScore = useMemo(() => {
    if (!data || !data[7]?.result) {
      return BigInt(0);
    }
    const scoreResult = data[7].result as [bigint, bigint];

    // console.log('🔍 calculateScore 返回值:', {
    //   total: scoreResult[0]?.toString(),
    //   score: scoreResult[1]?.toString(),
    //   rawResult: data[7].result,
    // });

    // // 同时打印相关的其他数据
    // console.log('🔍 相关数据:', {
    //   joinedAmount: (data[0]?.result as any)?.[0]?.toString(),
    //   totalJoinedAmount: data[1]?.result?.toString(),
    //   userGovVotes: data[5]?.result?.toString(),
    //   totalGovVotes: data[6]?.result?.toString(),
    //   minGovVotes: data[9]?.result?.toString(),
    // });

    return scoreResult[1]; // score 是第二个值
  }, [data]);

  const totalScore = useMemo(() => {
    if (!data || !data[7]?.result) return BigInt(0);
    const scoreResult = data[7].result as [bigint, bigint];
    return scoreResult[0]; // total 是第一个值
  }, [data]);

  // 计算 LP 占比（用于显示）
  const lpRatio = useMemo(() => {
    if (!joinedAmount || joinedAmount === BigInt(0) || !lpTotalSupply || lpTotalSupply === BigInt(0)) {
      return 0;
    }
    return (Number(joinedAmount) / Number(lpTotalSupply)) * 100;
  }, [joinedAmount, lpTotalSupply]);

  // 获取当前区块
  const currentBlock = currentBlockData || BigInt(0);

  // 计算是否可以退出和剩余区块数
  const canExitNow = useMemo(() => {
    // 如果没有加入，则不能退出
    if (!joinedAmount || joinedAmount === BigInt(0)) {
      return false;
    }
    // 优先使用合约返回的 canExit 结果
    return canExitFromContract;
  }, [joinedAmount, canExitFromContract]);

  const remainingBlocks = useMemo(() => {
    // 如果没有加入，返回0
    if (!joinedAmount || joinedAmount === BigInt(0)) {
      return BigInt(0);
    }
    // 如果已经可以退出，返回0
    if (canExitNow) {
      return BigInt(0);
    }
    // 计算还需要等待的区块数
    if (currentBlock >= exitableBlock) {
      return BigInt(0);
    }
    return exitableBlock - currentBlock;
  }, [joinedAmount, canExitNow, currentBlock, exitableBlock]);

  // 只有当 joinTokenAddress 存在时，才需要等待第二批数据加载
  const shouldWaitForPairData = !!joinTokenAddress;
  const finalIsPending = isPending || isPendingBlock || (shouldWaitForPairData && isPendingPair);

  return {
    joinedAmount,
    totalJoinedAmount,
    lpTotalSupply,
    joinedBlock,
    exitableBlock,
    currentBlock,
    waitingBlocks,
    canExitNow,
    remainingBlocks,
    userScore,
    totalScore,
    userGovVotes,
    totalGovVotes,
    minGovVotes,
    lpRatio,
    joinTokenAddress,
    govRatioMultiplier,
    joinedValue,
    isPending: finalIsPending,
    error: error || errorPair,
  };
};

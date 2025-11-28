import { useReadContract } from 'wagmi';
import { useEffect } from 'react';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';
import { LOVE20StakeAbi } from '@/src/abis/LOVE20Stake';
import { safeToBigInt } from '@/src/lib/clientUtils';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_STAKE as `0x${string}`;

// =======================
// ===== 读取 Hooks ======
// =======================

/**
 * 获取账户的质押状态
 * @param token 代币地址
 * @param account 账户地址
 */
export const useAccountStakeStatus = (token: `0x${string}`, account: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20StakeAbi,
    functionName: 'accountStakeStatus',
    args: [token, account],
    query: {
      enabled: !!token && !!account,
    },
  });

  return {
    slAmount: data?.slAmount ? safeToBigInt(data.slAmount) : undefined,
    stAmount: data?.stAmount ? safeToBigInt(data.stAmount) : undefined,
    promisedWaitingPhases: data?.promisedWaitingPhases ? safeToBigInt(data.promisedWaitingPhases) : BigInt(0),
    requestedUnstakeRound: data?.requestedUnstakeRound ? safeToBigInt(data.requestedUnstakeRound) : undefined,
    govVotes: data?.govVotes ? safeToBigInt(data.govVotes) : undefined,
    isPending,
    error,
  };
};

/**
 * 计算治理投票数
 * @param lpAmount LP代币数量
 * @param promisedWaitingPhases 预期等待轮数
 */
export const useCaculateGovVotes = (lpAmount: bigint, promisedWaitingPhases: bigint) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20StakeAbi,
    functionName: 'caculateGovVotes',
    args: [lpAmount, promisedWaitingPhases],
  });

  return { govVotes: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * 获取当前轮次
 */
export const useCurrentRound = (enabled: boolean = true) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20StakeAbi,
    functionName: 'currentRound',
    args: [],
    query: {
      enabled,
    },
  });

  return { currentRound: safeToBigInt(data), isPending, error };
};

/**
 * 获取代币的初始质押轮次
 * @param token 代币地址
 */
export const useInitialStakeRound = (tokenAddress: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20StakeAbi,
    functionName: 'initialStakeRound',
    args: [tokenAddress],
    query: {
      enabled: !!tokenAddress,
    },
  });

  return { initialStakeRound: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * 获取token的总治理票数
 * @param token 代币地址
 */
export const useGovVotesNum = (token: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20StakeAbi,
    functionName: 'govVotesNum',
    args: [token],
    query: {
      enabled: !!token,
    },
  });

  return { govVotesNum: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * 获取 originBlocks 的值
 */
export const useOriginBlocks = () => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20StakeAbi,
    functionName: 'originBlocks',
    args: [],
  });

  return { originBlocks: data ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * 获取有效的治理投票数
 * @param tokenAddress 代币地址
 * @param account 账户地址
 * @param enabled 是否启用查询（可选，默认为 true）
 */
export const useValidGovVotes = (tokenAddress: `0x${string}`, account: `0x${string}`, enabled: boolean = true) => {
  const { data, isPending, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20StakeAbi,
    functionName: 'validGovVotes',
    args: [tokenAddress, account],
    query: {
      enabled: enabled && !!tokenAddress && !!account,
    },
  });

  return { validGovVotes: safeToBigInt(data), isPending, error };
};

// =======================
// ===== Write Hooks =====
// =======================

/**
 * 质押流动性
 */
export const useStakeLiquidity = () => {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20StakeAbi,
    CONTRACT_ADDRESS,
    'stakeLiquidity',
  );

  const stakeLiquidity = async (
    tokenAddress: `0x${string}`,
    tokenAmountForLP: bigint,
    parentTokenAmountForLP: bigint,
    promisedWaitingPhases: bigint,
    to: `0x${string}`,
  ) => {
    console.log('提交stakeLiquidity交易:', {
      tokenAddress,
      tokenAmountForLP,
      parentTokenAmountForLP,
      promisedWaitingPhases,
      to,
      isTukeMode,
    });
    return await execute([tokenAddress, tokenAmountForLP, parentTokenAmountForLP, promisedWaitingPhases, to]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('stakeLiquidity tx hash:', hash);
    }
    if (error) {
      console.log('提交stakeLiquidity交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    stakeLiquidity,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
};

export const useStakeToken = () => {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20StakeAbi,
    CONTRACT_ADDRESS,
    'stakeToken',
  );

  const stakeToken = async (
    tokenAddress: `0x${string}`,
    tokenAmount: bigint,
    promisedWaitingPhases: bigint,
    to: `0x${string}`,
  ) => {
    console.log('提交stakeToken交易:', { tokenAddress, tokenAmount, promisedWaitingPhases, to, isTukeMode });
    return await execute([tokenAddress, tokenAmount, promisedWaitingPhases, to]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('stakeToken tx hash:', hash);
    }
    if (error) {
      console.log('提交stakeToken交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    stakeToken,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
};

/**
 * 取消质押
 */
export const useUnstake = () => {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20StakeAbi,
    CONTRACT_ADDRESS,
    'unstake',
  );

  const unstake = async (tokenAddress: `0x${string}`) => {
    console.log('提交unstake交易:', { tokenAddress, isTukeMode });
    return await execute([tokenAddress]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('unstake tx hash:', hash);
    }
    if (error) {
      console.log('提交unstake交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    unstake,
    writeData: hash,
    isWriting: isPending,
    writeError: error,
    isConfirming,
    isConfirmed,
    hash,
    isTukeMode,
  };
};

/**
 * 提款
 */
export const useWithdraw = () => {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20StakeAbi,
    CONTRACT_ADDRESS,
    'withdraw',
  );

  /**
   * 调用合约的 withdraw 函数
   * @param tokenAddress 代币地址
   */
  const withdraw = async (tokenAddress: `0x${string}`) => {
    console.log('提交withdraw交易:', { tokenAddress, isTukeMode });
    return await execute([tokenAddress]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('withdraw tx hash:', hash);
    }
    if (error) {
      console.log('提交withdraw交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    withdraw,
    writeData: hash,
    isWriting: isPending,
    writeError: error,
    isConfirming,
    isConfirmed,
    hash,
    isTukeMode,
  };
};

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20VerifyAbi } from '@/src/abis/LOVE20Verify';

interface VerifierScoresParams {
  verifier: `0x${string}`;
  round: bigint;
  tokenAddress: `0x${string}`;
  actionId: bigint;
  accounts: `0x${string}`[];
  enabled?: boolean;
}

interface VerifierScoreResult {
  account: `0x${string}`;
  score: bigint;
  isPending: boolean;
  error: Error | null;
}

// 获取合约地址
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_VERIFY as `0x${string}`;

/**
 * 批量获取验证者对多个账户的打分
 * 使用 useReadContracts 将多个RPC调用合并成一次批量请求，提高效率
 */
export const useVerifierScores = ({
  verifier,
  round,
  tokenAddress,
  actionId,
  accounts,
  enabled = true,
}: VerifierScoresParams) => {
  // 构建批量合约调用配置
  const contracts = useMemo(() => {
    if (!enabled || accounts.length === 0 || !verifier || !tokenAddress) {
      return [];
    }

    return accounts.map((account) => ({
      address: CONTRACT_ADDRESS,
      abi: LOVE20VerifyAbi,
      functionName: 'scoreByVerifierByActionIdByAccount' as const,
      args: [tokenAddress, round, verifier, actionId, account],
    }));
  }, [tokenAddress, round, verifier, actionId, accounts, enabled]);

  // 使用 useReadContracts 进行批量调用 - 这是真正的一次RPC请求！
  const {
    data: contractResults,
    isLoading,
    error,
    isSuccess,
  } = useReadContracts({
    contracts,
    query: {
      enabled: enabled && contracts.length > 0,
    },
  });

  // 计算派生数据
  const verifierScores = useMemo(() => {
    if (!enabled || accounts.length === 0) {
      return {
        scores: [] as VerifierScoreResult[],
        isLoading: false,
        hasError: false,
        allLoaded: true,
      };
    }

    // 处理批量调用的结果
    const scores: VerifierScoreResult[] = accounts.map((account, index) => {
      const result = contractResults?.[index];

      return {
        account,
        score: result?.status === 'success' ? (result.result as bigint) || BigInt(0) : BigInt(0),
        isPending: isLoading,
        error: result?.status === 'failure' ? (result.error as Error) : error || null,
      };
    });

    // 计算整体状态
    const hasError = !!error || scores.some((score) => score.error !== null);
    const allLoaded = isSuccess;

    return {
      scores,
      isLoading,
      hasError,
      allLoaded,
    };
  }, [contractResults, accounts, enabled, isLoading, error, isSuccess]);

  // 返回格式化的结果
  return {
    // 分数数据
    scores: verifierScores.scores,

    // 状态信息
    isLoading: verifierScores.isLoading,
    hasError: verifierScores.hasError,
    allLoaded: verifierScores.allLoaded,

    // 便捷方法：获取分数数组（按账户顺序）
    getScoresArray: () => verifierScores.scores.map((item) => item.score),

    // 便捷方法：获取分数映射
    getScoresMap: () => {
      const map: { [account: string]: bigint } = {};
      verifierScores.scores.forEach((item) => {
        map[item.account] = item.score;
      });
      return map;
    },

    // 验证
    hasValidData: enabled && accounts.length > 0 && !!verifier && !!tokenAddress,
  };
};

import { useMemo, useState, useEffect } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20JoinAbi } from '@/src/abis/LOVE20Join';
import { LOVE20VerifyAbi } from '@/src/abis/LOVE20Verify';
import { readContracts } from '@wagmi/core';
import { config } from '@/src/wagmi';

// 获取合约地址
const JOIN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_JOIN as `0x${string}`;
const VERIFY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_VERIFY as `0x${string}`;

interface ActionRoundKey {
  actionId: bigint;
  round: bigint;
}

interface EstimateAccountScoresParams {
  account: `0x${string}`;
  tokenAddress: `0x${string}`;
  actionRoundPairs: ActionRoundKey[];
  enabled?: boolean;
}

/**
 * 批量估算账户在多个行动和轮次下的原始得分（100分制）
 *
 * 算法流程：
 * 1. 批量获取所有行动×轮次的随机账户列表
 * 2. 分批串行获取所有账户的分数（按每个行动×轮次分批，避免单次RPC调用过多导致超时）
 * 3. 计算每个行动×轮次下的最高分，并将目标账户分数换算为100分制
 *
 * 优化说明：
 * - 每个行动×轮次约有500个随机账户，如果一次性查询所有会导致RPC超时
 * - 采用分批策略：每次只查询一个行动×轮次的所有账户分数
 * - 通过 useEffect + async/await 实现串行批量加载，确保稳定性
 * - 只查询传入的 actionRoundPairs，避免查询不必要的轮次
 */
export const useEstimateAccountScoresByActionIdsByRounds = ({
  account,
  tokenAddress,
  actionRoundPairs,
  enabled = true,
}: EstimateAccountScoresParams) => {
  // 使用传入的行动×轮次组合，并生成稳定的 key 用于依赖追踪
  const { validActionRoundPairs, actionRoundPairsKey } = useMemo(() => {
    if (!enabled || actionRoundPairs.length === 0) {
      return { validActionRoundPairs: [], actionRoundPairsKey: '' };
    }
    
    // 生成稳定的 key，基于实际的 actionId 和 round 值
    const key = actionRoundPairs
      .map((pair) => `${pair.actionId.toString()}_${pair.round.toString()}`)
      .join('|');
    
    return { validActionRoundPairs: actionRoundPairs, actionRoundPairsKey: key };
  }, [actionRoundPairs, enabled]);

  // 第一步：批量获取随机账户列表
  const randomAccountsContracts = useMemo(() => {
    if (!enabled || validActionRoundPairs.length === 0 || !tokenAddress) {
      return [];
    }

    return validActionRoundPairs.map(({ actionId, round }) => ({
      address: JOIN_CONTRACT_ADDRESS,
      abi: LOVE20JoinAbi,
      functionName: 'randomAccounts' as const,
      args: [tokenAddress, round, actionId],
    }));
  }, [tokenAddress, validActionRoundPairs, enabled]);

  const {
    data: randomAccountsData,
    isLoading: isLoadingRandomAccounts,
    error: randomAccountsError,
    isSuccess: randomAccountsSuccess,
  } = useReadContracts({
    contracts: randomAccountsContracts,
    query: {
      enabled: enabled && randomAccountsContracts.length > 0,
    },
  });

  console.log('randomAccountsData', randomAccountsData);

  // 第二步：分批获取所有账户的分数
  // 使用 state 来存储分批加载的结果
  const [batchScoresData, setBatchScoresData] = useState<{
    [key: string]: {
      // key 格式: "actionId_round"
      actionId: bigint;
      round: bigint;
      accountScores: { [account: string]: bigint };
    };
  }>({});
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  const [scoresError, setScoresError] = useState<Error | null>(null);
  const [scoresSuccess, setScoresSuccess] = useState(false);

  // 当随机账户数据准备好后，开始分批加载分数
  useEffect(() => {
    if (
      !enabled ||
      !randomAccountsData ||
      !randomAccountsSuccess ||
      validActionRoundPairs.length === 0 ||
      !tokenAddress ||
      !account
    ) {
      return;
    }

    // 定义异步函数来分批加载
    const loadScoresByBatch = async () => {
      setIsLoadingScores(true);
      setScoresError(null);
      setBatchScoresData({});

      const allScores: typeof batchScoresData = {};

      try {
        // 按每个行动×轮次组合分批执行
        for (let index = 0; index < validActionRoundPairs.length; index++) {
          const { actionId, round } = validActionRoundPairs[index];
          const result = randomAccountsData[index];

          if (result?.status === 'success') {
            const accounts = result.result as `0x${string}`[];

            // 确保目标账户在列表中
            const accountsToQuery = [...accounts];
            if (!accountsToQuery.includes(account)) {
              accountsToQuery.push(account);
            }

            // 为当前行动×轮次的所有账户构建分数查询
            const contracts = accountsToQuery.map((acc) => ({
              address: VERIFY_CONTRACT_ADDRESS,
              abi: LOVE20VerifyAbi,
              functionName: 'scoreByActionIdByAccount' as const,
              args: [tokenAddress, round, actionId, acc],
            }));

            console.log(`正在加载 actionId=${actionId}, round=${round} 的分数数据，共 ${contracts.length} 个账户...`);

            // 执行当前批次的 RPC 调用
            const batchResults = await readContracts(config, {
              contracts,
            });

            // 处理当前批次的结果
            const key = `${actionId.toString()}_${round.toString()}`;
            const accountScores: { [account: string]: bigint } = {};

            batchResults.forEach((result, idx) => {
              if (result?.status === 'success') {
                const acc = accountsToQuery[idx];
                const score = (result.result as bigint) || BigInt(0);
                accountScores[acc] = score;
              }
            });

            allScores[key] = {
              actionId,
              round,
              accountScores,
            };

            // 更新状态，让UI能看到进度
            setBatchScoresData({ ...allScores });

            console.log(
              `完成加载 actionId=${actionId}, round=${round}，进度: ${index + 1}/${validActionRoundPairs.length}`,
            );
          }
        }

        setScoresSuccess(true);
        setIsLoadingScores(false);
      } catch (error) {
        console.error('分批加载分数时出错:', error);
        setScoresError(error as Error);
        setIsLoadingScores(false);
        setScoresSuccess(false);
      }
    };

    loadScoresByBatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    enabled,
    tokenAddress,
    account,
    actionRoundPairsKey, // 使用基于 actionRoundPairs 的稳定 key
    randomAccountsSuccess, // 只有当随机账户数据成功获取后才触发
  ]);

  // 第三步：计算100分制得分（支持渐进式返回部分数据）
  const estimatedScores = useMemo(() => {
    if (!enabled || validActionRoundPairs.length === 0) {
      return {
        scores: {},
        isLoading: false,
        hasError: false,
        allLoaded: true,
      };
    }

    // 如果有错误
    const hasError = !!randomAccountsError || !!scoresError;
    if (hasError) {
      return {
        scores: {},
        isLoading: false,
        hasError: true,
        allLoaded: false,
      };
    }

    // 如果随机账户列表还在加载中，返回空数据
    if (isLoadingRandomAccounts) {
      return {
        scores: {},
        isLoading: true,
        hasError: false,
        allLoaded: false,
      };
    }

    // 计算每个行动×轮次下的100分制得分
    // 即使还在加载中，也返回已经加载完成的部分数据
    const finalScores: { [actionId: string]: { [round: string]: string } } = {};

    Object.values(batchScoresData).forEach(({ actionId, round, accountScores }) => {
      // 找出最高分
      const scores = Object.values(accountScores);
      const maxScore = scores.reduce((max, score) => (score > max ? score : max), BigInt(0));

      // 获取目标账户的分数
      const targetScore = accountScores[account] || BigInt(0);

      // 计算100分制得分（四舍五入到整数）
      let scaledScore = '0';
      if (maxScore > BigInt(0) && targetScore > BigInt(0)) {
        // 使用 BigInt 进行精确计算，缩放到100分制
        // 计算 (targetScore * 100) / maxScore
        const quotient = (targetScore * BigInt(100)) / maxScore;
        const remainder = (targetScore * BigInt(100)) % maxScore;

        // 四舍五入：如果 remainder * 2 >= maxScore，则进位
        const scaledValue = remainder * BigInt(2) >= maxScore ? Number(quotient) + 1 : Number(quotient);

        scaledScore = scaledValue.toString();
      }

      // 存储结果
      const actionIdStr = actionId.toString();
      const roundStr = round.toString();

      if (!finalScores[actionIdStr]) {
        finalScores[actionIdStr] = {};
      }

      finalScores[actionIdStr][roundStr] = scaledScore;
    });

    // 判断是否全部加载完成
    const allLoaded = scoresSuccess && !isLoadingScores;

    return {
      scores: finalScores,
      isLoading: isLoadingScores,
      hasError: false,
      allLoaded,
    };
  }, [
    enabled,
    validActionRoundPairs,
    account,
    isLoadingRandomAccounts,
    isLoadingScores,
    randomAccountsError,
    scoresError,
    scoresSuccess,
    randomAccountsData,
    randomAccountsSuccess,
    batchScoresData,
  ]);

  return {
    // 分数数据：{ actionId: { round: score } }
    scores: estimatedScores.scores,

    // 状态信息
    isLoading: estimatedScores.isLoading,
    hasError: estimatedScores.hasError,
    allLoaded: estimatedScores.allLoaded,
  };
};

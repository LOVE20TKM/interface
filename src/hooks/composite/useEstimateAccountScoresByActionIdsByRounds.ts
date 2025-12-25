import { useMemo, useState, useEffect } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20JoinAbi } from '@/src/abis/LOVE20Join';
import { LOVE20VerifyAbi } from '@/src/abis/LOVE20Verify';
import { readContracts } from '@wagmi/core';
import { config } from '@/src/wagmi';

// 获取合约地址
const JOIN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_JOIN as `0x${string}`;
const VERIFY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_VERIFY as `0x${string}`;

// ==================== localStorage 缓存工具函数 ====================

// 缓存数据结构: { "actionId_round": "score" }
type ScoreCacheData = {
  [actionId_round: string]: string;
};

// 生成缓存 key
const buildScoreCacheKey = (account: string, tokenAddress: string) =>
  `love20_score_cache_${account.toLowerCase()}_${tokenAddress.toLowerCase()}`;

// 读取缓存（导出供外部使用）
export const getScoreCache = (account: string, tokenAddress: string): ScoreCacheData => {
  if (typeof window === 'undefined') return {};
  try {
    const cached = localStorage.getItem(buildScoreCacheKey(account, tokenAddress));
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
};

// 批量写入缓存
const batchSetScoreCache = (
  account: string,
  tokenAddress: string,
  scores: { [actionId: string]: { [round: string]: string } },
) => {
  if (typeof window === 'undefined') return;
  try {
    const existing = getScoreCache(account, tokenAddress);
    // 合并新旧数据
    Object.entries(scores).forEach(([actionId, rounds]) => {
      Object.entries(rounds).forEach(([round, score]) => {
        const key = `${actionId}_${round}`;
        existing[key] = score;
      });
    });
    localStorage.setItem(buildScoreCacheKey(account, tokenAddress), JSON.stringify(existing));
  } catch (err) {
    console.error('写入得分缓存失败:', err);
  }
};

// ==================== 类型定义 ====================

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
 * 1. 从 localStorage 读取已缓存的得分数据
 * 2. 批量获取未缓存行动×轮次的随机账户列表
 * 3. 分批串行获取所有账户的分数（按每个行动×轮次分批，避免单次RPC调用过多导致超时）
 * 4. 计算每个行动×轮次下的最高分，并将目标账户分数换算为100分制
 * 5. 将新获取的得分写入 localStorage 缓存
 *
 * 优化说明：
 * - 每个行动×轮次约有500个随机账户，如果一次性查询所有会导致RPC超时
 * - 采用分批策略：每次只查询一个行动×轮次的所有账户分数
 * - 通过 useEffect + async/await 实现串行批量加载，确保稳定性
 * - 只查询传入的 actionRoundPairs，避免查询不必要的轮次
 * - 使用 localStorage 缓存已查询的得分，避免重复请求链上数据
 */
export const useEstimateAccountScoresByActionIdsByRounds = ({
  account,
  tokenAddress,
  actionRoundPairs,
  enabled = true,
}: EstimateAccountScoresParams) => {
  // 使用传入的行动×轮次组合，并生成稳定的 key 用于依赖追踪
  // 同时从缓存中读取已有的得分数据，过滤出需要请求的 pairs
  const { validActionRoundPairs, actionRoundPairsKey, cachedScores, uncachedPairs } = useMemo(() => {
    if (!enabled || actionRoundPairs.length === 0 || !account || !tokenAddress) {
      return { validActionRoundPairs: [], actionRoundPairsKey: '', cachedScores: {}, uncachedPairs: [] };
    }

    // 读取缓存
    const cache = getScoreCache(account, tokenAddress);

    // 分离已缓存和未缓存的 pairs
    const cached: { [actionId: string]: { [round: string]: string } } = {};
    const uncached: ActionRoundKey[] = [];

    actionRoundPairs.forEach((pair) => {
      const cacheKey = `${pair.actionId.toString()}_${pair.round.toString()}`;
      const cachedScore = cache[cacheKey];

      if (cachedScore !== undefined) {
        // 已缓存
        const actionIdStr = pair.actionId.toString();
        const roundStr = pair.round.toString();
        if (!cached[actionIdStr]) {
          cached[actionIdStr] = {};
        }
        cached[actionIdStr][roundStr] = cachedScore;
      } else {
        // 未缓存，需要请求
        uncached.push(pair);
      }
    });

    // 生成稳定的 key，基于实际的 actionId 和 round 值
    const key = actionRoundPairs.map((pair) => `${pair.actionId.toString()}_${pair.round.toString()}`).join('|');

    console.log(`缓存命中: ${Object.keys(cache).length} 条, 需要请求: ${uncached.length} 条`);

    return {
      validActionRoundPairs: actionRoundPairs,
      actionRoundPairsKey: key,
      cachedScores: cached,
      uncachedPairs: uncached,
    };
  }, [actionRoundPairs, enabled, account, tokenAddress]);

  // 第一步：批量获取随机账户列表（只获取未缓存的）
  const randomAccountsContracts = useMemo(() => {
    if (!enabled || uncachedPairs.length === 0 || !tokenAddress) {
      return [];
    }

    return uncachedPairs.map(({ actionId, round }) => ({
      address: JOIN_CONTRACT_ADDRESS,
      abi: LOVE20JoinAbi,
      functionName: 'randomAccounts' as const,
      args: [tokenAddress, round, actionId],
    }));
  }, [tokenAddress, uncachedPairs, enabled]);

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
      uncachedPairs.length === 0 ||
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
      const newScoresToCache: { [actionId: string]: { [round: string]: string } } = {};

      try {
        // 按每个行动×轮次组合分批执行
        for (let index = 0; index < uncachedPairs.length; index++) {
          const { actionId, round } = uncachedPairs[index];
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
            let hasFailedRequest = false;

            batchResults.forEach((result, idx) => {
              if (result?.status === 'success') {
                const acc = accountsToQuery[idx];
                const score = (result.result as bigint) || BigInt(0);
                accountScores[acc] = score;
              } else {
                // 记录失败的请求
                hasFailedRequest = true;
                console.warn(`获取账户 ${accountsToQuery[idx]} 的得分失败:`, result?.error);
              }
            });

            // 检查目标账户的得分是否成功获取
            const hasTargetAccountScore = accountScores[account] !== undefined;

            // 无论是否缓存，都更新状态让 UI 显示已获取的数据
            allScores[key] = {
              actionId,
              round,
              accountScores,
            };

            // 只有当没有失败请求且目标账户得分存在时，才缓存数据
            if (!hasFailedRequest && hasTargetAccountScore) {
              // 计算100分制得分准备缓存
              const scores = Object.values(accountScores);
              const maxScore = scores.reduce((max, score) => (score > max ? score : max), BigInt(0));
              const targetScore = accountScores[account] || BigInt(0);

              let scaledScore = '0';
              if (maxScore > BigInt(0) && targetScore > BigInt(0)) {
                const quotient = (targetScore * BigInt(100)) / maxScore;
                const remainder = (targetScore * BigInt(100)) % maxScore;
                const scaledValue = remainder * BigInt(2) >= maxScore ? Number(quotient) + 1 : Number(quotient);
                scaledScore = scaledValue.toString();
              }

              // 准备写入缓存
              const actionIdStr = actionId.toString();
              const roundStr = round.toString();
              if (!newScoresToCache[actionIdStr]) {
                newScoresToCache[actionIdStr] = {};
              }
              newScoresToCache[actionIdStr][roundStr] = scaledScore;

              console.log(`完成加载 actionId=${actionId}, round=${round}，进度: ${index + 1}/${uncachedPairs.length}`);
            } else {
              console.warn(
                `跳过缓存 actionId=${actionId}, round=${round}: ` +
                  `hasFailedRequest=${hasFailedRequest}, hasTargetAccountScore=${hasTargetAccountScore}`,
              );
            }

            // 更新状态，让UI能看到进度
            setBatchScoresData({ ...allScores });
          }
        }

        // 批量写入缓存
        if (Object.keys(newScoresToCache).length > 0) {
          batchSetScoreCache(account, tokenAddress, newScoresToCache);
          console.log('得分数据已写入缓存');
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
  // 合并缓存数据和新获取的数据
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

    // 如果随机账户列表还在加载中，返回已缓存的数据
    if (isLoadingRandomAccounts) {
      return {
        scores: cachedScores,
        isLoading: uncachedPairs.length > 0, // 只有存在未缓存数据时才显示加载中
        hasError: false,
        allLoaded: false,
      };
    }

    // 计算每个行动×轮次下的100分制得分（新获取的数据）
    const newScores: { [actionId: string]: { [round: string]: string } } = {};

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

      if (!newScores[actionIdStr]) {
        newScores[actionIdStr] = {};
      }

      newScores[actionIdStr][roundStr] = scaledScore;
    });

    // 合并缓存数据和新获取的数据
    const finalScores: { [actionId: string]: { [round: string]: string } } = { ...cachedScores };

    Object.entries(newScores).forEach(([actionId, rounds]) => {
      if (!finalScores[actionId]) {
        finalScores[actionId] = {};
      }
      Object.entries(rounds).forEach(([round, score]) => {
        finalScores[actionId][round] = score;
      });
    });

    // 判断是否全部加载完成
    const allLoaded = uncachedPairs.length === 0 || (scoresSuccess && !isLoadingScores);

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
    cachedScores,
    uncachedPairs,
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

// ==================== 单个行动×轮次按需加载 Hook ====================

interface EstimateAccountScoreSingleParams {
  account: `0x${string}`;
  tokenAddress: `0x${string}`;
  actionId: bigint;
  round: bigint;
  enabled?: boolean;
}

/**
 * 按需加载单个行动×轮次的估算得分
 * 优先从缓存读取，缓存不存在时调用 RPC 获取
 */
export const useEstimateAccountScoreByActionRound = ({
  account,
  tokenAddress,
  actionId,
  round,
  enabled = true,
}: EstimateAccountScoreSingleParams) => {
  const [score, setScore] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // 检查缓存
  const cachedScore = useMemo(() => {
    if (!enabled || !account || !tokenAddress) return null;
    const cache = getScoreCache(account, tokenAddress);
    const cacheKey = `${actionId.toString()}_${round.toString()}`;
    return cache[cacheKey] ?? null;
  }, [enabled, account, tokenAddress, actionId, round]);

  // 获取随机账户列表
  const { data: randomAccountsData, isSuccess: randomAccountsSuccess } = useReadContracts({
    contracts: [
      {
        address: JOIN_CONTRACT_ADDRESS,
        abi: LOVE20JoinAbi,
        functionName: 'randomAccounts' as const,
        args: [tokenAddress, round, actionId],
      },
    ],
    query: {
      enabled: enabled && cachedScore === null && !!account && !!tokenAddress,
    },
  });

  // 当随机账户数据准备好后，获取分数
  useEffect(() => {
    if (!enabled || cachedScore !== null || !randomAccountsSuccess || !randomAccountsData?.[0]?.result) {
      return;
    }

    const loadScore = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const accounts = randomAccountsData[0].result as `0x${string}`[];
        const accountsToQuery = [...accounts];
        if (!accountsToQuery.includes(account)) {
          accountsToQuery.push(account);
        }

        const contracts = accountsToQuery.map((acc) => ({
          address: VERIFY_CONTRACT_ADDRESS,
          abi: LOVE20VerifyAbi,
          functionName: 'scoreByActionIdByAccount' as const,
          args: [tokenAddress, round, actionId, acc],
        }));

        const batchResults = await readContracts(config, { contracts });

        const accountScores: { [account: string]: bigint } = {};
        let hasFailedRequest = false;

        batchResults.forEach((result, idx) => {
          if (result?.status === 'success') {
            accountScores[accountsToQuery[idx]] = (result.result as bigint) || BigInt(0);
          } else {
            hasFailedRequest = true;
          }
        });

        const targetScore = accountScores[account];
        if (targetScore === undefined) {
          setHasError(true);
          setIsLoading(false);
          return;
        }

        // 计算100分制得分
        const scores = Object.values(accountScores);
        const maxScore = scores.reduce((max, s) => (s > max ? s : max), BigInt(0));

        let scaledScore = '0';
        if (maxScore > BigInt(0) && targetScore > BigInt(0)) {
          const quotient = (targetScore * BigInt(100)) / maxScore;
          const remainder = (targetScore * BigInt(100)) % maxScore;
          const scaledValue = remainder * BigInt(2) >= maxScore ? Number(quotient) + 1 : Number(quotient);
          scaledScore = scaledValue.toString();
        }

        setScore(scaledScore);

        // 写入缓存
        if (!hasFailedRequest) {
          const actionIdStr = actionId.toString();
          const roundStr = round.toString();
          batchSetScoreCache(account, tokenAddress, {
            [actionIdStr]: { [roundStr]: scaledScore },
          });
        }

        setIsLoading(false);
      } catch (error) {
        console.error('加载单个得分失败:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    loadScore();
  }, [enabled, cachedScore, randomAccountsSuccess, randomAccountsData, account, tokenAddress, actionId, round]);

  // 优先返回缓存值
  const finalScore = cachedScore !== null ? cachedScore : score;

  return {
    score: finalScore,
    isLoading: isLoading || (enabled && cachedScore === null && !randomAccountsSuccess),
    hasError,
    isCached: cachedScore !== null,
  };
};

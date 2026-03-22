// hooks/composite/useVerificationInfos.ts
// 批量获取验证信息的 Hook（支持分批加载，避免单次请求过大导致失败）

import { useMemo, useState, useEffect, useRef } from 'react';
import { useUniversalReadContracts } from '@/src/lib/universalReadContract';
import { ExtensionCenterAbi } from '@/src/abis/ExtensionCenter';

interface VerificationInfosParams {
  tokenAddress: `0x${string}` | undefined;
  actionId: bigint;
  accounts: `0x${string}`[];
  verificationKeys: string[];
  round: bigint;
  enabled?: boolean;
}

export interface VerificationInfoResult {
  account: `0x${string}`;
  infos: string[]; // 按 verificationKeys 顺序对应的验证信息
  isPending: boolean;
  error: Error | null;
}

// 获取合约地址
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_CENTER as `0x${string}`;

// 每批最多请求的合约调用数量（账号数 × key 数不超过此值）
const BATCH_SIZE = 100;

/**
 * 批量获取多个地址的验证信息
 * 当账号数量较多时自动分批请求，避免单次 RPC 调用过大导致失败
 *
 * @param tokenAddress - 代币地址
 * @param actionId - 行动 ID
 * @param accounts - 需要获取验证信息的地址列表
 * @param verificationKeys - 验证信息的键列表
 * @param round - 轮次
 * @param enabled - 是否启用查询
 * @returns 包含所有地址验证信息的数组
 */
export const useVerificationInfos = ({
  tokenAddress,
  actionId,
  accounts,
  verificationKeys,
  round,
  enabled = true,
}: VerificationInfosParams) => {
  // 将所有合约调用按 BATCH_SIZE 分批
  const allBatches = useMemo(() => {
    if (!enabled || accounts.length === 0 || verificationKeys.length === 0 || !tokenAddress) {
      return [];
    }

    const allCalls: any[] = [];
    accounts.forEach((account) => {
      verificationKeys.forEach((key) => {
        allCalls.push({
          address: CONTRACT_ADDRESS,
          abi: ExtensionCenterAbi,
          functionName: 'verificationInfoByRound' as const,
          args: [tokenAddress, actionId, account, key, round],
        });
      });
    });

    // 分批
    const batches: any[][] = [];
    for (let i = 0; i < allCalls.length; i += BATCH_SIZE) {
      batches.push(allCalls.slice(i, i + BATCH_SIZE));
    }
    return batches;
  }, [tokenAddress, actionId, accounts, verificationKeys, round, enabled]);

  // 当前正在请求的批次索引
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  // 累积的所有批次结果
  const [accumulatedResults, setAccumulatedResults] = useState<any[]>([]);
  // 是否所有批次都已完成
  const [allBatchesDone, setAllBatchesDone] = useState(false);
  // 记录上一次的批次配置，用于检测参数变化时重置
  const prevBatchKeyRef = useRef<string>('');

  const totalBatches = allBatches.length;

  // 当参数变化时重置状态
  const batchKey = useMemo(
    () => `${tokenAddress}-${actionId}-${accounts.length}-${verificationKeys.length}-${round}-${enabled}`,
    [tokenAddress, actionId, accounts.length, verificationKeys.length, round, enabled],
  );

  useEffect(() => {
    if (batchKey !== prevBatchKeyRef.current) {
      prevBatchKeyRef.current = batchKey;
      setCurrentBatchIndex(0);
      setAccumulatedResults([]);
      setAllBatchesDone(false);
    }
  }, [batchKey]);

  // 当前批次的合约调用
  const currentBatchContracts = useMemo(() => {
    if (allBatchesDone || currentBatchIndex >= totalBatches) {
      return [];
    }
    return allBatches[currentBatchIndex] || [];
  }, [allBatches, currentBatchIndex, totalBatches, allBatchesDone]);

  // 请求当前批次
  const {
    data: batchResult,
    error: batchError,
    isSuccess: isBatchSuccess,
  } = useUniversalReadContracts({
    contracts: currentBatchContracts,
    query: {
      enabled: enabled && currentBatchContracts.length > 0 && !allBatchesDone,
    },
  });

  // 当前批次完成后，累积结果并推进到下一批
  useEffect(() => {
    if (!isBatchSuccess || !batchResult || allBatchesDone) return;
    if (currentBatchIndex >= totalBatches) return;

    setAccumulatedResults((prev) => {
      // 防止重复追加同一批次
      const expectedLength = currentBatchIndex * BATCH_SIZE;
      // 如果已经累积了足够的结果，说明这批已经处理过了
      if (prev.length > expectedLength) return prev;
      return [...prev, ...batchResult];
    });

    if (currentBatchIndex + 1 >= totalBatches) {
      setAllBatchesDone(true);
    } else {
      setCurrentBatchIndex((prev) => prev + 1);
    }
  }, [isBatchSuccess, batchResult, currentBatchIndex, totalBatches, allBatchesDone]);

  // 整体加载状态
  const isLoading = enabled && totalBatches > 0 && !allBatchesDone;
  const isSuccess = allBatchesDone;
  const error = batchError;

  // 使用最终的累积结果（或在加载中使用已有的部分结果）
  const contractResults = allBatchesDone ? accumulatedResults : null;

  // 计算派生数据
  const verificationInfos = useMemo(() => {
    if (!enabled || accounts.length === 0 || verificationKeys.length === 0) {
      return {
        infos: [] as VerificationInfoResult[],
        isLoading: false,
        hasError: false,
        allLoaded: true,
      };
    }

    // 处理批量调用的结果
    const infos: VerificationInfoResult[] = accounts.map((account, accountIndex) => {
      // 为每个地址收集所有验证 key 的信息
      const accountInfos: string[] = [];
      let hasError = false;
      let accountError: Error | null = null;

      verificationKeys.forEach((_, keyIndex) => {
        // 计算在 contractResults 中的索引
        const resultIndex = accountIndex * verificationKeys.length + keyIndex;
        const result = contractResults?.[resultIndex];

        if (result?.status === 'success') {
          accountInfos.push((result.result as string) || '');
        } else {
          accountInfos.push('');
          if (result?.status === 'failure') {
            hasError = true;
            accountError = result.error as Error;
          }
        }
      });

      return {
        account,
        infos: accountInfos,
        isPending: isLoading,
        error: hasError ? accountError : null,
      };
    });

    // 计算整体状态
    const hasAnyError = !!error || infos.some((info) => info.error !== null);
    const allLoaded = isSuccess;

    return {
      infos,
      isLoading,
      hasError: hasAnyError,
      allLoaded,
    };
  }, [contractResults, accounts, verificationKeys, enabled, isLoading, error, isSuccess]);

  // 返回格式化的结果
  return {
    // 验证信息数据
    verificationInfos: verificationInfos.infos,

    // 状态信息
    isLoading: verificationInfos.isLoading,
    isPending: verificationInfos.isLoading,
    hasError: verificationInfos.hasError,
    allLoaded: verificationInfos.allLoaded,
    error: error || null,

    // 便捷方法：根据地址获取验证信息
    getInfosByAccount: (account: `0x${string}`) => {
      const found = verificationInfos.infos.find((info) => info.account.toLowerCase() === account.toLowerCase());
      return found?.infos || [];
    },

    // 便捷方法：获取所有验证信息的映射
    getInfosMap: () => {
      const map: { [account: string]: string[] } = {};
      verificationInfos.infos.forEach((info) => {
        map[info.account] = info.infos;
      });
      return map;
    },

    // 验证
    hasValidData: enabled && accounts.length > 0 && verificationKeys.length > 0 && !!tokenAddress,
  };
};

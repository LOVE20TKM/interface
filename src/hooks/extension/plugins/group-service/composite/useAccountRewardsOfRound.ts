/**
 * 行动轮次参与者激励查询 Hook
 *
 * 职责：
 * - 查询某个行动的某个轮次所有参与者的激励信息
 * - 先获取所有参与地址，再批量获取每个地址的激励
 * - 使用 useReadContracts 优化批量查询性能
 *
 * 使用示例：
 * ```typescript
 * const { accountRewards, isPending, error } = useAccountRewardsOfRound({
 *   extensionAddress: '0x...',
 *   tokenAddress: '0x...',
 *   actionId: BigInt(1),
 *   round: BigInt(2)
 * });
 * // accountRewards: [
 * //   { account: '0xabc...', amount: 1000n, isMinted: true },
 * //   { account: '0xdef...', amount: 500n, isMinted: false },
 * //   ...
 * // ]
 * ```
 */

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { ExtensionGroupServiceAbi } from '@/src/abis/ExtensionGroupService';
import { useAccountsByActionByRound } from '@/src/hooks/extension/base/composite/useAccountsByActionByRound';
import { safeToBigInt } from '@/src/lib/clientUtils';

// ==================== 类型定义 ====================

/**
 * 账户激励信息
 */
export interface AccountRewardInfo {
  /** 账户地址 */
  account: `0x${string}`;
  /** 激励金额 */
  amount: bigint;
  /** 是否已铸造 */
  isMinted: boolean;
  /** 是否设置了二次分配地址 */
  hasRecipients: boolean;
}

/**
 * Hook 参数
 */
export interface UseAccountRewardsOfRoundParams {
  /** 扩展合约地址 */
  extensionAddress: `0x${string}` | undefined;
  /** Token 地址 */
  tokenAddress: `0x${string}` | undefined;
  /** Action ID */
  actionId: bigint | undefined;
  /** 轮次 */
  round: bigint | undefined;
}

/**
 * Hook 返回值
 */
export interface UseAccountRewardsOfRoundResult {
  /** 账户激励列表 */
  accountRewards: AccountRewardInfo[];
  /** 参与者总数 */
  totalCount: bigint | undefined;
  /** 加载状态 */
  isPending: boolean;
  /** 错误信息 */
  error: Error | null;
}

// ==================== Hook 实现 ====================

/**
 * 获取某个行动的某个轮次所有参与者的激励信息
 *
 * @param params - Hook 参数
 * @returns 参与者激励信息列表
 *
 * @description
 * 分两步查询：
 * 1. 调用 useAccountsByActionByRound 获取参与者地址列表
 * 2. 批量调用 rewardByAccount(round, account) 获取每个地址的激励
 */
export function useAccountRewardsOfRound(params: UseAccountRewardsOfRoundParams): UseAccountRewardsOfRoundResult {
  const { extensionAddress, tokenAddress, actionId, round } = params;

  // ==========================================
  // 第一步：获取参与者地址列表
  // ==========================================
  const {
    accounts,
    count,
    isPending: isAccountsPending,
    error: accountsError,
  } = useAccountsByActionByRound({
    tokenAddress,
    actionId,
    round,
  });

  // ==========================================
  // 第二步：批量查询每个地址的激励
  // ==========================================
  const rewardsContracts = useMemo(() => {
    // 如果扩展地址未获取到，或参与者列表为空，返回空数组
    if (!extensionAddress || !round || accounts.length === 0) {
      return [];
    }

    // 为每个地址构建一个查询配置
    return accounts.map((account) => ({
      address: extensionAddress,
      abi: ExtensionGroupServiceAbi,
      functionName: 'rewardByAccount' as const,
      args: [round, account] as const,
    }));
  }, [extensionAddress, round, accounts]);

  const {
    data: rewardsData,
    isPending: isRewardsPending,
    error: rewardsError,
  } = useReadContracts({
    contracts: rewardsContracts,
    query: {
      // 只有在扩展地址、轮次、账户列表都就绪时才启用
      enabled: !!extensionAddress && !!round && accounts.length > 0 && rewardsContracts.length > 0,
    },
  });

  // ==========================================
  // 第三步：批量查询每个地址的二次分配地址设置情况
  // ==========================================
  const recipientsContracts = useMemo(() => {
    // 如果扩展地址未获取到，或参与者列表为空，返回空数组
    if (!extensionAddress || !round || accounts.length === 0) {
      return [];
    }

    // 为每个地址构建一个查询配置
    // actionIdsWithRecipients 的参数顺序是 (account, round)
    return accounts.map((account) => ({
      address: extensionAddress,
      abi: ExtensionGroupServiceAbi,
      functionName: 'actionIdsWithRecipients' as const,
      args: [account, round] as const,
    }));
  }, [extensionAddress, round, accounts]);

  const {
    data: recipientsData,
    isPending: isRecipientsPending,
    error: recipientsError,
  } = useReadContracts({
    contracts: recipientsContracts,
    query: {
      // 只有在扩展地址、轮次、账户列表都就绪时才启用
      enabled: !!extensionAddress && !!round && accounts.length > 0 && recipientsContracts.length > 0,
    },
  });

  // ==========================================
  // 解析激励数据和二次分配地址设置情况
  // ==========================================
  const accountRewards = useMemo(() => {
    // 如果没有数据或账户列表为空，返回空数组
    if (!rewardsData || accounts.length === 0) {
      return [];
    }

    // 解析每个查询结果
    const result: AccountRewardInfo[] = [];
    for (let i = 0; i < accounts.length; i++) {
      const rewardData = rewardsData[i];
      const recipientData = recipientsData?.[i];

      if (rewardData?.status === 'success' && rewardData.result) {
        const [amount, isMinted] = rewardData.result as [bigint, boolean];

        // 检查是否设置了二次分配地址
        // 如果 actionIdsWithRecipients 返回的列表不为空，就是设置了
        let hasRecipients = false;
        if (recipientData?.status === 'success' && recipientData.result) {
          const actionIds = recipientData.result as bigint[];
          hasRecipients = Array.isArray(actionIds) && actionIds.length > 0;
        }

        result.push({
          account: accounts[i],
          amount: safeToBigInt(amount),
          isMinted,
          hasRecipients,
        });
      }
    }
    return result;
  }, [rewardsData, recipientsData, accounts]);

  // ==========================================
  // 计算最终状态
  // ==========================================
  const isPending = useMemo(() => {
    // 账户列表加载中
    if (isAccountsPending) return true;
    // 账户列表为空，无需等待激励查询
    if (accounts.length === 0) return false;
    // 等待激励数据和二次分配地址查询完成
    return isRewardsPending || isRecipientsPending;
  }, [isAccountsPending, accounts.length, isRewardsPending, isRecipientsPending]);

  const error = accountsError || rewardsError || recipientsError;

  // ==========================================
  // 返回结果
  // ==========================================
  return {
    accountRewards,
    totalCount: count,
    isPending,
    error,
  };
}

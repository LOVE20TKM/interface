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
  /** 铸造激励 */
  mintReward: bigint;
  /** 销毁激励 */
  burnReward: bigint;
  /** 是否已领取 */
  claimed: boolean;
  /** 是否设置了二次分配地址 */
  hasRecipients: boolean;
  /** 链群铸币量 */
  generatedAmount: bigint;
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
  // 第二步：批量查询每个地址的激励、二次分配设置、链群铸币量（合并为一次查询）
  // ==========================================
  const allContracts = useMemo(() => {
    // 如果扩展地址未获取到，或参与者列表为空，返回空数组
    if (!extensionAddress || !round || accounts.length === 0) {
      return [];
    }

    // 为每个账户构建三个查询：激励信息、二次分配设置、链群铸币量
    const contracts = [];
    for (const account of accounts) {
      // 1. rewardByAccount - 获取激励信息
      contracts.push({
        address: extensionAddress,
        abi: ExtensionGroupServiceAbi,
        functionName: 'rewardByAccount' as const,
        args: [round, account] as const,
      });
      // 2. actionIdsWithRecipients - 获取二次分配设置
      contracts.push({
        address: extensionAddress,
        abi: ExtensionGroupServiceAbi,
        functionName: 'actionIdsWithRecipients' as const,
        args: [account, round] as const,
      });
      // 3. generatedActionRewardByVerifier - 获取链群铸币量
      contracts.push({
        address: extensionAddress,
        abi: ExtensionGroupServiceAbi,
        functionName: 'generatedActionRewardByVerifier' as const,
        args: [account, round] as const,
      });
    }
    return contracts;
  }, [extensionAddress, round, accounts]);

  const {
    data: allData,
    isPending: isAllDataPending,
    error: allDataError,
  } = useReadContracts({
    contracts: allContracts,
    query: {
      // 只有在扩展地址、轮次、账户列表都就绪时才启用
      enabled: !!extensionAddress && !!round && accounts.length > 0 && allContracts.length > 0,
    },
  });

  // ==========================================
  // 解析激励数据、二次分配设置和链群铸币量
  // ==========================================
  const accountRewards = useMemo(() => {
    // 如果没有数据或账户列表为空，返回空数组
    if (!allData || accounts.length === 0) {
      return [];
    }

    // 解析每个账户的查询结果
    // 每个账户对应 3 个连续的查询结果：rewardByAccount, actionIdsWithRecipients, generatedActionRewardByVerifier
    const result: AccountRewardInfo[] = [];
    for (let i = 0; i < accounts.length; i++) {
      const rewardIndex = i * 3; // 激励信息索引
      const recipientIndex = i * 3 + 1; // 二次分配设置索引
      const generatedIndex = i * 3 + 2; // 链群铸币量索引

      const rewardData = allData[rewardIndex];
      const recipientData = allData[recipientIndex];
      const generatedData = allData[generatedIndex];

      if (rewardData?.status === 'success' && rewardData.result) {
        // rewardByAccount 返回 (mintReward, burnReward, claimed)
        const [mintReward, burnReward, claimed] = rewardData.result as [bigint, bigint, boolean];

        // 解析二次分配设置
        // 如果 actionIdsWithRecipients 返回的列表不为空，就是设置了
        let hasRecipients = false;
        if (recipientData?.status === 'success' && recipientData.result) {
          const actionIds = recipientData.result as unknown as bigint[];
          hasRecipients = Array.isArray(actionIds) && actionIds.length > 0;
        }

        // 解析链群铸币量
        let generatedAmount = BigInt(0);
        if (generatedData?.status === 'success' && generatedData.result) {
          generatedAmount = safeToBigInt(generatedData.result);
        }

        result.push({
          account: accounts[i],
          mintReward: safeToBigInt(mintReward),
          burnReward: safeToBigInt(burnReward),
          claimed,
          hasRecipients,
          generatedAmount,
        });
      }
    }
    return result;
  }, [allData, accounts]);

  // ==========================================
  // 计算最终状态
  // ==========================================
  const isPending = useMemo(() => {
    // 账户列表加载中
    if (isAccountsPending) return true;
    // 账户列表为空，无需等待数据查询
    if (accounts.length === 0) return false;
    // 等待合并后的批量数据查询完成
    return isAllDataPending;
  }, [isAccountsPending, accounts.length, isAllDataPending]);

  const error = accountsError || allDataError;

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

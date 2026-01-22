// hooks/extension/plugins/group/composite/useGetInfoForJoin.ts
// 批量获取加入链群所需的所有信息

import { useMemo } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';
import { LOVE20JoinAbi } from '@/src/abis/LOVE20Join';
import { LOVE20VoteAbi } from '@/src/abis/LOVE20Vote';
import { GroupJoinAbi } from '@/src/abis/GroupJoin';
import { LOVE20TokenAbi } from '@/src/abis/LOVE20Token';
import { ExtensionCenterAbi } from '@/src/abis/ExtensionCenter';
import { safeToBigInt } from '@/src/lib/clientUtils';

const JOIN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_JOIN as `0x${string}`;
const VOTE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_VOTE as `0x${string}`;
const EXTENSION_CENTER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_CENTER as `0x${string}`;

// ==================== 类型定义 ====================

/**
 * Hook 参数
 */
export interface UseGetInfoForJoinParams {
  /** Token 地址 */
  tokenAddress: `0x${string}` | undefined;
  /** 扩展合约地址 */
  extensionAddress: `0x${string}` | undefined;
  /** 账户地址 */
  account: `0x${string}` | undefined;
  /** Action ID */
  actionId: bigint | undefined;
  /** 加入代币地址（从 useExtensionsByActionIdsWithCache 获取） */
  joinTokenAddress: `0x${string}` | undefined;
  /** 验证信息的 key 列表（从 actionInfo 获取） */
  verificationKeys: string[] | undefined;
  /** GroupJoin 合约地址 */
  groupJoinContractAddress: `0x${string}`;
}

/**
 * Hook 返回值
 */
export interface UseGetInfoForJoinResult {
  /** 当前轮次 */
  currentRound: bigint | undefined;
  /** 行动是否已投票 */
  isActionIdVoted: boolean | undefined;
  /** 已加入的代币数量（从 joinInfo 中提取） */
  joinedAmount: bigint | undefined;
  /** 代币余额 */
  balance: bigint | undefined;
  /** 已授权数量 */
  allowance: bigint | undefined;
  /** 验证信息列表（与 verificationKeys 顺序一一对应） */
  verificationInfos: (string | undefined)[];
  /** 加载状态 */
  isPending: boolean;
  /** 授权额度加载状态（单独返回，用于 UI 响应） */
  isPendingAllowance: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 刷新授权额度的方法 */
  refetchAllowance: () => void;
}

// ==================== Hook 实现 ====================

/**
 * 批量获取加入链群所需的所有信息
 *
 * 功能：
 * 1. 获取当前轮次（单独调用，因为 isActionIdVoted 依赖它）
 * 2. 批量获取：投票状态、加入信息、代币余额、授权额度、验证信息
 * 3. 使用 useReadContracts 优化网络请求
 *
 * @param params - Hook 参数
 * @returns 所有需要的信息及加载状态
 */
export function useGetInfoForJoin(params: UseGetInfoForJoinParams): UseGetInfoForJoinResult {
  const {
    tokenAddress,
    extensionAddress,
    account,
    actionId,
    joinTokenAddress,
    verificationKeys,
    groupJoinContractAddress,
  } = params;

  // ==========================================
  // 步骤1：先获取 currentRound（单独调用，因为 isActionIdVoted 依赖它）
  // ==========================================
  const {
    data: currentRoundData,
    isPending: isPendingCurrentRound,
    error: errorCurrentRound,
  } = useReadContract({
    address: JOIN_CONTRACT_ADDRESS,
    abi: LOVE20JoinAbi,
    functionName: 'currentRound',
    query: {
      enabled: true,
    },
  });

  const currentRound = useMemo(() => {
    return currentRoundData ? safeToBigInt(currentRoundData) : undefined;
  }, [currentRoundData]);

  // ==========================================
  // 步骤2：单独调用 allowance 以保留 refetch 功能
  // ==========================================
  const {
    data: allowanceData,
    isPending: isPendingAllowance,
    error: errorAllowance,
    refetch: refetchAllowance,
  } = useReadContract({
    address: joinTokenAddress,
    abi: LOVE20TokenAbi,
    functionName: 'allowance',
    args: [account as `0x${string}`, groupJoinContractAddress],
    query: {
      enabled: !!joinTokenAddress && !!account,
    },
  });

  const allowance = useMemo(() => {
    return allowanceData ? safeToBigInt(allowanceData) : undefined;
  }, [allowanceData]);

  // ==========================================
  // 步骤3：构建批量合约调用配置（不包括 allowance）
  // ==========================================
  const contracts = useMemo(() => {
    const contractList: any[] = [];

    // 只有在必要参数都存在时才构建调用
    if (!extensionAddress || !account) {
      return [];
    }

    // 1. isActionIdVoted - 需要 currentRound
    if (tokenAddress && currentRound !== undefined && actionId !== undefined) {
      contractList.push({
        address: VOTE_CONTRACT_ADDRESS,
        abi: LOVE20VoteAbi,
        functionName: 'isActionIdVoted' as const,
        args: [tokenAddress, currentRound, actionId] as const,
      });
    }

    // 2. joinInfo - 获取加入信息
    contractList.push({
      address: groupJoinContractAddress,
      abi: GroupJoinAbi,
      functionName: 'joinInfo' as const,
      args: [extensionAddress, account] as const,
    });

    // 3. balanceOf - 需要 joinTokenAddress
    if (joinTokenAddress) {
      contractList.push({
        address: joinTokenAddress,
        abi: LOVE20TokenAbi,
        functionName: 'balanceOf' as const,
        args: [account] as const,
      });
    }

    // 4. verificationInfos - 为每个 verificationKey 构建一个调用
    if (verificationKeys && verificationKeys.length > 0 && tokenAddress && actionId !== undefined) {
      verificationKeys.forEach((key) => {
        contractList.push({
          address: EXTENSION_CENTER_ADDRESS,
          abi: ExtensionCenterAbi,
          functionName: 'verificationInfo' as const,
          args: [tokenAddress, actionId, account, key] as const,
        });
      });
    }

    return contractList;
  }, [
    extensionAddress,
    account,
    tokenAddress,
    currentRound,
    actionId,
    joinTokenAddress,
    verificationKeys,
    groupJoinContractAddress,
  ]);

  // ==========================================
  // 步骤4：批量调用合约（不包括 allowance）
  // ==========================================
  const {
    data: batchData,
    isPending: isPendingBatch,
    error: errorBatch,
  } = useReadContracts({
    contracts,
    query: {
      enabled: contracts.length > 0 && extensionAddress !== undefined && account !== undefined,
    },
  });

  // ==========================================
  // 步骤5：解析返回数据
  // ==========================================
  // 计算各个数据在 batchData 中的索引（基于 contracts 数组的结构）
  const indices = useMemo(() => {
    let index = 0;
    const hasIsActionIdVoted = tokenAddress && currentRound !== undefined && actionId !== undefined;
    const isActionIdVotedIndex = hasIsActionIdVoted ? index++ : -1;
    const joinInfoIndex = index++;
    const balanceIndex = joinTokenAddress ? index++ : -1;
    const verificationInfosStartIndex = index;

    return {
      isActionIdVotedIndex,
      joinInfoIndex,
      balanceIndex,
      verificationInfosStartIndex,
    };
  }, [tokenAddress, currentRound, actionId, joinTokenAddress]);

  // 1. isActionIdVoted
  const isActionIdVoted = useMemo(() => {
    if (indices.isActionIdVotedIndex < 0 || !batchData || indices.isActionIdVotedIndex >= batchData.length) {
      return undefined;
    }
    const result = batchData[indices.isActionIdVotedIndex];
    return result?.status === 'success' ? (result.result as boolean) : undefined;
  }, [batchData, indices.isActionIdVotedIndex]);

  // 2. joinInfo
  const joinInfoData = useMemo(() => {
    if (!batchData || indices.joinInfoIndex >= batchData.length) return undefined;
    const result = batchData[indices.joinInfoIndex];
    return result?.status === 'success' ? (result.result as [bigint, bigint, bigint, `0x${string}`]) : undefined;
  }, [batchData, indices.joinInfoIndex]);

  const joinedAmount = useMemo(() => {
    return joinInfoData ? safeToBigInt(joinInfoData[1]) : undefined;
  }, [joinInfoData]);

  // 3. balanceOf
  const balance = useMemo(() => {
    if (!joinTokenAddress || indices.balanceIndex < 0) return undefined;
    if (!batchData || indices.balanceIndex >= batchData.length) return undefined;
    const result = batchData[indices.balanceIndex];
    return result?.status === 'success' ? safeToBigInt(result.result) : undefined;
  }, [batchData, indices.balanceIndex, joinTokenAddress]);

  // 4. verificationInfos
  const verificationInfos = useMemo(() => {
    if (!verificationKeys || verificationKeys.length === 0) {
      return [];
    }
    if (!batchData || indices.verificationInfosStartIndex < 0) {
      return Array(verificationKeys.length).fill(undefined);
    }

    return verificationKeys.map((_, index) => {
      const resultIndex = indices.verificationInfosStartIndex + index;
      if (resultIndex >= batchData.length) return undefined;
      const result = batchData[resultIndex];
      return result?.status === 'success' ? (result.result as string) : undefined;
    });
  }, [batchData, indices.verificationInfosStartIndex, verificationKeys]);

  // ==========================================
  // 步骤6：合并加载状态和错误
  // ==========================================
  const isPending = isPendingCurrentRound || isPendingBatch || isPendingAllowance;
  const error = errorCurrentRound || errorBatch || errorAllowance || null;

  // ==========================================
  // 返回结果
  // ==========================================
  return {
    currentRound,
    isActionIdVoted,
    joinedAmount,
    balance,
    allowance,
    verificationInfos,
    isPending,
    isPendingAllowance,
    error,
    refetchAllowance: refetchAllowance || (() => {}),
  };
}

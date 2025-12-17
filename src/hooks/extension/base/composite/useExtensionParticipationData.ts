/**
 * 扩展行动参与数据查询 Hook
 *
 * 职责：
 * - 查询扩展合约的公共统计数据（参与人数、总金额）
 * - 查询用户在扩展行动中的参与状态（参与金额、是否已参与）
 * - 使用批量调用优化性能
 *
 * 使用示例：
 * ```typescript
 * const { participantCount, totalAmount, userJoinedAmount, isJoined } =
 *   useExtensionParticipationData(extensionAddress, tokenAddress, actionId, account);
 * ```
 */

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { LOVE20ExtensionLpAbi } from '@/src/abis/LOVE20ExtensionLp';
import { LOVE20ExtensionCenterAbi } from '@/src/abis/LOVE20ExtensionCenter';
import { safeToBigInt } from '@/src/lib/clientUtils';

const EXTENSION_CENTER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_CENTER as `0x${string}`;

// ==================== 类型定义 ====================

/**
 * 扩展行动参与数据
 */
export interface ExtensionParticipationData {
  /** 参与者数量 */
  participantCount: bigint | undefined;
  /** 总参与金额 */
  totalAmount: bigint | undefined;
  /** 用户参与金额 */
  userJoinedAmount: bigint | undefined;
  /** 用户是否已参与 */
  isJoined: boolean;
  /** 加载状态 */
  isPending: boolean;
  /** 错误信息 */
  error: Error | null;
}

// ==================== Hook 实现 ====================

/**
 * 获取扩展行动的参与数据
 *
 * @param extensionAddress - 扩展合约地址
 * @param tokenAddress - 代币地址
 * @param actionId - 行动 ID
 * @param account - 用户地址（可选，不传则不查询用户相关数据）
 * @returns 扩展行动的参与数据
 *
 * @description
 * 批量查询 4 个合约方法：
 * 1. accountsCount - 参与者数量（从扩展合约）
 * 2. joinedValue - 总参与金额（从扩展合约）
 * 3. joinedValueByAccount - 用户参与金额（从扩展合约，需要 account）
 * 4. isAccountJoined - 是否已参与（从 ExtensionCenter，需要 account）
 */
export function useExtensionParticipationData(
  extensionAddress: `0x${string}` | undefined,
  tokenAddress: `0x${string}` | undefined,
  actionId: bigint | undefined,
  account?: `0x${string}` | undefined,
): ExtensionParticipationData {
  // ==========================================
  // 构建批量查询合约配置
  // ==========================================
  const contracts = useMemo(() => {
    const contractCalls = [
      // 1. 查询参与者数量（公共数据，始终查询）
      {
        address: EXTENSION_CENTER_ADDRESS,
        abi: LOVE20ExtensionCenterAbi,
        functionName: 'accountsCount' as const,
        args: [tokenAddress, actionId],
      },
      // 2. 查询总参与金额（公共数据，始终查询）
      {
        address: extensionAddress,
        abi: LOVE20ExtensionLpAbi,
        functionName: 'joinedValue' as const,
      },
      // 3. 查询用户参与金额（需要 account）
      {
        address: extensionAddress,
        abi: LOVE20ExtensionLpAbi,
        functionName: 'joinedValueByAccount' as const,
        args: account ? [account] : undefined,
      },
      // 4. 查询用户是否已参与（需要 account + tokenAddress + actionId）
      {
        address: EXTENSION_CENTER_ADDRESS,
        abi: LOVE20ExtensionCenterAbi,
        functionName: 'isAccountJoined' as const,
        args: tokenAddress && actionId !== undefined && account ? [tokenAddress, actionId, account] : undefined,
      },
    ];

    return contractCalls;
  }, [extensionAddress, tokenAddress, actionId, account]);

  // ==========================================
  // 批量调用合约
  // ==========================================
  const { data, isPending, error } = useReadContracts({
    contracts,
    query: {
      enabled: !!extensionAddress,
    },
  });

  // ==========================================
  // 解析返回数据
  // ==========================================
  const participantCount = useMemo(() => {
    return data?.[0]?.status === 'success' ? safeToBigInt(data[0].result) : undefined;
  }, [data]);

  const totalAmount = useMemo(() => {
    return data?.[1]?.status === 'success' ? safeToBigInt(data[1].result) : undefined;
  }, [data]);

  const userJoinedAmount = useMemo(() => {
    // 如果没有传 account，返回 undefined
    if (!account) return undefined;
    return data?.[2]?.status === 'success' ? safeToBigInt(data[2].result) : undefined;
  }, [data, account]);

  const isJoined = useMemo(() => {
    // 如果没有传 account 或必要参数，返回 false
    if (!account || !tokenAddress || actionId === undefined) return false;
    return data?.[3]?.status === 'success' ? (data[3].result as boolean) : false;
  }, [data, account, tokenAddress, actionId]);

  // ==========================================
  // 返回结果
  // ==========================================
  return {
    participantCount,
    totalAmount,
    userJoinedAmount,
    isJoined,
    isPending,
    error: error || null,
  };
}

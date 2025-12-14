/**
 * 账户验证信息批量查询 Hook
 *
 * 职责：
 * - 批量查询账户在扩展合约中提供的所有验证信息
 * - 使用 useReadContracts 优化多个验证 key 的查询性能
 * - 返回 key-value 对应的验证信息列表
 *
 * 使用示例：
 * ```typescript
 * const { verificationInfos, isPending, error } = useAccountVerificationInfos({
 *   extensionAddress: '0x...',
 *   account: '0x...',
 *   verificationKeys: ['微信', '邮箱', '电话']
 * });
 * // verificationInfos: ['wx123', 'test@example.com', '13800138000']
 * ```
 */

import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { VerificationInfoAbi } from '@/src/abis/VerificationInfo';

// ==================== 类型定义 ====================

/**
 * Hook 参数
 */
export interface UseAccountVerificationInfosParams {
  /** 扩展合约地址 */
  extensionAddress: `0x${string}` | undefined;
  /** 账户地址 */
  account: `0x${string}` | undefined;
  /** 验证信息的 key 列表（如：['微信', '邮箱', '电话']） */
  verificationKeys: string[] | undefined;
}

/**
 * Hook 返回值
 */
export interface UseAccountVerificationInfosResult {
  /** 验证信息列表（与 verificationKeys 顺序一一对应） */
  verificationInfos: (string | undefined)[];
  /** 加载状态 */
  isPending: boolean;
  /** 错误信息 */
  error: Error | null;
}

// ==================== Hook 实现 ====================

/**
 * 批量获取账户的验证信息
 *
 * @param params - Hook 参数
 * @returns 账户的验证信息列表及加载状态
 *
 * @description
 * 对每个 verificationKey，调用扩展合约的 verificationInfo(account, key) 方法
 * 使用 useReadContracts 批量查询，提升性能
 *
 * @example
 * ```typescript
 * // 查询用户的微信、邮箱、电话验证信息
 * const { verificationInfos, isPending } = useAccountVerificationInfos({
 *   extensionAddress: '0x123...',
 *   account: '0xabc...',
 *   verificationKeys: ['微信', '邮箱', '电话']
 * });
 *
 * if (!isPending && verificationInfos[0]) {
 *   console.log('微信:', verificationInfos[0]);
 *   console.log('邮箱:', verificationInfos[1]);
 *   console.log('电话:', verificationInfos[2]);
 * }
 * ```
 */
export function useAccountVerificationInfos(
  params: UseAccountVerificationInfosParams,
): UseAccountVerificationInfosResult {
  const { extensionAddress, account, verificationKeys } = params;

  // ==========================================
  // 构建批量查询合约配置
  // ==========================================
  const contracts = useMemo(() => {
    // 如果没有 verificationKeys 或为空数组，返回空数组
    if (!verificationKeys || verificationKeys.length === 0) {
      return [];
    }

    // 为每个 verificationKey 构建一个查询配置
    return verificationKeys.map((key) => ({
      address: extensionAddress,
      abi: VerificationInfoAbi,
      functionName: 'verificationInfo' as const,
      args: account && key ? [account, key] : undefined,
    }));
  }, [extensionAddress, account, verificationKeys]);

  // ==========================================
  // 批量调用合约
  // ==========================================
  const { data, isPending, error } = useReadContracts({
    contracts,
    query: {
      // 只有在所有必要参数都存在且有 key 需要查询时才启用
      enabled: !!extensionAddress && !!account && !!verificationKeys && verificationKeys.length > 0,
    },
  });

  // ==========================================
  // 解析返回数据
  // ==========================================
  const verificationInfos = useMemo(() => {
    // 如果没有 verificationKeys，返回空数组
    if (!verificationKeys || verificationKeys.length === 0) {
      return [];
    }

    // 如果没有数据，返回对应长度的 undefined 数组
    if (!data) {
      return Array(verificationKeys.length).fill(undefined);
    }

    // 解析每个查询结果
    return verificationKeys.map((_, index) => {
      const result = data[index];
      if (result?.status === 'success') {
        return result.result as string;
      }
      return undefined;
    });
  }, [data, verificationKeys]);

  // ==========================================
  // 返回结果
  // ==========================================
  return {
    verificationInfos,
    isPending,
    error: error || null,
  };
}

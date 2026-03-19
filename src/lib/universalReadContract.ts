// src/lib/universalReadContract.ts
import { useReadContract, useReadContracts } from 'wagmi';
import { useEffect } from 'react';
import { useContractError } from '@/src/errors/useContractError';

// 利用 typeof 保留 wagmi 原始泛型签名
type UseReadContractFn = typeof useReadContract;
type UseReadContractsFn = typeof useReadContracts;

/**
 * 统一的合约读取 Hook
 * 包装 wagmi 的 useReadContract，自动处理错误（解析、展示到全局 ErrorContext、上报 Sentry）
 *
 * 用法与 useReadContract 完全一致，可无缝替换
 */
export const useUniversalReadContract: UseReadContractFn = ((parameters?: any) => {
  const result = useReadContract(parameters);
  const { handleError } = useContractError();

  // 自动处理合约读取错误
  useEffect(() => {
    if (result.error) {
      handleError(result.error);
    }
  }, [result.error, handleError]);

  return result;
}) as UseReadContractFn;

/**
 * 统一的合约批量读取 Hook
 * 包装 wagmi 的 useReadContracts，自动处理错误
 *
 * 用法与 useReadContracts 完全一致，可无缝替换
 */
export const useUniversalReadContracts: UseReadContractsFn = ((parameters?: any) => {
  const result = useReadContracts(parameters);
  const { handleError } = useContractError();

  // 自动处理合约批量读取错误
  useEffect(() => {
    if (result.error) {
      handleError(result.error);
    }
  }, [result.error, handleError]);

  return result;
}) as UseReadContractsFn;

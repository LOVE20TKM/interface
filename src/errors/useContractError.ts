/**
 * 合约错误处理 React Hook
 *
 * 使用方式：
 * ```tsx
 * const { handleError } = useContractError();
 *
 * try {
 *   await contract.write.stake(...);
 * } catch (error) {
 *   handleError(error);
 * }
 * ```
 */

import { useCallback } from 'react';
import * as Sentry from '@sentry/nextjs';
import { useError } from '@/src/contexts/ErrorContext';
import { parseContractError, extractErrorMessage } from './contractErrorParser';

/**
 * 合约错误处理 Hook
 * 无需传入 contractKey，自动解析所有合约错误
 */
export function useContractError() {
  const { setError } = useError();

  const handleError = useCallback(
    (error: unknown) => {
      console.error('Contract error:', error);

      // 解析错误
      const parsedError = parseContractError(error);

      // null 表示用户取消交易，不设置错误
      if (parsedError === null) {
        console.log('用户取消了交易');
        return;
      }

      console.error('Parsed error:', parsedError);

      // 设置错误到全局上下文
      setError(parsedError);

      // 上报到 Sentry（非用户取消的错误）
      if (!parsedError.message.includes('用户取消')) {
        try {
          Sentry.captureException(error ?? new Error(parsedError.message), {
            level: 'error',
            tags: {
              source: 'useContractError',
            },
            extra: {
              parsedError,
              rawErrorMessage: extractErrorMessage(error),
            },
          });
        } catch (sentryError) {
          console.warn('Sentry capture failed:', sentryError);
        }
      }
    },
    [setError]
  );

  return { handleError };
}

// src/lib/universalTransaction.ts
import { useState, useEffect } from 'react';
import { useWaitForTransactionReceipt } from 'wagmi';
import { simulateContract, writeContract } from '@wagmi/core';
import { config } from '@/src/wagmi';
import { isTukeWallet, sendTransactionForTuke, waitForTukeTransaction } from './tukeWalletUtils';
import { checkWalletNetworkStatus } from '@/src/lib/web3';
import { useContractError } from '@/src/errors/useContractError';
import {
  isAbiDecodingError,
  fetchRawCallData,
  tryDecodeRevertData,
  ContractRevertError,
} from '@/src/lib/revertDecoder';

/**
 * 统一交易发送函数
 * 根据钱包类型选择合适的发送方式
 */
export const sendUniversalTransaction = async (
  abi: readonly any[],
  address: `0x${string}`,
  functionName: string,
  args: any[] = [],
  value?: bigint,
  options?: {
    skipSimulation?: boolean; // 跳过模拟调用
  },
) => {
  if (isTukeWallet()) {
    // TUKE钱包模式：使用ethers.js直接发送
    console.log('使用TUKE钱包模式发送交易');
    return await sendTransactionForTuke(abi, address, functionName, args, value, options);
  } else {
    // 标准钱包模式：simulate + write
    const isDebug =
      typeof window !== 'undefined' &&
      !!localStorage.getItem('debug') &&
      localStorage.getItem('debug') !== '0' &&
      localStorage.getItem('debug') !== 'false';

    if (!options?.skipSimulation && !isDebug) {
      console.log('步骤1: (标准模式)执行模拟调用 验证交易...');

      try {
        await simulateContract(config, {
          address,
          abi,
          functionName,
          args,
          value,
        });
      } catch (simError: unknown) {
        if (isAbiDecodingError(simError)) {
          // 非标准 RPC：revert data 被当作成功返回，尝试恢复并解码
          const rawData = await fetchRawCallData(config, address, abi, functionName, args, value);
          if (rawData) {
            const decoded = tryDecodeRevertData(rawData, abi);
            if (decoded) {
              const selector = rawData.slice(0, 10) as `0x${string}`;
              throw new ContractRevertError(decoded.errorName, decoded.args, selector);
            }
          }
        }
        throw simError;
      }
    } else if (isDebug) {
      console.log('步骤1: [DEBUG] 跳过模拟调用');
    }

    console.log('步骤2: (标准模式)执行真实交易...');
    return await writeContract(config, {
      address,
      abi,
      functionName,
      args,
      value,
    });
  }
};

/**
 * 统一的交易处理Hook
 * 封装交易发送和确认逻辑
 */
export function useUniversalTransaction(
  abi: readonly any[],
  address: `0x${string}`,
  functionName: string,
  options?: {
    skipSimulation?: boolean; // 跳过模拟调用
  },
) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isManuallyConfirmed, setIsManuallyConfirmed] = useState(false);

  const isTuke = isTukeWallet();
  const { handleError } = useContractError();

  // 对于非TUKE钱包，使用标准的useWaitForTransactionReceipt
  const {
    isLoading: wagmiIsConfirming,
    isSuccess: wagmiIsConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: !isTuke && hash ? hash : undefined, // 只有非TUKE钱包才使用
  });

  // 统一的交易执行函数
  const execute = async (args: any[] = [], value?: bigint) => {
    setIsPending(true);
    setError(null);
    setIsManuallyConfirmed(false);
    setIsConfirming(false);

    try {
      // 交易前网络检查
      const networkStatus = await checkWalletNetworkStatus();
      if (!networkStatus.isValid) {
        const errorMsg = `网络不匹配！请切换到 ${process.env.NEXT_PUBLIC_CHAIN_NAME} 网络`;
        const networkError = new Error(errorMsg);
        setError(networkError);
        throw networkError;
      }

      console.log(`发送交易: ${functionName}`, { args, value });
      const txHash = await sendUniversalTransaction(abi, address, functionName, args, value, options);
      setIsPending(false);

      console.log('交易发送成功:', txHash);
      setHash(txHash);

      if (isTuke) {
        console.log('TUKE钱包模式：开始等待交易确认');
        setIsConfirming(true);

        try {
          const receipt = await waitForTukeTransaction(txHash);
          console.log('TUKE交易确认成功:', receipt);
          setIsManuallyConfirmed(true);
        } catch (confirmErr) {
          console.error('TUKE交易确认失败:', confirmErr);
          setError(confirmErr as Error);
          setIsManuallyConfirmed(false);
          throw confirmErr;
        } finally {
          setIsConfirming(false);
        }
      }

      return txHash;
    } catch (err: any) {
      console.error('交易发送失败:', err);
      setError(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  // 统一的确认状态（TUKE手动确认 + 标准wagmi确认）
  const finalIsConfirming = isTuke ? isConfirming : wagmiIsConfirming;
  const finalIsConfirmed = isTuke ? isManuallyConfirmed : wagmiIsConfirmed;
  const finalConfirmError = isTuke ? null : confirmError;

  // 合并错误
  const combinedError = error ?? finalConfirmError;

  // 自动处理合约错误：解析、展示到全局 ErrorContext、上报 Sentry
  useEffect(() => {
    if (combinedError) {
      handleError(combinedError);
    }
  }, [combinedError, handleError]);

  return {
    execute,
    isPending,
    isConfirming: finalIsConfirming,
    isConfirmed: finalIsConfirmed,
    error: combinedError,
    hash,
    isTukeMode: isTuke,
  };
}

/**
 * 简化版本：创建特定合约函数的Hook工厂
 */
export const createUniversalHook = (abi: readonly any[], contractAddress: `0x${string}`, functionName: string) => {
  return () => {
    return useUniversalTransaction(abi, contractAddress, functionName);
  };
};

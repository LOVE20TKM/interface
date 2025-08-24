// src/utils/errorUtils.ts

import { ContractErrorsMaps, getErrorNameFromSelector } from '@/src/errors';
import * as Sentry from '@sentry/nextjs';
import { ErrorInfo } from '@/src/contexts/ErrorContext';
import { useError } from '@/src/contexts/ErrorContext';
import { useCallback } from 'react';

/**
 * 从 MetaMask 错误信息中解析核心的错误原因
 *
 * @param error 错误信息
 * @returns 解析出的核心错误信息
 */
function _parseMetaMaskError(error: string): string {
  /***
   * 新版本错误格式示例：
     TransactionExecutionError: User rejected the request.
     Details: MetaMask Tx Signature: User denied transaction signature.
   * 
   * 旧版本错误格式示例：
     error TransactionExecutionError: User rejected the request.
      Details: MetaMask Tx Signature: User denied transaction signature.
   */

  // 检查新版本格式：直接包含 "User rejected the request"
  const userRejectedMatch = error.match(/User rejected the request/);
  if (userRejectedMatch) {
    return '用户取消了交易';
  }

  // 检查详细信息中的用户拒绝签名
  const errorMatch = error.match(/User denied transaction signature/);
  if (errorMatch) {
    return '用户取消了交易';
  }

  // 检查其他可能的用户拒绝格式
  const userDeniedMatch = error.match(/User denied|User rejected|rejected by user|denied by user/i);
  if (userDeniedMatch) {
    return '用户取消了交易';
  }

  return '';
}

/**
 * 从 Solidity 合约调用错误信息中解析核心的错误原因
 *
 * @param errorLog 整段合约调用返回的错误字符串
 * @returns 解析出的核心错误信息
 */
function _parseOriginalRevertMessage(errorLog: string): string {
  /**
   * 示例错误日志：
    ```
    The contract function "stakeLiquidity" reverted.

    Error: InvalidToAddress()
    
    Contract Call:
      address:   0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
      function:  stakeLiquidity(address tokenAddress, uint256 tokenAmountForLP, uint256 parentTokenAmountForLP, uint256 promisedWaitingPhases, address to)
      args:                    (0x75537828f2ce51be7289709686A69CbFDbB714F1, 10000000000000000000000000000, 1000000000000000000, 4, 0x0000000000000000000000000000000000000000)
      sender:    0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

    Docs: https://viem.sh/docs/contract/simulateContract
    Version: viem@2.17.0
    ```
  */
  const errorMatch = errorLog.split('\n').find((line) => line.trim().startsWith('Error:'));
  if (errorMatch) {
    const reason = errorMatch.split('Error:')[1]?.trim();
    if (reason) {
      return reason;
    }
  }

  /**
   * 示例错误日志：
    ```
    The contract function "stakeLiquidity" reverted with the following reason:
    ERC20: transfer amount exceeds balance

    Contract Call:
      address:   0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
      function:  stakeLiquidity(address tokenAddress, uint256 tokenAmountForLP, uint256 parentTokenAmountForLP, uint256 promisedWaitingPhases, address to)
      args:                    (0x75537828f2ce51be7289709686A69CbFDbB714F1, 10000000000000000000000000000, 1000000000000000000, 4, 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)
      sender:    0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

    Docs: https://viem.sh/docs/contract/simulateContract
    Version: viem@2.17.0
    ```
  */
  const lines = errorLog.split('\n');
  const reasonIndex = lines.findIndex((line) => line.includes('the following reason:'));
  if (reasonIndex !== -1 && reasonIndex + 1 < lines.length) {
    const reason = lines[reasonIndex + 1].trim();
    if (reason) {
      return reason;
    }
  }

  // 如果都没有匹配上，则返回一个默认提示
  return '';
}

/**
 * 检查是否为网络超时错误
 */
function _parseTimeoutError(error: string): string {
  const timeoutPatterns = [
    /took too long to respond/i,
    /request timed out/i,
    /The request took too long/i,
    /timeout/i,
    /ETIMEDOUT/i,
    /Request timeout/i,
  ];

  for (const pattern of timeoutPatterns) {
    if (pattern.test(error)) {
      return '网络请求超时，这在移动端比较常见。请检查网络连接后重试，或稍后再试。';
    }
  }
  return '';
}

/**
 * 解析 TransactionExecutionError 格式的错误
 * 新版本viem会产生这种格式的错误
 */
function _parseTransactionExecutionError(error: string): string {
  /**
   * 示例错误格式：
   * TransactionExecutionError: User rejected the request.
   *
   * Request Arguments:
   *   from:  0x6ce7A032693E5Ead4cD8B980026f1BA96A72C7ff
   *   to:    0xD4506737c861697EB3B3616ee0E31c835a4432B2
   *   data:  0xfe43a47e...
   *
   * Details: MetaMask Tx Signature: User denied transaction signature.
   * Version: viem@2.17.0
   */

  // 检查是否是TransactionExecutionError
  if (!error.includes('TransactionExecutionError')) {
    return '';
  }

  // 提取主要错误信息（第一行的冒号后面的内容）
  const lines = error.split('\n');
  if (lines.length > 0) {
    const firstLine = lines[0];
    const match = firstLine.match(/TransactionExecutionError:\s*(.+)$/);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return '';
}

/**
 * 根据 solidity revert 自定义错误，返回可读的中文错误提示。
 *
 * @param error  错误信息
 * @param contractKey 用来区分合约的 key，必须在 ContractErrorsMaps 中存在
 * @returns 可读错误文案，若无法匹配则返回 "未知错误"
 */
export function getReadableRevertErrMsg(error: string, contractKey: string): ErrorInfo {
  const rawMessage: string = error ?? '';

  // 0.优先检查网络超时错误
  const timeoutError = _parseTimeoutError(rawMessage);
  if (timeoutError) {
    return { name: '网络超时', message: timeoutError };
  }

  // 0.5.检查TransactionExecutionError格式 (新增)
  const transactionError = _parseTransactionExecutionError(rawMessage);
  if (transactionError) {
    // 如果是用户拒绝，返回特定提示
    if (transactionError.includes('User rejected') || transactionError.includes('User denied')) {
      return { name: '交易提示', message: '用户取消了交易' };
    }
    // 其他TransactionExecutionError，返回原始错误信息
    return { name: '交易错误', message: transactionError };
  }

  // 0.6.检查用户取消错误
  const metaMaskError = _parseMetaMaskError(rawMessage);
  if (metaMaskError) {
    return { name: '交易提示', message: metaMaskError };
  }

  // 1.优先检查是否是十六进制错误选择器格式，使用更精确的匹配模式
  // 示例格式：
  // - "Data:   0xd6e1a062 (4 bytes)"  (Viem 错误格式)
  // - 'data: "0xa748da06"'            (JSON-RPC 错误格式)
  // - "0xa748da06"                    (直接错误选择器)
  // - "execution reverted, data: 0xa748da06"  (其他格式)

  let selector = '';

  // 匹配 Viem 格式：Data:   0xd6e1a062 (4 bytes)
  const viemMatch = rawMessage.match(/Data:\s*0x([a-fA-F0-9]{8})\s*\(4 bytes\)/i);
  if (viemMatch) {
    selector = '0x' + viemMatch[1];
  }

  // 匹配 JSON-RPC 格式：data: "0xa748da06" 或 data: 0xa748da06
  if (!selector) {
    const jsonRpcMatch = rawMessage.match(/data:\s*"?0x([a-fA-F0-9]{8})"?/i);
    if (jsonRpcMatch) {
      selector = '0x' + jsonRpcMatch[1];
    }
  }

  // 匹配独立的 4 字节选择器，但要确保它不是地址的一部分
  // 地址是 40 个字符，选择器是 8 个字符
  if (!selector) {
    const standaloneMatch = rawMessage.match(/(?:^|[^a-fA-F0-9])0x([a-fA-F0-9]{8})(?:[^a-fA-F0-9]|$)/);
    if (standaloneMatch) {
      selector = '0x' + standaloneMatch[1];
    }
  }

  // 匹配 anvil 测试链的错误格式：custom error 0x50cd778e
  if (!selector) {
    const anvilMatch = rawMessage.match(/custom error 0x([a-fA-F0-9]{8})/i);
    if (anvilMatch) {
      selector = '0x' + anvilMatch[1];
    }
  }

  // 匹配其他可能的 reverted with 格式
  if (!selector) {
    const revertWithMatch = rawMessage.match(/reverted with:\s*custom error 0x([a-fA-F0-9]{8})/i);
    if (revertWithMatch) {
      selector = '0x' + revertWithMatch[1];
    }
  }

  if (selector) {
    const errorName = getErrorNameFromSelector(selector, contractKey);
    if (errorName) {
      // 先在对应合约的错误映射中查找
      const errorMap = ContractErrorsMaps[contractKey];
      if (errorMap && errorMap[errorName]) {
        return { name: '交易错误', message: errorMap[errorName] };
      }

      // 如果在对应合约中找不到，再在通用错误映射中查找
      const slTokenErrorMap = ContractErrorsMaps.slToken;
      if (slTokenErrorMap && slTokenErrorMap[errorName]) {
        return { name: '交易错误', message: slTokenErrorMap[errorName] };
      }
      const stErrorMap = ContractErrorsMaps.stToken;
      if (stErrorMap && stErrorMap[errorName]) {
        return { name: '交易错误', message: stErrorMap[errorName] };
      }
      const tokenErrorMap = ContractErrorsMaps.token;
      if (tokenErrorMap && tokenErrorMap[errorName]) {
        return { name: '交易错误', message: tokenErrorMap[errorName] };
      }
      const commonErrorMap = ContractErrorsMaps.common;
      if (commonErrorMap && commonErrorMap[errorName]) {
        return { name: '交易错误', message: commonErrorMap[errorName] };
      }
    }
  }

  // 2.解析传统格式的错误信息
  // 首先检查 UniswapV2Router 特定格式：UniswapV2Router: ERROR_NAME
  const uniswapMatch = rawMessage.match(/UniswapV2Router:\s*([A-Z_]+)/);
  if (uniswapMatch && uniswapMatch[1]) {
    const uniswapErrorName = uniswapMatch[1];
    // 直接使用 UniswapV2Router 错误映射
    const uniswapErrorMap = ContractErrorsMaps.uniswapV2Router;
    if (uniswapErrorMap && uniswapErrorMap[uniswapErrorName]) {
      return { name: '交易错误', message: uniswapErrorMap[uniswapErrorName] };
    }
  }

  const matched = rawMessage.match(/(?:([A-Za-z0-9_]+)\()|(?:ERC20:\s*(.+))/);
  let errorName = '';
  if (matched && (matched[1] != undefined || matched[2] != undefined)) {
    if (matched[1]) {
      // 类似 "InvalidToAddress()"
      errorName = matched[1];
    } else if (matched[2]) {
      // 类似 "ERC20: transfer amount exceeds balance"
      errorName = `${matched[2]}`;
    }
  }

  // 3.根据合约key获取对应的错误映射
  const errorMap = ContractErrorsMaps[contractKey];
  if (errorMap && errorMap[errorName]) {
    return { name: '交易错误', message: errorMap[errorName] };
  }

  // 4.如果找不到对应的错误文案，则返回默认的错误文案
  const originalRevertError = _parseOriginalRevertMessage(rawMessage);
  if (originalRevertError) {
    //打印原始错误
    return { name: '交易错误', message: originalRevertError };
  }

  // 未知错误
  return {
    name: '交易错误',
    message: rawMessage ? rawMessage : '交易失败，请稍后刷新重试',
  };
}

/**
 * 自定义 Hook 用于处理错误
 * @param context 错误上下文，例如 'stake' 或 'uniswap'
 * @returns handleContractError 函数
 */
export const useHandleContractError = () => {
  const { setError } = useError();

  /**
   * 处理错误并设置错误信息
   * @param error 捕获到的错误对象
   * @param context 错误上下文，例如 'stake' 或 'uniswap'
   */
  const handleContractError = useCallback(
    (error: any, context: string) => {
      console.error('error:', error);

      // 尝试从多个可能的位置提取错误信息
      let errorMessage = '';
      let errorStringified = '';

      // 安全地序列化 error 对象，处理 BigInt
      try {
        errorStringified = JSON.stringify(error, (key, value) => {
          // 将 BigInt 转换为字符串
          if (typeof value === 'bigint') {
            return value.toString();
          }
          return value;
        });
      } catch (e) {
        // 如果序列化失败，使用 toString 或默认值
        errorStringified = error?.toString() || 'Error object cannot be stringified';
      }

      // 扩展错误信息来源，增加对新版本错误格式的支持
      const sources = [
        error?.message, // 主要错误信息
        error?.cause?.message, // 原因错误信息
        error?.data, // 错误数据
        error?.reason, // 错误原因
        error?.details, // 错误详情 (新增)
        error?.cause?.details, // 原因错误详情 (新增)
        error?.shortMessage, // 简短错误信息 (新增)
        errorStringified, // 序列化后的完整错误
      ];

      // 优先检查是否为用户取消交易的错误
      for (const source of sources) {
        if (source && typeof source === 'string') {
          const metaMaskError = _parseMetaMaskError(source);
          if (metaMaskError) {
            setError({ name: '交易提示', message: metaMaskError });
            return;
          }
        }
      }

      // 再检查合约错误
      for (const source of sources) {
        if (source && typeof source === 'string') {
          const parsedError = getReadableRevertErrMsg(source, context);
          if (parsedError.message !== '交易失败，请稍后刷新重试') {
            errorMessage = parsedError.message;
            break;
          }
        }
      }

      const finalError = errorMessage
        ? { name: '交易错误', message: errorMessage }
        : getReadableRevertErrMsg(error?.message || errorStringified, context);

      console.error('Final Error Message:', finalError);

      // 将错误设置到全局错误上下文，供 UI 提示
      setError(finalError);

      // 在非用户主动取消交易的情况下，上报到 Sentry
      try {
        const isUserCancel = finalError?.message?.includes('用户取消') || finalError?.name === '交易提示';
        // 仅在生产环境上报，避免本地开发噪音
        const shouldReport = !isUserCancel;
        if (shouldReport) {
          Sentry.captureException(error ?? new Error(finalError?.message || 'Unknown contract error'), {
            level: 'error',
            tags: {
              contractContext: context,
              source: 'handleContractError',
            },
            extra: {
              finalError,
              rawErrorMessage: error?.message,
              rawErrorReason: error?.reason,
              rawErrorDetails: error?.details,
              rawErrorShortMessage: error?.shortMessage,
              stringified: errorStringified,
            },
          });
        }
      } catch (sentryError) {
        // 避免上报过程本身影响用户操作流
        console.warn('Sentry capture skipped or failed:', sentryError);
      }
    },
    [setError],
  );

  return { handleContractError };
};

// /**
//  * 测试错误解析功能（仅用于开发调试）
//  * @param testMessage 测试错误消息
//  * @param contractKey 合约上下文
//  */
// export function testErrorParsing(testMessage: string, contractKey: string): void {
//   if (process.env.NODE_ENV === 'development') {
//     console.log('🧪 测试错误解析:', testMessage);
//     const result = getReadableRevertErrMsg(testMessage, contractKey);
//     console.log('📋 解析结果:', result);
//   }
// }

// // 导出用于测试的函数（仅开发环境）
// if (process.env.NODE_ENV === 'development') {
//   // 测试 anvil 错误格式
//   testErrorParsing('Error: reverted with: custom error 0x50cd778e', 'stake');
//   testErrorParsing('custom error 0x50cd778e', 'stake');
//   testErrorParsing('Transaction failed: custom error 0x50cd778e', 'stake');
// }

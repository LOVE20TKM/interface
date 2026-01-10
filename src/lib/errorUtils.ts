// src/utils/errorUtils.ts

import { ContractErrorsMaps, getErrorNameFromSelector } from '@/src/errors';
import * as Sentry from '@sentry/nextjs';
import { ErrorInfo } from '@/src/contexts/ErrorContext';
import { useError } from '@/src/contexts/ErrorContext';
import { useCallback } from 'react';

/**
 * 从钱包错误信息中解析用户取消交易的核心错误原因
 * 支持 MetaMask、TrustWallet 等多种钱包格式
 *
 * @param error 错误信息
 * @returns 解析出的核心错误信息，如果是用户取消则返回提示文本，否则返回空字符串
 */
function _parseUserCancelError(error: string): string {
  /***
   * MetaMask 错误格式示例：
     TransactionExecutionError: User rejected the request.
     Details: MetaMask Tx Signature: User denied transaction signature.
   * 
   * TrustWallet 错误格式示例：
     Error: cancel
   * 
   * 其他钱包可能的格式：
     User denied transaction signature
     User rejected the request
   */

  // 检查 TrustWallet 格式：Error: cancel 或简单的 "cancel"
  const trustWalletMatch = error.match(/^(Error:\s*)?cancel$/i);
  if (trustWalletMatch) {
    return '用户取消了交易';
  }

  // 检查 MetaMask 新版本格式：直接包含 "User rejected the request"
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
      return '网络请求超时，请检查网络连接后重试，或稍后再试。';
    }
  }
  return '';
}

/**
 * 检查是否为RPC调用错误（通常因为链上状态变化导致）
 */
function _parseRpcError(error: string): string {
  // 优先检查网络连接错误（Failed to fetch）
  // 这是最常见的网络或RPC节点连接问题
  if (/Failed to fetch/i.test(error)) {
    // 如果同时包含 "An internal error was received"，说明是RPC节点内部错误
    if (/An internal error was received/i.test(error)) {
      return 'RPC节点临时故障，请稍后重试或刷新页面';
    }
    // 单独的 "Failed to fetch" 通常是网络连接问题
    return '网络连接失败，请检查网络连接后重试';
  }

  // 优先检查 RPC 节点内部错误（错误码 -32603）
  // 这种错误通常是临时性的 RPC 节点问题，不是前端或合约问题
  if (/InternalRpcError/i.test(error) || /code.*-32603/i.test(error) || /Internal error/i.test(error)) {
    // 检查是否同时包含具体的交易信息，如果有则更可能是节点问题
    if (/An internal error was received/i.test(error)) {
      return 'RPC节点临时故障，请稍后重试或刷新页面';
    }
  }

  const rpcErrorPatterns = [
    // 常见RPC错误模式
    /Missing or invalid parameters/i,
    /no input found/i,
    /invalid input/i,
    /call exception/i,
    /invalid call data/i,
    /execution reverted.*position.*out of bounds/i,
    /position.*out of bounds/i,
    /Invalid array length/i,
    /index out of bounds/i,

    // 流动性相关的RPC错误
    /insufficient reserves/i,
    /insufficient liquidity/i,
    /zero liquidity/i,
    /pair does not exist/i,

    // 价格查询失败的常见模式
    /amounts.*calculation.*failed/i,
    /getAmountsOut.*failed/i,
    /price.*query.*failed/i,
  ];

  for (const pattern of rpcErrorPatterns) {
    if (pattern.test(error)) {
      // 如果错误包含流动性相关关键词，给出更具体的提示
      if (/insufficient.*liquidity|zero.*liquidity|insufficient.*reserves/i.test(error)) {
        return '流动性不足，请尝试较小的交换数量或稍后重试';
      }

      // 如果错误包含position/bounds相关关键词，通常是价格变动导致
      if (/position.*out of bounds|index out of bounds/i.test(error)) {
        return '链上状态变化，导致操作失败。可能有人先发起了同样的交易。请刷新重试~';
      }

      // 通用RPC错误提示
      return '网络返回错误，请刷新或稍后重试~';
    }
  }
  return '';
}

/**
 * 检查是否为 Gas 费不足错误
 */
function _parseGasError(error: string): string {
  const gasErrorPatterns = [
    // Gas 估算失败
    /Failed to estimate gas/i,
    /cannot estimate gas/i,
    /transaction may fail or may require manual gas limit/i,

    // 资金不足相关
    /insufficient funds for intrinsic transaction cost/i,
    /insufficient funds for gas/i,
    /insufficient funds/i,

    // Gas 不足
    /out of gas/i,
    /gas required exceeds allowance/i,
    /gas limit exceeded/i,
    /exceeds block gas limit/i,
    /base fee exceeds gas limit/i,

    // MetaMask 特定错误
    /insufficient ether for transfer/i,
    /insufficient balance/i,

    // 其他 Web3 提供商的错误格式
    /code=INSUFFICIENT_FUNDS/i,
    /INSUFFICIENT_FUNDS/i,
    /not enough funds/i,
    /balance too low/i,
    /gas estimation failed/i,
    /execution reverted.*gas/i,

    // viem 特定错误格式
    /The total cost \(gas \* gas fee \+ value\) of executing this transaction exceeds the balance/i,
  ];

  for (const pattern of gasErrorPatterns) {
    if (pattern.test(error)) {
      const tokenSymbol = process.env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL || 'ETH';
      return `Gas费不足，请确认是否有足够的 ${tokenSymbol}`;
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
 * @returns 可读错误文案，若无法匹配则返回 "未知错误"；如果是用户取消交易则返回 null
 */
export function getReadableRevertErrMsg(error: string, contractKey: string): ErrorInfo | null {
  const rawMessage: string = error ?? '';

  // 0.优先检查 Gas 费不足错误
  const gasError = _parseGasError(rawMessage);
  if (gasError) {
    return { name: 'Gas费不足', message: gasError };
  }

  // 0.1.检查网络超时错误
  const timeoutError = _parseTimeoutError(rawMessage);
  if (timeoutError) {
    return { name: '网络超时', message: timeoutError };
  }

  // 0.2.检查RPC调用错误（链上状态变化导致的错误）
  const rpcError = _parseRpcError(rawMessage);
  if (rpcError) {
    return { name: '链上交易失败', message: rpcError };
  }

  // 0.5.检查TransactionExecutionError格式 (新增)
  const transactionError = _parseTransactionExecutionError(rawMessage);
  if (transactionError) {
    // 如果是用户拒绝，返回null表示这不是错误
    if (transactionError.includes('User rejected') || transactionError.includes('User denied')) {
      return null;
    }
    // 其他TransactionExecutionError，返回原始错误信息
    return { name: '交易错误', message: transactionError };
  }

  // 0.6.检查用户取消错误
  const userCancelError = _parseUserCancelError(rawMessage);
  if (userCancelError) {
    // 用户取消交易不是错误，返回null
    return null;
  }

  // 1.优先检查是否是十六进制错误选择器格式，使用更精确的匹配模式
  // 示例格式：
  // - "Data:   0xd6e1a062 (4 bytes)"  (Viem 错误格式)
  // - 'data: "0xa748da06"'            (JSON-RPC 错误格式)
  // - "0xa748da06"                    (直接错误选择器)
  // - "execution reverted, data: 0xa748da06"  (其他格式)

  let selector = '';

  // 优先匹配各类 "custom error 0xXXXXXXXX"（例如 anvil 或 viem 提示中的 reason: custom error ...）
  const customErrorMatch = rawMessage.match(/custom error 0x([a-fA-F0-9]{8})/i);
  if (customErrorMatch) {
    selector = '0x' + customErrorMatch[1];
  }

  // 匹配 "Execution reverted with reason: custom error 0xXXXXXXXX" 格式
  if (!selector) {
    const executionRevertMatch = rawMessage.match(/Execution reverted with reason:\s*custom error 0x([a-fA-F0-9]{8})/i);
    if (executionRevertMatch) {
      selector = '0x' + executionRevertMatch[1];
    }
  }

  // 匹配 Viem 格式：Data:   0xd6e1a062 (4 bytes)
  if (!selector) {
    const viemMatch = rawMessage.match(/Data:\s*0x([a-fA-F0-9]{8})\s*\(4 bytes\)/i);
    if (viemMatch) {
      selector = '0x' + viemMatch[1];
    }
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

      // 优先检查是否为 Gas 费不足错误
      for (const source of sources) {
        if (source && typeof source === 'string') {
          const gasError = _parseGasError(source);
          if (gasError) {
            setError({ name: 'Gas费不足', message: gasError });
            return;
          }
        }
      }

      // 检查是否为RPC调用错误
      for (const source of sources) {
        if (source && typeof source === 'string') {
          const rpcError = _parseRpcError(source);
          if (rpcError) {
            setError({ name: '链上交易失败', message: rpcError });
            return;
          }
        }
      }

      // 再检查是否为用户取消交易的错误
      for (const source of sources) {
        if (source && typeof source === 'string') {
          const userCancelError = _parseUserCancelError(source);
          if (userCancelError) {
            // 用户取消交易是正常行为，不视为错误，直接返回不设置错误状态
            console.log('用户取消了交易：', userCancelError);
            return;
          }
        }
      }

      // 再检查合约错误
      for (const source of sources) {
        if (source && typeof source === 'string') {
          const parsedError = getReadableRevertErrMsg(source, context);
          // 如果返回null，说明是用户取消交易，直接返回
          if (parsedError === null) {
            console.log('用户取消了交易，不作为错误处理');
            return;
          }
          if (parsedError.message !== '交易失败，请稍后刷新重试') {
            errorMessage = parsedError.message;
            break;
          }
        }
      }

      const finalError = errorMessage
        ? { name: '交易错误', message: errorMessage }
        : getReadableRevertErrMsg(error?.message || errorStringified, context);

      // 如果最终错误是null（用户取消交易），直接返回
      if (finalError === null) {
        console.log('用户取消了交易，不作为错误处理');
        return;
      }

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
//   // 测试 Gas 费不足错误格式
//   console.log('🔧 测试 Gas 费错误解析:');
//   testErrorParsing('cannot estimate gas; transaction may fail or may require manual gas limit', 'test');
//   testErrorParsing('insufficient funds for intrinsic transaction cost', 'test');
//   testErrorParsing(
//     'Error: insufficient funds for gas * price + value (error={"reason":"insufficient funds for gas * price + value","code":"INSUFFICIENT_FUNDS","error":{"reason":"insufficient funds for gas * price + value","code":"INSUFFICIENT_FUNDS","method":"sendTransaction","transaction":{"from":"0x9d2340F8C971488606dcCafdb51aDddFEa7522c8"}}}, method="sendTransaction")',
//     'test',
//   );
//   testErrorParsing('out of gas', 'test');
//   testErrorParsing(
//     'The total cost (gas * gas fee + value) of executing this transaction exceeds the balance of the account.',
//     'test',
//   );

//   // 测试 anvil 错误格式
//   testErrorParsing('Error: reverted with: custom error 0x50cd778e', 'stake');
//   testErrorParsing('custom error 0x50cd778e', 'stake');
//   testErrorParsing('Transaction failed: custom error 0x50cd778e', 'stake');
// }

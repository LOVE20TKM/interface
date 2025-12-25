/**
 * 合约错误解析器
 *
 * 统一处理合约错误，无需传入 contractKey
 * 支持多种错误格式：hex 选择器、错误名称、RPC 错误等
 */

import { ErrorsBySelector, ErrorsByName } from './unifiedErrorMap';

// ============================================================================
// 类型定义
// ============================================================================

export interface ErrorInfo {
  name: string;
  message: string;
}

// ============================================================================
// 错误消息提取
// ============================================================================

/**
 * 从错误对象中提取错误消息字符串
 * 支持多种错误对象格式
 */
export function extractErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;

  const errorObj = error as Record<string, any>;

  // 尝试从各种可能的位置提取错误信息
  const sources = [
    errorObj?.message,
    errorObj?.cause?.message,
    errorObj?.data,
    errorObj?.reason,
    errorObj?.details,
    errorObj?.cause?.details,
    errorObj?.shortMessage,
  ];

  for (const source of sources) {
    if (typeof source === 'string' && source.trim()) {
      return source;
    }
  }

  // 尝试 JSON 序列化
  try {
    return JSON.stringify(error, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
  } catch {
    return String(error);
  }
}

// ============================================================================
// 特定错误类型检测
// ============================================================================

/**
 * 检查是否为 Gas 费不足错误
 */
export function parseGasError(error: string): ErrorInfo | null {
  const gasErrorPatterns = [
    /Failed to estimate gas/i,
    /cannot estimate gas/i,
    /transaction may fail or may require manual gas limit/i,
    /insufficient funds for intrinsic transaction cost/i,
    /insufficient funds for gas/i,
    /insufficient funds/i,
    /out of gas/i,
    /gas required exceeds allowance/i,
    /gas limit exceeded/i,
    /exceeds block gas limit/i,
    /base fee exceeds gas limit/i,
    /insufficient ether for transfer/i,
    /insufficient balance/i,
    /code=INSUFFICIENT_FUNDS/i,
    /INSUFFICIENT_FUNDS/i,
    /not enough funds/i,
    /balance too low/i,
    /gas estimation failed/i,
    /execution reverted.*gas/i,
    /The total cost \(gas \* gas fee \+ value\) of executing this transaction exceeds the balance/i,
  ];

  for (const pattern of gasErrorPatterns) {
    if (pattern.test(error)) {
      const tokenSymbol = process.env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL || 'ETH';
      return {
        name: 'Gas费不足',
        message: `Gas费不足，请确认是否有足够的 ${tokenSymbol}`,
      };
    }
  }
  return null;
}

/**
 * 检查是否为网络超时错误
 */
export function parseTimeoutError(error: string): ErrorInfo | null {
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
      return {
        name: '网络超时',
        message: '网络请求超时，请检查网络连接后重试，或稍后再试。',
      };
    }
  }
  return null;
}

/**
 * 检查是否为 RPC 调用错误
 */
export function parseRpcError(error: string): ErrorInfo | null {
  // RPC 节点内部错误
  if (/InternalRpcError/i.test(error) || /code.*-32603/i.test(error) || /Internal error/i.test(error)) {
    if (/An internal error was received/i.test(error)) {
      return {
        name: '链上交易失败',
        message: 'RPC节点临时故障，请稍后重试或刷新页面',
      };
    }
  }

  const rpcErrorPatterns = [
    /Missing or invalid parameters/i,
    /no input found/i,
    /invalid input/i,
    /call exception/i,
    /invalid call data/i,
    /execution reverted.*position.*out of bounds/i,
    /position.*out of bounds/i,
    /Invalid array length/i,
    /index out of bounds/i,
    /insufficient reserves/i,
    /insufficient liquidity/i,
    /zero liquidity/i,
    /pair does not exist/i,
    /amounts.*calculation.*failed/i,
    /getAmountsOut.*failed/i,
    /price.*query.*failed/i,
  ];

  for (const pattern of rpcErrorPatterns) {
    if (pattern.test(error)) {
      if (/insufficient.*liquidity|zero.*liquidity|insufficient.*reserves/i.test(error)) {
        return {
          name: '链上交易失败',
          message: '流动性不足，请尝试较小的交换数量或稍后重试',
        };
      }
      if (/position.*out of bounds|index out of bounds/i.test(error)) {
        return {
          name: '链上交易失败',
          message: '链上状态变化，导致操作失败。可能有人先发起了同样的交易。请刷新重试~',
        };
      }
      return {
        name: '链上交易失败',
        message: '网络返回错误，请刷新或稍后重试~',
      };
    }
  }
  return null;
}

/**
 * 检查是否为用户取消交易
 */
export function isUserCancellation(error: string): boolean {
  // TrustWallet 格式
  if (/^(Error:\s*)?cancel$/i.test(error)) {
    return true;
  }

  // MetaMask 格式
  if (/User rejected the request/i.test(error)) {
    return true;
  }

  // 其他格式
  if (/User denied transaction signature/i.test(error)) {
    return true;
  }

  if (/User denied|User rejected|rejected by user|denied by user/i.test(error)) {
    return true;
  }

  return false;
}

// ============================================================================
// 错误选择器和名称提取
// ============================================================================

/**
 * 从错误消息中提取 4 字节选择器
 * 支持多种格式匹配
 */
export function extractErrorSelector(message: string): string | null {
  const patterns = [
    /custom error 0x([a-fA-F0-9]{8})/i,
    /Execution reverted with reason:\s*custom error 0x([a-fA-F0-9]{8})/i,
    /Data:\s*0x([a-fA-F0-9]{8})\s*\(4 bytes\)/i,
    /data:\s*"?0x([a-fA-F0-9]{8})"?/i,
    /reverted with:\s*custom error 0x([a-fA-F0-9]{8})/i,
    // 独立的 4 字节选择器（确保不是地址的一部分）
    /(?:^|[^a-fA-F0-9])0x([a-fA-F0-9]{8})(?:[^a-fA-F0-9]|$)/,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return '0x' + match[1].toLowerCase();
    }
  }

  return null;
}

/**
 * 从错误消息中提取错误名称（传统格式）
 */
export function extractErrorName(message: string): string | null {
  // UniswapV2Router 格式: UniswapV2Router: ERROR_NAME
  const uniswapMatch = message.match(/UniswapV2Router:\s*([A-Z_]+)/);
  if (uniswapMatch) return uniswapMatch[1];

  // 函数调用格式: ErrorName()
  const fnMatch = message.match(/([A-Za-z0-9_]+)\(\)/);
  if (fnMatch) return fnMatch[1];

  // 带参数的错误格式: ErrorName(params)
  const fnWithParamsMatch = message.match(/([A-Za-z0-9_]+)\([^)]*\)/);
  if (fnWithParamsMatch) return fnWithParamsMatch[1];

  return null;
}

/**
 * 解析原始 revert 消息
 */
export function parseOriginalRevertMessage(errorLog: string): string | null {
  // 匹配 "Error: ErrorName()" 格式
  const errorMatch = errorLog.split('\n').find((line) => line.trim().startsWith('Error:'));
  if (errorMatch) {
    const reason = errorMatch.split('Error:')[1]?.trim();
    if (reason) return reason;
  }

  // 匹配 "the following reason:" 后的内容
  const lines = errorLog.split('\n');
  const reasonIndex = lines.findIndex((line) => line.includes('the following reason:'));
  if (reasonIndex !== -1 && reasonIndex + 1 < lines.length) {
    const reason = lines[reasonIndex + 1].trim();
    if (reason) return reason;
  }

  return null;
}

// ============================================================================
// 主解析函数
// ============================================================================

/**
 * 解析合约错误，返回用户友好的错误信息
 *
 * @param error 原始错误信息（字符串或 Error 对象）
 * @returns ErrorInfo | null（null 表示用户取消交易，不是真正的错误）
 */
export function parseContractError(error: unknown): ErrorInfo | null {
  // 提取错误消息
  const rawMessage = extractErrorMessage(error);

  // 1. 检查 Gas 费不足
  const gasError = parseGasError(rawMessage);
  if (gasError) return gasError;

  // 2. 检查网络超时
  const timeoutError = parseTimeoutError(rawMessage);
  if (timeoutError) return timeoutError;

  // 3. 检查 RPC 错误
  const rpcError = parseRpcError(rawMessage);
  if (rpcError) return rpcError;

  // 4. 检查用户取消（返回 null 表示不是错误）
  if (isUserCancellation(rawMessage)) {
    return null;
  }

  // 5. 提取并解析 4 字节选择器
  const selector = extractErrorSelector(rawMessage);
  if (selector) {
    const errorDef = ErrorsBySelector[selector];
    if (errorDef) {
      return { name: '交易错误', message: errorDef.message };
    }
  }

  // 6. 解析传统格式错误名称
  const errorName = extractErrorName(rawMessage);
  if (errorName) {
    const errorDef = ErrorsByName[errorName];
    if (errorDef) {
      return { name: '交易错误', message: errorDef.message };
    }
  }

  // 7. 尝试解析原始 revert 消息
  const revertMessage = parseOriginalRevertMessage(rawMessage);
  if (revertMessage) {
    // 再次尝试从 revert 消息中提取错误名称
    const revertErrorName = extractErrorName(revertMessage);
    if (revertErrorName) {
      const errorDef = ErrorsByName[revertErrorName];
      if (errorDef) {
        return { name: '交易错误', message: errorDef.message };
      }
    }
    return { name: '交易错误', message: revertMessage };
  }

  // 8. 兜底返回
  return {
    name: '交易错误',
    message: rawMessage || '交易失败，请稍后刷新重试',
  };
}

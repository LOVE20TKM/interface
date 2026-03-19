/**
 * Revert Data 恢复与解码
 *
 * 当非标准 RPC 将合约 revert data 作为成功响应返回时，viem 的 simulateContract
 * 会按函数返回类型解码，导致 AbiDecodingDataSizeTooSmallError。本模块负责：
 * 1. 检测此类错误
 * 2. 通过低级 call 获取原始返回数据
 * 3. 用 decodeErrorResult 解码为具体合约错误
 */

import { encodeFunctionData, decodeErrorResult } from 'viem';
import { call, getAccount } from '@wagmi/core';
import type { Config } from '@wagmi/core';

// ============================================================================
// 自定义错误类
// ============================================================================

/**
 * 已解码的合约 revert 错误，携带 errorName、args 和 4 字节 selector
 */
export class ContractRevertError extends Error {
  public readonly errorName: string;
  public readonly args: readonly unknown[];
  public readonly selector: string;

  constructor(errorName: string, args: readonly unknown[], selector: string) {
    const argsStr = args.map((a) => String(a)).join(', ');
    super(`${errorName}(${argsStr})`);
    this.name = 'ContractRevertError';
    this.errorName = errorName;
    this.args = args;
    this.selector = selector;
  }
}

// ============================================================================
// ABI 解码错误检测
// ============================================================================

/**
 * 检测是否为 ABI 解码大小错误（非标准 RPC 将 revert data 当作成功返回导致）
 */
export function isAbiDecodingError(error: unknown): boolean {
  if (error == null) return false;

  let current: unknown = error;
  for (let depth = 0; depth < 10 && current != null; depth++) {
    const err = current as Record<string, unknown>;
    const name = typeof err.name === 'string' ? err.name : '';
    const message = typeof err.message === 'string' ? err.message : '';

    if (/AbiDecodingDataSizeTooSmall/i.test(name)) return true;
    if (/position.*out of bounds/i.test(message)) return true;

    current = err.cause;
  }
  return false;
}

// ============================================================================
// 原始 call 数据获取
// ============================================================================

/**
 * 使用低级 call 获取原始返回数据（用于恢复被误当作成功返回的 revert data）
 */
export async function fetchRawCallData(
  config: Config,
  address: `0x${string}`,
  abi: readonly unknown[],
  functionName: string,
  args: unknown[] = [],
  value?: bigint,
): Promise<`0x${string}` | null> {
  try {
    const data = encodeFunctionData({
      abi: abi as any,
      functionName,
      args,
    });

    const { address: account } = getAccount(config);

    const result = await call(config, {
      to: address,
      data,
      account: account ?? undefined,
      value,
    });

    if (result?.data && typeof result.data === 'string' && result.data.startsWith('0x')) {
      return result.data as `0x${string}`;
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================================================
// Revert Data 解码
// ============================================================================

/**
 * 尝试将原始数据解码为 ABI 中定义的 custom error
 */
export function tryDecodeRevertData(
  data: `0x${string}`,
  abi: readonly unknown[],
): { errorName: string; args: readonly unknown[] } | null {
  if (!data || data.length < 10) return null; // 至少 4 字节 selector
  try {
    const decoded = decodeErrorResult({
      abi: abi as any,
      data,
    });
    return {
      errorName: decoded.errorName,
      args: decoded.args ?? [],
    };
  } catch {
    return null;
  }
}

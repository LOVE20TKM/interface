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

/**
 * 判断是否为 0x 格式的十六进制字符串
 */
function isHexString(value: unknown): value is `0x${string}` {
  return typeof value === 'string' && /^0x[0-9a-fA-F]+$/.test(value);
}

/**
 * 从字符串中提取最可能的 revert data
 * 规则：
 * 1. 只接受 0x 开头的十六进制片段
 * 2. 优先选择更长的片段，尽量避开地址等短片段
 */
function extractBestHexCandidate(text: string): `0x${string}` | null {
  const matches = text.match(/0x[0-9a-fA-F]+/g);
  if (!matches || matches.length === 0) return null;

  const candidates = matches
    .filter((candidate) => candidate.length >= 10)
    .sort((a, b) => b.length - a.length);

  return (candidates[0] as `0x${string}` | undefined) ?? null;
}

/**
 * 递归提取错误对象中最可能的 revert data
 *
 * 兼容 viem / wagmi 常见结构：
 * - error.data
 * - error.cause.data
 * - error.details / shortMessage / message 中嵌入的 hex 字符串
 * - 嵌套对象中的 response / body / error 等字段
 */
export function extractRawRevertData(error: unknown): `0x${string}` | null {
  const seen = new WeakSet<object>();

  const visit = (value: unknown, depth: number): `0x${string}` | null => {
    if (value == null || depth > 8) return null;

    if (isHexString(value)) {
      return value;
    }

    if (typeof value === 'string') {
      return extractBestHexCandidate(value);
    }

    if (typeof value !== 'object') {
      return null;
    }

    const current = value as Record<string, unknown>;
    if (seen.has(current)) return null;
    seen.add(current);

    // 先检查更可能存放 revert data 的字段
    const preferredKeys = ['data', 'revertData', 'rawData', 'returnData', 'result', 'response', 'body'];
    for (const key of preferredKeys) {
      const nested = current[key];
      const found = visit(nested, depth + 1);
      if (found) return found;
    }

    // 再检查文本字段
    const textKeys = ['message', 'details', 'shortMessage', 'reason', 'name', 'stack'];
    for (const key of textKeys) {
      const nested = current[key];
      if (typeof nested === 'string') {
        const found = extractBestHexCandidate(nested);
        if (found) return found;
      }
    }

    // 最后递归 cause / error / info / metaMessages
    const recursiveKeys = ['cause', 'error', 'info'];
    for (const key of recursiveKeys) {
      const found = visit(current[key], depth + 1);
      if (found) return found;
    }

    const metaMessages = current.metaMessages;
    if (Array.isArray(metaMessages)) {
      for (const item of metaMessages) {
        const found = visit(item, depth + 1);
        if (found) return found;
      }
    }

    // 扫描对象自身的所有字符串字段，作为兜底
    for (const valueItem of Object.values(current)) {
      const found = visit(valueItem, depth + 1);
      if (found) return found;
    }

    return null;
  };

  return visit(error, 0);
}

/**
 * 提取用于排障展示的错误上下文文本片段
 *
 * 目标不是“美化”，而是尽量保留原始信息，便于用户截图排查。
 */
export function collectErrorContextLines(error: unknown): string[] {
  const lines = new Set<string>();
  const seen = new WeakSet<object>();

  const pushLine = (label: string, value: unknown) => {
    if (value == null) return;
    if (typeof value === 'string') {
      const text = value.trim();
      if (text) lines.add(`${label}: ${text}`);
      return;
    }
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
      lines.add(`${label}: ${String(value)}`);
    }
  };

  const visit = (value: unknown, path: string, depth: number) => {
    if (value == null || depth > 6) return;

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
      pushLine(path, value);
      return;
    }

    if (typeof value !== 'object') return;

    const current = value as Record<string, unknown>;
    if (seen.has(current)) return;
    seen.add(current);

    pushLine(`${path}.name`, current.name);
    pushLine(`${path}.message`, current.message);
    pushLine(`${path}.shortMessage`, current.shortMessage);
    pushLine(`${path}.details`, current.details);
    pushLine(`${path}.reason`, current.reason);
    pushLine(`${path}.data`, current.data);

    if (Array.isArray(current.metaMessages)) {
      current.metaMessages.forEach((item, index) => pushLine(`${path}.metaMessages[${index}]`, item));
    }

    const nextKeys = ['cause', 'error', 'info', 'response', 'body'];
    nextKeys.forEach((key) => visit(current[key], `${path}.${key}`, depth + 1));
  };

  visit(error, 'error', 0);
  return Array.from(lines);
}

/**
 * 构造用于截图排查的原始错误文案
 */
export function formatRawErrorMessage(error: unknown, title = '链上交易失败'): string {
  const rawData = extractRawRevertData(error);
  const contextLines = collectErrorContextLines(error);
  const selector = rawData ? rawData.slice(0, 10) : null;

  const sections = [
    title,
    '原始错误信息:',
    ...contextLines,
    `原始 revert data: ${rawData ?? '未获取到'}`,
    selector ? `selector: ${selector}` : null,
  ].filter((line): line is string => Boolean(line));

  return sections.join('\n');
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
  } catch (error) {
    const rawData = extractRawRevertData(error);
    return rawData;
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

import { extractErrorMessage, extractErrorName, isUserCancellation, parseContractError } from './contractErrorParser';

const GLOBAL_RUNTIME_ERROR_PATTERNS = [
  /^TypeError:/i,
  /^ReferenceError:/i,
  /^RangeError:/i,
  /^SyntaxError:/i,
  /^Error:/i,
  /Cannot read (?:properties|property)/i,
  /Maximum update depth exceeded/i,
  /Hydration failed/i,
  /Rendered more hooks than during the previous render/i,
];

const CONTRACT_ERROR_PATTERNS = [
  /execution reverted/i,
  /reverted with/i,
  /custom error/i,
  /insufficient funds/i,
  /failed to estimate gas/i,
  /cannot estimate gas/i,
  /rpc/i,
  /call exception/i,
  /0x[a-fA-F0-9]{8}/,
  /ERC20:/i,
  /User rejected/i,
  /User denied/i,
];

const isLikelyRuntimeError = (message: string) => GLOBAL_RUNTIME_ERROR_PATTERNS.some((pattern) => pattern.test(message));

const isLikelyContractError = (message: string) => CONTRACT_ERROR_PATTERNS.some((pattern) => pattern.test(message));

export const buildGlobalErrorInfo = (error: unknown, fallbackName: string) => {
  const rawMessage = extractErrorMessage(error);

  if (isUserCancellation(rawMessage)) {
    return null;
  }

  if (!rawMessage || isLikelyRuntimeError(rawMessage)) {
    return {
      name: fallbackName,
      message: '页面发生异常，请刷新后重试',
    };
  }

  const errorName = extractErrorName(rawMessage);
  if (isLikelyContractError(rawMessage) || errorName) {
    const parsedError = parseContractError(error);
    if (parsedError) {
      return parsedError;
    }
  }

  return {
    name: fallbackName,
    message: rawMessage,
  };
};

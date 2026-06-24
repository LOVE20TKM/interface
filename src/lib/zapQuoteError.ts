import { extractErrorMessage, extractErrorName } from '../errors/contractErrorParser';

const LOCAL_ZAP_QUOTE_ERRORS = new Set(['InsufficientLiquidityMinted', 'PairMissingOrEmpty', 'ZeroAmount']);
const ZAP_QUOTE_FUNCTIONS = ['quoteZapToken', 'quoteZapNativeToken'];

export const isZapQuoteError = (error: unknown) => {
  const message = extractErrorMessage(error);
  return ZAP_QUOTE_FUNCTIONS.some((functionName) => message.includes(functionName));
};

export const shouldHandleZapQuoteErrorLocally = (error: unknown) => {
  const message = extractErrorMessage(error);
  if (!isZapQuoteError(error)) return false;

  const name = extractErrorName(message);
  return !!name && LOCAL_ZAP_QUOTE_ERRORS.has(name);
};

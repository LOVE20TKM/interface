import { parseUnits as viemParseUnits } from 'viem';

export const parseLiquidityAmountInput = (value: string): bigint | null => {
  const decimals = parseInt(process.env.NEXT_PUBLIC_TOKEN_DECIMALS || '18', 10);
  const normalizedValue = value.replace(/,/g, '');

  if (normalizedValue === '') return BigInt(0);
  if (!/^\d*(?:\.\d*)?$/.test(normalizedValue)) return null;

  try {
    return viemParseUnits(normalizedValue, decimals);
  } catch {
    return null;
  }
};

export const formatLiquidityAmountInputError = (value: string, balance: bigint) => {
  const amount = parseLiquidityAmountInput(value);
  if (amount === null) return '请输入有效数字';
  if (amount > balance) return '输入数量不能超过您的可用余额';
  return null;
};

interface LiquiditySlippageQuote {
  amountAUsed: bigint;
  amountBUsed: bigint;
  liquidity: bigint;
}

export const calculateLiquiditySlippageMins = (
  baseAmount: bigint,
  tokenAmount: bigint,
  slippage: number,
  zapQuote?: LiquiditySlippageQuote,
) => {
  const slippageBigInt = BigInt(Math.round(slippage * 10));
  const multiplier = BigInt(1000) - slippageBigInt;
  const baseAmountForMin = zapQuote ? zapQuote.amountAUsed : baseAmount;
  const tokenAmountForMin = zapQuote ? zapQuote.amountBUsed : tokenAmount;

  return {
    baseAmountMin: (baseAmountForMin * multiplier) / BigInt(1000),
    tokenAmountMin: (tokenAmountForMin * multiplier) / BigInt(1000),
    liquidityMin: zapQuote ? (zapQuote.liquidity * multiplier) / BigInt(1000) : BigInt(1),
  };
};

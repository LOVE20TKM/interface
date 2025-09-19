export interface TokenConfig {
  symbol: string;
  address: `0x${string}` | 'NATIVE';
  decimals: number;
  isNative: boolean;
  isWETH?: boolean;
}

export type SwapMethod = 'WETH9' | 'UniswapV2_TOKEN_TO_TOKEN' | 'UniswapV2_ETH_TO_TOKEN' | 'UniswapV2_TOKEN_TO_ETH';

export interface SwapFormValues {
  fromTokenAmount: string;
  fromTokenAddress: string;
  toTokenAddress: string;
}

export interface SwapPanelProps {
  showCurrentToken?: boolean;
}

export interface SwapInfo {
  conversionRate: string;
  feePercentage: number;
  feeAmount: string;
  minAmountOut: bigint;
  swapMethod: SwapMethod;
  swapPath: `0x${string}`[];
}

export interface SwapValidationResult {
  isValid: boolean;
  error?: string;
}
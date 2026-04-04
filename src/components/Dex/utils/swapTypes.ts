export interface TokenConfig {
  symbol: string;
  address: `0x${string}` | 'NATIVE';
  decimals: number;
  isNative: boolean;
  isWETH?: boolean;
}

export interface RouteTokenConfig {
  symbol: string;
  address: `0x${string}`;
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

export interface SwapRouteQuote {
  path: `0x${string}`[];
  displayPath: string[];
  amountsOut: bigint[];
  outputAmount: bigint;
}

export interface SwapValidationResult {
  isValid: boolean;
  error?: string;
}

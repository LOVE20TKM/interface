import { Token } from '@/src/contexts/TokenContext';

export interface TokenOption {
  symbol: string;
  address: `0x${string}` | 'NATIVE';
  decimals: number;
  isNative: boolean;
  name: string;
  isLp?: boolean;
}

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
const DEFAULT_TOKEN_DECIMALS = 18;
const nativeTokenDecimals = Number(process.env.NEXT_PUBLIC_NATIVE_TOKEN_DECIMALS || DEFAULT_TOKEN_DECIMALS);

export const buildSupportedTokenOptions = (
  token: Token | null | undefined,
  options?: {
    usdtLpPairAddress?: `0x${string}`;
    usdtSymbol?: string;
  },
): TokenOption[] => {
  const supportedTokens: TokenOption[] = [];
  const addedAddresses = new Set<string>();

  const addToken = (tokenConfig: TokenOption) => {
    const key = tokenConfig.address.toLowerCase();
    if (addedAddresses.has(key)) return;
    addedAddresses.add(key);
    supportedTokens.push(tokenConfig);
  };

  const nativeSymbol = process.env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL || 'TKM';
  addToken({
    symbol: nativeSymbol,
    address: 'NATIVE',
    decimals: nativeTokenDecimals,
    isNative: true,
    name: `原生代币 (${nativeSymbol})`,
  });

  const wethSymbol = process.env.NEXT_PUBLIC_FIRST_PARENT_TOKEN_SYMBOL;
  const wethAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ROOT_PARENT_TOKEN;
  if (wethSymbol && wethAddress) {
    addToken({
      symbol: wethSymbol,
      address: wethAddress as `0x${string}`,
      decimals: DEFAULT_TOKEN_DECIMALS,
      isNative: false,
      name: `包装代币 (${wethSymbol})`,
    });
  }

  const usdtSymbol = process.env.NEXT_PUBLIC_USDT_SYMBOL;
  const usdtAddress = process.env.NEXT_PUBLIC_USDT_ADDRESS;
  if (usdtSymbol && usdtAddress) {
    addToken({
      symbol: usdtSymbol,
      address: usdtAddress as `0x${string}`,
      decimals: DEFAULT_TOKEN_DECIMALS,
      isNative: false,
      name: `TUSDT 代币 (${usdtSymbol})`,
    });
  }

  if (token) {
    if (token.symbol && token.address) {
      addToken({
        symbol: token.symbol,
        address: token.address,
        decimals: token.decimals || DEFAULT_TOKEN_DECIMALS,
        isNative: false,
        name: `当前代币 (${token.symbol})`,
      });
    }

    if (token.parentTokenSymbol && token.parentTokenAddress) {
      addToken({
        symbol: token.parentTokenSymbol,
        address: token.parentTokenAddress,
        decimals: DEFAULT_TOKEN_DECIMALS,
        isNative: false,
        name: `父币 (${token.parentTokenSymbol})`,
      });
    }

    if (token.uniswapV2PairAddress && token.uniswapV2PairAddress !== ZERO_ADDRESS) {
      const lpSymbolName = `${token.symbol}/${token.parentTokenSymbol}`;
      addToken({
        symbol: `LP(${lpSymbolName})`,
        address: token.uniswapV2PairAddress,
        decimals: DEFAULT_TOKEN_DECIMALS,
        isNative: false,
        name: `LP代币 (${lpSymbolName})`,
        isLp: true,
      });
    }

    if (options?.usdtLpPairAddress && options.usdtLpPairAddress !== ZERO_ADDRESS && options.usdtSymbol) {
      const lpSymbolName = `${token.symbol}/${options.usdtSymbol}`;
      addToken({
        symbol: `LP(${lpSymbolName})`,
        address: options.usdtLpPairAddress,
        decimals: DEFAULT_TOKEN_DECIMALS,
        isNative: false,
        name: `LP代币 (${lpSymbolName})`,
        isLp: true,
      });
    }
  }

  return supportedTokens;
};

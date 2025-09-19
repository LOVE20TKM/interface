import { TokenConfig } from './swapTypes';

export const MIN_NATIVE_TO_TOKEN = '0.1';

export const buildSupportedTokens = (token: any, showCurrentToken: boolean = true): TokenConfig[] => {
  const supportedTokens: TokenConfig[] = [];

  // 1. 原生代币
  const nativeSymbol = process.env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL;
  if (nativeSymbol) {
    supportedTokens.push({
      symbol: nativeSymbol,
      address: 'NATIVE',
      decimals: 18,
      isNative: true,
    });
  }

  // 2. WETH9 代币 (TKM20)
  const wethSymbol = process.env.NEXT_PUBLIC_FIRST_PARENT_TOKEN_SYMBOL;
  const wethAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ROOT_PARENT_TOKEN;
  if (wethSymbol && wethAddress) {
    supportedTokens.push({
      symbol: wethSymbol,
      address: wethAddress as `0x${string}`,
      decimals: 18,
      isNative: false,
      isWETH: true,
    });
  }

  // 3. TUSDT 代币
  const usdtSymbol = process.env.NEXT_PUBLIC_USDT_SYMBOL;
  const usdtAddress = process.env.NEXT_PUBLIC_USDT_ADDRESS;
  if (usdtSymbol && usdtAddress && usdtAddress.length > 0) {
    supportedTokens.push({
      symbol: usdtSymbol,
      address: usdtAddress as `0x${string}`,
      decimals: 18,
      isNative: false,
    });
  }

  // 4. 添加当前 token
  if (token && showCurrentToken && token.symbol && token.address) {
    const exists = supportedTokens.find((t) => t.address === token.address);
    if (!exists) {
      supportedTokens.push({
        symbol: token.symbol,
        address: token.address,
        decimals: 18,
        isNative: false,
      });
    }
  }

  // 5. 添加 parentToken
  if (token && token.parentTokenSymbol && token.parentTokenAddress) {
    const exists = supportedTokens.find((t) => t.address === token.parentTokenAddress);
    if (!exists) {
      supportedTokens.push({
        symbol: token.parentTokenSymbol,
        address: token.parentTokenAddress,
        decimals: 18,
        isNative: false,
        isWETH: token.parentTokenAddress === process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ROOT_PARENT_TOKEN,
      });
    }
  }

  return supportedTokens;
};

export const getSwapContractAddresses = () => ({
  wethAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ROOT_PARENT_TOKEN as `0x${string}`,
  routerAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_ROUTER as `0x${string}`,
  usdtAddress: process.env.NEXT_PUBLIC_USDT_ADDRESS as `0x${string}`,
});

export const getDefaultTokenPair = (supportedTokens: TokenConfig[]) => {
  if (supportedTokens.length === 0) return { fromToken: null, toToken: null };

  const fromToken = supportedTokens[0];

  // 优先查找 FIRST_TOKEN (当前 token)
  const firstTokenSymbol = process.env.NEXT_PUBLIC_FIRST_TOKEN_SYMBOL;
  let toToken: TokenConfig | undefined;

  if (firstTokenSymbol) {
    toToken = supportedTokens.find(
      (t) => t.symbol === firstTokenSymbol && t.address !== fromToken?.address,
    );
  }

  // 如果没找到，找第一个与 fromToken 不同的代币
  if (!toToken) {
    for (let i = 1; i < supportedTokens.length; i++) {
      if (supportedTokens[i].address !== fromToken?.address) {
        toToken = supportedTokens[i];
        break;
      }
    }
  }

  return { fromToken, toToken: toToken || supportedTokens[1] || supportedTokens[0] };
};
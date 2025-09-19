import { TokenConfig, SwapMethod } from './swapTypes';

export const determineSwapMethod = (fromToken: TokenConfig, toToken: TokenConfig): SwapMethod => {
  // 情况1: 原生代币 ↔ WETH9 - 使用 WETH9
  if ((fromToken.isNative && toToken.isWETH) || (fromToken.isWETH && toToken.isNative)) {
    return 'WETH9';
  }

  // 情况2: 原生代币 → 非WETH的ERC20代币 - 使用 ETH_TO_TOKEN
  if (fromToken.isNative && !toToken.isNative && !toToken.isWETH) {
    return 'UniswapV2_ETH_TO_TOKEN';
  }

  // 情况3: 非WETH的ERC20代币 → 原生代币 - 使用 TOKEN_TO_ETH
  if (!fromToken.isNative && !fromToken.isWETH && toToken.isNative) {
    return 'UniswapV2_TOKEN_TO_ETH';
  }

  // 情况4: 所有其他情况都使用 UniswapV2 标准方法
  return 'UniswapV2_TOKEN_TO_TOKEN';
};

export const buildSwapPath = (fromToken: TokenConfig, toToken: TokenConfig, token: any): `0x${string}`[] => {
  if (determineSwapMethod(fromToken, toToken) === 'WETH9') {
    return [];
  }
  return selectOptimalRoute(fromToken, toToken, token);
};

const selectOptimalRoute = (fromToken: TokenConfig, toToken: TokenConfig, token: any): `0x${string}`[] => {
  const tkm20Address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ROOT_PARENT_TOKEN as `0x${string}`;
  const usdtAddress = process.env.NEXT_PUBLIC_USDT_ADDRESS as `0x${string}`;
  const currentTokenAddress = token?.address as `0x${string}`;

  // 定义实际存在的流动性池
  const directPairs = [
    // 注意: NATIVE 和 TKM20 是通过 WETH9 协议 1:1 兑换，不是 Uniswap 池子
    ...(tkm20Address && currentTokenAddress ? [{ token1: tkm20Address, token2: currentTokenAddress }] : []),
    ...(usdtAddress && currentTokenAddress ? [{ token1: usdtAddress, token2: currentTokenAddress }] : []),
    ...(token?.parentTokenAddress && currentTokenAddress
      ? [{ token1: token.parentTokenAddress, token2: currentTokenAddress }]
      : []),
  ];

  const fromAddr = fromToken.isNative ? 'NATIVE' : fromToken.address;
  const toAddr = toToken.isNative ? 'NATIVE' : toToken.address;

  // 特殊情况: 原生代币兑换需要通过多跳路径（因为原生代币与其他ERC20没有直接池）
  if (fromToken.isNative && !toToken.isNative && !toToken.isWETH) {
    // TKM -> 目标代币，必须通过 TKM20 -> LOVE20 -> 目标代币
    return buildNativeToTokenPath(toToken, tkm20Address, currentTokenAddress, usdtAddress, directPairs);
  }

  if (!fromToken.isNative && !fromToken.isWETH && toToken.isNative) {
    // 源代币 -> TKM，必须通过 源代币 -> LOVE20 -> TKM20
    return buildTokenToNativePath(fromToken, tkm20Address, currentTokenAddress, usdtAddress, directPairs);
  }

  // 检查是否存在直接交易对（仅限ERC20 to ERC20）
  const hasDirectPair = directPairs.some(
    (pair) =>
      (pair.token1 === fromAddr && pair.token2 === toAddr) || (pair.token1 === toAddr && pair.token2 === fromAddr),
  );

  if (hasDirectPair) {
    return buildDirectPath(fromToken, toToken, tkm20Address);
  }

  // 尝试通过中介代币路由
  return buildRoutedPath(fromToken, toToken, token, directPairs, tkm20Address, currentTokenAddress);
};

const buildDirectPath = (fromToken: TokenConfig, toToken: TokenConfig, tkm20Address: `0x${string}`): `0x${string}`[] => {
  // 注意: 这个函数只应该处理 ERC20 to ERC20 的直接路径
  // 原生代币的路径应该由专门的函数处理
  if (fromToken.isNative || toToken.isNative) {
    throw new Error('buildDirectPath should not handle native tokens');
  }
  return [fromToken.address as `0x${string}`, toToken.address as `0x${string}`];
};

const buildRoutedPath = (
  fromToken: TokenConfig,
  toToken: TokenConfig,
  token: any,
  directPairs: Array<{ token1: string; token2: `0x${string}` }>,
  tkm20Address: `0x${string}`,
  currentTokenAddress: `0x${string}`,
): `0x${string}`[] => {
  // 这个函数只处理 ERC20 to ERC20 的路由，原生代币应该在之前就被处理了
  if (fromToken.isNative || toToken.isNative) {
    throw new Error('buildRoutedPath should not handle native tokens');
  }

  const fromAddr = fromToken.address;
  const toAddr = toToken.address;

  // 尝试通过 LOVE20 路由
  if (currentTokenAddress && fromAddr !== currentTokenAddress && toAddr !== currentTokenAddress) {
    const hasFromToCurrent = directPairs.some(
      (pair) =>
        (pair.token1 === fromAddr && pair.token2 === currentTokenAddress) ||
        (pair.token1 === currentTokenAddress && pair.token2 === fromAddr),
    );
    const hasCurrentToTo = directPairs.some(
      (pair) =>
        (pair.token1 === currentTokenAddress && pair.token2 === toAddr) ||
        (pair.token1 === toAddr && pair.token2 === currentTokenAddress),
    );

    if (hasFromToCurrent && hasCurrentToTo) {
      return [fromToken.address as `0x${string}`, currentTokenAddress, toToken.address as `0x${string}`];
    }
  }

  // 尝试通过 TKM20 路由
  const hasFromToTKM20 = directPairs.some(
    (pair) =>
      (pair.token1 === fromAddr && pair.token2 === tkm20Address) ||
      (pair.token1 === tkm20Address && pair.token2 === fromAddr),
  );
  const hasTKM20ToTo = directPairs.some(
    (pair) =>
      (pair.token1 === tkm20Address && pair.token2 === toAddr) ||
      (pair.token1 === toAddr && pair.token2 === tkm20Address),
  );

  if (hasFromToTKM20 && hasTKM20ToTo) {
    return [fromToken.address as `0x${string}`, tkm20Address, toToken.address as `0x${string}`];
  }

  throw new Error(`No valid routing path found for ${fromToken.symbol} -> ${toToken.symbol}`);
};

// 处理原生代币到ERC20代币的路径 (TKM -> 目标代币)
const buildNativeToTokenPath = (
  toToken: TokenConfig,
  tkm20Address: `0x${string}`,
  currentTokenAddress: `0x${string}`,
  usdtAddress: `0x${string}`,
  directPairs: Array<{ token1: string; token2: `0x${string}` }>,
): `0x${string}`[] => {
  // 目标是 LOVE20，直接路径: TKM20 -> LOVE20
  if (toToken.address === currentTokenAddress) {
    return [tkm20Address, currentTokenAddress];
  }

  // 目标是 TUSDT，需要通过 LOVE20: TKM20 -> LOVE20 -> TUSDT
  if (toToken.address === usdtAddress) {
    const hasTKM20ToLOVE20 = directPairs.some(
      (pair) =>
        (pair.token1 === tkm20Address && pair.token2 === currentTokenAddress) ||
        (pair.token1 === currentTokenAddress && pair.token2 === tkm20Address),
    );
    const hasLOVE20ToTUSDT = directPairs.some(
      (pair) =>
        (pair.token1 === currentTokenAddress && pair.token2 === usdtAddress) ||
        (pair.token1 === usdtAddress && pair.token2 === currentTokenAddress),
    );

    if (hasTKM20ToLOVE20 && hasLOVE20ToTUSDT) {
      return [tkm20Address, currentTokenAddress, usdtAddress];
    }
  }

  // 回退: 尝试直接路径
  return [tkm20Address, toToken.address as `0x${string}`];
};

// 处理ERC20代币到原生代币的路径 (源代币 -> TKM)
const buildTokenToNativePath = (
  fromToken: TokenConfig,
  tkm20Address: `0x${string}`,
  currentTokenAddress: `0x${string}`,
  usdtAddress: `0x${string}`,
  directPairs: Array<{ token1: string; token2: `0x${string}` }>,
): `0x${string}`[] => {
  // 源是 LOVE20，直接路径: LOVE20 -> TKM20
  if (fromToken.address === currentTokenAddress) {
    return [currentTokenAddress, tkm20Address];
  }

  // 源是 TUSDT，需要通过 LOVE20: TUSDT -> LOVE20 -> TKM20
  if (fromToken.address === usdtAddress) {
    const hasTUSDTToLOVE20 = directPairs.some(
      (pair) =>
        (pair.token1 === usdtAddress && pair.token2 === currentTokenAddress) ||
        (pair.token1 === currentTokenAddress && pair.token2 === usdtAddress),
    );
    const hasLOVE20ToTKM20 = directPairs.some(
      (pair) =>
        (pair.token1 === currentTokenAddress && pair.token2 === tkm20Address) ||
        (pair.token1 === tkm20Address && pair.token2 === currentTokenAddress),
    );

    if (hasTUSDTToLOVE20 && hasLOVE20ToTKM20) {
      return [usdtAddress, currentTokenAddress, tkm20Address];
    }
  }

  // 回退: 尝试直接路径
  return [fromToken.address as `0x${string}`, tkm20Address];
};
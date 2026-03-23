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
  const firstTokenAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_FIRST_TOKEN as `0x${string}`;
  const currentTokenAddress = token?.address as `0x${string}`;

  // 定义实际存在的流动性池
  const directPairs = [
    // TKM20 ↔ FIRST_TOKEN
    ...(tkm20Address && firstTokenAddress ? [{ token1: tkm20Address, token2: firstTokenAddress }] : []),
    // TUSDT ↔ FIRST_TOKEN（TUSDT 只和 FIRST_TOKEN 有池子）
    ...(usdtAddress && firstTokenAddress ? [{ token1: usdtAddress, token2: firstTokenAddress }] : []),
    // parentToken ↔ 当前子币（如 FIRST_TOKEN ↔ Life20）
    ...(token?.parentTokenAddress && currentTokenAddress
      ? [{ token1: token.parentTokenAddress, token2: currentTokenAddress }]
      : []),
  ];

  const fromAddr = fromToken.isNative ? 'NATIVE' : fromToken.address;
  const toAddr = toToken.isNative ? 'NATIVE' : toToken.address;

  // 特殊情况: 原生代币兑换需要通过多跳路径（因为原生代币与其他ERC20没有直接池）
  if (fromToken.isNative && !toToken.isNative && !toToken.isWETH) {
    return buildNativeToTokenPath(toToken, tkm20Address, firstTokenAddress, directPairs);
  }

  if (!fromToken.isNative && !fromToken.isWETH && toToken.isNative) {
    return buildTokenToNativePath(fromToken, tkm20Address, firstTokenAddress, currentTokenAddress, directPairs);
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

  // 收集所有可能的中间代币，逐一尝试单跳路由
  const intermediates: `0x${string}`[] = [];
  if (currentTokenAddress) intermediates.push(currentTokenAddress);
  if (token?.parentTokenAddress) intermediates.push(token.parentTokenAddress as `0x${string}`);
  if (tkm20Address) intermediates.push(tkm20Address);

  for (const mid of intermediates) {
    if (mid === fromAddr || mid === toAddr) continue;

    const hasFromToMid = directPairs.some(
      (pair) =>
        (pair.token1 === fromAddr && pair.token2 === mid) || (pair.token1 === mid && pair.token2 === fromAddr),
    );
    const hasMidToTo = directPairs.some(
      (pair) =>
        (pair.token1 === mid && pair.token2 === toAddr) || (pair.token1 === toAddr && pair.token2 === mid),
    );

    if (hasFromToMid && hasMidToTo) {
      return [fromToken.address as `0x${string}`, mid, toToken.address as `0x${string}`];
    }
  }

  throw new Error(`No valid routing path found for ${fromToken.symbol} -> ${toToken.symbol}`);
};

// 处理原生代币到ERC20代币的路径 (TKM -> 目标代币)
// 原生代币通过 Router 自动 wrap 成 TKM20(WETH)，所以路径从 TKM20 开始
const buildNativeToTokenPath = (
  toToken: TokenConfig,
  tkm20Address: `0x${string}`,
  firstTokenAddress: `0x${string}`,
  directPairs: Array<{ token1: string; token2: `0x${string}` }>,
): `0x${string}`[] => {
  const toAddr = toToken.address as string;

  // 目标是 FIRST_TOKEN，直接路径: TKM20 -> FIRST_TOKEN
  if (toAddr === firstTokenAddress) {
    return [tkm20Address, firstTokenAddress];
  }

  // 目标是其他代币，尝试通过 FIRST_TOKEN 中转: TKM20 -> FIRST_TOKEN -> 目标代币
  const hasTKM20ToFirst = directPairs.some(
    (pair) =>
      (pair.token1 === tkm20Address && pair.token2 === firstTokenAddress) ||
      (pair.token1 === firstTokenAddress && pair.token2 === tkm20Address),
  );
  const hasFirstToTarget = directPairs.some(
    (pair) =>
      (pair.token1 === firstTokenAddress && pair.token2 === toAddr) ||
      (pair.token1 === toAddr && pair.token2 === firstTokenAddress),
  );

  if (hasTKM20ToFirst && hasFirstToTarget) {
    return [tkm20Address, firstTokenAddress, toToken.address as `0x${string}`];
  }

  // 回退: 尝试直接路径
  return [tkm20Address, toToken.address as `0x${string}`];
};

// 处理ERC20代币到原生代币的路径 (源代币 -> TKM)
// Router 最终会把 TKM20(WETH) unwrap 成原生代币，所以路径以 TKM20 结尾
const buildTokenToNativePath = (
  fromToken: TokenConfig,
  tkm20Address: `0x${string}`,
  firstTokenAddress: `0x${string}`,
  currentTokenAddress: `0x${string}`,
  directPairs: Array<{ token1: string; token2: `0x${string}` }>,
): `0x${string}`[] => {
  const fromAddr = fromToken.address as string;

  // 源是 FIRST_TOKEN，直接路径: FIRST_TOKEN -> TKM20
  if (fromAddr === firstTokenAddress) {
    return [firstTokenAddress, tkm20Address];
  }

  // 源是其他代币，尝试通过 FIRST_TOKEN 中转: 源代币 -> FIRST_TOKEN -> TKM20
  const hasSourceToFirst = directPairs.some(
    (pair) =>
      (pair.token1 === fromAddr && pair.token2 === firstTokenAddress) ||
      (pair.token1 === firstTokenAddress && pair.token2 === fromAddr),
  );
  const hasFirstToTKM20 = directPairs.some(
    (pair) =>
      (pair.token1 === firstTokenAddress && pair.token2 === tkm20Address) ||
      (pair.token1 === tkm20Address && pair.token2 === firstTokenAddress),
  );

  if (hasSourceToFirst && hasFirstToTKM20) {
    return [fromToken.address as `0x${string}`, firstTokenAddress, tkm20Address];
  }

  // 回退: 尝试直接路径
  return [fromToken.address as `0x${string}`, tkm20Address];
};
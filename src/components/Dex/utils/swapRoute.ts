import { MAX_SWAP_ROUTE_HOPS } from './swapConfig';
import { RouteTokenConfig, SwapMethod, SwapRouteQuote, TokenConfig } from './swapTypes';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

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

export const isZeroAddress = (address?: string | null) => !address || address === ZERO_ADDRESS;

export const getWrappedNativeAddress = () => process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ROOT_PARENT_TOKEN as
  | `0x${string}`
  | undefined;

export const resolveSwapEndpoints = (fromToken: TokenConfig, toToken: TokenConfig) => {
  const wrappedNativeAddress = getWrappedNativeAddress();

  return {
    sourceAddress: fromToken.isNative ? wrappedNativeAddress : (fromToken.address as `0x${string}`),
    targetAddress: toToken.isNative ? wrappedNativeAddress : (toToken.address as `0x${string}`),
  };
};

export const buildPairCandidates = (routeTokens: RouteTokenConfig[]) => {
  const pairCandidates: Array<{ tokenA: `0x${string}`; tokenB: `0x${string}` }> = [];

  for (let i = 0; i < routeTokens.length; i++) {
    for (let j = i + 1; j < routeTokens.length; j++) {
      const tokenA = routeTokens[i]?.address;
      const tokenB = routeTokens[j]?.address;

      if (!tokenA || !tokenB || tokenA.toLowerCase() === tokenB.toLowerCase()) {
        continue;
      }

      pairCandidates.push({ tokenA, tokenB });
    }
  }

  return pairCandidates;
};

export const buildTokenSymbolMap = (routeTokens: RouteTokenConfig[]) => {
  const tokenSymbolMap = new Map<string, string>();
  routeTokens.forEach((token) => {
    tokenSymbolMap.set(token.address.toLowerCase(), token.symbol);
  });
  return tokenSymbolMap;
};

export const buildRouteGraph = (pairs: Array<{ tokenA: `0x${string}`; tokenB: `0x${string}` }>) => {
  const graph = new Map<string, Set<`0x${string}`>>();

  const addEdge = (from: `0x${string}`, to: `0x${string}`) => {
    const key = from.toLowerCase();
    if (!graph.has(key)) {
      graph.set(key, new Set());
    }
    graph.get(key)!.add(to);
  };

  pairs.forEach(({ tokenA, tokenB }) => {
    addEdge(tokenA, tokenB);
    addEdge(tokenB, tokenA);
  });

  return graph;
};

export const enumerateCandidatePaths = (
  graph: Map<string, Set<`0x${string}`>>,
  sourceAddress: `0x${string}`,
  targetAddress: `0x${string}`,
  maxHops: number = MAX_SWAP_ROUTE_HOPS,
): `0x${string}`[][] => {
  const maxPathLength = maxHops + 1;
  const results: `0x${string}`[][] = [];

  const dfs = (current: `0x${string}`, path: `0x${string}`[], visited: Set<string>) => {
    if (path.length > maxPathLength) {
      return;
    }

    if (current.toLowerCase() === targetAddress.toLowerCase()) {
      results.push([...path]);
      return;
    }

    const neighbors = Array.from(graph.get(current.toLowerCase()) ?? []);
    for (const next of neighbors) {
      const normalizedNext = next.toLowerCase();
      if (visited.has(normalizedNext) || path.length >= maxPathLength) {
        continue;
      }

      visited.add(normalizedNext);
      path.push(next);
      dfs(next, path, visited);
      path.pop();
      visited.delete(normalizedNext);
    }
  };

  dfs(sourceAddress, [sourceAddress], new Set([sourceAddress.toLowerCase()]));
  return results;
};

export const sortCandidatePaths = (paths: `0x${string}`[][]) =>
  [...paths].sort((leftPath, rightPath) => {
    if (leftPath.length !== rightPath.length) {
      return leftPath.length - rightPath.length;
    }

    return leftPath.join('-').localeCompare(rightPath.join('-'));
  });

export const buildDisplayPath = (
  path: `0x${string}`[],
  tokenSymbolMap: Map<string, string>,
  fromToken: TokenConfig,
  toToken: TokenConfig,
  swapMethod: SwapMethod,
) => {
  const displayPath = path.map(
    (address) => tokenSymbolMap.get(address.toLowerCase()) || `${address.slice(0, 6)}...${address.slice(-4)}`,
  );

  if (swapMethod === 'UniswapV2_ETH_TO_TOKEN' && displayPath.length > 0) {
    return [fromToken.symbol, ...displayPath.slice(1)];
  }

  if (swapMethod === 'UniswapV2_TOKEN_TO_ETH' && displayPath.length > 0) {
    return [...displayPath.slice(0, -1), toToken.symbol];
  }

  return displayPath;
};

export const selectBestRouteQuote = (quotes: SwapRouteQuote[]) =>
  quotes.reduce<SwapRouteQuote | undefined>((bestQuote, currentQuote) => {
    if (!bestQuote) {
      return currentQuote;
    }

    if (currentQuote.outputAmount > bestQuote.outputAmount) {
      return currentQuote;
    }

    if (currentQuote.outputAmount === bestQuote.outputAmount) {
      if (currentQuote.path.length < bestQuote.path.length) {
        return currentQuote;
      }

      if (currentQuote.path.length === bestQuote.path.length) {
        return currentQuote.path.join('-').localeCompare(bestQuote.path.join('-')) < 0 ? currentQuote : bestQuote;
      }
    }

    return bestQuote;
  }, undefined);

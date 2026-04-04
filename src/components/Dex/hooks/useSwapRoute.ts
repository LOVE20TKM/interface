import { useMemo } from 'react';
import { UniswapV2FactoryAbi } from '@/src/abis/UniswapV2Factory';
import { UniswapV2RouterAbi } from '@/src/abis/UniswapV2Router';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useUniversalReadContracts } from '@/src/lib/universalReadContract';
import { useInitialStakeRound } from '@/src/hooks/contracts/useLOVE20Stake';
import useTokenContext from '@/src/hooks/context/useTokenContext';
import { buildSwapRouteTokens } from '../utils/swapConfig';
import { SwapRouteQuote, TokenConfig } from '../utils/swapTypes';
import {
  buildDisplayPath,
  buildPairCandidates,
  buildRouteGraph,
  buildTokenSymbolMap,
  determineSwapMethod,
  enumerateCandidatePaths,
  isZeroAddress,
  resolveSwapEndpoints,
  selectBestRouteQuote,
  sortCandidatePaths,
} from '../utils/swapRoute';

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_FACTORY as `0x${string}`;
const ROUTER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_ROUTER as `0x${string}`;

export const useSwapRoute = (
  fromToken: TokenConfig,
  toToken: TokenConfig,
  fromAmount: bigint,
  supportedTokens: TokenConfig[],
) => {
  const { token } = useTokenContext();

  const swapMethod = useMemo(() => determineSwapMethod(fromToken, toToken), [fromToken, toToken]);

  const routeTokens = useMemo(
    () => buildSwapRouteTokens(supportedTokens, token, [fromToken, toToken]),
    [supportedTokens, token, fromToken, toToken],
  );

  const tokenSymbolMap = useMemo(() => buildTokenSymbolMap(routeTokens), [routeTokens]);

  const { sourceAddress, targetAddress } = useMemo(() => resolveSwapEndpoints(fromToken, toToken), [fromToken, toToken]);

  const pairCandidates = useMemo(() => {
    if (swapMethod === 'WETH9' || !FACTORY_ADDRESS || !sourceAddress || !targetAddress) {
      return [];
    }

    return buildPairCandidates(routeTokens);
  }, [routeTokens, sourceAddress, swapMethod, targetAddress]);

  const {
    data: pairData,
    error: pairError,
    isPending: isPendingPairs,
  } = useUniversalReadContracts({
    contracts: pairCandidates.map(({ tokenA, tokenB }) => ({
      address: FACTORY_ADDRESS,
      abi: UniswapV2FactoryAbi,
      functionName: 'getPair' as const,
      args: [tokenA, tokenB] as const,
    })) as any,
    query: {
      enabled: pairCandidates.length > 0,
    },
  });

  const availablePairs = useMemo(() => {
    if (!pairData || pairData.length === 0) {
      return [];
    }

    return pairCandidates.filter((pair, index) => {
      const result = pairData[index] as { result?: `0x${string}`; status?: string } | undefined;
      const pairAddress = result?.result as `0x${string}` | undefined;
      return result?.status !== 'failure' && !isZeroAddress(pairAddress);
    });
  }, [pairCandidates, pairData]);

  const routeGraph = useMemo(() => buildRouteGraph(availablePairs), [availablePairs]);

  const candidatePaths = useMemo(() => {
    if (swapMethod === 'WETH9' || !sourceAddress || !targetAddress) {
      return [];
    }

    return sortCandidatePaths(enumerateCandidatePaths(routeGraph, sourceAddress, targetAddress));
  }, [routeGraph, sourceAddress, swapMethod, targetAddress]);

  const {
    initialStakeRound,
    isPending: isPendingInitialStakeRound,
    error: errInitialStakeRound,
  } = useInitialStakeRound(token?.address as `0x${string}`);

  const useCurrentToken = fromToken.symbol === token?.symbol || toToken.symbol === token?.symbol;
  const canUseCurrentToken = !useCurrentToken || !!initialStakeRound;

  const quoteContracts = useMemo(() => {
    if (
      swapMethod === 'WETH9' ||
      !ROUTER_ADDRESS ||
      !canUseCurrentToken ||
      fromAmount <= BigInt(0) ||
      candidatePaths.length === 0
    ) {
      return [];
    }

    return candidatePaths.map((path) => ({
      address: ROUTER_ADDRESS,
      abi: UniswapV2RouterAbi,
      functionName: 'getAmountsOut' as const,
      args: [fromAmount, path] as const,
    }));
  }, [canUseCurrentToken, candidatePaths, fromAmount, swapMethod]);

  const {
    data: quoteData,
    error: quoteError,
    isPending: isPendingQuotes,
  } = useUniversalReadContracts({
    contracts: quoteContracts as any,
    allowFailure: true,
    query: {
      enabled: quoteContracts.length > 0,
    },
  });

  const quotedRoutes = useMemo<SwapRouteQuote[]>(() => {
    if (!quoteData || quoteData.length === 0) {
      return [];
    }

    return candidatePaths.reduce<SwapRouteQuote[]>((routes, path, index) => {
      const result = quoteData[index] as
        | {
            result?: readonly bigint[];
            status?: string;
          }
        | undefined;

      if (result?.status === 'failure' || !Array.isArray(result?.result)) {
        return routes;
      }

      const amountsOut = result.result.map((value) => safeToBigInt(value));
      const outputAmount = amountsOut[amountsOut.length - 1] ?? BigInt(0);

      if (amountsOut.length !== path.length || outputAmount <= BigInt(0)) {
        return routes;
      }

      routes.push({
        path,
        displayPath: buildDisplayPath(path, tokenSymbolMap, fromToken, toToken, swapMethod),
        amountsOut,
        outputAmount,
      });

      return routes;
    }, []);
  }, [candidatePaths, fromToken, quoteData, swapMethod, toToken, tokenSymbolMap]);

  const bestRoute = useMemo(() => selectBestRouteQuote(quotedRoutes), [quotedRoutes]);

  const firstQuoteFailure = useMemo(() => {
    if (!quoteData) {
      return undefined;
    }

    const failedResult = (quoteData as Array<{ status?: string; error?: Error }>).find(
      (result) => result?.status === 'failure' && result.error,
    );

    return failedResult?.error;
  }, [quoteData]);

  const swapPath = useMemo(() => {
    if (swapMethod === 'WETH9') {
      return [];
    }

    if (fromAmount > BigInt(0)) {
      return bestRoute?.path ?? [];
    }

    return candidatePaths[0] ?? [];
  }, [bestRoute, candidatePaths, fromAmount, swapMethod]);

  const amountsOut = bestRoute?.amountsOut;

  const hasRouteCandidates = swapMethod === 'WETH9' ? true : candidatePaths.length > 0;
  const hasBestRoute = swapMethod === 'WETH9' ? true : fromAmount === BigInt(0) ? hasRouteCandidates : !!bestRoute;
  const canSwap = canUseCurrentToken && hasBestRoute;

  const amountsOutError = useMemo(() => {
    if (swapMethod === 'WETH9' || fromAmount <= BigInt(0) || !canUseCurrentToken) {
      return null;
    }

    if (!isPendingPairs && candidatePaths.length === 0) {
      return pairError ?? new Error(`No valid swap route found for ${fromToken.symbol} -> ${toToken.symbol}`);
    }

    if (!isPendingQuotes && !bestRoute) {
      return firstQuoteFailure ?? quoteError ?? new Error('All candidate routes failed to quote');
    }

    return null;
  }, [
    bestRoute,
    canUseCurrentToken,
    candidatePaths.length,
    firstQuoteFailure,
    fromAmount,
    fromToken.symbol,
    isPendingPairs,
    isPendingQuotes,
    pairError,
    quoteError,
    swapMethod,
    toToken.symbol,
  ]);

  const isAmountsOutLoading =
    swapMethod !== 'WETH9' &&
    fromAmount > BigInt(0) &&
    canUseCurrentToken &&
    (isPendingPairs || (quoteContracts.length > 0 && isPendingQuotes));

  return {
    swapMethod,
    swapPath,
    amountsOut,
    amountsOutError,
    isAmountsOutLoading,
    canSwap,
    initialStakeRound,
    isPendingInitialStakeRound,
    errInitialStakeRound,
    candidateRouteCount: candidatePaths.length,
    quotedRoutes,
    bestRoute,
  };
};

import { useMemo } from 'react';
import { useGetAmountsOut } from '@/src/hooks/contracts/useUniswapV2Router';
import { useInitialStakeRound } from '@/src/hooks/contracts/useLOVE20Stake';
import { TokenConfig } from '../utils/swapTypes';
import { determineSwapMethod, buildSwapPath } from '../utils/swapRoute';
import useTokenContext from '@/src/hooks/context/useTokenContext';

export const useSwapRoute = (fromToken: TokenConfig, toToken: TokenConfig, fromAmount: bigint) => {
  const { token } = useTokenContext();

  const swapMethod = useMemo(() => determineSwapMethod(fromToken, toToken), [fromToken, toToken]);

  const swapPath = useMemo(() => {
    if (swapMethod === 'WETH9') {
      return [];
    }
    return buildSwapPath(fromToken, toToken, token);
  }, [fromToken, toToken, swapMethod, token]);

  const {
    initialStakeRound,
    isPending: isPendingInitialStakeRound,
    error: errInitialStakeRound,
  } = useInitialStakeRound(token?.address as `0x${string}`);

  const useCurrentToken = fromToken.symbol === token?.symbol || toToken.symbol === token?.symbol;
  const canSwap = !useCurrentToken || !!initialStakeRound;

  const {
    data: amountsOut,
    error: amountsOutError,
    isLoading: isAmountsOutLoading,
  } = useGetAmountsOut(
    fromAmount,
    swapPath,
    canSwap && swapMethod !== 'WETH9' && fromAmount > BigInt(0) && swapPath.length >= 2,
  );

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
  };
};
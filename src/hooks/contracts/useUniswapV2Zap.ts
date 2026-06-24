import { useEffect } from 'react';
import { useReadContract } from 'wagmi';

import { UniswapV2ZapAbi } from '@/src/abis/UniswapV2Zap';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';

type Address = `0x${string}`;

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

export const UNISWAP_V2_ZAP_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_UNISWAP_V2_ZAP ||
  ZERO_ADDRESS) as Address;

export const isUniswapV2ZapConfigured = UNISWAP_V2_ZAP_ADDRESS.toLowerCase() !== ZERO_ADDRESS;

export interface ZapTokenParams {
  tokenA: Address;
  tokenB: Address;
  amountAIn: bigint;
  amountBIn: bigint;
  amountAMin: bigint;
  amountBMin: bigint;
  liquidityMin: bigint;
  to: Address;
  deadline: bigint;
}

export interface ZapQuote {
  hasLiquidity: boolean;
  willSwap: boolean;
  swapTokenIn: Address;
  swapTokenOut: Address;
  amountToSwap: bigint;
  amountOutFromSwap: bigint;
  amountAUsed: bigint;
  amountBUsed: bigint;
  liquidity: bigint;
  reserveAAfter: bigint;
  reserveBAfter: bigint;
}

interface ZapNativeQuote {
  hasLiquidity: boolean;
  willSwap: boolean;
  swapTokenIn: Address;
  swapTokenOut: Address;
  amountToSwap: bigint;
  amountOutFromSwap: bigint;
  amountTokenUsed: bigint;
  amountNativeUsed: bigint;
  liquidity: bigint;
  reserveTokenAfter: bigint;
  reserveNativeAfter: bigint;
}

export function useZapQuote(
  tokenA: Address | undefined,
  tokenB: Address | undefined,
  amountAIn: bigint,
  amountBIn: bigint,
  enabled: boolean,
  isTokenANative: boolean = false,
) {
  const tokenQuote = useReadContract({
    address: UNISWAP_V2_ZAP_ADDRESS,
    abi: UniswapV2ZapAbi,
    functionName: 'quoteZapToken',
    args: [tokenA || ZERO_ADDRESS, tokenB || ZERO_ADDRESS, amountAIn, amountBIn],
    query: {
      enabled:
        enabled &&
        !isTokenANative &&
        isUniswapV2ZapConfigured &&
        !!tokenA &&
        !!tokenB &&
        tokenA !== tokenB &&
        (amountAIn > BigInt(0) || amountBIn > BigInt(0)),
    },
  });

  const nativeQuote = useReadContract({
    address: UNISWAP_V2_ZAP_ADDRESS,
    abi: UniswapV2ZapAbi,
    functionName: 'quoteZapNativeToken',
    args: [tokenB || ZERO_ADDRESS, amountBIn, amountAIn],
    query: {
      enabled:
        enabled &&
        isTokenANative &&
        isUniswapV2ZapConfigured &&
        !!tokenB &&
        (amountAIn > BigInt(0) || amountBIn > BigInt(0)),
    },
  });

  if (isTokenANative) {
    const quote = nativeQuote.data as ZapNativeQuote | undefined;
    return {
      quote: quote
        ? {
            hasLiquidity: quote.hasLiquidity,
            willSwap: quote.willSwap,
            swapTokenIn: quote.swapTokenIn,
            swapTokenOut: quote.swapTokenOut,
            amountToSwap: quote.amountToSwap,
            amountOutFromSwap: quote.amountOutFromSwap,
            amountAUsed: quote.amountNativeUsed,
            amountBUsed: quote.amountTokenUsed,
            liquidity: quote.liquidity,
            reserveAAfter: quote.reserveNativeAfter,
            reserveBAfter: quote.reserveTokenAfter,
          }
        : undefined,
      isLoading: nativeQuote.isLoading,
      error: nativeQuote.error,
    };
  }

  return { quote: tokenQuote.data as ZapQuote | undefined, isLoading: tokenQuote.isLoading, error: tokenQuote.error };
}

export function useZapToken() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    UniswapV2ZapAbi,
    UNISWAP_V2_ZAP_ADDRESS,
    'zapToken',
  );

  const zapToken = async (params: ZapTokenParams) => {
    console.log('提交zapToken交易:', { ...params, isTukeMode });
    return await execute([params]);
  };

  useEffect(() => {
    if (hash) {
      console.log('zapToken tx hash:', hash);
    }
    if (error) {
      console.log('提交zapToken交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    zapToken,
    writeData: hash,
    isWriting: isPending,
    writeError: error,
    isConfirming,
    isConfirmed,
    isTukeMode,
  };
}

export function useZapNativeToken() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    UniswapV2ZapAbi,
    UNISWAP_V2_ZAP_ADDRESS,
    'zapNativeToken',
  );

  const zapNativeToken = async (
    token: Address,
    amountTokenIn: bigint,
    amountTokenMin: bigint,
    amountNativeMin: bigint,
    liquidityMin: bigint,
    to: Address,
    deadline: bigint,
    amountNativeIn: bigint,
  ) => {
    console.log('提交zapNativeToken交易:', {
      token,
      amountTokenIn,
      amountTokenMin,
      amountNativeMin,
      liquidityMin,
      to,
      deadline,
      amountNativeIn,
      isTukeMode,
    });
    return await execute(
      [token, amountTokenIn, amountTokenMin, amountNativeMin, liquidityMin, to, deadline],
      amountNativeIn,
    );
  };

  useEffect(() => {
    if (hash) {
      console.log('zapNativeToken tx hash:', hash);
    }
    if (error) {
      console.log('提交zapNativeToken交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    zapNativeToken,
    writeData: hash,
    isWriting: isPending,
    writeError: error,
    isConfirming,
    isConfirmed,
    isTukeMode,
  };
}

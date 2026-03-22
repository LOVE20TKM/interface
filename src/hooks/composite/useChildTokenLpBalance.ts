import { useMemo } from 'react';
import { useUniversalReadContract, useUniversalReadContracts } from '@/src/lib/universalReadContract';
import { LOVE20TokenViewerAbi } from '@/src/abis/LOVE20TokenViewer';
import { UniswapV2PairAbi } from '@/src/abis/UniswapV2Pair';
import type { TokenInfo } from '@/src/types/love20types';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
const TOKEN_VIEWER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PERIPHERAL_TOKENVIEWER as `0x${string}`;

export const useChildTokenLpBalance = (
  parentTokenAddress: `0x${string}` | undefined,
  childTokensCount: bigint | undefined,
  enabled = true,
) => {
  const totalChildren = childTokensCount ?? BigInt(0);
  const shouldQueryChildren = !!parentTokenAddress && parentTokenAddress !== ZERO_ADDRESS && enabled && totalChildren > 0;

  const { data: childTokensData, isPending: isPendingChildTokens, error: errorChildTokens } = useUniversalReadContract({
    address: TOKEN_VIEWER_ADDRESS,
    abi: LOVE20TokenViewerAbi,
    functionName: 'childTokensByPage',
    args: [parentTokenAddress ?? ZERO_ADDRESS, BigInt(0), totalChildren > BigInt(0) ? totalChildren - BigInt(1) : BigInt(0)],
    query: {
      enabled: shouldQueryChildren,
    },
  });

  const childTokens = childTokensData as `0x${string}`[] | undefined;
  const hasChildTokens = !!childTokens && childTokens.length > 0;
  const shouldQueryTokenDetails = shouldQueryChildren && hasChildTokens;

  const {
    data: tokenDetailsData,
    isPending: isPendingTokenDetails,
    error: errorTokenDetails,
  } = useUniversalReadContract({
    address: TOKEN_VIEWER_ADDRESS,
    abi: LOVE20TokenViewerAbi,
    functionName: 'tokenDetails',
    args: [childTokens ?? []],
    query: {
      enabled: shouldQueryTokenDetails,
    },
  });

  const childTokenInfos = (tokenDetailsData?.[0] as TokenInfo[] | undefined) ?? [];

  const childPairs = useMemo(() => {
    return childTokenInfos.filter(
      (tokenInfo) =>
        tokenInfo.uniswapV2PairAddress &&
        tokenInfo.uniswapV2PairAddress !== ZERO_ADDRESS &&
        tokenInfo.uniswapV2PairAddress !== undefined,
    );
  }, [childTokenInfos]);

  const pairContracts = useMemo(() => {
    return childPairs.flatMap((tokenInfo) => [
      {
        address: tokenInfo.uniswapV2PairAddress,
        abi: UniswapV2PairAbi,
        functionName: 'getReserves' as const,
      },
      {
        address: tokenInfo.uniswapV2PairAddress,
        abi: UniswapV2PairAbi,
        functionName: 'token0' as const,
      },
      {
        address: tokenInfo.uniswapV2PairAddress,
        abi: UniswapV2PairAbi,
        functionName: 'token1' as const,
      },
    ]);
  }, [childPairs]);

  const { data: pairData, isPending: isPendingPairs, error: errorPairs } = useUniversalReadContracts({
    contracts: pairContracts as any,
    query: {
      enabled: pairContracts.length > 0,
    },
  });

  const shouldQueryPairs = pairContracts.length > 0;

  const childTokenLpBalance = useMemo(() => {
    if (!parentTokenAddress || childPairs.length === 0 || !pairData || pairData.length !== childPairs.length * 3) {
      return BigInt(0);
    }

    return childPairs.reduce((total, _tokenInfo, index) => {
      const reserves = pairData[index * 3]?.result as [bigint, bigint, number] | undefined;
      const token0 = pairData[index * 3 + 1]?.result as `0x${string}` | undefined;
      const token1 = pairData[index * 3 + 2]?.result as `0x${string}` | undefined;

      if (!reserves || !token0 || !token1) {
        return total;
      }

      const [reserve0, reserve1] = reserves;
      if (token0.toLowerCase() === parentTokenAddress.toLowerCase()) {
        return total + reserve0;
      }
      if (token1.toLowerCase() === parentTokenAddress.toLowerCase()) {
        return total + reserve1;
      }
      return total;
    }, BigInt(0));
  }, [parentTokenAddress, childPairs, pairData]);

  return {
    childTokenLpBalance,
    isPending:
      (shouldQueryChildren && isPendingChildTokens) ||
      (shouldQueryTokenDetails && isPendingTokenDetails) ||
      (shouldQueryPairs && isPendingPairs),
    error: errorChildTokens || errorTokenDetails || errorPairs,
  };
};

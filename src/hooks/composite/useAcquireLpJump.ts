import { useEffect, useMemo } from 'react';
import { LOVE20LaunchAbi } from '@/src/abis/LOVE20Launch';
import { LOVE20TokenAbi } from '@/src/abis/LOVE20Token';
import { UniswapV2PairAbi } from '@/src/abis/UniswapV2Pair';
import { LocalCache } from '@/src/lib/LocalCache';
import { useUniversalReadContracts } from '@/src/lib/universalReadContract';
import { LaunchInfo } from '@/src/types/love20types';
import { useChainId } from 'wagmi';

interface UseAcquireLpJumpParams {
  pairAddress: `0x${string}` | undefined;
}

export type AcquireLpJumpStatus = 'supported' | 'unsupported' | 'resolving' | 'error';

interface UseAcquireLpJumpResult {
  status: AcquireLpJumpStatus;
  href?: string;
  isSupported: boolean;
  isResolving: boolean;
  hasError: boolean;
}

interface AcquireLpJumpCacheValue {
  status: Extract<AcquireLpJumpStatus, 'supported' | 'unsupported'>;
  href?: string;
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
const LAUNCH_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_LAUNCH as `0x${string}`;

const buildAcquireLpJumpCacheKey = (chainId: number, pairAddress: `0x${string}`) =>
  `acquire_lp_jump:${chainId}:${pairAddress.toLowerCase()}`;

const readStringResult = (result: any): string | undefined => {
  return result?.status === 'success' && typeof result.result === 'string' ? result.result : undefined;
};

const readBooleanResult = (result: any): boolean | undefined => {
  return result?.status === 'success' && typeof result.result === 'boolean' ? result.result : undefined;
};

const readAddressResult = (result: any): `0x${string}` | undefined => {
  return result?.status === 'success' && typeof result.result === 'string'
    ? (result.result as `0x${string}`)
    : undefined;
};

const readLaunchParentAddress = (result: any): `0x${string}` | undefined => {
  if (result?.status !== 'success' || !result.result) return undefined;

  const parentTokenAddress = (result.result as LaunchInfo).parentTokenAddress;
  return typeof parentTokenAddress === 'string' && parentTokenAddress !== ZERO_ADDRESS
    ? (parentTokenAddress as `0x${string}`)
    : undefined;
};

export const useAcquireLpJump = ({ pairAddress }: UseAcquireLpJumpParams): UseAcquireLpJumpResult => {
  const chainId = useChainId();
  const usdtAddress = process.env.NEXT_PUBLIC_USDT_ADDRESS?.toLowerCase();
  const usdtSymbol = process.env.NEXT_PUBLIC_USDT_SYMBOL?.trim();
  const cacheKey = useMemo(() => {
    if (!pairAddress || !chainId) return undefined;
    return buildAcquireLpJumpCacheKey(chainId, pairAddress);
  }, [chainId, pairAddress]);

  const cachedJump = useMemo(() => {
    if (!cacheKey) return null;
    return LocalCache.get<AcquireLpJumpCacheValue>(cacheKey);
  }, [cacheKey]);

  const shouldReadPair = !!pairAddress && !cachedJump;

  const pairContracts = useMemo(() => {
    if (!shouldReadPair || !pairAddress) return [];

    return [
      {
        address: pairAddress,
        abi: UniswapV2PairAbi,
        functionName: 'token0' as const,
      },
      {
        address: pairAddress,
        abi: UniswapV2PairAbi,
        functionName: 'token1' as const,
      },
    ];
  }, [shouldReadPair, pairAddress]);

  const { data: pairData, isPending: isPendingPair } = useUniversalReadContracts({
    contracts: pairContracts as any,
    query: {
      enabled: pairContracts.length > 0,
    },
  });

  const token0 = useMemo(() => readAddressResult(pairData?.[0]), [pairData]);
  const token1 = useMemo(() => readAddressResult(pairData?.[1]), [pairData]);

  const metadataTargets = useMemo(() => {
    if (!token0 || !token1) return [];

    const token0Address = token0.toLowerCase();
    const token1Address = token1.toLowerCase();

    if (usdtAddress && token0Address === usdtAddress) return [token1];
    if (usdtAddress && token1Address === usdtAddress) return [token0];

    return [token0, token1];
  }, [token0, token1, usdtAddress]);

  const metadataContracts = useMemo(
    () =>
      metadataTargets.flatMap((address) => [
        {
          address: LAUNCH_ADDRESS,
          abi: LOVE20LaunchAbi,
          functionName: 'isLOVE20Token' as const,
          args: [address],
        },
        {
          address: LAUNCH_ADDRESS,
          abi: LOVE20LaunchAbi,
          functionName: 'launchInfo' as const,
          args: [address],
        },
        {
          address,
          abi: LOVE20TokenAbi,
          functionName: 'symbol' as const,
        },
      ]),
    [metadataTargets],
  );

  const { data: metadataData, isPending: isPendingMetadata } = useUniversalReadContracts({
    contracts: metadataContracts as any,
    query: {
      enabled: metadataContracts.length > 0,
    },
  });

  const tokenMetadata = useMemo(() => {
    return metadataTargets.reduce<Record<string, { isLove20: boolean; parentTokenAddress?: `0x${string}`; symbol?: string }>>(
      (acc, address, index) => {
        const isLove20 = readBooleanResult(metadataData?.[index * 3]) ?? false;
        const parentTokenAddress = readLaunchParentAddress(metadataData?.[index * 3 + 1]);
        const symbol = readStringResult(metadataData?.[index * 3 + 2]);

        acc[address.toLowerCase()] = {
          isLove20,
          parentTokenAddress,
          symbol,
        };

        return acc;
      },
      {},
    );
  }, [metadataTargets, metadataData]);

  const pairReadFailed = useMemo(() => {
    if (!shouldReadPair || !pairData || pairData.length !== pairContracts.length) return false;
    return pairData.some((result) => result?.status !== 'success');
  }, [shouldReadPair, pairData, pairContracts.length]);

  const pairReadSucceeded = useMemo(() => {
    if (!shouldReadPair) return false;
    if (!pairData || pairData.length !== pairContracts.length) return false;
    return pairData.every((result) => result?.status === 'success');
  }, [shouldReadPair, pairData, pairContracts.length]);

  const metadataReadFailed = useMemo(() => {
    if (!shouldReadPair || metadataContracts.length === 0) return false;
    if (!metadataData || metadataData.length !== metadataContracts.length) return false;
    return metadataData.some((result) => result?.status !== 'success');
  }, [shouldReadPair, metadataContracts.length, metadataData]);

  const metadataReadSucceeded = useMemo(() => {
    if (!shouldReadPair) return false;
    if (metadataContracts.length === 0) return true;
    if (!metadataData || metadataData.length !== metadataContracts.length) return false;
    return metadataData.every((result) => result?.status === 'success');
  }, [shouldReadPair, metadataContracts.length, metadataData]);

  const isResolving = useMemo(() => {
    if (cachedJump) return false;
    if (!pairAddress || !shouldReadPair) return false;
    if (pairContracts.length > 0 && (!pairData || isPendingPair)) return true;
    if (!pairReadSucceeded) return false;
    return metadataContracts.length > 0 && (!metadataData || isPendingMetadata);
  }, [
    cachedJump,
    pairAddress,
    shouldReadPair,
    pairContracts.length,
    pairData,
    isPendingPair,
    pairReadSucceeded,
    metadataContracts.length,
    metadataData,
    isPendingMetadata,
  ]);

  const hasResolutionError = useMemo(() => {
    if (cachedJump) return false;
    if (!pairAddress) return true;
    if (isResolving) return false;
    if (pairReadFailed || metadataReadFailed) return true;
    if (pairData && pairContracts.length > 0 && pairData.length !== pairContracts.length) return true;
    if (pairReadSucceeded && (!token0 || !token1)) return true;
    if (metadataData && metadataContracts.length > 0 && metadataData.length !== metadataContracts.length) return true;
    return false;
  }, [
    cachedJump,
    pairAddress,
    isResolving,
    pairReadFailed,
    metadataReadFailed,
    pairData,
    pairContracts.length,
    pairReadSucceeded,
    token0,
    token1,
    metadataData,
    metadataContracts.length,
  ]);

  const jump = useMemo<UseAcquireLpJumpResult>(() => {
    if (cachedJump) {
      return {
        ...cachedJump,
        isSupported: cachedJump.status === 'supported',
        isResolving: false,
        hasError: false,
      };
    }

    if (isResolving) {
      return {
        status: 'resolving',
        href: undefined,
        isSupported: false,
        isResolving: true,
        hasError: false,
      };
    }

    if (hasResolutionError) {
      return {
        status: 'error',
        href: undefined,
        isSupported: false,
        isResolving: false,
        hasError: true,
      };
    }

    const token0Address = token0?.toLowerCase();
    const token1Address = token1?.toLowerCase();

    let routeSymbol: string | undefined;
    let baseTokenSymbol: string | undefined;

    if (token0Address && token1Address) {
      const token0Info = tokenMetadata[token0Address];
      const token1Info = tokenMetadata[token1Address];
      const token0ParentAddress = token0Info?.parentTokenAddress?.toLowerCase();
      const token1ParentAddress = token1Info?.parentTokenAddress?.toLowerCase();

      if (usdtAddress && token0Address === usdtAddress) {
        if (token1Info?.isLove20 && token1Info.symbol && usdtSymbol) {
          routeSymbol = token1Info.symbol;
          baseTokenSymbol = usdtSymbol;
        }
      } else if (usdtAddress && token1Address === usdtAddress) {
        if (token0Info?.isLove20 && token0Info.symbol && usdtSymbol) {
          routeSymbol = token0Info.symbol;
          baseTokenSymbol = usdtSymbol;
        }
      } else {
        // 父子币 LP 对只要求子币能识别出 parentTokenAddress。
        // 这样可覆盖 子币+根父币 的场景，不必要求父币本身也是 LOVE20 子币。
        if (token0ParentAddress && token0ParentAddress === token1Address && token0Info?.symbol && token1Info?.symbol) {
          routeSymbol = token0Info.symbol;
          baseTokenSymbol = token1Info.symbol;
        } else if (
          token1ParentAddress &&
          token1ParentAddress === token0Address &&
          token1Info?.symbol &&
          token0Info?.symbol
        ) {
          routeSymbol = token1Info.symbol;
          baseTokenSymbol = token0Info.symbol;
        }
      }
    }

    if (!routeSymbol || !baseTokenSymbol) {
      return {
        status: 'unsupported',
        href: undefined,
        isSupported: false,
        isResolving: false,
        hasError: false,
      };
    }

    const params = new URLSearchParams({ tab: 'liquidity' });
    params.set('symbol', routeSymbol);
    params.set('baseToken', baseTokenSymbol);

    return {
      status: 'supported',
      href: `/dex/?${params.toString()}`,
      isSupported: true,
      isResolving: false,
      hasError: false,
    };
  }, [cachedJump, isResolving, hasResolutionError, token0, token1, tokenMetadata, usdtAddress, usdtSymbol]);

  const isCacheable = useMemo(() => {
    if (!shouldReadPair || !token0 || !token1) return false;
    return pairReadSucceeded && metadataReadSucceeded;
  }, [shouldReadPair, token0, token1, pairReadSucceeded, metadataReadSucceeded]);

  useEffect(() => {
    if (!cacheKey || cachedJump || !isCacheable) return;
    if (jump.status !== 'supported' && jump.status !== 'unsupported') return;
    LocalCache.set<AcquireLpJumpCacheValue>(cacheKey, {
      status: jump.status,
      href: jump.href,
    });
  }, [cacheKey, cachedJump, isCacheable, jump]);

  return jump;
};

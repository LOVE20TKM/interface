// hooks/contracts/useLOVE20TokenViewer.ts

import { useUniversalReadContract } from '@/src/lib/universalReadContract';
import { LOVE20TokenViewerAbi } from '@/src/abis/LOVE20TokenViewer';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { LaunchInfo, TokenInfo, PairInfo, TokenStats } from '@/src/types/love20types';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PERIPHERAL_TOKENVIEWER as `0x${string}`;

// =====================
// === 读取 Hooks ===
// =====================

/**
 * Hook for launchAddress
 * Reads the address of the launch contract.
 */
export const useLaunchAddress = () => {
  const { data, isPending, error } = useUniversalReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20TokenViewerAbi,
    functionName: 'launchAddress',
  });

  return { launchAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for stakeAddress
 * Reads the address of the stake contract.
 */
export const useStakeAddress = () => {
  const { data, isPending, error } = useUniversalReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20TokenViewerAbi,
    functionName: 'stakeAddress',
  });

  return { stakeAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * Hook for tokensByPage
 */
export const useTokensByPage = (start: bigint, end: bigint) => {
  const { data, isPending, error } = useUniversalReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20TokenViewerAbi,
    functionName: 'tokensByPage',
    args: [start, end],
  });

  return { tokens: data as `0x${string}`[] | undefined, isPending, error };
};

/**
 * Hook for childTokensByPage
 */
export const useChildTokensByPage = (parentTokenAddress: `0x${string}`, start: bigint, end: bigint) => {
  const { data, isPending, error } = useUniversalReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20TokenViewerAbi,
    functionName: 'childTokensByPage',
    args: [parentTokenAddress, start, end],
  });

  return { childTokens: data as `0x${string}`[] | undefined, isPending, error };
};

/**
 * Hook for launchingTokensByPage
 */
export const useLaunchingTokensByPage = (start: bigint, end: bigint) => {
  const { data, isPending, error } = useUniversalReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20TokenViewerAbi,
    functionName: 'launchingTokensByPage',
    args: [start, end],
  });

  return { launchingTokens: data as `0x${string}`[] | undefined, isPending, error };
};

/**
 * Hook for launchedTokensByPage
 */
export const useLaunchedTokensByPage = (start: bigint, end: bigint) => {
  const { data, isPending, error } = useUniversalReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20TokenViewerAbi,
    functionName: 'launchedTokensByPage',
    args: [start, end],
  });

  return { launchedTokens: data as `0x${string}`[] | undefined, isPending, error };
};

/**
 * Hook for launchingChildTokensByPage
 */
export const useLaunchingChildTokensByPage = (parentTokenAddress: `0x${string}`, start: bigint, end: bigint) => {
  const { data, isPending, error } = useUniversalReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20TokenViewerAbi,
    functionName: 'launchingChildTokensByPage',
    args: [parentTokenAddress, start, end],
  });

  return { launchingChildTokens: data as `0x${string}`[] | undefined, isPending, error };
};

/**
 * Hook for launchedChildTokensByPage
 */
export const useLaunchedChildTokensByPage = (parentTokenAddress: `0x${string}`, start: bigint, end: bigint) => {
  const { data, isPending, error } = useUniversalReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20TokenViewerAbi,
    functionName: 'launchedChildTokensByPage',
    args: [parentTokenAddress, start, end],
  });

  return { launchedChildTokens: data as `0x${string}`[] | undefined, isPending, error };
};

/**
 * Hook for participatedTokensByPage
 */
export const useParticipatedTokensByPage = (walletAddress: `0x${string}`, start: bigint, end: bigint) => {
  const { data, isPending, error } = useUniversalReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20TokenViewerAbi,
    functionName: 'participatedTokensByPage',
    args: [walletAddress, start, end],
  });

  return { participatedTokens: data as `0x${string}`[] | undefined, isPending, error };
};

/**
 * Hook for tokenDetail
 * Reads the details of a token.
 */
export const useTokenDetail = (tokenAddress: `0x${string}`) => {
  const { data, isPending, error } = useUniversalReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20TokenViewerAbi,
    functionName: 'tokenDetail',
    args: [tokenAddress],
    query: {
      enabled: !!tokenAddress,
    },
  });

  return {
    token: data?.[0] as TokenInfo | undefined,
    launchInfo: data?.[1] as LaunchInfo | undefined,
    isPending,
    error,
  };
};

/**
 * Hook for tokenDetailBySymbol
 * Reads the details of a token by symbol.
 */
export const useTokenDetailBySymbol = (symbol: string) => {
  const { data, isPending, error } = useUniversalReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20TokenViewerAbi,
    functionName: 'tokenDetailBySymbol',
    args: [symbol],
    query: {
      enabled: !!symbol,
    },
  });
  return {
    token: data?.[0] as TokenInfo | undefined,
    launchInfo: data?.[1] as LaunchInfo | undefined,
    isPending,
    error,
  };
};

/**
 * Hook for tokenDetails
 * Reads the details of multiple tokens.
 */
export const useTokenDetails = (tokenAddresses: `0x${string}`[]) => {
  const { data, isPending, error } = useUniversalReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20TokenViewerAbi,
    functionName: 'tokenDetails',
    args: [tokenAddresses],
  });
  return {
    tokens: data?.[0] as TokenInfo[] | undefined,
    launchInfos: data?.[1] as LaunchInfo[] | undefined,
    isPending,
    error,
  };
};

/**
 * Hook for tokenPairInfoWithAccount
 */
export const useTokenPairInfoWithAccount = (account: `0x${string}`, tokenAddress: `0x${string}`) => {
  const { data, isPending, error } = useUniversalReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20TokenViewerAbi,
    functionName: 'tokenPairInfoWithAccount',
    args: [account, tokenAddress],
    query: {
      enabled: !!account && !!tokenAddress,
    },
  });

  return { pairInfo: data as PairInfo, isPending, error };
};

/**
 * Hook for tokenStatistics
 * Reads the statistics of a token.
 */
export const useTokenStatistics = (tokenAddress: `0x${string}`, flag: boolean = true) => {
  const { data, isPending, error } = useUniversalReadContract({
    address: CONTRACT_ADDRESS,
    abi: LOVE20TokenViewerAbi,
    functionName: 'tokenStatistics',
    args: [tokenAddress],
    query: {
      enabled: !!tokenAddress && flag,
    },
  });
  return { tokenStatistics: data as TokenStats, isPending, error };
};

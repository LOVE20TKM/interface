// hooks/contracts/useLOVE20STToken.ts

import { useEffect } from 'react';
import { useUniversalReadContract } from '@/src/lib/universalReadContract';

import { LOVE20STTokenAbi } from '@/src/abis/LOVE20STToken';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logWeb3Error, logError } from '@/src/lib/debugUtils';

/**
 * Hook for allowance
 */
export const useAllowance = (address: `0x${string}`, owner: `0x${string}`, spender: `0x${string}`) => {
  const { data, isPending, error } = useUniversalReadContract({
    address,
    abi: LOVE20STTokenAbi,
    functionName: 'allowance',
    args: [owner, spender],
    query: {
      enabled: !!address && !!owner && !!spender,
    },
  });

  return {
    allowance: data ? safeToBigInt(data) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for balanceOf
 */
export const useBalanceOf = (address: `0x${string}`, account: `0x${string}`) => {
  const { data, isPending, error } = useUniversalReadContract({
    address,
    abi: LOVE20STTokenAbi,
    functionName: 'balanceOf',
    args: [account],
    query: {
      enabled: !!address && !!account,
    },
  });

  return {
    balance: data ? safeToBigInt(data) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for decimals
 */
export const useDecimals = (address: `0x${string}`) => {
  const { data, isPending, error } = useUniversalReadContract({
    address,
    abi: LOVE20STTokenAbi,
    functionName: 'decimals',
    args: [],
    query: {
      enabled: !!address,
    },
  });

  return {
    decimals: data as number | undefined,
    isPending,
    error,
  };
};

/**
 * Hook for name
 */
export const useName = (address: `0x${string}`) => {
  const { data, isPending, error } = useUniversalReadContract({
    address,
    abi: LOVE20STTokenAbi,
    functionName: 'name',
    args: [],
    query: {
      enabled: !!address,
    },
  });

  return {
    name: data as string | undefined,
    isPending,
    error,
  };
};

/**
 * Hook for reserve
 */
export const useReserve = (address: `0x${string}`) => {
  const { data, isPending, error } = useUniversalReadContract({
    address,
    abi: LOVE20STTokenAbi,
    functionName: 'reserve',
    args: [],
    query: {
      enabled: !!address,
    },
  });

  return {
    reserve: data ? safeToBigInt(data) : undefined,
    isPending,
    error,
  };
};

/**
 * Hook for symbol
 */
export const useSymbol = (address: `0x${string}`) => {
  const { data, isPending, error } = useUniversalReadContract({
    address,
    abi: LOVE20STTokenAbi,
    functionName: 'symbol',
    args: [],
    query: {
      enabled: !!address,
    },
  });

  return {
    symbol: data as string | undefined,
    isPending,
    error,
  };
};

/**
 * Hook for tokenAddress
 */
export const useTokenAddress = (address: `0x${string}`) => {
  const { data, isPending, error } = useUniversalReadContract({
    address,
    abi: LOVE20STTokenAbi,
    functionName: 'tokenAddress',
    args: [],
    query: {
      enabled: !!address,
    },
  });

  return {
    tokenAddress: data as `0x${string}` | undefined,
    isPending,
    error,
  };
};

/**
 * Hook for totalSupply
 */
export const useTotalSupply = (address: `0x${string}`) => {
  const { data, isPending, error } = useUniversalReadContract({
    address,
    abi: LOVE20STTokenAbi,
    functionName: 'totalSupply',
    args: [],
    query: {
      enabled: !!address,
    },
  });

  return {
    totalSupply: data ? safeToBigInt(data) : undefined,
    isPending,
    error,
  };
};

// =====================
// === 写入 Hook ===
// =====================

/**
 * Hook for approve
 */
export function useApprove(address: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20STTokenAbi,
    address,
    'approve',
  );

  const approve = async (spender: `0x${string}`, value: bigint) => {
    console.log('提交approve交易:', { address, spender, value, isTukeMode });
    return await execute([spender, value]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('approve tx hash:', hash);
    }
    if (error) {
      console.log('提交approve交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    approve,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

// hooks/useLove20Token.ts

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';

import { LOVE20TokenAbi } from '@/src/abis/LOVE20Token';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logWeb3Error, logError } from '@/src/lib/debugUtils';

/* =======================
   ===== Read Hooks ======
   ======================= */

/**
 * useAllowance Hook
 * @param owner - Address of the owner
 * @param spender - Address of the spender
 */
export const useAllowance = (
  token: `0x${string}`,
  owner: `0x${string}`,
  spender: `0x${string}`,
  flag: boolean = true,
) => {
  const { data, isPending, error, refetch } = useReadContract({
    address: token,
    abi: LOVE20TokenAbi,
    functionName: 'allowance',
    args: [owner, spender],
    query: {
      enabled: !!token && !!owner && !!spender && flag,
    },
  });

  return { allowance: data !== undefined ? safeToBigInt(data) : undefined, isPending, error, refetch };
};

/**
 * useBalanceOf Hook
 * @param account - Address of the account
 */
export const useBalanceOf = (token: `0x${string}`, account: `0x${string}`, flag: boolean = true) => {
  const { data, isPending, error, refetch } = useReadContract({
    address: token,
    abi: LOVE20TokenAbi,
    functionName: 'balanceOf',
    args: [account],
    query: {
      enabled: !!token && !!account && flag,
    },
  });

  return { balance: data !== undefined ? safeToBigInt(data) : undefined, isPending, error, refetch };
};

/**
 * useDecimals Hook
 */
export const useDecimals = (token: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: token,
    abi: LOVE20TokenAbi,
    functionName: 'decimals',
    args: [],
    query: {
      enabled: !!token,
    },
  });

  return { decimals: data as number | undefined, isPending, error };
};

/**
 * useMaxSupply Hook
 */
export const useMaxSupply = (token: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: token,
    abi: LOVE20TokenAbi,
    functionName: 'maxSupply',
    args: [],
    query: {
      enabled: !!token,
    },
  });

  return { maxSupply: data !== undefined ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * useName Hook
 */
export const useName = (token: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: token,
    abi: LOVE20TokenAbi,
    functionName: 'name',
    args: [],
    query: {
      enabled: !!token,
    },
  });

  return { name: data as string | undefined, isPending, error };
};

/**
 * useParentPool Hook
 */
export const useParentPool = (token: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: token,
    abi: LOVE20TokenAbi,
    functionName: 'parentPool',
    args: [],
    query: {
      enabled: !!token,
    },
  });

  return { parentPool: data !== undefined ? safeToBigInt(data) : undefined, isPending, error };
};

/**
 * useParentTokenAddress Hook
 */
export const useParentTokenAddress = (token: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: token,
    abi: LOVE20TokenAbi,
    functionName: 'parentTokenAddress',
    args: [],
    query: {
      enabled: !!token,
    },
  });

  return { parentTokenAddress: data as `0x${string}` | undefined, isPending, error };
};

/**
 * useSymbol Hook
 */
export const useSymbol = (token: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: token,
    abi: LOVE20TokenAbi,
    functionName: 'symbol',
    args: [],
    query: {
      enabled: !!token,
    },
  });

  return { symbol: data as string | undefined, isPending, error };
};

/**
 * useTotalSupply Hook
 */
export const useTotalSupply = (token: `0x${string}`) => {
  const { data, isPending, error } = useReadContract({
    address: token,
    abi: LOVE20TokenAbi,
    functionName: 'totalSupply',
    args: [],
    query: {
      enabled: !!token,
    },
  });

  return { totalSupply: data !== undefined ? safeToBigInt(data) : undefined, isPending, error };
};

/* =======================
   ===== Write Hooks =====
   ======================= */
/**
 * useApprove Hook
 */
export function useApprove(token: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20TokenAbi,
    token,
    'approve',
  );

  const approve = async (spender: `0x${string}`, value: bigint) => {
    console.log('提交approve交易:', { token, spender, value, isTukeMode });
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

/**
 * useBurnForParentToken Hook
 */
export function useBurnForParentToken(token: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20TokenAbi,
    token,
    'burnForParentToken',
  );

  const burnForParentToken = async (amount: bigint) => {
    console.log('提交burnForParentToken交易:', { token, amount, isTukeMode });
    return await execute([amount]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('burnForParentToken tx hash:', hash);
    }
    if (error) {
      console.log('提交burnForParentToken交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    burnForParentToken,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

/**
 * useTransfer Hook - for ERC20 token transfers
 */
export function useTransfer(token: `0x${string}`) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    LOVE20TokenAbi,
    token,
    'transfer',
  );

  const transfer = async (to: `0x${string}`, amount: bigint) => {
    console.log('提交transfer交易:', { token, to, amount, isTukeMode });
    return await execute([to, amount]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('transfer tx hash:', hash);
    }
    if (error) {
      console.log('提交transfer交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    transfer,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

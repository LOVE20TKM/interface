// hooks/contracts/useWETH.ts

import { useEffect } from 'react';
import { useUniversalReadContract } from '@/src/lib/universalReadContract';

import { WETH9Abi } from '@/src/abis/WETH9';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';
import { logWeb3Error, logError } from '@/src/lib/debugUtils';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_ROOT_PARENT_TOKEN as `0x${string}`;

/* =======================
   ===== Read Hooks ======
   ======================= */

/**
 * useBalanceOf Hook
 * @param account - Address of the account
 */
export const useBalanceOf = (token: `0x${string}`, account: `0x${string}`) => {
  const { data, isPending, error } = useUniversalReadContract({
    address: token,
    abi: WETH9Abi,
    functionName: 'balanceOf',
    args: [account],
    query: {
      enabled: !!token && !!account,
    },
  });

  return { balance: data ? safeToBigInt(data) : undefined, isPending, error };
};

// =====================
// === 写入 Hook ===
// =====================

/**
 * Hook for deposit
 */
export const useDeposit = () => {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    WETH9Abi,
    CONTRACT_ADDRESS,
    'deposit',
  );

  const deposit = async (ethAmount: bigint) => {
    console.log('提交deposit交易:', { ethAmount, isTukeMode });
    return await execute([], ethAmount);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('deposit tx hash:', hash);
    }
    if (error) {
      console.log('提交deposit交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    deposit,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
};

/**
 * Hook for withdraw
 */
export const useWithdraw = () => {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    WETH9Abi,
    CONTRACT_ADDRESS,
    'withdraw',
  );

  const withdraw = async (wethAmount: bigint) => {
    console.log('提交withdraw交易:', { wethAmount, isTukeMode });
    return await execute([wethAmount]);
  };

  // 错误日志记录
  useEffect(() => {
    if (hash) {
      console.log('withdraw tx hash:', hash);
    }
    if (error) {
      console.log('提交withdraw交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    withdraw,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
};

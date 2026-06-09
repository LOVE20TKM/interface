import { useEffect } from 'react';
import { isAddress, zeroAddress } from 'viem';

import { BatchTransferAbi } from '@/src/abis/BatchTransfer';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';
import { useUniversalReadContract } from '@/src/lib/universalReadContract';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';

const configuredBatchTransferAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_BATCH_TRANSFER;

export const BATCH_TRANSFER_CONTRACT_ADDRESS =
  configuredBatchTransferAddress && isAddress(configuredBatchTransferAddress)
    ? (configuredBatchTransferAddress as `0x${string}`)
    : zeroAddress;

export const isBatchTransferEnabled = BATCH_TRANSFER_CONTRACT_ADDRESS !== zeroAddress;

export function useNativeBatchBalances(accounts: readonly `0x${string}`[], enabled: boolean) {
  const { data, isPending, error, refetch } = useUniversalReadContract({
    address: BATCH_TRANSFER_CONTRACT_ADDRESS,
    abi: BatchTransferAbi,
    functionName: 'nativeBalances',
    args: [accounts],
    query: {
      enabled: isBatchTransferEnabled && enabled && accounts.length > 0,
    },
  });

  return {
    balances: (data as readonly bigint[] | undefined) || [],
    isPending,
    error,
    refetch,
  };
}

export function useErc20BatchBalances(
  tokenAddress: `0x${string}`,
  accounts: readonly `0x${string}`[],
  enabled: boolean,
) {
  const { data, isPending, error, refetch } = useUniversalReadContract({
    address: BATCH_TRANSFER_CONTRACT_ADDRESS,
    abi: BatchTransferAbi,
    functionName: 'erc20Balances',
    args: [tokenAddress, accounts],
    query: {
      enabled: isBatchTransferEnabled && enabled && tokenAddress !== zeroAddress && accounts.length > 0,
    },
  });

  return {
    balances: (data as readonly bigint[] | undefined) || [],
    isPending,
    error,
    refetch,
  };
}

export function useBatchTransferNative() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    BatchTransferAbi,
    BATCH_TRANSFER_CONTRACT_ADDRESS,
    'batchTransferNative',
  );

  const batchTransferNative = async (
    recipients: readonly `0x${string}`[],
    amounts: readonly bigint[],
    totalAmount: bigint,
  ) => {
    console.log('提交batchTransferNative交易:', { recipients, amounts, totalAmount, isTukeMode });
    return await execute([recipients, amounts], totalAmount);
  };

  useEffect(() => {
    if (hash) {
      console.log('batchTransferNative tx hash:', hash);
    }
    if (error) {
      console.log('提交batchTransferNative交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    batchTransferNative,
    isPending,
    isConfirming,
    isConfirmed,
    writeError: error,
    hash,
    isTukeMode,
  };
}

export function useBatchTransferERC20() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    BatchTransferAbi,
    BATCH_TRANSFER_CONTRACT_ADDRESS,
    'batchTransferERC20',
  );

  const batchTransferERC20 = async (
    tokenAddress: `0x${string}`,
    recipients: readonly `0x${string}`[],
    amounts: readonly bigint[],
  ) => {
    console.log('提交batchTransferERC20交易:', { tokenAddress, recipients, amounts, isTukeMode });
    return await execute([tokenAddress, recipients, amounts]);
  };

  useEffect(() => {
    if (hash) {
      console.log('batchTransferERC20 tx hash:', hash);
    }
    if (error) {
      console.log('提交batchTransferERC20交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    batchTransferERC20,
    isPending,
    isConfirming,
    isConfirmed,
    writeError: error,
    hash,
    isTukeMode,
  };
}

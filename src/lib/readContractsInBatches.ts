import { readContracts } from '@wagmi/core';
import { config } from '@/src/wagmi';

export interface IndexedContractRead<TMeta = unknown> {
  contract: any;
  resultIndex: number;
  meta?: TMeta;
}

export interface IndexedContractReadFailure<TMeta = unknown> extends IndexedContractRead<TMeta> {
  error: unknown;
}

export interface ReadContractsInBatchesOptions {
  batchSize?: number;
  maxRetries?: number;
  minBatchSize?: number;
  retryDelayMs?: number;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 可靠的批量合约读取：
 * - 先按较大批次读取，提高吞吐
 * - 某批次/某条失败时，自动缩小批次重试
 * - 最终保留原始 resultIndex，便于调用方按位置还原结果
 */
export async function readContractsInBatchesWithRetry<TMeta = unknown>(
  entries: IndexedContractRead<TMeta>[],
  options: ReadContractsInBatchesOptions = {},
): Promise<{
  results: any[];
  failures: IndexedContractReadFailure<TMeta>[];
}> {
  const { batchSize = 25, maxRetries = 4, minBatchSize = 1, retryDelayMs = 250 } = options;

  const resultLength =
    entries.length === 0 ? 0 : entries.reduce((max, entry) => Math.max(max, entry.resultIndex), -1) + 1;
  const results = new Array(resultLength).fill(undefined);

  type PendingEntry = IndexedContractRead<TMeta> & {
    error?: unknown;
  };

  let pending: PendingEntry[] = entries.map((entry) => ({ ...entry }));
  let currentBatchSize = Math.max(minBatchSize, batchSize);

  for (let attempt = 0; attempt < maxRetries && pending.length > 0; attempt++) {
    const nextPending: PendingEntry[] = [];

    for (let i = 0; i < pending.length; i += currentBatchSize) {
      const batch = pending.slice(i, i + currentBatchSize);

      try {
        const batchResults = await readContracts(config, {
          contracts: batch.map((entry) => entry.contract),
          allowFailure: true,
        });

        batchResults.forEach((result, index) => {
          const entry = batch[index];
          if (result?.status === 'success') {
            results[entry.resultIndex] = result;
            return;
          }

          nextPending.push({
            ...entry,
            error: result?.error || new Error('Contract read failed'),
          });
        });
      } catch (error) {
        batch.forEach((entry) => {
          nextPending.push({
            ...entry,
            error,
          });
        });
      }
    }

    pending = nextPending;
    if (pending.length === 0) break;

    if (attempt < maxRetries - 1) {
      currentBatchSize = Math.max(minBatchSize, Math.floor(currentBatchSize / 2));
      if (retryDelayMs > 0) {
        await delay(retryDelayMs * (attempt + 1));
      }
    }
  }

  return {
    results,
    failures: pending.map(({ error, ...entry }) => ({
      ...entry,
      error,
    })),
  };
}

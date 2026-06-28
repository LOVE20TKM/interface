export const GROUP_VERIFY_BATCH_SIZE_OPTIONS = [100, 300, 500] as const;
export const DEFAULT_GROUP_VERIFY_BATCH_SIZE = 500;

export function getEffectiveGroupVerifySubmittedCount(
  total: number,
  chainSubmitted: bigint | undefined,
  optimisticSubmitted: number | null,
) {
  const chainCount = Number(chainSubmitted ?? BigInt(0));
  return Math.min(Math.max(chainCount, optimisticSubmitted ?? 0), total);
}

// total is the current ordered account list length for this group and round.
export function getNextGroupVerifyBatchRange(total: number, submitted: bigint | undefined, batchSize: number) {
  const startIndex = Math.min(Number(submitted ?? BigInt(0)), total);
  const safeBatchSize = Number.isFinite(batchSize) && batchSize > 0 ? Math.floor(batchSize) : 0;
  const endIndex = Math.min(startIndex + safeBatchSize, total);

  return {
    startIndex,
    endIndex,
    count: Math.max(endIndex - startIndex, 0),
  };
}

export function getSubmittedGroupVerifyAccounts<T>(accounts: T[], submitted: bigint | undefined) {
  return accounts.slice(0, Math.min(Number(submitted ?? BigInt(0)), accounts.length));
}

export function getVisibleGroupVerifyIndexes(
  total: number,
  startIndex: number,
  endIndex: number,
  showSubmitted: boolean,
  showFuture: boolean,
) {
  const start = showSubmitted ? 0 : startIndex;
  const end = showFuture ? total : endIndex;
  return Array.from({ length: Math.max(end - start, 0) }, (_, index) => start + index);
}

export interface GroupVerifyAccountScore {
  account: `0x${string}`;
  score: string;
}

export function applyPastedGroupVerifyScores(
  accountScores: GroupVerifyAccountScore[],
  clipboardText: string,
  submittedCount: number,
  visibleIndexes?: number[],
) {
  const lines = clipboardText
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const scores = accountScores.map((item) => ({ ...item }));
  const parsedRows = lines.map((line) => line.split(/[,\t;，；\s]+/).filter(Boolean));
  const hasOnlyScores = parsedRows.every((parts) => parts.length === 1);
  const remainingCount = Math.max(scores.length - submittedCount, 0);
  const allIndexes = scores.map((_, index) => index);
  const unsubmittedIndexes = allIndexes.filter((index) => index >= submittedCount);
  const visible = visibleIndexes ?? allIndexes;
  const visibleUnsubmittedIndexes = visible.filter((index) => index >= submittedCount && index < scores.length);

  if (hasOnlyScores) {
    let targetPairs: Array<{ targetIndex: number; sourceIndex: number }> = [];
    if (parsedRows.length === visible.length) {
      targetPairs = visible
        .map((targetIndex, sourceIndex) => ({ targetIndex, sourceIndex }))
        .filter(({ targetIndex }) => targetIndex >= submittedCount && targetIndex < scores.length);
    } else if (parsedRows.length === visibleUnsubmittedIndexes.length) {
      targetPairs = visibleUnsubmittedIndexes.map((targetIndex, sourceIndex) => ({ targetIndex, sourceIndex }));
    } else if (parsedRows.length === remainingCount) {
      targetPairs = unsubmittedIndexes.map((targetIndex, sourceIndex) => ({ targetIndex, sourceIndex }));
    } else if (parsedRows.length === scores.length) {
      targetPairs = allIndexes
        .map((targetIndex, sourceIndex) => ({ targetIndex, sourceIndex }))
        .filter(({ targetIndex }) => targetIndex >= submittedCount);
    } else {
      return { scores, updated: 0, mode: 'sequential' as const, changed: false };
    }

    let updated = 0;
    for (const { targetIndex, sourceIndex } of targetPairs) {
      const score = parsedRows[sourceIndex]?.[0];
      if (score !== undefined && !Number.isNaN(parseFloat(score))) {
        scores[targetIndex].score = score;
        updated++;
      }
    }
    return { scores, updated, mode: 'sequential' as const, changed: updated > 0 };
  }

  if (parsedRows.some((parts) => parts.length !== 2)) {
    return { scores, updated: 0, mode: 'address' as const, error: 'invalid-format' as const, changed: false };
  }

  const scoreByAddress = new Map<string, string>();
  for (const parts of parsedRows) {
    const addressIndex = parts.findIndex((part) => /^0x[a-fA-F0-9]{40}$/.test(part));
    if (addressIndex === -1) continue;

    const score = parts.find((part, index) => index !== addressIndex && !Number.isNaN(parseFloat(part)));
    if (score !== undefined) {
      scoreByAddress.set(parts[addressIndex].toLowerCase(), score);
    }
  }

  if (scoreByAddress.size === 0) {
    return { scores, updated: 0, mode: 'address' as const, changed: false };
  }

  let updated = 0;
  for (let i = submittedCount; i < scores.length; i++) {
    if (scoreByAddress.has(scores[i].account.toLowerCase())) updated++;
  }

  for (let i = submittedCount; i < scores.length; i++) {
    const pastedScore = scoreByAddress.get(scores[i].account.toLowerCase());
    scores[i].score = pastedScore ?? '0';
  }

  return { scores, updated, mode: 'address' as const, changed: scoreByAddress.size > 0 };
}

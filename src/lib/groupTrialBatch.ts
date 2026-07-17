export type GroupTrialBatchItem = {
  address: string;
  amount: string;
};

export type GroupTrialBatchParseResult = {
  items: GroupTrialBatchItem[];
  invalidLineNumbers: number[];
};

const AMOUNT_PATTERN = /^(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?|\.\d+)$/;
const ROW_PATTERN = /^([^\s,]+)(?:\s*,\s*|\s+)([^\s]+)$/;

export const parseGroupTrialBatch = (input: string): GroupTrialBatchParseResult => {
  const items: GroupTrialBatchItem[] = [];
  const invalidLineNumbers: number[] = [];

  input.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) return;

    const match = line.match(ROW_PATTERN);
    if (!match || !AMOUNT_PATTERN.test(match[2])) {
      invalidLineNumbers.push(index + 1);
      return;
    }

    items.push({ address: match[1], amount: match[2].replace(/,/g, '') });
  });

  return { items, invalidLineNumbers };
};

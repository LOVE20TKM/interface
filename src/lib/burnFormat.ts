import { formatUnits } from 'viem';

const trimZeros = (value: string) => (value.includes('.') ? value.replace(/0+$/, '').replace(/\.$/, '') : value);

export const formatExactBurnAmount = (value: bigint | undefined, decimals = 18) => {
  if (value === undefined) return '-';
  const [whole, fraction = ''] = trimZeros(formatUnits(value, decimals)).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction ? `${grouped}.${fraction}` : grouped;
};

const formatTinyBurnAmount = (value: bigint, decimals: number) => {
  const [, fraction = ''] = formatUnits(value, decimals).split('.');
  const zeroCount = fraction.match(/^0*/)?.[0].length || 0;
  if (zeroCount < 4 || zeroCount === fraction.length) return undefined;

  const significant = fraction.slice(zeroCount, zeroCount + 4);
  return `0.0{${zeroCount}}${significant.replace(/0+$/, '')}`;
};

export const formatBurnAmount = (value: bigint | undefined, decimals = 18, maxFractionDigits = 6) => {
  if (value === undefined) return '-';
  if (value > BigInt(0)) {
    const tinyAmount = formatTinyBurnAmount(value, decimals);
    if (tinyAmount) return tinyAmount;
  }
  if (decimals <= maxFractionDigits) return formatExactBurnAmount(value, decimals);

  const precisionUnit = BigInt(`1${'0'.repeat(decimals - maxFractionDigits)}`);
  if (value > BigInt(0) && value < precisionUnit) {
    const minimum = maxFractionDigits === 0 ? '1' : `0.${'0'.repeat(maxFractionDigits - 1)}1`;
    return `<${minimum}`;
  }

  return formatExactBurnAmount(value / precisionUnit, maxFractionDigits);
};

export const formatBurnInputAmount = (value: bigint, decimals: number) => trimZeros(formatUnits(value, decimals));

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

export const formatBurnAmount = (value: bigint | undefined, decimals = 18) => {
  if (value === undefined) return '-';
  if (value > BigInt(0)) {
    const tinyAmount = formatTinyBurnAmount(value, decimals);
    if (tinyAmount) return tinyAmount;
  }
  const [whole] = formatUnits(value, decimals).split('.');
  const integerDigits = whole === '0' ? 0 : whole.replace('-', '').length;
  const fractionDigits = Math.max(0, 6 - integerDigits);
  if (decimals <= fractionDigits) return formatExactBurnAmount(value, decimals);

  const precisionUnit = BigInt(`1${'0'.repeat(decimals - fractionDigits)}`);
  if (value > BigInt(0) && value < precisionUnit) {
    const minimum = fractionDigits === 0 ? '1' : `0.${'0'.repeat(fractionDigits - 1)}1`;
    return `<${minimum}`;
  }

  return formatExactBurnAmount(value / precisionUnit, fractionDigits);
};

export const formatBurnInputAmount = (value: bigint, decimals: number) => trimZeros(formatUnits(value, decimals));

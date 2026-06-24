import assert from 'node:assert/strict';

import { parseContractError } from '../src/errors/contractErrorParser';
import { calculateLiquiditySlippageMins, parseLiquidityAmountInput } from '../src/lib/liquidityAmountInput';
import { shouldHandleZapQuoteErrorLocally } from '../src/lib/zapQuoteError';

assert.equal(
  parseLiquidityAmountInput('1e3'),
  null,
  '科学计数法不是有效的金额输入，不能静默当成 0',
);

assert.equal(parseLiquidityAmountInput('1.5')?.toString(), '1500000000000000000');
assert.equal(parseLiquidityAmountInput('1.')?.toString(), '1000000000000000000');
assert.equal(parseLiquidityAmountInput('')?.toString(), '0');

assert.equal(
  shouldHandleZapQuoteErrorLocally(new Error('The contract function "quoteZapToken" reverted.\n\nError: InsufficientLiquidityMinted()')),
  true,
  'Zap 报价不足以铸造 LP 是局部表单错误，不应升级成全局运行时错误',
);

assert.equal(
  shouldHandleZapQuoteErrorLocally(new Error('Error: ZeroAmount()')),
  false,
  '非 Zap 报价来源的通用错误不能被全局静默吞掉',
);

assert.equal(
  parseContractError(new Error('The contract function "quoteZapToken" reverted.\n\nError: InsufficientLiquidityMinted()'))?.message,
  'LP铸造数量低于最小值，请调整数量或滑点后重试',
);

assert.equal(
  parseContractError(new Error('The contract function "quoteZapToken" reverted.\n\nError: AmountTooLarge()'))?.message,
  '输入数量过大，请减少数量后重试',
);

const normalMins = calculateLiquiditySlippageMins(BigInt(1000), BigInt(2000), 2.5);
assert.equal(normalMins.baseAmountMin, BigInt(975));
assert.equal(normalMins.tokenAmountMin, BigInt(1950));
assert.equal(normalMins.liquidityMin, BigInt(1));

const zapMins = calculateLiquiditySlippageMins(BigInt(10000), BigInt(20000), 2.5, {
  amountAUsed: BigInt(4000),
  amountBUsed: BigInt(6000),
  liquidity: BigInt(1000),
});
assert.equal(zapMins.baseAmountMin, BigInt(3900));
assert.equal(zapMins.tokenAmountMin, BigInt(5850));
assert.equal(zapMins.liquidityMin, BigInt(975));

console.log('liquidity amount input ok');

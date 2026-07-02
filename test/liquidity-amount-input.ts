import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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

const liquidityPanelSource = readFileSync(join(__dirname, '../src/components/Dex/Liquidity.tsx'), 'utf8');
const autoCalculationStart = liquidityPanelSource.indexOf('// 4. 自动计算数量逻辑');
const autoCalculationEnd = liquidityPanelSource.indexOf('// 5. 授权逻辑');
assert.ok(autoCalculationStart >= 0, '需要找到流动性输入自动计算逻辑起点');
assert.ok(autoCalculationEnd > autoCalculationStart, '需要找到流动性输入自动计算逻辑终点');
const autoCalculationBlock = liquidityPanelSource.slice(autoCalculationStart, autoCalculationEnd);
const autoCalculationEffects = autoCalculationBlock.match(
  /useEffect\(\(\) => \{[\s\S]*?\n  \}, \[[\s\S]*?\]\);/g,
) ?? [];

assert.equal(
  autoCalculationBlock.includes('const lastEditedSideRef = useRef') &&
    liquidityPanelSource.includes('lastEditedSideRef.current = "base"') &&
    liquidityPanelSource.includes('lastEditedSideRef.current = "token"'),
  true,
  '需要记录最后编辑的输入侧，才能在智能模式、储备量或基础代币变化后按正确方向重新同步',
);
assert.equal(
  autoCalculationBlock.includes('resyncLastEditedAmounts();') &&
    autoCalculationBlock.includes('baseToken.address') &&
    autoCalculationBlock.includes('void form.trigger(["baseTokenAmount", "tokenAmount"])'),
  true,
  '智能模式、储备量或基础代币变化后需要重新同步并重新校验当前表单',
);
assert.equal(
  autoCalculationEffects.some(
    (effect) =>
      effect.includes('form.trigger') &&
      /baseTokenValue|tokenAmountValue|parsedBaseAmount|parsedTokenAmount/.test(effect),
  ),
  false,
  '智能模式输入联动不能在 watch 驱动的 effect 中调用 form.trigger，否则删除数字时会反复验证并卡死',
);
assert.equal(
  autoCalculationEffects.some((effect) => effect.includes('form.setValue')),
  false,
  '流动性输入联动不能在 watch 驱动的 effect 中写回表单值，否则手动删除和点击最高会互相触发',
);
assert.match(
  liquidityPanelSource,
  /form\.reset\(\{[\s\S]*?baseTokenAddress: baseToken\.address,[\s\S]*?\}\);\s*lastEditedSideRef\.current = null;/,
  '添加流动性成功并清空表单后，也要清空最后编辑侧，避免后续刷新对空表单触发校验',
);

console.log('liquidity amount input ok');

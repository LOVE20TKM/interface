require('ts-node/register/transpile-only');

const {
  GOV_RATIO_PRECISION: P,
  estimateRequiredSlAmount,
} = require('../src/components/Common/liquidityStakeOverflowMath.ts');

assert(estimateRequiredSlAmount({
  targetRatio: P / 10n,
  userGovVotes: 100n,
  totalGovVotes: 1000n,
  govRatioMultiplier: 1n,
  slAmount: 0n,
  waitingPhases: 12n,
}) === 0n);

assert(estimateRequiredSlAmount({
  targetRatio: P / 2n,
  userGovVotes: 0n,
  totalGovVotes: 0n,
  govRatioMultiplier: 1n,
  slAmount: 0n,
  waitingPhases: 12n,
}) === 1n);

assert(estimateRequiredSlAmount({
  targetRatio: P / 2n,
  userGovVotes: 10n,
  totalGovVotes: 100n,
  govRatioMultiplier: 1n,
  slAmount: 10n,
  waitingPhases: 12n,
}) === 0n);

assert(estimateRequiredSlAmount({
  targetRatio: P,
  userGovVotes: 10n,
  totalGovVotes: 100n,
  govRatioMultiplier: 1n,
  slAmount: 0n,
  waitingPhases: 12n,
}) === undefined);

function assert(condition) {
  if (!condition) throw new Error('liquidity stake overflow formula check failed');
}


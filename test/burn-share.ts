import assert from 'node:assert/strict';

import { calculateAccountCategoryRatio, calculateAccountCommunityShare } from '../src/lib/burnShare';
import { type BurnStats, type CategoryWeights } from '../src/lib/burnStats';

const WAD = BigInt('1000000000000000000');
const equalWeights: CategoryWeights = {
  slTokenLock: BigInt(1),
  stTokenLock: BigInt(1),
  govRewardBurn: BigInt(1),
  actionRewardBurn: BigInt(1),
};
const stats = (sl = BigInt(0), st = BigInt(0), gov = BigInt(0), action = BigInt(0)): BurnStats => ({
  slTokenLock: { amount: BigInt(0), score: sl },
  stTokenLock: { amount: BigInt(0), score: st },
  govRewardBurn: { amount: BigInt(0), score: gov },
  actionRewardBurn: { amount: BigInt(0), score: action },
});

assert.equal(calculateAccountCommunityShare(stats(), stats(), equalWeights), BigInt(0));
assert.equal(calculateAccountCategoryRatio(BigInt(50), BigInt(200)), WAD / BigInt(4));
assert.equal(calculateAccountCategoryRatio(BigInt(0), BigInt(0)), BigInt(0));
assert.equal(calculateAccountCommunityShare(stats(BigInt(100)), stats(BigInt(100)), equalWeights), WAD);
assert.equal(
  calculateAccountCommunityShare(stats(BigInt(100), BigInt(200)), stats(BigInt(50), BigInt(50)), equalWeights),
  (WAD * BigInt(3)) / BigInt(8),
);
assert.equal(
  calculateAccountCommunityShare(
    stats(BigInt(100), BigInt(200), BigInt(300)),
    stats(BigInt(100), BigInt(200), BigInt(300)),
    equalWeights,
  ),
  WAD,
);
assert.equal(
  calculateAccountCommunityShare(stats(BigInt(100), BigInt(100)), stats(BigInt(100), BigInt(0)), {
    ...equalWeights,
    stTokenLock: BigInt(3),
  }),
  WAD / BigInt(4),
);

console.log('burn share ok');

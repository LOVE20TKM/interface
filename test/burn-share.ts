import assert from 'node:assert/strict';

import {
  calculateBurnScoreApy,
  calculateAccountCategoryRatio,
  calculateAccountCommunityShare,
  calculateCategoryWeightRatio,
  formatWadPercentage,
} from '../src/lib/burnShare';
import {
  getBurnActivityNoticeMarker,
  getBurnActivityNoticePhase,
  getBurnActivityRound,
  getBurnActivityRoundsRemaining,
  getVoteRoundFromBlock,
  type BurnStats,
  type CategoryWeights,
} from '../src/lib/burnStats';

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
assert.equal(
  calculateCategoryWeightRatio(BigInt(1), {
    slTokenLock: BigInt(1),
    stTokenLock: BigInt(3),
    govRewardBurn: BigInt(5),
    actionRewardBurn: BigInt(7),
  }),
  WAD / BigInt(16),
);
assert.equal(
  calculateCategoryWeightRatio(BigInt(0), {
    slTokenLock: BigInt(0),
    stTokenLock: BigInt(1),
    govRewardBurn: BigInt(1),
    actionRewardBurn: BigInt(1),
  }),
  BigInt(0),
);
assert.equal(
  calculateCategoryWeightRatio(BigInt(0), {
    slTokenLock: BigInt(0),
    stTokenLock: BigInt(0),
    govRewardBurn: BigInt(0),
    actionRewardBurn: BigInt(0),
  }),
  BigInt(0),
);
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
assert.equal(formatWadPercentage(BigInt(0)), '0%');
assert.equal(formatWadPercentage(BigInt('123456789000000000')), '12.34%');
assert.equal(formatWadPercentage(BigInt('370370370400')), '0.0{4}3703%');
assert.equal(formatWadPercentage(BigInt(1)), '0.0{15}1%');
assert.equal(calculateBurnScoreApy(WAD, BigInt(0)), 0);
assert.equal(calculateBurnScoreApy(BigInt('1010000000000000000'), BigInt(0)), undefined);
assert.equal(calculateBurnScoreApy(WAD, undefined), undefined);
assert.equal(getBurnActivityRound(BigInt(2)), undefined);
assert.equal(getBurnActivityRound(BigInt(5)), BigInt(2));
assert.equal(getBurnActivityRound(BigInt(6)), BigInt(3));
assert.equal(getVoteRoundFromBlock(BigInt(99), BigInt(100), BigInt(10)), BigInt(0));
assert.equal(getVoteRoundFromBlock(BigInt(100), BigInt(100), BigInt(10)), BigInt(0));
assert.equal(getVoteRoundFromBlock(BigInt(119), BigInt(100), BigInt(10)), BigInt(1));
assert.equal(getBurnActivityNoticePhase(undefined, BigInt(5), BigInt(7)), 'not-started');
assert.equal(getBurnActivityNoticePhase(BigInt(4), BigInt(5), BigInt(7)), 'not-started');
assert.equal(getBurnActivityNoticePhase(BigInt(5), BigInt(5), BigInt(7)), 'active');
assert.equal(getBurnActivityNoticePhase(BigInt(8), BigInt(5), BigInt(7)), 'finished');
assert.equal(getBurnActivityNoticeMarker('not-started', undefined), 'pre-start');
assert.equal(getBurnActivityNoticeMarker('active', BigInt(5)), BigInt(5));
assert.equal(getBurnActivityNoticeMarker('finished', BigInt(8)), 'ended');
assert.ok(
  Math.abs((calculateBurnScoreApy(BigInt('3847200000000000000'), BigInt(2000)) || 0) - 27.875963633875823) <
    0.000001,
);
assert.deepEqual(getBurnActivityRoundsRemaining(BigInt(4), BigInt(5), BigInt(7)), {
  target: 'start',
  rounds: BigInt(4),
});
assert.deepEqual(getBurnActivityRoundsRemaining(BigInt(8), BigInt(5), BigInt(7)), {
  target: 'end',
  rounds: BigInt(3),
});
assert.deepEqual(getBurnActivityRoundsRemaining(BigInt(10), BigInt(5), BigInt(7)), {
  target: 'end',
  rounds: BigInt(1),
});
assert.equal(getBurnActivityRoundsRemaining(BigInt(11), BigInt(5), BigInt(7)), undefined);

console.log('burn share ok');

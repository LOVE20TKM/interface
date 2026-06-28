import assert from 'node:assert/strict';

import {
  DEFAULT_GROUP_VERIFY_BATCH_SIZE,
  GROUP_VERIFY_BATCH_SIZE_OPTIONS,
  applyPastedGroupVerifyScores,
  getNextGroupVerifyBatchRange,
  getEffectiveGroupVerifySubmittedCount,
  getSubmittedGroupVerifyAccounts,
  getVisibleGroupVerifyIndexes,
} from '../src/lib/groupVerifyBatch';

assert.deepEqual(GROUP_VERIFY_BATCH_SIZE_OPTIONS, [100, 300, 500]);
assert.equal(DEFAULT_GROUP_VERIFY_BATCH_SIZE, 500);

assert.equal(getEffectiveGroupVerifySubmittedCount(1000, BigInt(500), null), 500);
assert.equal(getEffectiveGroupVerifySubmittedCount(1000, BigInt(500), 800), 800);
assert.equal(getEffectiveGroupVerifySubmittedCount(1000, BigInt(800), 500), 800);
assert.equal(getEffectiveGroupVerifySubmittedCount(1000, BigInt(1200), 800), 1000);

assert.deepEqual(getNextGroupVerifyBatchRange(1234, BigInt(0), 500), {
  startIndex: 0,
  endIndex: 500,
  count: 500,
});

assert.deepEqual(getNextGroupVerifyBatchRange(1234, BigInt(500), 300), {
  startIndex: 500,
  endIndex: 800,
  count: 300,
});

assert.deepEqual(getNextGroupVerifyBatchRange(1234, BigInt(1200), 500), {
  startIndex: 1200,
  endIndex: 1234,
  count: 34,
});

assert.deepEqual(getNextGroupVerifyBatchRange(10, BigInt(10), 500), {
  startIndex: 10,
  endIndex: 10,
  count: 0,
});

assert.deepEqual(getNextGroupVerifyBatchRange(10, BigInt(3), 0), {
  startIndex: 3,
  endIndex: 3,
  count: 0,
});

assert.deepEqual(getNextGroupVerifyBatchRange(10, BigInt(3), 1.7), {
  startIndex: 3,
  endIndex: 4,
  count: 1,
});

assert.deepEqual(getSubmittedGroupVerifyAccounts(['a', 'b', 'c', 'd'], BigInt(2)), ['a', 'b']);
assert.deepEqual(getSubmittedGroupVerifyAccounts(['a', 'b'], BigInt(5)), ['a', 'b']);
assert.deepEqual(getSubmittedGroupVerifyAccounts(['a', 'b'], undefined), []);
assert.deepEqual(getVisibleGroupVerifyIndexes(6, 2, 5, false, false), [2, 3, 4]);
assert.deepEqual(getVisibleGroupVerifyIndexes(6, 2, 5, true, false), [0, 1, 2, 3, 4]);
assert.deepEqual(getVisibleGroupVerifyIndexes(6, 2, 5, false, true), [2, 3, 4, 5]);

const accounts = [
  { account: '0x1111111111111111111111111111111111111111' as `0x${string}`, score: '10' },
  { account: '0x2222222222222222222222222222222222222222' as `0x${string}`, score: '20' },
  { account: '0x3333333333333333333333333333333333333333' as `0x${string}`, score: '30' },
];

assert.deepEqual(applyPastedGroupVerifyScores(accounts, '80\n90\n100', 0), {
  scores: [
    { account: accounts[0].account, score: '80' },
    { account: accounts[1].account, score: '90' },
    { account: accounts[2].account, score: '100' },
  ],
  updated: 3,
  mode: 'sequential',
  changed: true,
});

assert.deepEqual(applyPastedGroupVerifyScores(accounts, '90\n100', 1, [1, 2]), {
  scores: [
    { account: accounts[0].account, score: '10' },
    { account: accounts[1].account, score: '90' },
    { account: accounts[2].account, score: '100' },
  ],
  updated: 2,
  mode: 'sequential',
  changed: true,
});

assert.deepEqual(applyPastedGroupVerifyScores(accounts, '10\n90\n100', 1, [0, 1, 2]), {
  scores: [
    { account: accounts[0].account, score: '10' },
    { account: accounts[1].account, score: '90' },
    { account: accounts[2].account, score: '100' },
  ],
  updated: 2,
  mode: 'sequential',
  changed: true,
});

assert.deepEqual(
  applyPastedGroupVerifyScores(
    accounts,
    [
      `${accounts[2].account},88`,
      `${accounts[0].account}\t66`,
      '0x9999999999999999999999999999999999999999 55',
    ].join('\n'),
    1,
  ),
  {
    scores: [
      { account: accounts[0].account, score: '10' },
      { account: accounts[1].account, score: '0' },
      { account: accounts[2].account, score: '88' },
    ],
    updated: 1,
    mode: 'address',
    changed: true,
  },
);

assert.deepEqual(
  applyPastedGroupVerifyScores(accounts, '0x9999999999999999999999999999999999999999 55', 1),
  {
    scores: [
      { account: accounts[0].account, score: '10' },
      { account: accounts[1].account, score: '0' },
      { account: accounts[2].account, score: '0' },
    ],
    updated: 0,
    mode: 'address',
    changed: true,
  },
);

assert.deepEqual(applyPastedGroupVerifyScores(accounts, `${accounts[1].account}\t2222\t90`, 1), {
  scores: accounts,
  updated: 0,
  mode: 'address',
  error: 'invalid-format',
  changed: false,
});

assert.deepEqual(applyPastedGroupVerifyScores(accounts, 'xxx 1 2', 1), {
  scores: accounts,
  updated: 0,
  mode: 'address',
  error: 'invalid-format',
  changed: false,
});

console.log('group verify batch ok');

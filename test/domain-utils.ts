import assert from 'node:assert/strict';

import { calculateActionAPY, calculateAPY, getMissingStakeReceiptAmount } from '../src/lib/domainUtils';

process.env.NEXT_PUBLIC_PHASE_BLOCKS = '111';
process.env.NEXT_PUBLIC_BLOCK_TIME_MS = '2868';

assert.equal(calculateAPY(BigInt(1), BigInt(50), BigInt(0)), '3,678%');
assert.equal(calculateActionAPY(BigInt(1), BigInt(100)), '365%');
assert.equal(calculateActionAPY(BigInt(8), BigInt(100)), '2,920%');
assert.equal(getMissingStakeReceiptAmount(BigInt(100), BigInt(40)), BigInt(60));
assert.equal(getMissingStakeReceiptAmount(BigInt(100), BigInt(0), BigInt(1)), BigInt(0));

console.log('domain utils ok');

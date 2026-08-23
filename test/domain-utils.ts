import assert from 'node:assert/strict';

import { calculateActionAPY, calculateAPY } from '../src/lib/domainUtils';

process.env.NEXT_PUBLIC_PHASE_BLOCKS = '111';
process.env.NEXT_PUBLIC_BLOCK_TIME_MS = '2868';

assert.equal(calculateAPY(BigInt(1), BigInt(50), BigInt(0)), '3,678%');
assert.equal(calculateActionAPY(BigInt(1), BigInt(100)), '365%');
assert.equal(calculateActionAPY(BigInt(8), BigInt(100)), '2,920%');

console.log('domain utils ok');

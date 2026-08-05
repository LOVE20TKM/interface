import assert from 'node:assert/strict';

import { formatBurnAmount } from '../src/lib/burnFormat';

assert.equal(formatBurnAmount(BigInt('1234567800000000000')), '1.234567');
assert.equal(formatBurnAmount(BigInt('12345600000000')), '0.0{4}1234');

console.log('burn format ok');

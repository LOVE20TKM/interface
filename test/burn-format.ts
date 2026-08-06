import assert from 'node:assert/strict';

import { formatBurnAmount } from '../src/lib/burnFormat';

assert.equal(formatBurnAmount(BigInt('1234567800000000000')), '1.23456');
assert.equal(formatBurnAmount(BigInt('12345678000000000000')), '12.3456');
assert.equal(formatBurnAmount(BigInt('123456780000000000000')), '123.456');
assert.equal(formatBurnAmount(BigInt('1234567800000000000000')), '1,234.56');
assert.equal(formatBurnAmount(BigInt('12345678000000000000000')), '12,345.6');
assert.equal(formatBurnAmount(BigInt('123456780000000000000000')), '123,456');
assert.equal(formatBurnAmount(BigInt('12345600000000')), '0.0{4}1234');

console.log('burn format ok');

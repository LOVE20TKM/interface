import assert from 'node:assert/strict';

import { parseGroupTrialBatch } from '../src/lib/groupTrialBatch';

const address1 = '0x1111111111111111111111111111111111111111';
const address2 = '0x2222222222222222222222222222222222222222';
const thAddress = 'THSOMEVALIDADDRESS';

assert.deepEqual(
  parseGroupTrialBatch(`\n${address1} 1.5\r\n${address2}\t2\n${thAddress}, 3,000.25\n`),
  {
    items: [
      { address: address1, amount: '1.5' },
      { address: address2, amount: '2' },
      { address: thAddress, amount: '3000.25' },
    ],
    invalidLineNumbers: [],
  },
);

assert.deepEqual(parseGroupTrialBatch(`${address1}\n${address2},\n${address1} 1 2\n${address2} abc`), {
  items: [],
  invalidLineNumbers: [1, 2, 3, 4],
});

assert.deepEqual(parseGroupTrialBatch(`${address1},.5\n${address2} 0`), {
  items: [
    { address: address1, amount: '.5' },
    { address: address2, amount: '0' },
  ],
  invalidLineNumbers: [],
});

console.log('group trial batch ok');

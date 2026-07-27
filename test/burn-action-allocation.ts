import assert from 'node:assert/strict';

import { allocateActionBurn } from '../src/lib/burnActionAllocation';

assert.deepEqual(allocateActionBurn(BigInt(0), []), []);

assert.deepEqual(
  allocateActionBurn(BigInt(3), [{ actionId: BigInt(2), unusedQuotaAmount: BigInt(5) }]),
  [{ actionId: BigInt(2), amount: BigInt(3) }],
);

const unsortedQuotas = [
  { actionId: BigInt(3), unusedQuotaAmount: BigInt(5) },
  { actionId: BigInt(1), unusedQuotaAmount: BigInt(4) },
  { actionId: BigInt(2), unusedQuotaAmount: BigInt(0) },
];

assert.deepEqual(allocateActionBurn(BigInt(9), unsortedQuotas), [
  { actionId: BigInt(1), amount: BigInt(4) },
  { actionId: BigInt(3), amount: BigInt(5) },
]);
assert.deepEqual(unsortedQuotas.map(({ actionId }) => actionId), [BigInt(3), BigInt(1), BigInt(2)]);

assert.deepEqual(
  allocateActionBurn(BigInt(6), [
    { actionId: BigInt(2), unusedQuotaAmount: BigInt(4) },
    { actionId: BigInt(1), unusedQuotaAmount: BigInt(3) },
  ]),
  [
    { actionId: BigInt(1), amount: BigInt(3) },
    { actionId: BigInt(2), amount: BigInt(3) },
  ],
);

assert.throws(
  () => allocateActionBurn(BigInt(6), [{ actionId: BigInt(1), unusedQuotaAmount: BigInt(5) }]),
  /行动销毁数量超过可用额度/,
);

assert.throws(
  () => allocateActionBurn(BigInt(-1), [{ actionId: BigInt(1), unusedQuotaAmount: BigInt(5) }]),
  /行动销毁数量不能为负数/,
);

console.log('burn action allocation ok');

import assert from 'node:assert/strict';
import {
  ZERO_ADDRESS,
  shouldEnableTrialAccountsWaitingQuery,
  shouldReportErrorToSentry,
  toQuerySafeAddress,
} from '../src/lib/errorHandlingGuards';

const validAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`;

assert.equal(
  toQuerySafeAddress(undefined),
  ZERO_ADDRESS,
  'undefined 地址应回退为完整零地址，而不是非法的 0x0',
);

assert.equal(
  toQuerySafeAddress('0x0' as `0x${string}`),
  ZERO_ADDRESS,
  '非法短地址 0x0 应标准化为完整零地址',
);

assert.equal(
  shouldEnableTrialAccountsWaitingQuery(validAddress, BigInt(1), validAddress),
  true,
  '完整合法参数应启用体验查询',
);

assert.equal(
  shouldEnableTrialAccountsWaitingQuery(validAddress, BigInt(1), ZERO_ADDRESS),
  false,
  '零地址 provider 不应触发体验查询',
);

assert.equal(
  shouldReportErrorToSentry(new Error('Address "0x0" is invalid.')),
  false,
  '本地非法地址错误不应上报到 Sentry',
);

assert.equal(
  shouldReportErrorToSentry(new Error('execution reverted: custom error 0x12345678')),
  true,
  '真实链上错误仍应允许上报到 Sentry',
);

console.log('error handling guards ok');

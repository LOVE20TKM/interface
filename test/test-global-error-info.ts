const assert = require('node:assert/strict');

const { buildGlobalErrorInfo } = require('../src/errors/globalErrorInfo.ts');

assert.equal(
  typeof buildGlobalErrorInfo,
  'function',
  'buildGlobalErrorInfo 应该可用，方便验证全局错误桥接逻辑',
);

const errorInfo = buildGlobalErrorInfo(new Error('ActionNotSubmitted()'), '异步错误');

assert.ok(errorInfo, 'ActionNotSubmitted() 应该被识别为可展示的错误');
assert.equal(errorInfo.name, '交易错误');
assert.equal(errorInfo.message, '该行动本轮未被推举，无法投票');

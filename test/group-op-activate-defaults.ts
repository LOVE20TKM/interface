import assert from 'node:assert/strict';

import { defaultGroupActivationFormValues } from '../src/lib/groupActivationDefaults';

assert.equal(
  defaultGroupActivationFormValues.minJoinAmount,
  '',
  '激活链群表单不应预填最小参与代币数',
);

assert.deepEqual(defaultGroupActivationFormValues, {
  maxCapacity: '',
  description: '',
  minJoinAmount: '',
  maxJoinAmount: '',
  maxAccounts: '',
});

console.log('group op activate defaults ok');

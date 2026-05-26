import assert from 'assert';

import { resolveOwnerManagedChatPermission } from '../src/lib/groupChatPermissions';

const owner = '0x0000000000000000000000000000000000000001';
const delegate = '0x0000000000000000000000000000000000000002';
const other = '0x0000000000000000000000000000000000000003';

assert.deepStrictEqual(
  resolveOwnerManagedChatPermission({
    account: owner,
    owner,
    ownerOrDelegateId: 0n,
    isOwnerOrDelegatePending: true,
    managerOwned: false,
    hasChatInfo: true,
  }),
  {
    accountIsOwner: true,
    canEdit: true,
    isPending: false,
  },
);

assert.deepStrictEqual(
  resolveOwnerManagedChatPermission({
    account: delegate,
    owner,
    ownerOrDelegateId: 9n,
    isOwnerOrDelegatePending: false,
    managerOwned: false,
    hasChatInfo: true,
  }),
  {
    accountIsOwner: false,
    canEdit: true,
    isPending: false,
  },
);

assert.strictEqual(
  resolveOwnerManagedChatPermission({
    account: other,
    owner,
    ownerOrDelegateId: 0n,
    isOwnerOrDelegatePending: false,
    managerOwned: false,
    hasChatInfo: true,
  }).canEdit,
  false,
);

assert.strictEqual(
  (() => {
    const permission = resolveOwnerManagedChatPermission({
      account: owner,
      owner,
      ownerOrDelegateId: 1n,
      isOwnerOrDelegatePending: true,
      managerOwned: true,
      hasChatInfo: true,
    });
    assert.strictEqual(permission.isPending, false);
    return permission;
  })().canEdit,
  false,
);

assert.strictEqual(
  resolveOwnerManagedChatPermission({
    account: other,
    owner,
    ownerOrDelegateId: undefined,
    isOwnerOrDelegatePending: true,
    managerOwned: false,
    hasChatInfo: true,
  }).isPending,
  true,
);

console.log('group-chat-permissions tests passed');

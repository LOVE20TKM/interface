type Address = `0x${string}`;

function sameAddress(left?: Address, right?: Address) {
  return !!left && !!right && left.toLowerCase() === right.toLowerCase();
}

export function resolveOwnerManagedChatPermission({
  account,
  owner,
  ownerOrDelegateId,
  isOwnerOrDelegatePending,
  managerOwned,
  hasChatInfo,
}: {
  account: Address | undefined;
  owner: Address | undefined;
  ownerOrDelegateId: bigint | undefined;
  isOwnerOrDelegatePending: boolean;
  managerOwned: boolean;
  hasChatInfo: boolean;
}) {
  const accountIsOwner = sameAddress(account, owner);
  const canEdit = !managerOwned && (accountIsOwner || (ownerOrDelegateId !== undefined && ownerOrDelegateId > BigInt(0)));

  return {
    accountIsOwner,
    canEdit,
    isPending: !hasChatInfo || (!managerOwned && !accountIsOwner && isOwnerOrDelegatePending),
  };
}

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

export const toQuerySafeAddress = (address?: string | null): `0x${string}` => {
  if (!address || !ADDRESS_PATTERN.test(address)) {
    return ZERO_ADDRESS;
  }

  return address as `0x${string}`;
};

export const shouldEnableTrialAccountsWaitingQuery = (
  extensionAddress?: string | null,
  groupId?: bigint | null,
  provider?: string | null,
) => {
  return (
    toQuerySafeAddress(extensionAddress) !== ZERO_ADDRESS &&
    typeof groupId === 'bigint' &&
    groupId > BigInt(0) &&
    toQuerySafeAddress(provider) !== ZERO_ADDRESS
  );
};

export const shouldReportErrorToSentry = (error: unknown) => {
  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
      ? error.message
      : JSON.stringify(error ?? '');

  if (!message) {
    return false;
  }

  return !/Address\s+"0x0"\s+is invalid|InvalidAddressError/i.test(message);
};

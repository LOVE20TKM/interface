import type { QueryClient, QueryKey } from '@tanstack/react-query';

const GROUP_VERIFY_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_EXTENSION_GROUP_VERIFY as `0x${string}` | undefined;

function isSameAddress(a: string | undefined, b: string | undefined) {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

export function isGroupVerifyQueryKey(queryKey: QueryKey, groupVerifyAddress: string | undefined = GROUP_VERIFY_ADDRESS) {
  if (!Array.isArray(queryKey) || queryKey.length < 2 || !groupVerifyAddress) {
    return false;
  }

  const [queryType, queryParams] = queryKey;

  if (queryType === 'readContract' && queryParams && typeof queryParams === 'object') {
    const { address } = queryParams as { address?: string };
    return isSameAddress(address, groupVerifyAddress);
  }

  if (queryType === 'readContracts' && queryParams && typeof queryParams === 'object') {
    const contracts = (queryParams as { contracts?: Array<{ address?: string }> }).contracts;
    return Array.isArray(contracts) && contracts.some((contract) => isSameAddress(contract?.address, groupVerifyAddress));
  }

  return false;
}

export function invalidateGroupVerifyQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    predicate: (query) => isGroupVerifyQueryKey(query.queryKey),
  });
}

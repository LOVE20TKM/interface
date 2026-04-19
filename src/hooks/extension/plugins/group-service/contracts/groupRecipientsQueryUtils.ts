import type { QueryClient, QueryKey } from '@tanstack/react-query';

const GROUP_RECIPIENTS_FUNCTION_NAMES = new Set([
  'recipients',
  'actionIdsWithRecipients',
  'groupIdsByActionIdWithRecipients',
]);

function isGroupRecipientsQuery(queryKey: QueryKey): boolean {
  if (!Array.isArray(queryKey) || queryKey.length < 2) {
    return false;
  }

  const [queryType, queryParams] = queryKey;

  if (queryType === 'readContract' && queryParams && typeof queryParams === 'object') {
    const functionName = (queryParams as { functionName?: string }).functionName;
    return !!functionName && GROUP_RECIPIENTS_FUNCTION_NAMES.has(functionName);
  }

  if (queryType === 'readContracts' && queryParams && typeof queryParams === 'object') {
    const contracts = (queryParams as { contracts?: Array<{ functionName?: string }> }).contracts;
    return (
      Array.isArray(contracts) &&
      contracts.some((contract) => !!contract?.functionName && GROUP_RECIPIENTS_FUNCTION_NAMES.has(contract.functionName))
    );
  }

  return false;
}

export function invalidateGroupRecipientsQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    predicate: (query) => isGroupRecipientsQuery(query.queryKey),
  });
}

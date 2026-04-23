import { useEffect, useMemo } from 'react';
import type { QueryClient, QueryKey } from '@tanstack/react-query';

import { GroupDefaultsAbi } from '@/src/abis/GroupDefaults';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';
import { useUniversalReadContract } from '@/src/lib/universalReadContract';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_DEFAULTS as `0x${string}` | undefined;

const getContractAddress = () => (CONTRACT_ADDRESS || ZERO_ADDRESS) as `0x${string}`;

export const isGroupDefaultsEnabled = !!CONTRACT_ADDRESS;

const GROUP_DEFAULTS_FUNCTION_NAMES = new Set(['defaultGroupIdOf', 'defaultGroupsOf']);

type DefaultGroupsResult =
  | readonly [readonly unknown[], readonly unknown[]]
  | {
      groupIds?: readonly unknown[];
      groupNames?: readonly unknown[];
    };

export interface DefaultGroupInfo {
  account: `0x${string}`;
  groupId: bigint;
  groupName: string;
  hasDefaultGroup: boolean;
}

const parseDefaultGroupsResult = (data: unknown) => {
  if (Array.isArray(data)) {
    return {
      groupIds: (data[0] || []) as readonly unknown[],
      groupNames: (data[1] || []) as readonly unknown[],
    };
  }

  const result = data as DefaultGroupsResult | undefined;
  return {
    groupIds: result && 'groupIds' in result ? result.groupIds || [] : [],
    groupNames: result && 'groupNames' in result ? result.groupNames || [] : [],
  };
};

function isGroupDefaultsQuery(queryKey: QueryKey): boolean {
  if (!Array.isArray(queryKey) || queryKey.length < 2) {
    return false;
  }

  const [queryType, queryParams] = queryKey;

  if (queryType === 'readContract' && queryParams && typeof queryParams === 'object') {
    const { address, functionName } = queryParams as {
      address?: `0x${string}`;
      functionName?: string;
    };
    return (
      !!address &&
      !!functionName &&
      address.toLowerCase() === getContractAddress().toLowerCase() &&
      GROUP_DEFAULTS_FUNCTION_NAMES.has(functionName)
    );
  }

  if (queryType === 'readContracts' && queryParams && typeof queryParams === 'object') {
    const contracts = (queryParams as { contracts?: Array<{ address?: `0x${string}`; functionName?: string }> }).contracts;
    return (
      Array.isArray(contracts) &&
      contracts.some(
        (contract) =>
          !!contract?.address &&
          !!contract?.functionName &&
          contract.address.toLowerCase() === getContractAddress().toLowerCase() &&
          GROUP_DEFAULTS_FUNCTION_NAMES.has(contract.functionName),
      )
    );
  }

  return false;
}

export function invalidateGroupDefaultsQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    predicate: (query) => isGroupDefaultsQuery(query.queryKey),
  });
}

export const useDefaultGroupIdOf = (account: `0x${string}` | undefined, enabled: boolean = true) => {
  const isQueryEnabled = !!CONTRACT_ADDRESS && !!account && enabled;
  const { data, isPending, error, refetch } = useUniversalReadContract({
    address: getContractAddress(),
    abi: GroupDefaultsAbi,
    functionName: 'defaultGroupIdOf',
    args: [account || ZERO_ADDRESS],
    query: {
      enabled: isQueryEnabled,
    },
  });

  return {
    defaultGroupId: isQueryEnabled && data !== undefined ? safeToBigInt(data) : undefined,
    isPending: isQueryEnabled ? isPending : false,
    error: isQueryEnabled ? error : undefined,
    refetch,
  };
};

export const useDefaultGroupsOf = (accounts: readonly `0x${string}`[] | undefined, enabled: boolean = true) => {
  const queryAccounts = useMemo(() => {
    return (accounts?.filter((account): account is `0x${string}` => !!account) || []) as `0x${string}`[];
  }, [accounts]);
  const isQueryEnabled = !!CONTRACT_ADDRESS && queryAccounts.length > 0 && enabled;

  const { data, isPending, error, refetch } = useUniversalReadContract({
    address: getContractAddress(),
    abi: GroupDefaultsAbi,
    functionName: 'defaultGroupsOf',
    args: [queryAccounts],
    query: {
      enabled: isQueryEnabled,
    },
  });

  const defaultGroups = useMemo<DefaultGroupInfo[]>(() => {
    if (!isQueryEnabled || !data || queryAccounts.length === 0) {
      return [];
    }

    const { groupIds, groupNames } = parseDefaultGroupsResult(data);
    return queryAccounts.map((account, index) => {
      const groupId = safeToBigInt(groupIds[index]);
      return {
        account,
        groupId,
        groupName: typeof groupNames[index] === 'string' ? groupNames[index] : '',
        hasDefaultGroup: groupId > BigInt(0),
      };
    });
  }, [data, isQueryEnabled, queryAccounts]);

  return {
    defaultGroups,
    isPending: isQueryEnabled ? isPending : false,
    error: isQueryEnabled ? error : undefined,
    refetch,
  };
};

export const useDefaultGroupOf = (account: `0x${string}` | undefined, enabled: boolean = true) => {
  const accounts = useMemo(() => (account ? [account] : []), [account]);
  const { defaultGroups, isPending, error, refetch } = useDefaultGroupsOf(accounts, enabled);
  const defaultGroup = defaultGroups[0];

  return {
    defaultGroup,
    defaultGroupId: defaultGroup?.groupId,
    defaultGroupName: defaultGroup?.groupName,
    hasDefaultGroup: defaultGroup?.hasDefaultGroup || false,
    isPending,
    error,
    refetch,
  };
};

export function useSetDefaultGroupId() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    GroupDefaultsAbi,
    getContractAddress(),
    'setDefaultGroupId',
  );

  const setDefaultGroupId = async (groupId: bigint) => {
    console.log('提交setDefaultGroupId交易:', { groupId, isTukeMode });
    return await execute([groupId]);
  };

  useEffect(() => {
    if (hash) {
      console.log('setDefaultGroupId tx hash:', hash);
    }
    if (error) {
      console.log('提交setDefaultGroupId交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    setDefaultGroupId,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

export function useClearDefaultGroupId() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    GroupDefaultsAbi,
    getContractAddress(),
    'clearDefaultGroupId',
  );

  const clearDefaultGroupId = async () => {
    console.log('提交clearDefaultGroupId交易:', { isTukeMode });
    return await execute([]);
  };

  useEffect(() => {
    if (hash) {
      console.log('clearDefaultGroupId tx hash:', hash);
    }
    if (error) {
      console.log('提交clearDefaultGroupId交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    clearDefaultGroupId,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

import { useEffect, useMemo } from 'react';

import { TokenActionGovManagerAbi } from '@/src/abis/TokenActionGovManager';
import { TokenActionMainManagerAbi } from '@/src/abis/TokenActionMainManager';
import { TokenGovManagerAbi } from '@/src/abis/TokenGovManager';
import { TokenMainManagerAbi } from '@/src/abis/TokenMainManager';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';
import { useUniversalReadContract } from '@/src/lib/universalReadContract';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

const TOKEN_MAIN_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_MAIN_MANAGER as
  | `0x${string}`
  | undefined;
const TOKEN_GOV_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_GOV_MANAGER as
  | `0x${string}`
  | undefined;
const TOKEN_ACTION_MAIN_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_ACTION_MAIN_MANAGER as
  | `0x${string}`
  | undefined;
const TOKEN_ACTION_GOV_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT_TOKEN_ACTION_GOV_MANAGER as
  | `0x${string}`
  | undefined;

const getTokenMainManagerAddress = () => (TOKEN_MAIN_MANAGER_ADDRESS || ZERO_ADDRESS) as `0x${string}`;
const getTokenGovManagerAddress = () => (TOKEN_GOV_MANAGER_ADDRESS || ZERO_ADDRESS) as `0x${string}`;
const getTokenActionMainManagerAddress = () => (TOKEN_ACTION_MAIN_MANAGER_ADDRESS || ZERO_ADDRESS) as `0x${string}`;
const getTokenActionGovManagerAddress = () => (TOKEN_ACTION_GOV_MANAGER_ADDRESS || ZERO_ADDRESS) as `0x${string}`;

export const isTokenMainChatManagerEnabled = !!TOKEN_MAIN_MANAGER_ADDRESS;
export const isTokenGovChatManagerEnabled = !!TOKEN_GOV_MANAGER_ADDRESS;
export const isTokenActionMainChatManagerEnabled = !!TOKEN_ACTION_MAIN_MANAGER_ADDRESS;
export const isTokenActionGovChatManagerEnabled = !!TOKEN_ACTION_GOV_MANAGER_ADDRESS;
export const GROUP_CHAT_TOKEN_MAIN_MANAGER_ADDRESS = getTokenMainManagerAddress();
export const GROUP_CHAT_TOKEN_GOV_MANAGER_ADDRESS = getTokenGovManagerAddress();
export const GROUP_CHAT_TOKEN_ACTION_MAIN_MANAGER_ADDRESS = getTokenActionMainManagerAddress();
export const GROUP_CHAT_TOKEN_ACTION_GOV_MANAGER_ADDRESS = getTokenActionGovManagerAddress();

type ChatManagerVotingSource = {
  address: `0x${string}`;
  abi: readonly any[];
  label: string;
};

function sameAddress(left?: `0x${string}`, right?: `0x${string}`) {
  return !!left && !!right && left.toLowerCase() === right.toLowerCase();
}

function resolveVotingSource(owner?: `0x${string}`): ChatManagerVotingSource | undefined {
  if (sameAddress(owner, GROUP_CHAT_TOKEN_MAIN_MANAGER_ADDRESS) && isTokenMainChatManagerEnabled) {
    return { address: GROUP_CHAT_TOKEN_MAIN_MANAGER_ADDRESS, abi: TokenMainManagerAbi, label: 'TokenMainManager' };
  }
  if (sameAddress(owner, GROUP_CHAT_TOKEN_GOV_MANAGER_ADDRESS) && isTokenGovChatManagerEnabled) {
    return { address: GROUP_CHAT_TOKEN_GOV_MANAGER_ADDRESS, abi: TokenGovManagerAbi, label: 'TokenGovManager' };
  }
  if (sameAddress(owner, GROUP_CHAT_TOKEN_ACTION_MAIN_MANAGER_ADDRESS) && isTokenActionMainChatManagerEnabled) {
    return { address: GROUP_CHAT_TOKEN_ACTION_MAIN_MANAGER_ADDRESS, abi: TokenActionMainManagerAbi, label: 'TokenActionMainManager' };
  }
  if (sameAddress(owner, GROUP_CHAT_TOKEN_ACTION_GOV_MANAGER_ADDRESS) && isTokenActionGovChatManagerEnabled) {
    return { address: GROUP_CHAT_TOKEN_ACTION_GOV_MANAGER_ADDRESS, abi: TokenActionGovManagerAbi, label: 'TokenActionGovManager' };
  }
  return undefined;
}

export function useGroupChatVotingPower(
  groupId: bigint | undefined,
  owner: `0x${string}` | undefined,
  voter: `0x${string}` | undefined,
  enabled: boolean = true,
) {
  const source = useMemo(() => resolveVotingSource(owner), [owner]);
  const isQueryEnabled = enabled && !!source && groupId !== undefined && groupId > BigInt(0) && !!voter;
  const voteWeightRead = useUniversalReadContract({
    address: source?.address || ZERO_ADDRESS,
    abi: source?.abi || TokenMainManagerAbi,
    functionName: 'voteWeightOf',
    args: [groupId || BigInt(0), voter || ZERO_ADDRESS],
    query: { enabled: isQueryEnabled },
  });
  const totalWeightRead = useUniversalReadContract({
    address: source?.address || ZERO_ADDRESS,
    abi: source?.abi || TokenMainManagerAbi,
    functionName: 'totalVoteWeight',
    args: [groupId || BigInt(0)],
    query: { enabled: Boolean(enabled && source && groupId !== undefined && groupId > BigInt(0)) },
  });

  return {
    managerAddress: source?.address,
    managerLabel: source?.label,
    voteWeight: isQueryEnabled && voteWeightRead.data !== undefined ? safeToBigInt(voteWeightRead.data) : BigInt(0),
    totalVoteWeight: source && totalWeightRead.data !== undefined ? safeToBigInt(totalWeightRead.data) : BigInt(0),
    isPending: isQueryEnabled ? Boolean(voteWeightRead.isPending || totalWeightRead.isPending) : false,
    error: voteWeightRead.error || totalWeightRead.error,
    refetch: () => {
      voteWeightRead.refetch();
      totalWeightRead.refetch();
    },
  };
}

export const useTokenMainChatGroupIdOfToken = (tokenAddress: `0x${string}` | undefined, enabled: boolean = true) => {
  const isQueryEnabled = isTokenMainChatManagerEnabled && enabled && !!tokenAddress;
  const { data, isPending, error, refetch } = useUniversalReadContract({
    address: getTokenMainManagerAddress(),
    abi: TokenMainManagerAbi,
    functionName: 'groupIdOfToken',
    args: [tokenAddress || ZERO_ADDRESS],
    query: {
      enabled: isQueryEnabled,
    },
  });

  return {
    groupId: isQueryEnabled && data !== undefined ? safeToBigInt(data) : undefined,
    isPending: isQueryEnabled ? isPending : false,
    error: isQueryEnabled ? error : undefined,
    refetch,
  };
};

export const useTokenGovChatGroupIdOfToken = (tokenAddress: `0x${string}` | undefined, enabled: boolean = true) => {
  const isQueryEnabled = isTokenGovChatManagerEnabled && enabled && !!tokenAddress;
  const { data, isPending, error, refetch } = useUniversalReadContract({
    address: getTokenGovManagerAddress(),
    abi: TokenGovManagerAbi,
    functionName: 'groupIdOfToken',
    args: [tokenAddress || ZERO_ADDRESS],
    query: {
      enabled: isQueryEnabled,
    },
  });

  return {
    groupId: isQueryEnabled && data !== undefined ? safeToBigInt(data) : undefined,
    isPending: isQueryEnabled ? isPending : false,
    error: isQueryEnabled ? error : undefined,
    refetch,
  };
};

export const useTokenActionMainChatGroupIdOfAction = (
  tokenAddress: `0x${string}` | undefined,
  actionId: bigint | undefined,
  enabled: boolean = true,
) => {
  const isQueryEnabled = isTokenActionMainChatManagerEnabled && enabled && !!tokenAddress && actionId !== undefined;
  const { data, isPending, error, refetch } = useUniversalReadContract({
    address: getTokenActionMainManagerAddress(),
    abi: TokenActionMainManagerAbi,
    functionName: 'groupIdOfAction',
    args: [tokenAddress || ZERO_ADDRESS, actionId || BigInt(0)],
    query: {
      enabled: isQueryEnabled,
    },
  });

  return {
    groupId: isQueryEnabled && data !== undefined ? safeToBigInt(data) : undefined,
    isPending: isQueryEnabled ? isPending : false,
    error: isQueryEnabled ? error : undefined,
    refetch,
  };
};

export const useTokenActionGovChatGroupIdOfAction = (
  tokenAddress: `0x${string}` | undefined,
  actionId: bigint | undefined,
  enabled: boolean = true,
) => {
  const isQueryEnabled = isTokenActionGovChatManagerEnabled && enabled && !!tokenAddress && actionId !== undefined;
  const { data, isPending, error, refetch } = useUniversalReadContract({
    address: getTokenActionGovManagerAddress(),
    abi: TokenActionGovManagerAbi,
    functionName: 'groupIdOfAction',
    args: [tokenAddress || ZERO_ADDRESS, actionId || BigInt(0)],
    query: {
      enabled: isQueryEnabled,
    },
  });

  return {
    groupId: isQueryEnabled && data !== undefined ? safeToBigInt(data) : undefined,
    isPending: isQueryEnabled ? isPending : false,
    error: isQueryEnabled ? error : undefined,
    refetch,
  };
};

export function useActivateTokenMainChat() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    TokenMainManagerAbi,
    getTokenMainManagerAddress(),
    'activate',
  );

  const activate = async (tokenAddress: `0x${string}`) => {
    console.log('提交TokenMainManager.activate交易:', { tokenAddress, isTukeMode });
    return await execute([tokenAddress]);
  };

  useEffect(() => {
    if (hash) {
      console.log('TokenMainManager.activate tx hash:', hash);
    }
    if (error) {
      console.log('提交TokenMainManager.activate交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    activate,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

export function useActivateTokenActionMainChat() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    TokenActionMainManagerAbi,
    getTokenActionMainManagerAddress(),
    'activate',
  );

  const activate = async (tokenAddress: `0x${string}`, actionId: bigint) => {
    console.log('提交TokenActionMainManager.activate交易:', { tokenAddress, actionId, isTukeMode });
    return await execute([tokenAddress, actionId]);
  };

  useEffect(() => {
    if (hash) {
      console.log('TokenActionMainManager.activate tx hash:', hash);
    }
    if (error) {
      console.log('提交TokenActionMainManager.activate交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    activate,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

export function useActivateTokenActionGovChat() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    TokenActionGovManagerAbi,
    getTokenActionGovManagerAddress(),
    'activate',
  );

  const activate = async (tokenAddress: `0x${string}`, actionId: bigint) => {
    console.log('提交TokenActionGovManager.activate交易:', { tokenAddress, actionId, isTukeMode });
    return await execute([tokenAddress, actionId]);
  };

  useEffect(() => {
    if (hash) {
      console.log('TokenActionGovManager.activate tx hash:', hash);
    }
    if (error) {
      console.log('提交TokenActionGovManager.activate交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    activate,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

export function useActivateTokenGovChat() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    TokenGovManagerAbi,
    getTokenGovManagerAddress(),
    'activate',
  );

  const activate = async (tokenAddress: `0x${string}`) => {
    console.log('提交TokenGovManager.activate交易:', { tokenAddress, isTukeMode });
    return await execute([tokenAddress]);
  };

  useEffect(() => {
    if (hash) {
      console.log('TokenGovManager.activate tx hash:', hash);
    }
    if (error) {
      console.log('提交TokenGovManager.activate交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    activate,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

import { useEffect, useMemo } from 'react';

import { GroupChatAbi } from '@/src/abis/GroupChat';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { logError, logWeb3Error } from '@/src/lib/debugUtils';
import { useUniversalReadContract } from '@/src/lib/universalReadContract';
import { useUniversalTransaction } from '@/src/lib/universalTransaction';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP_CHAT as `0x${string}` | undefined;
const GROUP_DELEGATE_ABI = [
  {
    type: 'function',
    name: 'delegateIdOf',
    stateMutability: 'view',
    inputs: [{ name: 'groupId', type: 'uint256' }],
    outputs: [{ name: 'delegateId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'setDelegateId',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'groupId', type: 'uint256' },
      { name: 'delegateId', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

const getContractAddress = () => (CONTRACT_ADDRESS || ZERO_ADDRESS) as `0x${string}`;
const isPositiveId = (value: bigint | undefined) => value !== undefined && value > BigInt(0);

export const isGroupChatEnabled = !!CONTRACT_ADDRESS;
export const GROUP_CHAT_CONTRACT_ADDRESS = getContractAddress();

function parseChatActivated(raw: unknown): boolean | undefined {
  if (!raw) return undefined;
  const data = raw as Record<string, unknown> & readonly unknown[];
  return Boolean(data.activated ?? data[2]);
}

export const useGroupChatActivationStatusMap = (
  groupIds: readonly bigint[],
  enabled: boolean = true,
) => {
  const uniqueGroupIds = useMemo(() => {
    const seen = new Set<string>();
    return groupIds.filter((groupId) => {
      const key = groupId.toString();
      if (seen.has(key)) return false;
      seen.add(key);
      return groupId > BigInt(0);
    });
  }, [groupIds]);
  const { chatInfos, isPending, error, refetch } = useGroupChatInfos(
    uniqueGroupIds,
    enabled && uniqueGroupIds.length > 0,
  );

  const activationStatusMap = useMemo(() => {
    const map = new Map<string, boolean>();
    uniqueGroupIds.forEach((groupId, index) => {
      const activated = parseChatActivated(chatInfos[index]);
      if (activated !== undefined) {
        map.set(groupId.toString(), activated);
      }
    });
    return map;
  }, [chatInfos, uniqueGroupIds]);

  return {
    activationStatusMap,
    isPending,
    error,
    refetch,
  };
};

export const useGroupChatGroupDelegateAddress = (enabled: boolean = true) => {
  const isQueryEnabled = isGroupChatEnabled && enabled;
  const { data, isPending, error, refetch } = useUniversalReadContract({
    address: getContractAddress(),
    abi: GroupChatAbi,
    functionName: 'GROUP_DELEGATE_ADDRESS',
    query: {
      enabled: isQueryEnabled,
    },
  });

  return {
    groupDelegateAddress: isQueryEnabled ? (data as `0x${string}` | undefined) : undefined,
    isPending: isQueryEnabled ? isPending : false,
    error: isQueryEnabled ? error : undefined,
    refetch,
  };
};

export const useGroupChatGroupIdsCount = (enabled: boolean = true) => {
  const isQueryEnabled = isGroupChatEnabled && enabled;
  const { data, isPending, error, refetch } = useUniversalReadContract({
    address: getContractAddress(),
    abi: GroupChatAbi,
    functionName: 'groupIdsCount',
    query: {
      enabled: isQueryEnabled,
    },
  });

  return {
    groupIdsCount: isQueryEnabled && data !== undefined ? safeToBigInt(data) : undefined,
    isPending: isQueryEnabled ? isPending : false,
    error: isQueryEnabled ? error : undefined,
    refetch,
  };
};

export const useGroupChatGroupIds = (
  offset: bigint,
  limit: bigint,
  reverse: boolean = true,
  enabled: boolean = true,
) => {
  const isQueryEnabled = isGroupChatEnabled && enabled && limit > BigInt(0);
  const { data, isPending, error, refetch } = useUniversalReadContract({
    address: getContractAddress(),
    abi: GroupChatAbi,
    functionName: 'groupIds',
    args: [offset, limit, reverse],
    query: {
      enabled: isQueryEnabled,
    },
  });

  return {
    groupIds: isQueryEnabled && Array.isArray(data) ? data.map((item) => safeToBigInt(item)) : [],
    isPending: isQueryEnabled ? isPending : false,
    error: isQueryEnabled ? error : undefined,
    refetch,
  };
};

export const useGroupChatInfo = (groupId: bigint | undefined, enabled: boolean = true) => {
  const isQueryEnabled = isGroupChatEnabled && enabled && isPositiveId(groupId);
  const { data, isPending, error, refetch } = useUniversalReadContract({
    address: getContractAddress(),
    abi: GroupChatAbi,
    functionName: 'chatInfo',
    args: [groupId || BigInt(0)],
    query: {
      enabled: isQueryEnabled,
      placeholderData: (previousData) => previousData,
      refetchOnWindowFocus: false,
    },
  });

  return {
    chatInfo: isQueryEnabled ? data : undefined,
    isPending: isQueryEnabled ? isPending : false,
    error: isQueryEnabled ? error : undefined,
    refetch,
  };
};

export const useGroupChatInfos = (groupIds: readonly bigint[], enabled: boolean = true) => {
  const hasOnlyPositiveGroupIds = groupIds.every((groupId) => groupId > BigInt(0));
  const isQueryEnabled = isGroupChatEnabled && enabled && groupIds.length > 0 && hasOnlyPositiveGroupIds;
  const { data, isPending, error, refetch } = useUniversalReadContract({
    address: getContractAddress(),
    abi: GroupChatAbi,
    functionName: 'chatInfos',
    args: [groupIds],
    query: {
      enabled: isQueryEnabled,
    },
  });
  const chatInfos = useMemo(
    () => (isQueryEnabled && Array.isArray(data) ? data : []),
    [data, isQueryEnabled],
  );

  return {
    chatInfos,
    isPending: isQueryEnabled ? isPending : false,
    error: isQueryEnabled ? error : undefined,
    refetch,
  };
};

export const useGroupChatMessagesCount = (groupId: bigint | undefined, enabled: boolean = true) => {
  const isQueryEnabled = isGroupChatEnabled && enabled && isPositiveId(groupId);
  const { data, isPending, error, refetch } = useUniversalReadContract({
    address: getContractAddress(),
    abi: GroupChatAbi,
    functionName: 'messagesCount',
    args: [groupId || BigInt(0)],
    query: {
      enabled: isQueryEnabled,
    },
  });

  return {
    messagesCount: isQueryEnabled && data !== undefined ? safeToBigInt(data) : undefined,
    isPending: isQueryEnabled ? isPending : false,
    error: isQueryEnabled ? error : undefined,
    refetch,
  };
};

export const useGroupChatMessages = (
  groupId: bigint | undefined,
  offset: bigint,
  limit: bigint,
  reverse: boolean = false,
  enabled: boolean = true,
) => {
  const isQueryEnabled = isGroupChatEnabled && enabled && isPositiveId(groupId) && limit > BigInt(0);
  const { data, isPending, error, refetch } = useUniversalReadContract({
    address: getContractAddress(),
    abi: GroupChatAbi,
    functionName: 'messages',
    args: [groupId || BigInt(0), offset, limit, reverse],
    query: {
      enabled: isQueryEnabled,
      placeholderData: (previousData) => previousData,
      refetchOnWindowFocus: false,
    },
  });

  return {
    messages: isQueryEnabled && Array.isArray(data) ? data : [],
    isPending: isQueryEnabled ? isPending : false,
    error: isQueryEnabled ? error : undefined,
    refetch,
  };
};

export const useGroupChatMessage = (
  groupId: bigint | undefined,
  messageId: bigint | undefined,
  enabled: boolean = true,
) => {
  const isQueryEnabled = isGroupChatEnabled && enabled && isPositiveId(groupId) && isPositiveId(messageId);
  const { data, isPending, error, refetch } = useUniversalReadContract({
    address: getContractAddress(),
    abi: GroupChatAbi,
    functionName: 'message',
    args: [groupId || BigInt(0), messageId || BigInt(0)],
    query: {
      enabled: isQueryEnabled,
    },
  });

  return {
    message: isQueryEnabled ? data : undefined,
    isPending: isQueryEnabled ? isPending : false,
    error: isQueryEnabled ? error : undefined,
    refetch,
  };
};

export const useGroupChatCanPost = (
  groupId: bigint | undefined,
  senderId: bigint | undefined,
  senderAddress: `0x${string}` | undefined,
  enabled: boolean = true,
) => {
  const isQueryEnabled =
    isGroupChatEnabled && enabled && isPositiveId(groupId) && isPositiveId(senderId) && !!senderAddress;
  const { data, isPending, error, refetch } = useUniversalReadContract({
    address: getContractAddress(),
    abi: GroupChatAbi,
    functionName: 'canPost',
    args: [groupId || BigInt(0), senderId || BigInt(0), senderAddress || ZERO_ADDRESS],
    query: {
      enabled: isQueryEnabled,
    },
  });

  const result = Array.isArray(data) ? data : undefined;

  return {
    canPost: isQueryEnabled && result ? Boolean(result[0]) : false,
    reasonCode: isQueryEnabled && result ? (result[1] as `0x${string}`) : undefined,
    isPending: isQueryEnabled ? isPending : false,
    error: isQueryEnabled ? error : undefined,
    refetch,
  };
};

export function usePostAsDefaultSender() {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    GroupChatAbi,
    getContractAddress(),
    'postAsDefaultSender',
  );

  const postAsDefaultSender = async (
    groupId: bigint,
    content: string,
    mentionedSenderIds: bigint[] = [],
    mentionAll: boolean = false,
    quotedMessageId: bigint = BigInt(0),
  ) => {
    console.log('提交postAsDefaultSender交易:', {
      groupId,
      contentLength: content.length,
      mentionedSenderIds,
      mentionAll,
      quotedMessageId,
      isTukeMode,
    });
    return await execute([groupId, content, mentionedSenderIds, mentionAll, quotedMessageId]);
  };

  useEffect(() => {
    if (hash) {
      console.log('postAsDefaultSender tx hash:', hash);
    }
    if (error) {
      console.log('提交postAsDefaultSender交易错误:');
      logWeb3Error(error);
      logError(error);
    }
  }, [hash, error]);

  return {
    postAsDefaultSender,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

function useGroupChatWrite(functionName: string) {
  const { execute, isPending, isConfirming, isConfirmed, error, hash, isTukeMode } = useUniversalTransaction(
    GroupChatAbi,
    getContractAddress(),
    functionName,
  );

  useEffect(() => {
    if (hash) {
      console.log(`${functionName} tx hash:`, hash);
    }
    if (error) {
      console.log(`提交${functionName}交易错误:`);
      logWeb3Error(error);
      logError(error);
    }
  }, [error, functionName, hash]);

  return {
    execute,
    isPending,
    isConfirming,
    writeError: error,
    isConfirmed,
    hash,
    isTukeMode,
  };
}

export function useActivateDirectGroupChat() {
  const tx = useGroupChatWrite('activateChat');

  const activateChat = async (
    groupId: bigint,
    scopeSource: `0x${string}` = ZERO_ADDRESS,
    banSource: `0x${string}` = ZERO_ADDRESS,
    beforePostPlugin: `0x${string}` = ZERO_ADDRESS,
    afterPostPlugin: `0x${string}` = ZERO_ADDRESS,
  ) => {
    return await tx.execute([groupId, scopeSource, banSource, beforePostPlugin, afterPostPlugin]);
  };

  return {
    activateChat,
    ...tx,
  };
}

export function useSetGroupChatPostingAllowed() {
  const tx = useGroupChatWrite('setPostingAllowed');

  const setPostingAllowed = async (groupId: bigint, postingAllowed: boolean) => {
    return await tx.execute([groupId, postingAllowed]);
  };

  return {
    setPostingAllowed,
    ...tx,
  };
}

export function useSetGroupChatScopeSource() {
  const tx = useGroupChatWrite('setScopeSource');

  const setScopeSource = async (groupId: bigint, sourceAddress: `0x${string}`) => {
    return await tx.execute([groupId, sourceAddress]);
  };

  return {
    setScopeSource,
    ...tx,
  };
}

export function useSetGroupChatBanSource() {
  const tx = useGroupChatWrite('setBanSource');

  const setBanSource = async (groupId: bigint, sourceAddress: `0x${string}`) => {
    return await tx.execute([groupId, sourceAddress]);
  };

  return {
    setBanSource,
    ...tx,
  };
}

export function useSetGroupChatBeforePostPlugin() {
  const tx = useGroupChatWrite('setBeforePostPlugin');

  const setBeforePostPlugin = async (groupId: bigint, pluginAddress: `0x${string}`) => {
    return await tx.execute([groupId, pluginAddress]);
  };

  return {
    setBeforePostPlugin,
    ...tx,
  };
}

export function useSetGroupChatAfterPostPlugin() {
  const tx = useGroupChatWrite('setAfterPostPlugin');

  const setAfterPostPlugin = async (groupId: bigint, pluginAddress: `0x${string}`) => {
    return await tx.execute([groupId, pluginAddress]);
  };

  return {
    setAfterPostPlugin,
    ...tx,
  };
}

export function useGroupDelegateId(groupDelegateAddress: `0x${string}` | undefined, groupId: bigint | undefined) {
  const isQueryEnabled = !!groupDelegateAddress && groupDelegateAddress !== ZERO_ADDRESS && isPositiveId(groupId);
  const { data, isPending, error, refetch } = useUniversalReadContract({
    address: groupDelegateAddress || ZERO_ADDRESS,
    abi: GROUP_DELEGATE_ABI,
    functionName: 'delegateIdOf',
    args: [groupId || BigInt(0)],
    query: {
      enabled: isQueryEnabled,
    },
  });

  return {
    delegateId: isQueryEnabled && data !== undefined ? safeToBigInt(data) : undefined,
    isPending: isQueryEnabled ? isPending : false,
    error: isQueryEnabled ? error : undefined,
    refetch,
  };
}

export function useSetGroupDelegateId(groupDelegateAddress: `0x${string}` | undefined) {
  const tx = useUniversalTransaction(
    GROUP_DELEGATE_ABI,
    groupDelegateAddress || ZERO_ADDRESS,
    'setDelegateId',
  );

  useEffect(() => {
    if (tx.hash) {
      console.log('setDelegateId tx hash:', tx.hash);
    }
    if (tx.error) {
      console.log('提交setDelegateId交易错误:');
      logWeb3Error(tx.error);
      logError(tx.error);
    }
  }, [tx.error, tx.hash]);

  return {
    setDelegateId: (groupId: bigint, delegateId: bigint) => tx.execute([groupId, delegateId]),
    execute: tx.execute,
    isPending: tx.isPending,
    isConfirming: tx.isConfirming,
    isConfirmed: tx.isConfirmed,
    writeError: tx.error,
    hash: tx.hash,
    isTukeMode: tx.isTukeMode,
  };
}

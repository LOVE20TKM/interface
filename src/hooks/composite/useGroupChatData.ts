import { useMemo } from 'react';

import { LOVE20GroupAbi } from '@/src/abis/LOVE20Group';
import { LOVE20SubmitAbi } from '@/src/abis/LOVE20Submit';
import { LOVE20TokenAbi } from '@/src/abis/LOVE20Token';
import { GroupChatAbi } from '@/src/abis/GroupChat';
import { TokenActionGovManagerAbi } from '@/src/abis/TokenActionGovManager';
import { TokenActionMainManagerAbi } from '@/src/abis/TokenActionMainManager';
import { TokenGovManagerAbi } from '@/src/abis/TokenGovManager';
import { TokenMainManagerAbi } from '@/src/abis/TokenMainManager';
import type { Token } from '@/src/contexts/TokenContext';
import {
  GROUP_CHAT_CONTRACT_ADDRESS,
  isGroupChatEnabled,
  useGroupChatCanPost,
  useGroupChatGroupIds,
  useGroupChatGroupIdsCount,
  useGroupChatInfo,
  useGroupChatInfos,
  useGroupChatMessages,
  useGroupChatMessagesCount,
} from '@/src/hooks/contracts/useGroupChat';
import { useDefaultGroupOf } from '@/src/hooks/extension/base/contracts/useGroupDefaults';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { abbreviateAddress } from '@/src/lib/format';
import { useUniversalReadContracts } from '@/src/lib/universalReadContract';
import {
  GROUP_NAME_UNKNOWN,
  addressesEqual,
  buildChatTitle,
  isNonZeroAddress,
  normalizeAddress,
  parseGroupChatInfo,
  parseGroupChatMessage,
  resultAt,
  typeLabel,
  uniqueAddresses,
  uniqueBigInts,
  type ClassifierKind,
  type GroupChatKind,
  type GroupChatListItem,
  type GroupChatRoomData,
  type ParsedGroupChatInfo,
  type ParsedGroupChatMessage,
  type ParsedGroupChatMeta,
  type ReadContractResult,
} from './groupChatDataTypes';

export {
  parseGroupChatInfo,
  parseGroupChatMessage,
  type GroupChatKind,
  type GroupChatListItem,
  type GroupChatRoomData,
  type ParsedGroupChatInfo,
  type ParsedGroupChatMessage,
  type ParsedGroupChatMeta,
} from './groupChatDataTypes';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
const INBOX_RECENT_MESSAGE_LIMIT = 10;
const GROUP_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_GROUP as `0x${string}` | undefined;
const SUBMIT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_SUBMIT as `0x${string}` | undefined;
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
const POST_BAN_SOURCE_ABI = [
  {
    type: 'function',
    name: 'isBanned',
    stateMutability: 'view',
    inputs: [
      { name: 'groupId', type: 'uint256' },
      { name: 'senderId', type: 'uint256' },
      { name: 'senderAddress', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

function actionInfoTitle(raw: unknown) {
  const item = raw as (Record<string, unknown> & readonly unknown[]) | undefined;
  const body = (item?.body ?? item?.[1]) as (Record<string, unknown> & readonly unknown[]) | undefined;
  const title = body?.title ?? body?.[3];
  return typeof title === 'string' && title.trim() ? title.trim() : '';
}

function managerKindByOwner(owner: `0x${string}` | undefined): ClassifierKind | undefined {
  if (addressesEqual(owner, TOKEN_MAIN_MANAGER_ADDRESS)) return 'token-community';
  if (addressesEqual(owner, TOKEN_GOV_MANAGER_ADDRESS)) return 'token-gov';
  if (addressesEqual(owner, TOKEN_ACTION_MAIN_MANAGER_ADDRESS)) return 'action';
  if (addressesEqual(owner, TOKEN_ACTION_GOV_MANAGER_ADDRESS)) return 'action-gov';
  return undefined;
}

export function useGroupNames(groupIds: readonly (bigint | undefined)[], enabled: boolean = true) {
  const uniqueIds = useMemo(() => uniqueBigInts(groupIds), [groupIds]);
  const contracts = useMemo(
    () =>
      uniqueIds.map((groupId) => ({
        address: (GROUP_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
        abi: LOVE20GroupAbi,
        functionName: 'groupNameOf' as const,
        args: [groupId],
      })),
    [uniqueIds],
  );

  const isQueryEnabled = !!GROUP_ADDRESS && enabled && uniqueIds.length > 0;
  const { data, isPending, error, refetch } = useUniversalReadContracts({
    contracts: contracts as any,
    query: {
      enabled: isQueryEnabled,
    },
  });

  const groupNames = useMemo(() => {
    const names: Record<string, string> = {};
    uniqueIds.forEach((groupId, index) => {
      const value = resultAt(data as readonly ReadContractResult[] | undefined, index);
      names[groupId.toString()] = typeof value === 'string' && value ? value : `${GROUP_NAME_UNKNOWN} #${groupId}`;
    });
    return names;
  }, [data, uniqueIds]);

  return {
    groupNames,
    isPending: isQueryEnabled ? isPending : false,
    error: isQueryEnabled ? error : undefined,
    refetch,
  };
}

export function useGroupChatInboxData(
  currentToken: Token | null | undefined,
  account: `0x${string}` | undefined,
  limit: number = 50,
  priorityGroupIds: readonly (bigint | undefined)[] = [],
) {
  const { groupIdsCount, isPending: isPendingCount, error: countError, refetch: refetchCount } =
    useGroupChatGroupIdsCount();
  const limitBigInt = BigInt(limit);
  const requestedLimit =
    groupIdsCount === undefined ? BigInt(0) : groupIdsCount < limitBigInt ? groupIdsCount : limitBigInt;
  const {
    groupIds: recentGroupIds,
    isPending: isPendingGroupIds,
    error: groupIdsError,
    refetch: refetchGroupIds,
  } = useGroupChatGroupIds(BigInt(0), requestedLimit, true, requestedLimit > BigInt(0));
  const groupIds = useMemo(
    () => uniqueBigInts([...priorityGroupIds, ...recentGroupIds]),
    [priorityGroupIds, recentGroupIds],
  );

  const { groupNames, isPending: isPendingGroupNames, refetch: refetchGroupNames } = useGroupNames(groupIds);
  const { defaultGroupId, hasDefaultGroup, isPending: isPendingDefaultGroup, refetch: refetchDefaultGroup } =
    useDefaultGroupOf(account, !!account);

  const { chatInfos, isPending: isPendingInfos, error: infoError, refetch: refetchInfos } =
    useGroupChatInfos(groupIds, groupIds.length > 0);
  const parsedChatInfos = useMemo(
    () => groupIds.map((_, index) => parseGroupChatInfo(chatInfos[index])),
    [chatInfos, groupIds],
  );

  const metaByGroup = useMemo(() => {
    const map: Record<string, ParsedGroupChatMeta> = {};
    groupIds.forEach((groupId) => {
      map[groupId.toString()] = { title: '', description: '' };
    });
    return map;
  }, [groupIds]);

  const messageCountContracts = useMemo(
    () =>
      groupIds.map((groupId) => ({
        address: GROUP_CHAT_CONTRACT_ADDRESS,
        abi: GroupChatAbi,
        functionName: 'messagesCount' as const,
        args: [groupId],
      })),
    [groupIds],
  );
  const shouldReadMessageCounts = isGroupChatEnabled && messageCountContracts.length > 0;
  const {
    data: messageCountData,
    isPending: rawIsPendingMessageCounts,
    error: messageCountError,
    refetch: refetchMessageCounts,
  } = useUniversalReadContracts({
    contracts: messageCountContracts as any,
    query: {
      enabled: shouldReadMessageCounts,
    },
  });
  const isPendingMessageCounts = shouldReadMessageCounts ? rawIsPendingMessageCounts : false;

  const messagesCountByGroup = useMemo(() => {
    const counts: Record<string, bigint> = {};
    groupIds.forEach((groupId, index) => {
      counts[groupId.toString()] = safeToBigInt(resultAt(messageCountData as readonly ReadContractResult[] | undefined, index));
    });
    return counts;
  }, [groupIds, messageCountData]);

  const latestMentionMeContracts = useMemo(
    () =>
      hasDefaultGroup && defaultGroupId
        ? groupIds.map((groupId) => ({
            address: GROUP_CHAT_CONTRACT_ADDRESS,
            abi: GroupChatAbi,
            functionName: 'messageIdsByMention' as const,
            args: [groupId, defaultGroupId, BigInt(0), BigInt(1), true],
          }))
        : [],
    [defaultGroupId, groupIds, hasDefaultGroup],
  );
  const shouldReadLatestMentionMe = isGroupChatEnabled && latestMentionMeContracts.length > 0;
  const {
    data: latestMentionMeData,
    isPending: rawIsPendingLatestMentionMe,
    error: latestMentionMeError,
    refetch: refetchLatestMentionMe,
  } = useUniversalReadContracts({
    contracts: latestMentionMeContracts as any,
    query: {
      enabled: shouldReadLatestMentionMe,
    },
  });
  const isPendingLatestMentionMe = shouldReadLatestMentionMe ? rawIsPendingLatestMentionMe : false;

  const latestMentionMeByGroup = useMemo(() => {
    const ids: Record<string, bigint> = {};
    groupIds.forEach((groupId, index) => {
      const result = resultAt(latestMentionMeData as readonly ReadContractResult[] | undefined, index);
      ids[groupId.toString()] = Array.isArray(result) ? safeToBigInt(result[0]) : BigInt(0);
    });
    return ids;
  }, [groupIds, latestMentionMeData]);

  const latestMentionAllContracts = useMemo(
    () =>
      groupIds.map((groupId) => ({
        address: GROUP_CHAT_CONTRACT_ADDRESS,
        abi: GroupChatAbi,
        functionName: 'messageIdsByMentionAll' as const,
        args: [groupId, BigInt(0), BigInt(1), true],
      })),
    [groupIds],
  );
  const shouldReadLatestMentionAll = isGroupChatEnabled && latestMentionAllContracts.length > 0;
  const {
    data: latestMentionAllData,
    isPending: rawIsPendingLatestMentionAll,
    error: latestMentionAllError,
    refetch: refetchLatestMentionAll,
  } = useUniversalReadContracts({
    contracts: latestMentionAllContracts as any,
    query: {
      enabled: shouldReadLatestMentionAll,
    },
  });
  const isPendingLatestMentionAll = shouldReadLatestMentionAll ? rawIsPendingLatestMentionAll : false;

  const latestMentionAllByGroup = useMemo(() => {
    const ids: Record<string, bigint> = {};
    groupIds.forEach((groupId, index) => {
      const result = resultAt(latestMentionAllData as readonly ReadContractResult[] | undefined, index);
      ids[groupId.toString()] = Array.isArray(result) ? safeToBigInt(result[0]) : BigInt(0);
    });
    return ids;
  }, [groupIds, latestMentionAllData]);

  const latestMessageContracts = useMemo(
    () =>
      groupIds
        .map((groupId) => {
          const count = messagesCountByGroup[groupId.toString()] || BigInt(0);
          if (count <= BigInt(0)) return null;
          return {
            address: GROUP_CHAT_CONTRACT_ADDRESS,
            abi: GroupChatAbi,
            functionName: 'message' as const,
            args: [groupId, count],
          };
        })
        .filter(Boolean),
    [groupIds, messagesCountByGroup],
  );
  const {
    data: latestMessageData,
    isPending: rawIsPendingLatestMessages,
    error: latestMessageError,
    refetch: refetchLatestMessages,
  } = useUniversalReadContracts({
    contracts: latestMessageContracts as any,
    query: {
      enabled: isGroupChatEnabled && latestMessageContracts.length > 0,
    },
  });
  const shouldReadLatestMessages = isGroupChatEnabled && latestMessageContracts.length > 0;
  const isPendingLatestMessages = shouldReadLatestMessages ? rawIsPendingLatestMessages : false;

  const latestMessageByGroup = useMemo(() => {
    const latest: Record<string, ParsedGroupChatMessage> = {};
    let resultIndex = 0;
    groupIds.forEach((groupId) => {
      const count = messagesCountByGroup[groupId.toString()] || BigInt(0);
      if (count <= BigInt(0)) return;
      const parsed = parseGroupChatMessage(
        resultAt(latestMessageData as readonly ReadContractResult[] | undefined, resultIndex),
      );
      if (parsed) latest[groupId.toString()] = parsed;
      resultIndex++;
    });
    return latest;
  }, [groupIds, latestMessageData, messagesCountByGroup]);

  const latestMessageBanContracts = useMemo(
    () =>
      groupIds
        .map((groupId, index) => {
          const info = parsedChatInfos[index];
          const message = latestMessageByGroup[groupId.toString()];
          if (!info?.banSource || info.banSource.toLowerCase() === ZERO_ADDRESS || !message) return null;
          return {
            address: info.banSource,
            abi: POST_BAN_SOURCE_ABI,
            functionName: 'isBanned' as const,
            args: [groupId, message.senderId, message.senderAddress],
          };
        })
        .filter(Boolean),
    [groupIds, latestMessageByGroup, parsedChatInfos],
  );
  const shouldReadLatestMessageBans = isGroupChatEnabled && latestMessageBanContracts.length > 0;
  const {
    data: latestMessageBanData,
    isPending: rawIsPendingLatestMessageBans,
    error: latestMessageBanError,
    refetch: refetchLatestMessageBans,
  } = useUniversalReadContracts({
    contracts: latestMessageBanContracts as any,
    query: {
      enabled: shouldReadLatestMessageBans,
    },
  });
  const isPendingLatestMessageBans = shouldReadLatestMessageBans ? rawIsPendingLatestMessageBans : false;

  const latestMessageBannedByGroup = useMemo(() => {
    const map: Record<string, boolean> = {};
    let resultIndex = 0;
    groupIds.forEach((groupId, index) => {
      const info = parsedChatInfos[index];
      const message = latestMessageByGroup[groupId.toString()];
      if (!message || !info?.banSource || info.banSource.toLowerCase() === ZERO_ADDRESS) {
        map[groupId.toString()] = false;
        return;
      }
      map[groupId.toString()] = Boolean(
        resultAt(latestMessageBanData as readonly ReadContractResult[] | undefined, resultIndex),
      );
      resultIndex++;
    });
    return map;
  }, [groupIds, latestMessageBanData, latestMessageByGroup, parsedChatInfos]);

  const recentMessageContracts = useMemo(
    () =>
      groupIds.flatMap((groupId) => {
        const count = messagesCountByGroup[groupId.toString()] || BigInt(0);
        if (count <= BigInt(0)) return [];
        const limit = count < BigInt(INBOX_RECENT_MESSAGE_LIMIT) ? count : BigInt(INBOX_RECENT_MESSAGE_LIMIT);
        const offset = count > limit ? count - limit : BigInt(0);
        return [
          {
            address: GROUP_CHAT_CONTRACT_ADDRESS,
            abi: GroupChatAbi,
            functionName: 'messages' as const,
            args: [groupId, offset, limit, false],
          },
        ];
      }),
    [groupIds, messagesCountByGroup],
  );
  const shouldReadRecentMessages = isGroupChatEnabled && recentMessageContracts.length > 0;
  const {
    data: recentMessageData,
    isPending: rawIsPendingRecentMessages,
    error: recentMessageError,
    refetch: refetchRecentMessages,
  } = useUniversalReadContracts({
    contracts: recentMessageContracts as any,
    query: {
      enabled: shouldReadRecentMessages,
    },
  });
  const isPendingRecentMessages = shouldReadRecentMessages ? rawIsPendingRecentMessages : false;

  const recentMessagesByGroup = useMemo(() => {
    const map: Record<string, ParsedGroupChatMessage[]> = {};
    let resultIndex = 0;
    groupIds.forEach((groupId) => {
      const count = messagesCountByGroup[groupId.toString()] || BigInt(0);
      if (count <= BigInt(0)) {
        map[groupId.toString()] = [];
        return;
      }
      const rawMessages = resultAt(recentMessageData as readonly ReadContractResult[] | undefined, resultIndex);
      map[groupId.toString()] = Array.isArray(rawMessages)
        ? rawMessages
            .map((message) => parseGroupChatMessage(message))
            .filter((message): message is ParsedGroupChatMessage => !!message)
        : [];
      resultIndex++;
    });
    return map;
  }, [groupIds, messagesCountByGroup, recentMessageData]);

  const recentMessageBanContracts = useMemo(
    () =>
      groupIds.flatMap((groupId, index) => {
        const info = parsedChatInfos[index];
        const recentMessages = recentMessagesByGroup[groupId.toString()] || [];
        if (!info?.banSource || info.banSource.toLowerCase() === ZERO_ADDRESS || recentMessages.length === 0) return [];
        return recentMessages.map((message) => ({
          address: info.banSource,
          abi: POST_BAN_SOURCE_ABI,
          functionName: 'isBanned' as const,
          args: [groupId, message.senderId, message.senderAddress],
        }));
      }),
    [groupIds, parsedChatInfos, recentMessagesByGroup],
  );
  const shouldReadRecentMessageBans = isGroupChatEnabled && recentMessageBanContracts.length > 0;
  const {
    data: recentMessageBanData,
    isPending: rawIsPendingRecentMessageBans,
    error: recentMessageBanError,
    refetch: refetchRecentMessageBans,
  } = useUniversalReadContracts({
    contracts: recentMessageBanContracts,
    query: {
      enabled: shouldReadRecentMessageBans,
    },
  });
  const isPendingRecentMessageBans = shouldReadRecentMessageBans ? rawIsPendingRecentMessageBans : false;

  const recentBannedMessageIdsByGroup = useMemo(() => {
    const map: Record<string, Record<string, boolean>> = {};
    let resultIndex = 0;
    groupIds.forEach((groupId, index) => {
      const info = parsedChatInfos[index];
      const recentMessages = recentMessagesByGroup[groupId.toString()] || [];
      const bannedByMessageId: Record<string, boolean> = {};
      if (!info?.banSource || info.banSource.toLowerCase() === ZERO_ADDRESS || recentMessages.length === 0) {
        recentMessages.forEach((message) => {
          bannedByMessageId[message.messageId.toString()] = false;
        });
        map[groupId.toString()] = bannedByMessageId;
        return;
      }
      recentMessages.forEach((message) => {
        bannedByMessageId[message.messageId.toString()] = Boolean(
          resultAt(recentMessageBanData as readonly ReadContractResult[] | undefined, resultIndex),
        );
        resultIndex++;
      });
      map[groupId.toString()] = bannedByMessageId;
    });
    return map;
  }, [groupIds, parsedChatInfos, recentMessageBanData, recentMessagesByGroup]);

  const classifierContracts = useMemo(() => {
    const contracts: Array<{
      groupId: bigint;
      kind: ClassifierKind;
      contract: {
        address: `0x${string}`;
        abi:
          | typeof TokenMainManagerAbi
          | typeof TokenGovManagerAbi
          | typeof TokenActionMainManagerAbi
          | typeof TokenActionGovManagerAbi;
        functionName: 'tokenOfGroup' | 'actionOfGroup';
        args: [bigint];
      };
    }> = [];

    groupIds.forEach((groupId) => {
      if (TOKEN_MAIN_MANAGER_ADDRESS) {
        contracts.push({
          groupId,
          kind: 'token-community',
          contract: {
            address: TOKEN_MAIN_MANAGER_ADDRESS,
            abi: TokenMainManagerAbi,
            functionName: 'tokenOfGroup',
            args: [groupId],
          },
        });
      }
      if (TOKEN_GOV_MANAGER_ADDRESS) {
        contracts.push({
          groupId,
          kind: 'token-gov',
          contract: {
            address: TOKEN_GOV_MANAGER_ADDRESS,
            abi: TokenGovManagerAbi,
            functionName: 'tokenOfGroup',
            args: [groupId],
          },
        });
      }
      if (TOKEN_ACTION_MAIN_MANAGER_ADDRESS) {
        contracts.push({
          groupId,
          kind: 'action',
          contract: {
            address: TOKEN_ACTION_MAIN_MANAGER_ADDRESS,
            abi: TokenActionMainManagerAbi,
            functionName: 'actionOfGroup',
            args: [groupId],
          },
        });
      }
      if (TOKEN_ACTION_GOV_MANAGER_ADDRESS) {
        contracts.push({
          groupId,
          kind: 'action-gov',
          contract: {
            address: TOKEN_ACTION_GOV_MANAGER_ADDRESS,
            abi: TokenActionGovManagerAbi,
            functionName: 'actionOfGroup',
            args: [groupId],
          },
        });
      }
    });

    return contracts;
  }, [groupIds]);

  const {
    data: classifierData,
    isPending: rawIsPendingClassifiers,
    error: classifierError,
    refetch: refetchClassifiers,
  } = useUniversalReadContracts({
    contracts: classifierContracts.map((item) => item.contract) as any,
    query: {
      enabled: classifierContracts.length > 0,
    },
  });
  const shouldReadClassifiers = classifierContracts.length > 0;
  const isPendingClassifiers = shouldReadClassifiers ? rawIsPendingClassifiers : false;

  const classificationByGroup = useMemo(() => {
    const map: Record<
      string,
      { kind: GroupChatKind; tokenAddress?: `0x${string}`; actionId?: bigint }
    > = {};

    classifierContracts.forEach((meta, index) => {
      const key = meta.groupId.toString();
      if (map[key]) return;

      const result = resultAt(classifierData as readonly ReadContractResult[] | undefined, index);
      if (meta.kind === 'token-community' || meta.kind === 'token-gov') {
        if (isNonZeroAddress(result)) {
          map[key] = { kind: meta.kind, tokenAddress: result };
        }
        return;
      }

      const tuple = result as (Record<string, unknown> & readonly unknown[]) | undefined;
      const tokenAddress = normalizeAddress(tuple?.token ?? tuple?.[0]);
      const actionId = safeToBigInt(tuple?.actionId ?? tuple?.[1]);
      if (isNonZeroAddress(tokenAddress)) {
        map[key] = { kind: meta.kind, tokenAddress, actionId };
      }
    });

    return map;
  }, [classifierContracts, classifierData]);

  const tokenAddresses = useMemo(
    () =>
      uniqueAddresses(
        Object.values(classificationByGroup).map((item) => item.tokenAddress),
      ),
    [classificationByGroup],
  );
  const symbolContracts = useMemo(
    () =>
      tokenAddresses.map((tokenAddress) => ({
        address: tokenAddress,
        abi: LOVE20TokenAbi,
        functionName: 'symbol' as const,
        args: [],
      })),
    [tokenAddresses],
  );
  const { data: symbolData, refetch: refetchSymbols } = useUniversalReadContracts({
    contracts: symbolContracts as any,
    query: {
      enabled: symbolContracts.length > 0,
    },
  });

  const symbolByToken = useMemo(() => {
    const map: Record<string, string> = {};
    tokenAddresses.forEach((tokenAddress, index) => {
      const value = resultAt(symbolData as readonly ReadContractResult[] | undefined, index);
      const fallback = addressesEqual(tokenAddress, currentToken?.address) ? currentToken?.symbol : undefined;
      map[tokenAddress.toLowerCase()] = typeof value === 'string' && value ? value : fallback || abbreviateAddress(tokenAddress);
    });
    return map;
  }, [currentToken?.address, currentToken?.symbol, symbolData, tokenAddresses]);

  const actionInfoRefs = useMemo(() => {
    const seen = new Set<string>();
    const refs: Array<{ tokenAddress: `0x${string}`; actionId: bigint; key: string }> = [];

    Object.values(classificationByGroup).forEach((item) => {
      if ((item.kind !== 'action' && item.kind !== 'action-gov') || !item.tokenAddress || item.actionId === undefined) return;
      const key = `${item.tokenAddress.toLowerCase()}:${item.actionId.toString()}`;
      if (seen.has(key)) return;
      seen.add(key);
      refs.push({ tokenAddress: item.tokenAddress, actionId: item.actionId, key });
    });

    return refs;
  }, [classificationByGroup]);
  const actionInfoContracts = useMemo(
    () =>
      actionInfoRefs.map((item) => ({
        address: (SUBMIT_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
        abi: LOVE20SubmitAbi,
        functionName: 'actionInfo' as const,
        args: [item.tokenAddress, item.actionId],
      })),
    [actionInfoRefs],
  );
  const shouldReadActionInfos = !!SUBMIT_ADDRESS && actionInfoContracts.length > 0;
  const { data: actionInfoData, isPending: rawIsPendingActionInfos, error: actionInfoError, refetch: refetchActionInfos } =
    useUniversalReadContracts({
      contracts: actionInfoContracts as any,
      query: {
        enabled: shouldReadActionInfos,
      },
    });
  const isPendingActionInfos = shouldReadActionInfos ? rawIsPendingActionInfos : false;
  const actionTitleByTokenAndId = useMemo(() => {
    const map: Record<string, string> = {};
    actionInfoRefs.forEach((item, index) => {
      map[item.key] = actionInfoTitle(resultAt(actionInfoData as readonly ReadContractResult[] | undefined, index));
    });
    return map;
  }, [actionInfoData, actionInfoRefs]);

  const items = useMemo<GroupChatListItem[]>(() => {
    return groupIds.map((groupId, index) => {
      const key = groupId.toString();
      const info = parsedChatInfos[index];
      const ownerManagerKind = managerKindByOwner(info?.owner);
      const classification = classificationByGroup[key] || {
        kind: ownerManagerKind || (info ? 'chain-service' : 'unknown'),
      };
      const tokenSymbol = classification.tokenAddress
        ? symbolByToken[classification.tokenAddress.toLowerCase()] ||
          (addressesEqual(classification.tokenAddress, currentToken?.address) ? currentToken?.symbol : undefined)
        : undefined;
      const actionTitle =
        classification.tokenAddress && classification.actionId !== undefined
          ? actionTitleByTokenAndId[`${classification.tokenAddress.toLowerCase()}:${classification.actionId.toString()}`]
          : undefined;
      const groupName = groupNames[key] || `${GROUP_NAME_UNKNOWN} #${groupId}`;
      const meta = metaByGroup[key] || { title: '', description: '' };

      const base = {
        groupId,
        kind: classification.kind,
        typeLabel: typeLabel(classification.kind),
        meta,
        groupName,
        tokenAddress: classification.tokenAddress,
        tokenSymbol,
        actionId: classification.actionId,
        actionTitle,
        info,
        messagesCount: messagesCountByGroup[key] || BigInt(0),
        latestMentionMeMessageId: latestMentionMeByGroup[key] || BigInt(0),
        latestMentionAllMessageId: latestMentionAllByGroup[key] || BigInt(0),
        latestMessage: latestMessageByGroup[key],
        latestMessageBanned: latestMessageBannedByGroup[key] || false,
        recentMessages: recentMessagesByGroup[key] || [],
        recentBannedMessageIds: recentBannedMessageIdsByGroup[key] || {},
        latestVisibleMentionMeMessageId: BigInt(0),
        latestVisibleMentionAllMessageId: BigInt(0),
      };

      const latestVisibleMentionMeMessageId = base.recentMessages.reduce(
        (latest, message) =>
          !base.recentBannedMessageIds[message.messageId.toString()] &&
          defaultGroupId &&
          message.mentionedSenderIds.some((senderId) => senderId === defaultGroupId) &&
          message.messageId > latest
            ? message.messageId
            : latest,
        BigInt(0),
      );
      const latestVisibleMentionAllMessageId = base.recentMessages.reduce(
        (latest, message) =>
          !base.recentBannedMessageIds[message.messageId.toString()] && message.mentionAll && message.messageId > latest
            ? message.messageId
            : latest,
        BigInt(0),
      );

      return {
        ...base,
        latestVisibleMentionMeMessageId,
        latestVisibleMentionAllMessageId,
        title: buildChatTitle({
          ...base,
          meta: info && !ownerManagerKind ? meta : { ...meta, title: '' },
          groupName: info && !ownerManagerKind ? groupName : undefined,
        }),
      };
    });
  }, [
    actionTitleByTokenAndId,
    classificationByGroup,
    currentToken?.address,
    currentToken?.symbol,
    defaultGroupId,
    groupIds,
    groupNames,
    latestMessageByGroup,
    latestMessageBannedByGroup,
    latestMentionAllByGroup,
    latestMentionMeByGroup,
    metaByGroup,
    messagesCountByGroup,
    parsedChatInfos,
    recentBannedMessageIdsByGroup,
    recentMessagesByGroup,
    symbolByToken,
  ]);

  return {
    items,
    groupIdsCount,
    isPending:
      isPendingCount ||
      isPendingGroupIds ||
      isPendingGroupNames ||
      isPendingDefaultGroup ||
      isPendingInfos ||
      isPendingMessageCounts ||
      isPendingLatestMentionMe ||
      isPendingLatestMentionAll ||
      isPendingLatestMessages ||
      isPendingLatestMessageBans ||
      isPendingRecentMessages ||
      isPendingRecentMessageBans ||
      isPendingClassifiers ||
      isPendingActionInfos,
    error:
      countError ||
      groupIdsError ||
      infoError ||
      messageCountError ||
      latestMentionMeError ||
      latestMentionAllError ||
      latestMessageError ||
      latestMessageBanError ||
      recentMessageError ||
      recentMessageBanError ||
      classifierError ||
      actionInfoError,
    refetch: () => {
      refetchCount();
      refetchGroupIds();
      refetchGroupNames();
      refetchDefaultGroup();
      refetchInfos();
      refetchMessageCounts();
      refetchLatestMentionMe();
      refetchLatestMentionAll();
      refetchLatestMessages();
      refetchLatestMessageBans();
      refetchRecentMessages();
      refetchRecentMessageBans();
      refetchClassifiers();
      refetchSymbols();
      refetchActionInfos();
    },
  };
}

export function useGroupChatRoomData(
  groupId: bigint | undefined,
  account: `0x${string}` | undefined,
  limit: number = 100,
): GroupChatRoomData {
  const { chatInfo: rawInfo, isPending: isPendingInfo, error: infoError, refetch: refetchInfo } = useGroupChatInfo(groupId);
  const chatInfo = useMemo(() => parseGroupChatInfo(rawInfo), [rawInfo]);
  const meta = useMemo<ParsedGroupChatMeta>(() => ({ title: '', description: '' }), []);
  const { messagesCount, isPending: isPendingCount, error: countError, refetch: refetchCount } =
    useGroupChatMessagesCount(groupId);
  const limitBigInt = BigInt(limit);
  const offset = messagesCount && messagesCount > limitBigInt ? messagesCount - limitBigInt : BigInt(0);
  const readLimit =
    messagesCount === undefined ? BigInt(0) : messagesCount > limitBigInt ? limitBigInt : messagesCount;
  const {
    messages: rawMessages,
    isPending: isPendingMessages,
    error: messagesError,
    refetch: refetchMessages,
  } = useGroupChatMessages(groupId, offset, readLimit, false, readLimit > BigInt(0));
  const messages = useMemo(
    () => rawMessages.map((message) => parseGroupChatMessage(message)).filter((message): message is ParsedGroupChatMessage => !!message),
    [rawMessages],
  );
  const loadedMessageIds = useMemo(() => new Set(messages.map((message) => message.messageId.toString())), [messages]);
  const quotedMessageIds = useMemo(
    () =>
      uniqueBigInts(
        messages
          .map((message) => message.quotedMessageId)
          .filter((messageId) => messageId > BigInt(0) && !loadedMessageIds.has(messageId.toString())),
      ).slice(0, 20),
    [loadedMessageIds, messages],
  );
  const quotedMessageContracts = useMemo(
    () =>
      groupId
        ? quotedMessageIds.map((messageId) => ({
            address: GROUP_CHAT_CONTRACT_ADDRESS,
            abi: GroupChatAbi,
            functionName: 'message' as const,
            args: [groupId, messageId],
          }))
        : [],
    [groupId, quotedMessageIds],
  );
  const { data: quotedMessageData, isPending: isPendingQuotedMessages, refetch: refetchQuotedMessages } =
    useUniversalReadContracts({
      contracts: quotedMessageContracts as any,
      query: { enabled: isGroupChatEnabled && quotedMessageContracts.length > 0 },
    });
  const quotedMessages = useMemo(() => {
    const map: Record<string, ParsedGroupChatMessage> = {};
    messages.forEach((message) => {
      map[message.messageId.toString()] = message;
    });
    quotedMessageIds.forEach((messageId, index) => {
      const parsed = parseGroupChatMessage(
        resultAt(quotedMessageData as readonly ReadContractResult[] | undefined, index),
      );
      if (parsed) map[messageId.toString()] = parsed;
    });
    return map;
  }, [messages, quotedMessageData, quotedMessageIds]);
  const shouldReadMessageBans = Boolean(
    groupId &&
    chatInfo?.banSource &&
    chatInfo.banSource.toLowerCase() !== ZERO_ADDRESS &&
    messages.length > 0,
  );
  const banContracts = useMemo(
    () =>
      shouldReadMessageBans && groupId && chatInfo?.banSource
        ? messages.map((message) => ({
            address: chatInfo.banSource,
            abi: POST_BAN_SOURCE_ABI,
            functionName: 'isBanned',
            args: [groupId, message.senderId, message.senderAddress],
          }))
        : [],
    [chatInfo?.banSource, groupId, messages, shouldReadMessageBans],
  );
  const { data: messageBanData, isPending: isPendingMessageBans, refetch: refetchMessageBans } =
    useUniversalReadContracts({
      contracts: banContracts,
      query: { enabled: shouldReadMessageBans && banContracts.length > 0 },
    });
  const bannedMessageIds = useMemo(() => {
    const map: Record<string, boolean> = {};
    messages.forEach((message, index) => {
      map[message.messageId.toString()] = Boolean(
        resultAt(messageBanData as readonly ReadContractResult[] | undefined, index),
      );
    });
    return map;
  }, [messageBanData, messages]);

  const { defaultGroup, defaultGroupId, defaultGroupName, hasDefaultGroup, isPending: isPendingDefaultGroup } =
    useDefaultGroupOf(account, !!account);
  const { canPost, reasonCode, isPending: isPendingCanPost, error: canPostError, refetch: refetchCanPost } =
    useGroupChatCanPost(groupId, defaultGroupId, account, !!account && hasDefaultGroup);
  const isMessageFeedPending = isPendingCount || (readLimit > BigInt(0) && isPendingMessages);

  const senderIds = useMemo(
    () =>
      uniqueBigInts([
        groupId,
        defaultGroupId,
        ...messages.flatMap((message) => [message.senderId, ...message.mentionedSenderIds]),
        ...Object.values(quotedMessages).flatMap((message) => [message.senderId, ...message.mentionedSenderIds]),
      ]),
    [defaultGroupId, groupId, messages, quotedMessages],
  );
  const { groupNames, isPending: isPendingNames, refetch: refetchNames } = useGroupNames(senderIds);

  return {
    groupId,
    chatInfo,
    meta,
    groupName: groupId ? groupNames[groupId.toString()] || `${GROUP_NAME_UNKNOWN} #${groupId}` : '',
    messagesCount,
    messages,
    quotedMessages,
    bannedMessageIds,
    senderNames: groupNames,
    defaultSenderId: defaultGroup?.groupId || defaultGroupId,
    defaultSenderName: defaultGroupName || (defaultGroupId ? groupNames[defaultGroupId.toString()] : '') || '',
    hasDefaultSender: hasDefaultGroup,
    isDefaultSenderPending: isPendingDefaultGroup,
    canPost,
    canPostReasonCode: reasonCode,
    isMessageFeedPending,
    isPending:
      isPendingInfo ||
      isPendingCount ||
      isPendingMessages ||
      isPendingQuotedMessages ||
      isPendingDefaultGroup ||
      isPendingCanPost ||
      isPendingNames ||
      isPendingMessageBans,
    error: infoError || countError || messagesError || canPostError,
    refetch: () => {
      refetchInfo();
      refetchCount();
      refetchMessages();
      refetchQuotedMessages();
      refetchMessageBans();
      refetchCanPost();
      refetchNames();
    },
  };
}

export function useGroupChatManagedTitle(
  groupId: bigint | undefined,
  currentToken?: Pick<Token, 'address' | 'symbol'> | null,
) {
  const classifierContracts = useMemo(() => {
    if (!groupId) return [];

    const contracts: Array<{
      kind: ClassifierKind;
      contract: {
        address: `0x${string}`;
        abi:
          | typeof TokenMainManagerAbi
          | typeof TokenGovManagerAbi
          | typeof TokenActionMainManagerAbi
          | typeof TokenActionGovManagerAbi;
        functionName: 'tokenOfGroup' | 'actionOfGroup';
        args: [bigint];
      };
    }> = [];

    if (TOKEN_MAIN_MANAGER_ADDRESS) {
      contracts.push({
        kind: 'token-community',
        contract: {
          address: TOKEN_MAIN_MANAGER_ADDRESS,
          abi: TokenMainManagerAbi,
          functionName: 'tokenOfGroup',
          args: [groupId],
        },
      });
    }
    if (TOKEN_GOV_MANAGER_ADDRESS) {
      contracts.push({
        kind: 'token-gov',
        contract: {
          address: TOKEN_GOV_MANAGER_ADDRESS,
          abi: TokenGovManagerAbi,
          functionName: 'tokenOfGroup',
          args: [groupId],
        },
      });
    }
    if (TOKEN_ACTION_MAIN_MANAGER_ADDRESS) {
      contracts.push({
        kind: 'action',
        contract: {
          address: TOKEN_ACTION_MAIN_MANAGER_ADDRESS,
          abi: TokenActionMainManagerAbi,
          functionName: 'actionOfGroup',
          args: [groupId],
        },
      });
    }
    if (TOKEN_ACTION_GOV_MANAGER_ADDRESS) {
      contracts.push({
        kind: 'action-gov',
        contract: {
          address: TOKEN_ACTION_GOV_MANAGER_ADDRESS,
          abi: TokenActionGovManagerAbi,
          functionName: 'actionOfGroup',
          args: [groupId],
        },
      });
    }

    return contracts;
  }, [groupId]);

  const shouldReadClassifiers = classifierContracts.length > 0;
  const {
    data: classifierData,
    isPending: rawIsPendingClassifiers,
    error: classifierError,
    refetch: refetchClassifiers,
  } = useUniversalReadContracts({
    contracts: classifierContracts.map((item) => item.contract) as any,
    query: { enabled: shouldReadClassifiers },
  });
  const isPendingClassifiers = shouldReadClassifiers ? rawIsPendingClassifiers : false;

  const classification = useMemo(() => {
    for (let index = 0; index < classifierContracts.length; index++) {
      const meta = classifierContracts[index];
      const result = resultAt(classifierData as readonly ReadContractResult[] | undefined, index);

      if (meta.kind === 'token-community' || meta.kind === 'token-gov') {
        if (isNonZeroAddress(result)) {
          return { kind: meta.kind, tokenAddress: result };
        }
        continue;
      }

      const tuple = result as (Record<string, unknown> & readonly unknown[]) | undefined;
      const tokenAddress = normalizeAddress(tuple?.token ?? tuple?.[0]);
      const actionId = safeToBigInt(tuple?.actionId ?? tuple?.[1]);
      if (isNonZeroAddress(tokenAddress)) {
        return { kind: meta.kind, tokenAddress, actionId };
      }
    }

    return undefined;
  }, [classifierContracts, classifierData]);

  const shouldReadSymbol = !!classification?.tokenAddress;
  const {
    data: symbolData,
    isPending: rawIsPendingSymbol,
    error: symbolError,
    refetch: refetchSymbol,
  } = useUniversalReadContracts({
    contracts: classification?.tokenAddress
      ? [
          {
            address: classification.tokenAddress,
            abi: LOVE20TokenAbi,
            functionName: 'symbol' as const,
            args: [],
          },
        ]
      : [],
    query: { enabled: shouldReadSymbol },
  });
  const tokenSymbol = useMemo(() => {
    const tokenAddress = classification?.tokenAddress;
    if (!tokenAddress) return undefined;
    const value = resultAt(symbolData as readonly ReadContractResult[] | undefined, 0);
    const fallback = addressesEqual(tokenAddress, currentToken?.address) ? currentToken?.symbol : undefined;
    return typeof value === 'string' && value ? value : fallback || abbreviateAddress(tokenAddress);
  }, [classification?.tokenAddress, currentToken?.address, currentToken?.symbol, symbolData]);

  const shouldReadActionInfo =
    !!SUBMIT_ADDRESS &&
    !!classification?.tokenAddress &&
    classification.actionId !== undefined &&
    (classification.kind === 'action' || classification.kind === 'action-gov');
  const {
    data: actionInfoData,
    isPending: rawIsPendingActionInfo,
    error: actionInfoError,
    refetch: refetchActionInfo,
  } = useUniversalReadContracts({
    contracts: shouldReadActionInfo
      ? [
          {
            address: (SUBMIT_ADDRESS || ZERO_ADDRESS) as `0x${string}`,
            abi: LOVE20SubmitAbi,
            functionName: 'actionInfo' as const,
            args: [classification.tokenAddress, classification.actionId],
          },
        ]
      : [],
    query: { enabled: shouldReadActionInfo },
  });
  const actionTitle = useMemo(
    () => actionInfoTitle(resultAt(actionInfoData as readonly ReadContractResult[] | undefined, 0)),
    [actionInfoData],
  );

  const title = useMemo(() => {
    if (!classification || !groupId) return undefined;
    return buildChatTitle({
      groupId,
      kind: classification.kind,
      tokenAddress: classification.tokenAddress,
      tokenSymbol,
      actionId: classification.actionId,
      actionTitle,
    });
  }, [actionTitle, classification, groupId, tokenSymbol]);

  return {
    title,
    classification,
    isPending: isPendingClassifiers || (shouldReadSymbol ? rawIsPendingSymbol : false) || (shouldReadActionInfo ? rawIsPendingActionInfo : false),
    error: classifierError || symbolError || actionInfoError,
    refetch: () => {
      refetchClassifiers();
      refetchSymbol();
      refetchActionInfo();
    },
  };
}

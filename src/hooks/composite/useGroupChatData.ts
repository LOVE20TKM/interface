import { useEffect, useMemo, useState } from 'react';

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
  type GroupChatRoomAccountData,
  type GroupChatRoomPublicData,
  type ParsedGroupChatInfo,
  type ParsedGroupChatMessage,
  type ReadContractResult,
} from './groupChatDataTypes';

export {
  parseGroupChatInfo,
  parseGroupChatMessage,
  type GroupChatKind,
  type GroupChatListItem,
  type GroupChatRoomAccountData,
  type GroupChatRoomPublicData,
  type ParsedGroupChatInfo,
  type ParsedGroupChatMessage,
} from './groupChatDataTypes';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
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
const MANAGER_CHAT_INFO_CACHE_PREFIX = 'love20:group-chat:manager-info';
const CHAIN_CACHE_KEY = process.env.NEXT_PUBLIC_CHAIN || 'unknown-chain';
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

function messageSenderKey(senderId: bigint, senderAddress: `0x${string}`) {
  return `${senderId.toString()}:${senderAddress.toLowerCase()}`;
}

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

function managerChatInfoCacheKey(groupId: bigint) {
  return `${MANAGER_CHAT_INFO_CACHE_PREFIX}:${CHAIN_CACHE_KEY}:${GROUP_CHAT_CONTRACT_ADDRESS.toLowerCase()}:${groupId.toString()}`;
}

function serializeGroupChatInfo(info: ParsedGroupChatInfo) {
  return {
    groupId: info.groupId.toString(),
    owner: info.owner,
    activated: info.activated,
    postingAllowed: info.postingAllowed,
    scopeSource: info.scopeSource,
    banSource: info.banSource,
    beforePostPlugin: info.beforePostPlugin,
    afterPostPlugin: info.afterPostPlugin,
    firstActivatedOwner: info.firstActivatedOwner,
    firstActivatedBlockNumber: info.firstActivatedBlockNumber.toString(),
    firstActivatedTimestamp: info.firstActivatedTimestamp.toString(),
  };
}

function parseCachedGroupChatInfo(raw: string | null): ParsedGroupChatInfo | undefined {
  if (!raw) return undefined;
  try {
    const item = JSON.parse(raw);
    const info = parseGroupChatInfo({
      ...item,
      groupId: item?.groupId,
      firstActivatedBlockNumber: item?.firstActivatedBlockNumber,
      firstActivatedTimestamp: item?.firstActivatedTimestamp,
    });
    return info && managerKindByOwner(info.owner) ? info : undefined;
  } catch {
    return undefined;
  }
}

function readCachedManagerChatInfos(groupIds: readonly bigint[]) {
  if (typeof window === 'undefined') return {};
  const map: Record<string, ParsedGroupChatInfo> = {};
  groupIds.forEach((groupId) => {
    const cached = parseCachedGroupChatInfo(window.localStorage.getItem(managerChatInfoCacheKey(groupId)));
    if (cached) map[groupId.toString()] = cached;
  });
  return map;
}

function writeCachedManagerChatInfo(info: ParsedGroupChatInfo) {
  if (typeof window === 'undefined' || !managerKindByOwner(info.owner)) return;
  window.localStorage.setItem(managerChatInfoCacheKey(info.groupId), JSON.stringify(serializeGroupChatInfo(info)));
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
  const groupIdsCacheKey = useMemo(() => groupIds.map((groupId) => groupId.toString()).join(','), [groupIds]);
  const [cachedManagerChatInfos, setCachedManagerChatInfos] = useState<Record<string, ParsedGroupChatInfo>>({});
  const [cacheReadyKey, setCacheReadyKey] = useState('');

  const { defaultGroupId, hasDefaultGroup, isPending: isPendingDefaultGroup, refetch: refetchDefaultGroup } =
    useDefaultGroupOf(account, !!account);

  useEffect(() => {
    setCachedManagerChatInfos(readCachedManagerChatInfos(groupIds));
    setCacheReadyKey(groupIdsCacheKey);
  }, [groupIdsCacheKey]);

  const isCacheReady = cacheReadyKey === groupIdsCacheKey;
  const uncachedInfoGroupIds = useMemo(
    () =>
      isCacheReady
        ? groupIds.filter((groupId) => !cachedManagerChatInfos[groupId.toString()])
        : [],
    [cachedManagerChatInfos, groupIds, isCacheReady],
  );
  const {
    chatInfos,
    isPending: rawIsPendingInfos,
    error: infoError,
    refetch: refetchInfos,
  } = useGroupChatInfos(uncachedInfoGroupIds, isGroupChatEnabled && isCacheReady && uncachedInfoGroupIds.length > 0);
  const isPendingInfos = isCacheReady && uncachedInfoGroupIds.length > 0 ? rawIsPendingInfos : !isCacheReady;
  const parsedChatInfos = useMemo(() => {
    const liveInfosByGroup: Record<string, ParsedGroupChatInfo | undefined> = {};
    uncachedInfoGroupIds.forEach((groupId, index) => {
      liveInfosByGroup[groupId.toString()] = parseGroupChatInfo(chatInfos[index]);
    });
    return groupIds.map((groupId) => cachedManagerChatInfos[groupId.toString()] || liveInfosByGroup[groupId.toString()]);
  }, [cachedManagerChatInfos, chatInfos, groupIds, uncachedInfoGroupIds]);

  useEffect(() => {
    const nextCachedInfos: Record<string, ParsedGroupChatInfo> = {};
    parsedChatInfos.forEach((info) => {
      if (!info || !managerKindByOwner(info.owner)) return;
      writeCachedManagerChatInfo(info);
      nextCachedInfos[info.groupId.toString()] = info;
    });
    if (Object.keys(nextCachedInfos).length === 0) return;
    setCachedManagerChatInfos((prev) => {
      let changed = false;
      const next = { ...prev };
      Object.entries(nextCachedInfos).forEach(([key, info]) => {
        const previous = prev[key];
        if (
          previous?.owner === info.owner &&
          previous?.firstActivatedBlockNumber === info.firstActivatedBlockNumber &&
          previous?.postingAllowed === info.postingAllowed &&
          previous?.scopeSource === info.scopeSource &&
          previous?.banSource === info.banSource &&
          previous?.beforePostPlugin === info.beforePostPlugin &&
          previous?.afterPostPlugin === info.afterPostPlugin
        ) {
          return;
        }
        next[key] = info;
        changed = true;
      });
      return changed ? next : prev;
    });
  }, [parsedChatInfos]);

  const groupNameIds = useMemo(
    () => groupIds.filter((_, index) => !managerKindByOwner(parsedChatInfos[index]?.owner)),
    [groupIds, parsedChatInfos],
  );
  const { groupNames, isPending: isPendingGroupNames, refetch: refetchGroupNames } = useGroupNames(
    groupNameIds,
    groupNameIds.length > 0,
  );

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

    groupIds.forEach((groupId, index) => {
      const ownerKind = managerKindByOwner(parsedChatInfos[index]?.owner);
      if (ownerKind === 'token-community' && TOKEN_MAIN_MANAGER_ADDRESS) {
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
      if (ownerKind === 'token-gov' && TOKEN_GOV_MANAGER_ADDRESS) {
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
      if (ownerKind === 'action' && TOKEN_ACTION_MAIN_MANAGER_ADDRESS) {
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
      if (ownerKind === 'action-gov' && TOKEN_ACTION_GOV_MANAGER_ADDRESS) {
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
  }, [groupIds, parsedChatInfos]);

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

      const base = {
        groupId,
        kind: classification.kind,
        typeLabel: typeLabel(classification.kind),
        groupName,
        tokenAddress: classification.tokenAddress,
        tokenSymbol,
        actionId: classification.actionId,
        actionTitle,
        info,
        messagesCount: messagesCountByGroup[key] || BigInt(0),
        latestMentionMeMessageId: latestMentionMeByGroup[key] || BigInt(0),
        latestMentionAllMessageId: latestMentionAllByGroup[key] || BigInt(0),
      };

      return {
        ...base,
        title: buildChatTitle({
          ...base,
          groupName: info && !ownerManagerKind ? groupName : undefined,
        }),
      };
    });
  }, [
    actionTitleByTokenAndId,
    classificationByGroup,
    currentToken?.address,
    currentToken?.symbol,
    groupIds,
    groupNames,
    latestMentionAllByGroup,
    latestMentionMeByGroup,
    messagesCountByGroup,
    parsedChatInfos,
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
      isPendingClassifiers ||
      isPendingActionInfos,
    error:
      countError ||
      groupIdsError ||
      infoError ||
      messageCountError ||
      latestMentionMeError ||
      latestMentionAllError ||
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
      refetchClassifiers();
      refetchSymbols();
      refetchActionInfos();
    },
  };
}

export function useGroupChatRoomPublicData(
  groupId: bigint | undefined,
  limit: number = 100,
): GroupChatRoomPublicData {
  const { chatInfo: rawInfo, isPending: isPendingInfo, error: infoError, refetch: refetchInfo } = useGroupChatInfo(groupId);
  const chatInfo = useMemo(() => parseGroupChatInfo(rawInfo), [rawInfo]);
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
  const messageSenders = useMemo(() => {
    const seen = new Set<string>();
    return messages.filter((message) => {
      const key = messageSenderKey(message.senderId, message.senderAddress);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [messages]);
  const shouldReadMessageBans = Boolean(
    groupId &&
    chatInfo?.banSource &&
    chatInfo.banSource.toLowerCase() !== ZERO_ADDRESS &&
    messageSenders.length > 0,
  );
  const banContracts = useMemo(
    () =>
      shouldReadMessageBans && groupId && chatInfo?.banSource
        ? messageSenders.map((sender) => ({
            address: chatInfo.banSource,
            abi: POST_BAN_SOURCE_ABI,
            functionName: 'isBanned',
            args: [groupId, sender.senderId, sender.senderAddress],
          }))
        : [],
    [chatInfo?.banSource, groupId, messageSenders, shouldReadMessageBans],
  );
  const { data: messageBanData, isPending: isPendingMessageBans, refetch: refetchMessageBans } =
    useUniversalReadContracts({
      contracts: banContracts,
      query: { enabled: shouldReadMessageBans && banContracts.length > 0 },
    });
  const bannedSenderMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    messageSenders.forEach((sender, index) => {
      map[messageSenderKey(sender.senderId, sender.senderAddress)] = Boolean(
        resultAt(messageBanData as readonly ReadContractResult[] | undefined, index),
      );
    });
    return map;
  }, [messageBanData, messageSenders]);
  const bannedMessageIds = useMemo(() => {
    const map: Record<string, boolean> = {};
    messages.forEach((message) => {
      map[message.messageId.toString()] = bannedSenderMap[messageSenderKey(message.senderId, message.senderAddress)] === true;
    });
    return map;
  }, [bannedSenderMap, messages]);
  const isMessageFeedPending = isPendingCount || (readLimit > BigInt(0) && isPendingMessages);

  const senderIds = useMemo(
    () =>
      uniqueBigInts([
        groupId,
        ...messages.flatMap((message) => [message.senderId, ...message.mentionedSenderIds]),
        ...Object.values(quotedMessages).flatMap((message) => [message.senderId, ...message.mentionedSenderIds]),
      ]),
    [groupId, messages, quotedMessages],
  );
  const { groupNames, isPending: isPendingNames, refetch: refetchNames } = useGroupNames(senderIds);

  return {
    groupId,
    chatInfo,
    groupName: groupId ? groupNames[groupId.toString()] || `${GROUP_NAME_UNKNOWN} #${groupId}` : '',
    messagesCount,
    messages,
    quotedMessages,
    bannedMessageIds,
    senderNames: groupNames,
    isMessageFeedPending,
    isPending:
      isPendingInfo ||
      isPendingCount ||
      isPendingMessages ||
      isPendingQuotedMessages ||
      isPendingNames ||
      isPendingMessageBans,
    error: infoError || countError || messagesError,
    refetch: () => {
      refetchInfo();
      refetchCount();
      refetchMessages();
      refetchQuotedMessages();
      refetchMessageBans();
      refetchNames();
    },
  };
}

export function useGroupChatRoomAccountData(
  groupId: bigint | undefined,
  account: `0x${string}` | undefined,
  senderNames: Record<string, string> = {},
): GroupChatRoomAccountData {
  const { defaultGroup, defaultGroupId, defaultGroupName, hasDefaultGroup, isPending: isPendingDefaultGroup, refetch: refetchDefaultGroup } =
    useDefaultGroupOf(account, !!account);
  const { canPost, reasonCode, isPending: isPendingCanPost, error: canPostError, refetch: refetchCanPost } =
    useGroupChatCanPost(groupId, defaultGroupId, account, !!account && hasDefaultGroup);
  const effectiveDefaultSenderId = defaultGroup?.groupId || defaultGroupId;

  return {
    defaultSenderId: effectiveDefaultSenderId,
    defaultSenderName: defaultGroupName || (effectiveDefaultSenderId ? senderNames[effectiveDefaultSenderId.toString()] : '') || '',
    hasDefaultSender: hasDefaultGroup,
    isDefaultSenderPending: isPendingDefaultGroup,
    canPost,
    canPostReasonCode: reasonCode,
    isPending: isPendingDefaultGroup || isPendingCanPost,
    error: canPostError,
    refetch: () => {
      refetchDefaultGroup();
      refetchCanPost();
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

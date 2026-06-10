import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAccount } from 'wagmi';
import { useQueryClient, type QueryClient, type QueryKey } from '@tanstack/react-query';

import { GroupChatAbi } from '@/src/abis/GroupChat';
import {
  GROUP_CHAT_CONTRACT_ADDRESS,
  isGroupChatEnabled,
} from '@/src/hooks/contracts/useGroupChat';
import { useDefaultGroupOf } from '@/src/hooks/extension/base/contracts/useGroupDefaults';
import { safeToBigInt } from '@/src/lib/clientUtils';
import { readContractsInBatchesWithRetry } from '@/src/lib/readContractsInBatches';
import {
  CACHED_GROUP_SETS_CHANGED_EVENT,
  CACHED_GROUP_SETS_STORAGE_KEY,
  FOLLOWED_GROUPS_CHANGED_EVENT,
  OWNED_CHAIN_GROUPS_CHANGED_EVENT,
  READ_CURSORS_CHANGED_EVENT,
  READ_CURSORS_STORAGE_KEY,
} from '@/src/components/Chat/chatConstants';
import {
  cachedGroupSetsScopePrefix,
  readFollowedGroupIds,
  readOwnedChainGroupIds,
} from '@/src/components/Chat/chatStorage';

export type GroupChatWatchSource = 'active-chat' | 'inbox-visible' | 'followed' | 'mentioned' | 'manual-follow';
export type GroupChatSyncStatus = 'idle' | 'refreshing' | 'error' | 'disabled';
export type GroupChatSyncFrequency = 'high' | 'medium' | 'low';
export type GroupChatSyncScope = 'page' | 'background';
export type GroupChatBadgeType = 'mention-me' | 'mention-all' | 'unread' | 'intro-dot' | 'none';

export type GroupChatSyncState = {
  groupId: bigint | undefined;
  latestMessageId: bigint | undefined;
  messagesCount: bigint | undefined;
  mentionMeCount: bigint | undefined;
  mentionAllCount: bigint | undefined;
  unreadCount: bigint;
  unreadMentionMeCount: bigint;
  unreadMentionAllCount: bigint;
  hasNewMessage: boolean;
  lastSeenMessageId: bigint | undefined;
  lastCheckedAt: number | undefined;
};

type GroupChatCountSnapshot = {
  messagesCount: bigint;
  mentionMeCount?: bigint;
  mentionAllCount?: bigint;
  updatedAt: number;
};

type StoredGroupChatCountSnapshot = {
  messagesCount?: string;
  mentionMeCount?: string;
  mentionAllCount?: string;
  updatedAt?: number;
};

type SourceRegistration = {
  scope: GroupChatSyncScope;
  frequency: GroupChatSyncFrequency;
  groupIds: bigint[];
};

type GroupChatRegisterOptions = {
  source: string;
  scope: GroupChatSyncScope;
  frequency: GroupChatSyncFrequency;
  groupIds: readonly bigint[];
  refreshOnRegister?: boolean;
};

type GroupChatSyncContextValue = {
  status: GroupChatSyncStatus;
  activeGroupId: bigint | undefined;
  registerGroups: (options: GroupChatRegisterOptions) => () => void;
  registerWatchedGroups: (groupIds: readonly bigint[], source: GroupChatWatchSource) => () => void;
  registerActiveChat: (groupId: bigint | undefined) => () => void;
  markGroupRead: (groupId: bigint, latestMessageId: bigint | undefined) => void;
  refreshGroup: (groupId: bigint) => Promise<void>;
  refreshGroups: (groupIds: readonly bigint[]) => Promise<void>;
  refreshAll: () => Promise<void>;
  getGroupState: (groupId: bigint | undefined) => GroupChatSyncState;
  unreadSummary: {
    totalUnread: bigint;
    totalMentionMe: bigint;
    totalMentionAll: bigint;
    badgeType: GroupChatBadgeType;
    badgeCount: bigint;
    badgeLabel: string;
    latestGroupId: bigint | undefined;
    groupsWithUnread: bigint[];
  };
};

type CountReadKind = 'messages' | 'mention-me' | 'mention-all';

const EMPTY_STATE: GroupChatSyncState = {
  groupId: undefined,
  latestMessageId: undefined,
  messagesCount: undefined,
  mentionMeCount: undefined,
  mentionAllCount: undefined,
  unreadCount: BigInt(0),
  unreadMentionMeCount: BigInt(0),
  unreadMentionAllCount: BigInt(0),
  hasNewMessage: false,
  lastSeenMessageId: undefined,
  lastCheckedAt: undefined,
};

const FREQUENCY_MS: Record<GroupChatSyncFrequency, number> = {
  high: 20 * 1000,
  medium: 60 * 1000,
  low: 3 * 60 * 1000,
};
const FREQUENCY_RANK: Record<GroupChatSyncFrequency, number> = {
  low: 1,
  medium: 2,
  high: 3,
};
const SYNC_TICK_MS = 5 * 1000;
const REFRESH_DEBOUNCE_MS = 600;
const ROOM_QUERY_FUNCTIONS = new Set([
  'chatInfo',
  'message',
  'messageIdsByMention',
  'messageIdsByMentionAll',
  'messageIdsBySender',
  'messages',
  'messagesByMention',
  'messagesByMentionAll',
  'messagesByMentionAllCount',
  'messagesByMentionCount',
  'messagesByRound',
  'messagesByRoundCount',
  'messagesBySender',
  'messagesBySenderCount',
  'messagesCount',
]);
const COUNT_BASELINES_STORAGE_KEY = 'love20-chat:count-baselines:v1';

function uniquePositiveGroupIds(groupIds: readonly (bigint | undefined)[]) {
  const seen = new Set<string>();
  return groupIds.filter((groupId): groupId is bigint => {
    if (!groupId || groupId <= BigInt(0)) return false;
    const key = groupId.toString();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function groupIdsFromKey(groupIdsKey: string) {
  return groupIdsKey ? groupIdsKey.split(',').map((groupId) => BigInt(groupId)) : [];
}

function sameGroupIds(left: readonly bigint[], right: readonly bigint[]) {
  if (left.length !== right.length) return false;
  return left.every((groupId, index) => groupId === right[index]);
}

function sortGroupIds(groupIds: readonly bigint[]) {
  return [...groupIds].sort((left, right) => {
    if (left === right) return 0;
    return left < right ? -1 : 1;
  });
}

function filterCountsByGroupKeys(
  countsByGroup: Record<string, GroupChatCountSnapshot>,
  groupKeys: Set<string>,
) {
  return Object.fromEntries(
    Object.entries(countsByGroup).filter(([key]) => groupKeys.has(key)),
  );
}

function watchedGroupKeysFromRegistrations(registrations: Record<string, SourceRegistration>) {
  const watchedKeys = new Set<string>();
  Object.values(registrations).forEach((registration) => {
    registration.groupIds.forEach((groupId) => watchedKeys.add(groupId.toString()));
  });
  return watchedKeys;
}

function groupKey(groupId: bigint | undefined) {
  return groupId && groupId > BigInt(0) ? groupId.toString() : undefined;
}

function maxBigInt(left: bigint, right: bigint) {
  return left > right ? left : right;
}

function snapshotFromStored(value: StoredGroupChatCountSnapshot | undefined): GroupChatCountSnapshot | undefined {
  if (!value) return undefined;
  return {
    messagesCount: safeToBigInt(value.messagesCount),
    mentionMeCount: value.mentionMeCount === undefined ? undefined : safeToBigInt(value.mentionMeCount),
    mentionAllCount: value.mentionAllCount === undefined ? undefined : safeToBigInt(value.mentionAllCount),
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : 0,
  };
}

function serializeSnapshot(value: GroupChatCountSnapshot): StoredGroupChatCountSnapshot {
  return {
    messagesCount: value.messagesCount.toString(),
    ...(value.mentionMeCount === undefined ? {} : { mentionMeCount: value.mentionMeCount.toString() }),
    ...(value.mentionAllCount === undefined ? {} : { mentionAllCount: value.mentionAllCount.toString() }),
    updatedAt: value.updatedAt,
  };
}

function readCursorMap() {
  if (typeof window === 'undefined') return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(READ_CURSORS_STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? Object.fromEntries(Object.entries(parsed).map(([key, value]) => [String(key), String(value)]))
      : {};
  } catch {
    return {};
  }
}

function writeCursor(groupId: bigint, latestMessageId: bigint | undefined) {
  if (typeof window === 'undefined') return;
  const key = groupId.toString();
  const cursor = latestMessageId && latestMessageId > BigInt(0) ? latestMessageId : BigInt(0);
  const cursors = readCursorMap();
  const previous = safeToBigInt(cursors[key]);
  if (cursor <= previous) return;
  window.localStorage.setItem(READ_CURSORS_STORAGE_KEY, JSON.stringify({ ...cursors, [key]: cursor.toString() }));
  window.dispatchEvent(new Event(READ_CURSORS_CHANGED_EVENT));
}

function readSeenMessageId(groupId: bigint | undefined) {
  const key = groupKey(groupId);
  return key ? safeToBigInt(readCursorMap()[key]) : BigInt(0);
}

function readCachedBackgroundGroupIds(account: `0x${string}` | undefined) {
  if (typeof window === 'undefined') return [];
  const groupIds: bigint[] = [
    ...readFollowedGroupIds(account).map((groupId) => safeToBigInt(groupId)),
    ...readOwnedChainGroupIds(account).map((groupId) => safeToBigInt(groupId)),
  ];
  const cacheScopePrefix = cachedGroupSetsScopePrefix(account);

  try {
    const parsed = JSON.parse(window.localStorage.getItem(CACHED_GROUP_SETS_STORAGE_KEY) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return uniquePositiveGroupIds(groupIds);
    }

    Object.entries(parsed).forEach(([cacheKey, item]) => {
      if (!cacheKey.startsWith(cacheScopePrefix)) return;
      if (!item || typeof item !== 'object' || Array.isArray(item)) return;
      const record = item as Record<string, unknown>;
      [record.recommendedGroupIds].forEach((rawGroupIds) => {
        if (!Array.isArray(rawGroupIds)) return;
        groupIds.push(...rawGroupIds.map((groupId) => safeToBigInt(groupId)));
      });
    });
  } catch {
    return uniquePositiveGroupIds(groupIds);
  }

  return uniquePositiveGroupIds(groupIds);
}

function hasCachedGroupIds(account: `0x${string}` | undefined) {
  if (typeof window === 'undefined') return true;
  const cacheScopePrefix = cachedGroupSetsScopePrefix(account);
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CACHED_GROUP_SETS_STORAGE_KEY) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;
    return Object.entries(parsed).some(([cacheKey, item]) => {
      if (!cacheKey.startsWith(cacheScopePrefix)) return false;
      if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
      const record = item as Record<string, unknown>;
      return [record.recommendedGroupIds].some((groupIds) => {
        return Array.isArray(groupIds) && uniquePositiveGroupIds(groupIds.map((groupId) => safeToBigInt(groupId))).length > 0;
      });
    });
  } catch {
    return false;
  }
}

function hasAnyCachedGroupSet(account: `0x${string}` | undefined) {
  if (typeof window === 'undefined') return true;
  return readFollowedGroupIds(account).length > 0 ||
    readOwnedChainGroupIds(account).length > 0 ||
    hasCachedGroupIds(account);
}

function scopedStorageKey(base: string, account: `0x${string}` | undefined, defaultSenderId: bigint | undefined) {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || process.env.NEXT_PUBLIC_CHAIN || 'unknown-chain';
  const accountKey = account?.toLowerCase() || 'anonymous';
  const senderKey = defaultSenderId && defaultSenderId > BigInt(0) ? defaultSenderId.toString() : '0';
  return `${base}:${chainId}:${GROUP_CHAT_CONTRACT_ADDRESS.toLowerCase()}:${accountKey}:${senderKey}`;
}

function readStoredBaselines(storageKey: string) {
  if (typeof window === 'undefined') return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed)
        .map(([key, value]) => [key, snapshotFromStored(value as StoredGroupChatCountSnapshot)])
        .filter((entry): entry is [string, GroupChatCountSnapshot] => !!entry[1]),
    );
  } catch {
    return {};
  }
}

function writeStoredBaselines(storageKey: string, baselines: Record<string, GroupChatCountSnapshot>) {
  if (typeof window === 'undefined') return;
  const serialized = Object.fromEntries(
    Object.entries(baselines).map(([key, value]) => [key, serializeSnapshot(value)]),
  );
  window.localStorage.setItem(storageKey, JSON.stringify(serialized));
}

function readContractQueryMatchesGroupChat(value: unknown, groupId: bigint): boolean {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  const address = typeof item.address === 'string' ? item.address.toLowerCase() : '';
  const functionName = typeof item.functionName === 'string' ? item.functionName : '';
  const args = Array.isArray(item.args) ? item.args : undefined;

  if (
    address === GROUP_CHAT_CONTRACT_ADDRESS.toLowerCase() &&
    ROOM_QUERY_FUNCTIONS.has(functionName) &&
    safeToBigInt(args?.[0]) === groupId
  ) {
    return true;
  }

  return Object.values(item).some((child) => {
    if (Array.isArray(child)) {
      return child.some((entry) => readContractQueryMatchesGroupChat(entry, groupId));
    }
    return readContractQueryMatchesGroupChat(child, groupId);
  });
}

export function invalidateGroupChatQueries(queryClient: QueryClient, groupId: bigint) {
  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey as QueryKey;
      return (
        Array.isArray(key) &&
        (key[0] === 'readContract' || key[0] === 'readContracts') &&
        readContractQueryMatchesGroupChat(key, groupId)
      );
    },
  });
}

const GroupChatSyncContext = createContext<GroupChatSyncContextValue | undefined>(undefined);

export function GroupChatSyncProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { address: account } = useAccount();
  const accountAddress = account as `0x${string}` | undefined;
  const { defaultGroupId } = useDefaultGroupOf(accountAddress, !!accountAddress);
  const [registrations, setRegistrations] = useState<Record<string, SourceRegistration>>({});
  const [statesByGroup, setStatesByGroup] = useState<Record<string, GroupChatSyncState>>({});
  const [baselinesByGroup, setBaselinesByGroup] = useState<Record<string, GroupChatCountSnapshot>>({});
  const [activeGroupId, setActiveGroupId] = useState<bigint | undefined>();
  const [status, setStatus] = useState<GroupChatSyncStatus>(isGroupChatEnabled ? 'idle' : 'disabled');
  const [hasCachedGroups, setHasCachedGroups] = useState(true);
  const registrationsRef = useRef(registrations);
  const statesRef = useRef(statesByGroup);
  const baselinesRef = useRef(baselinesByGroup);
  const activeGroupIdRef = useRef(activeGroupId);
  const refreshTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const refreshRunningRef = useRef(false);
  const queuedRefreshGroupIdsRef = useRef<Set<string>>(new Set());
  const lastFinishedByGroupRef = useRef<Record<string, number>>({});
  const watchedGroupKeysRef = useRef<Set<string>>(new Set());
  const storageKey = useMemo(
    () => scopedStorageKey(COUNT_BASELINES_STORAGE_KEY, accountAddress, defaultGroupId),
    [accountAddress, defaultGroupId],
  );

  const pruneUnwatchedRefreshState = useCallback((watchedKeys: Set<string>) => {
    Object.keys(lastFinishedByGroupRef.current).forEach((key) => {
      if (!watchedKeys.has(key)) {
        delete lastFinishedByGroupRef.current[key];
      }
    });

    Object.entries(refreshTimersRef.current).forEach(([key, timer]) => {
      if (!watchedKeys.has(key)) {
        clearTimeout(timer);
        delete refreshTimersRef.current[key];
      }
    });

    queuedRefreshGroupIdsRef.current.forEach((key) => {
      if (!watchedKeys.has(key)) {
        queuedRefreshGroupIdsRef.current.delete(key);
      }
    });
  }, []);

  const applyWatchedGroupKeys = useCallback((watchedKeys: Set<string>) => {
    watchedGroupKeysRef.current = watchedKeys;
    pruneUnwatchedRefreshState(watchedKeys);
  }, [pruneUnwatchedRefreshState]);

  useEffect(() => {
    statesRef.current = statesByGroup;
  }, [statesByGroup]);

  useEffect(() => {
    baselinesRef.current = baselinesByGroup;
  }, [baselinesByGroup]);

  useEffect(() => {
    activeGroupIdRef.current = activeGroupId;
  }, [activeGroupId]);

  useEffect(() => {
    setBaselinesByGroup(readStoredBaselines(storageKey));
    setHasCachedGroups(hasAnyCachedGroupSet(accountAddress));
  }, [accountAddress, storageKey]);

  const watchedGroups = useMemo(() => {
    const map: Record<string, { groupId: bigint; frequency: GroupChatSyncFrequency }> = {};
    Object.values(registrations).forEach((registration) => {
      registration.groupIds.forEach((groupId) => {
        const key = groupId.toString();
        const current = map[key];
        if (!current || FREQUENCY_RANK[registration.frequency] > FREQUENCY_RANK[current.frequency]) {
          map[key] = { groupId, frequency: registration.frequency };
        }
      });
    });
    return map;
  }, [registrations]);

  const watchedGroupIds = useMemo(
    () => Object.values(watchedGroups).map((item) => item.groupId),
    [watchedGroups],
  );

  useEffect(() => {
    const watchedKeys = watchedGroupKeysFromRegistrations(registrationsRef.current);
    setStatesByGroup((previousStates) => {
      let changed = false;
      const nextStates: Record<string, GroupChatSyncState> = {};
      Object.entries(previousStates).forEach(([key, state]) => {
        if (watchedKeys.has(key)) {
          nextStates[key] = state;
        } else {
          changed = true;
        }
      });
      return changed ? nextStates : previousStates;
    });
  }, [registrations]);

  const scheduleGroupRefresh = useCallback((groupId: bigint) => {
    const key = groupId.toString();
    if (!watchedGroupKeysRef.current.has(key)) return;
    if (refreshTimersRef.current[key]) clearTimeout(refreshTimersRef.current[key]);
    refreshTimersRef.current[key] = setTimeout(() => {
      delete refreshTimersRef.current[key];
      if (!watchedGroupKeysRef.current.has(key)) return;
      invalidateGroupChatQueries(queryClient, groupId);
    }, REFRESH_DEBOUNCE_MS);
  }, [queryClient]);

  const updateStatesFromCounts = useCallback((countsByGroup: Record<string, GroupChatCountSnapshot>) => {
    const watchedCountsByGroup = filterCountsByGroupKeys(countsByGroup, watchedGroupKeysRef.current);
    if (Object.keys(watchedCountsByGroup).length === 0) return;

    const now = Date.now();
    setBaselinesByGroup((previousBaselines) => {
      const nextBaselines = { ...previousBaselines };
      let baselinesChanged = false;

      Object.entries(watchedCountsByGroup).forEach(([key, counts]) => {
        if (nextBaselines[key]) return;
        nextBaselines[key] = counts;
        baselinesChanged = true;
      });

      if (baselinesChanged) {
        writeStoredBaselines(storageKey, nextBaselines);
      }
      return baselinesChanged ? nextBaselines : previousBaselines;
    });

    setStatesByGroup((previousStates) => {
      const baselineRef = baselinesRef.current;
      const nextStates = { ...previousStates };

      Object.entries(watchedCountsByGroup).forEach(([key, counts]) => {
        const baseline = baselineRef[key] || counts;
        const baselineMentionMeCount = baseline.mentionMeCount ?? counts.mentionMeCount ?? BigInt(0);
        const baselineMentionAllCount = baseline.mentionAllCount ?? counts.mentionAllCount ?? BigInt(0);
        const unreadCount = counts.messagesCount > baseline.messagesCount
          ? counts.messagesCount - baseline.messagesCount
          : BigInt(0);
        const unreadMentionMeCount = counts.mentionMeCount !== undefined && counts.mentionMeCount > baselineMentionMeCount
          ? counts.mentionMeCount - baselineMentionMeCount
          : BigInt(0);
        const unreadMentionAllCount = counts.mentionAllCount !== undefined && counts.mentionAllCount > baselineMentionAllCount
          ? counts.mentionAllCount - baselineMentionAllCount
          : BigInt(0);

        nextStates[key] = {
          groupId: BigInt(key),
          latestMessageId: counts.messagesCount > BigInt(0) ? counts.messagesCount : undefined,
          messagesCount: counts.messagesCount,
          mentionMeCount: counts.mentionMeCount ?? BigInt(0),
          mentionAllCount: counts.mentionAllCount ?? BigInt(0),
          unreadCount,
          unreadMentionMeCount,
          unreadMentionAllCount,
          hasNewMessage: unreadCount > BigInt(0) || unreadMentionMeCount > BigInt(0) || unreadMentionAllCount > BigInt(0),
          lastSeenMessageId: baseline.messagesCount,
          lastCheckedAt: now,
        };
      });

      return nextStates;
    });
  }, [storageKey]);

  const runRefresh = useCallback(async (rawGroupIds: readonly bigint[]) => {
    if (!isGroupChatEnabled || rawGroupIds.length === 0) return;
    const groupIds = uniquePositiveGroupIds(rawGroupIds)
      .filter((groupId) => watchedGroupKeysRef.current.has(groupId.toString()));
    if (groupIds.length === 0) return;

    if (refreshRunningRef.current) {
      groupIds.forEach((groupId) => queuedRefreshGroupIdsRef.current.add(groupId.toString()));
      return;
    }

    refreshRunningRef.current = true;
    setStatus('refreshing');

    try {
      const entries: Array<{
        contract: any;
        resultIndex: number;
        meta: { groupId: bigint; kind: CountReadKind };
      }> = [];

      groupIds.forEach((groupId, index) => {
        entries.push({
          resultIndex: index * 3,
          meta: { groupId, kind: 'messages' },
          contract: {
            address: GROUP_CHAT_CONTRACT_ADDRESS,
            abi: GroupChatAbi,
            functionName: 'messagesCount',
            args: [groupId],
          },
        });

        entries.push({
          resultIndex: index * 3 + 1,
          meta: { groupId, kind: 'mention-all' },
          contract: {
            address: GROUP_CHAT_CONTRACT_ADDRESS,
            abi: GroupChatAbi,
            functionName: 'messagesByMentionAllCount',
            args: [groupId],
          },
        });

        if (defaultGroupId && defaultGroupId > BigInt(0)) {
          entries.push({
            resultIndex: index * 3 + 2,
            meta: { groupId, kind: 'mention-me' },
            contract: {
              address: GROUP_CHAT_CONTRACT_ADDRESS,
              abi: GroupChatAbi,
              functionName: 'messagesByMentionCount',
              args: [groupId, defaultGroupId],
            },
          });
        }
      });

      const { results } = await readContractsInBatchesWithRetry(entries, { batchSize: 30 });
      const nextCountsByGroup: Record<string, GroupChatCountSnapshot> = {};
      const previousStates = statesRef.current;
      const watchedKeys = watchedGroupKeysRef.current;
      const now = Date.now();

      groupIds.forEach((groupId, index) => {
        const key = groupId.toString();
        if (!watchedKeys.has(key)) return;
        const previous = previousStates[key];
        nextCountsByGroup[key] = {
          messagesCount: previous?.messagesCount || BigInt(0),
          mentionAllCount: previous?.mentionAllCount || BigInt(0),
          mentionMeCount: defaultGroupId && defaultGroupId > BigInt(0) ? previous?.mentionMeCount || BigInt(0) : BigInt(0),
          updatedAt: now,
        };

        const messagesResult = results[index * 3];
        if (messagesResult?.status === 'success') {
          nextCountsByGroup[key].messagesCount = safeToBigInt(messagesResult.result);
        }

        const mentionAllResult = results[index * 3 + 1];
        if (mentionAllResult?.status === 'success') {
          nextCountsByGroup[key].mentionAllCount = safeToBigInt(mentionAllResult.result);
        }

        const mentionMeResult = results[index * 3 + 2];
        if (mentionMeResult?.status === 'success') {
          nextCountsByGroup[key].mentionMeCount = safeToBigInt(mentionMeResult.result);
        }
      });

      updateStatesFromCounts(nextCountsByGroup);
      const finishedAt = Date.now();
      groupIds.forEach((groupId) => {
        const key = groupId.toString();
        if (!watchedKeys.has(key)) return;
        lastFinishedByGroupRef.current[key] = finishedAt;
        if (activeGroupIdRef.current === groupId) {
          const previousCount = previousStates[key]?.messagesCount || BigInt(0);
          if (nextCountsByGroup[key]?.messagesCount > previousCount) {
            scheduleGroupRefresh(groupId);
          }
        }
      });
      setStatus('idle');
    } catch (error) {
      console.warn('GroupChat count refresh failed:', error);
      setStatus('error');
    } finally {
      refreshRunningRef.current = false;
      const queuedGroupIds = Array.from(queuedRefreshGroupIdsRef.current)
        .filter((key) => watchedGroupKeysRef.current.has(key))
        .map((key) => BigInt(key));
      queuedRefreshGroupIdsRef.current.clear();
      if (queuedGroupIds.length > 0) {
        runRefresh(queuedGroupIds);
      }
    }
  }, [defaultGroupId, scheduleGroupRefresh, updateStatesFromCounts]);

  const refreshGroups = useCallback(async (groupIds: readonly bigint[]) => {
    await runRefresh(groupIds);
  }, [runRefresh]);

  const refreshGroup = useCallback(async (groupId: bigint) => {
    await runRefresh([groupId]);
  }, [runRefresh]);

  const refreshAll = useCallback(async () => {
    await runRefresh(Object.values(watchedGroups).map((item) => item.groupId));
  }, [runRefresh, watchedGroups]);

  const registerGroups = useCallback((options: GroupChatRegisterOptions) => {
    const groupIds = sortGroupIds(uniquePositiveGroupIds(options.groupIds));
    const registrationKey = `${options.scope}:${options.source}`;
    const current = registrationsRef.current[registrationKey];
    const registrationChanged =
      !current ||
      current.scope !== options.scope ||
      current.frequency !== options.frequency ||
      !sameGroupIds(current.groupIds, groupIds);

    const nextRegistrationsForRef = { ...registrationsRef.current };
    if (groupIds.length === 0) {
      delete nextRegistrationsForRef[registrationKey];
    } else {
      nextRegistrationsForRef[registrationKey] = {
        scope: options.scope,
        frequency: options.frequency,
        groupIds,
      };
    }
    registrationsRef.current = nextRegistrationsForRef;
    applyWatchedGroupKeys(watchedGroupKeysFromRegistrations(nextRegistrationsForRef));

    setRegistrations((previous) => {
      if (groupIds.length === 0) {
        const next = { ...previous };
        delete next[registrationKey];
        return next;
      }
      const current = previous[registrationKey];
      if (
        current &&
        current.scope === options.scope &&
        current.frequency === options.frequency &&
        sameGroupIds(current.groupIds, groupIds)
      ) {
        return previous;
      }
      return {
        ...previous,
        [registrationKey]: {
          scope: options.scope,
          frequency: options.frequency,
          groupIds,
        },
      };
    });

    if (groupIds.length > 0 && registrationChanged && options.refreshOnRegister !== false) {
      runRefresh(groupIds);
    }

    return () => {
      const nextRegistrations = { ...registrationsRef.current };
      delete nextRegistrations[registrationKey];
      registrationsRef.current = nextRegistrations;
      applyWatchedGroupKeys(watchedGroupKeysFromRegistrations(nextRegistrations));

      setRegistrations((previous) => {
        if (!previous[registrationKey]) return previous;
        const next = { ...previous };
        delete next[registrationKey];
        return next;
      });
    };
  }, [applyWatchedGroupKeys, runRefresh]);

  useEffect(() => {
    const syncCachedBackgroundGroups = () => {
      setHasCachedGroups(hasAnyCachedGroupSet(accountAddress));
      const cachedGroupIds = readCachedBackgroundGroupIds(accountAddress);
      registerGroups({
        source: 'cached-background',
        scope: 'background',
        frequency: 'low',
        groupIds: cachedGroupIds,
        refreshOnRegister: false,
      });
    };

    syncCachedBackgroundGroups();
    window.addEventListener('storage', syncCachedBackgroundGroups);
    window.addEventListener(FOLLOWED_GROUPS_CHANGED_EVENT, syncCachedBackgroundGroups);
    window.addEventListener(OWNED_CHAIN_GROUPS_CHANGED_EVENT, syncCachedBackgroundGroups);
    window.addEventListener(CACHED_GROUP_SETS_CHANGED_EVENT, syncCachedBackgroundGroups);
    return () => {
      window.removeEventListener('storage', syncCachedBackgroundGroups);
      window.removeEventListener(FOLLOWED_GROUPS_CHANGED_EVENT, syncCachedBackgroundGroups);
      window.removeEventListener(OWNED_CHAIN_GROUPS_CHANGED_EVENT, syncCachedBackgroundGroups);
      window.removeEventListener(CACHED_GROUP_SETS_CHANGED_EVENT, syncCachedBackgroundGroups);
    };
  }, [accountAddress, registerGroups]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!isGroupChatEnabled || refreshRunningRef.current) return;
      const now = Date.now();
      const dueGroupIds = Object.values(watchedGroups)
        .filter(({ groupId, frequency }) => {
          const key = groupId.toString();
          const lastFinishedAt = lastFinishedByGroupRef.current[key] || 0;
          return now - lastFinishedAt >= FREQUENCY_MS[frequency];
        })
        .map((item) => item.groupId);
      if (dueGroupIds.length > 0) {
        runRefresh(dueGroupIds);
      }
    }, SYNC_TICK_MS);

    return () => window.clearInterval(interval);
  }, [runRefresh, watchedGroups]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshAll();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshAll]);

  useEffect(
    () => () => {
      Object.values(refreshTimersRef.current).forEach((timer) => clearTimeout(timer));
      refreshTimersRef.current = {};
    },
    [],
  );

  const registerWatchedGroups = useCallback((groupIds: readonly bigint[], source: GroupChatWatchSource) => {
    return registerGroups({
      source,
      scope: 'page',
      frequency: 'medium',
      groupIds,
    });
  }, [registerGroups]);

  const registerActiveChat = useCallback((groupId: bigint | undefined) => {
    if (!groupId || groupId <= BigInt(0)) return () => {};
    setActiveGroupId(groupId);
    const unregister = registerGroups({
      source: 'active-chat',
      scope: 'page',
      frequency: 'high',
      groupIds: [groupId],
    });
    return () => {
      unregister();
      setActiveGroupId((current) => (current === groupId ? undefined : current));
    };
  }, [registerGroups]);

  const markGroupRead = useCallback((groupId: bigint, latestMessageId: bigint | undefined) => {
    const cursor = latestMessageId && latestMessageId > BigInt(0) ? latestMessageId : undefined;
    if (cursor === undefined) return;

    writeCursor(groupId, cursor);
    const key = groupId.toString();
    const current = statesRef.current[key];
    const previousBaseline = baselinesRef.current[key];
    const nextMessagesBaseline = maxBigInt(previousBaseline?.messagesCount || BigInt(0), cursor);
    const canMarkMentionRead =
      current?.messagesCount !== undefined &&
      current.messagesCount <= cursor;
    const nextBaseline: GroupChatCountSnapshot = {
      messagesCount: nextMessagesBaseline,
      mentionMeCount: canMarkMentionRead ? current?.mentionMeCount ?? previousBaseline?.mentionMeCount : previousBaseline?.mentionMeCount,
      mentionAllCount: canMarkMentionRead ? current?.mentionAllCount ?? previousBaseline?.mentionAllCount : previousBaseline?.mentionAllCount,
      updatedAt: Date.now(),
    };

    setBaselinesByGroup((previous) => {
      const existing = previous[key];
      if (
        existing?.messagesCount === nextBaseline.messagesCount &&
        existing?.mentionMeCount === nextBaseline.mentionMeCount &&
        existing?.mentionAllCount === nextBaseline.mentionAllCount
      ) {
        return previous;
      }

      const next = { ...previous, [key]: nextBaseline };
      writeStoredBaselines(storageKey, next);
      return next;
    });

    setStatesByGroup((previous) => {
      const previousState = previous[key];
      const unreadCount = BigInt(0);
      const unreadMentionMeCount = canMarkMentionRead ? BigInt(0) : previousState?.unreadMentionMeCount || BigInt(0);
      const unreadMentionAllCount = canMarkMentionRead ? BigInt(0) : previousState?.unreadMentionAllCount || BigInt(0);

      const nextState: GroupChatSyncState = {
        ...(previousState || EMPTY_STATE),
        groupId,
        latestMessageId: nextBaseline.messagesCount > BigInt(0) ? nextBaseline.messagesCount : undefined,
        messagesCount: nextBaseline.messagesCount,
        mentionMeCount: nextBaseline.mentionMeCount ?? previousState?.mentionMeCount,
        mentionAllCount: nextBaseline.mentionAllCount ?? previousState?.mentionAllCount,
        lastSeenMessageId: nextBaseline.messagesCount,
        unreadCount,
        unreadMentionMeCount,
        unreadMentionAllCount,
        hasNewMessage: unreadCount > BigInt(0) || unreadMentionMeCount > BigInt(0) || unreadMentionAllCount > BigInt(0),
        lastCheckedAt: Date.now(),
      };

      if (
        previousState?.latestMessageId === nextState.latestMessageId &&
        previousState?.messagesCount === nextState.messagesCount &&
        previousState?.mentionMeCount === nextState.mentionMeCount &&
        previousState?.mentionAllCount === nextState.mentionAllCount &&
        previousState?.lastSeenMessageId === nextState.lastSeenMessageId &&
        previousState?.unreadCount === nextState.unreadCount &&
        previousState?.unreadMentionMeCount === nextState.unreadMentionMeCount &&
        previousState?.unreadMentionAllCount === nextState.unreadMentionAllCount &&
        previousState?.hasNewMessage === nextState.hasNewMessage
      ) {
        return previous;
      }

      return { ...previous, [key]: nextState };
    });
  }, [storageKey]);

  const getGroupState = useCallback((groupId: bigint | undefined): GroupChatSyncState => {
    const key = groupKey(groupId);
    if (!key) return EMPTY_STATE;
    return statesRef.current[key] || {
      ...EMPTY_STATE,
      groupId,
      lastSeenMessageId: readSeenMessageId(groupId),
    };
  }, []);

  const unreadSummary = useMemo(() => {
    const watchedKeys = new Set(Object.keys(watchedGroups));
    const unreadStates = Object.values(statesByGroup).filter(
      (state) => state.groupId && watchedKeys.has(state.groupId.toString()),
    );
    const totalMentionMe = unreadStates.reduce((total, state) => total + state.unreadMentionMeCount, BigInt(0));
    const totalMentionAll = unreadStates.reduce((total, state) => total + state.unreadMentionAllCount, BigInt(0));
    const totalUnread = unreadStates.reduce((total, state) => total + state.unreadCount, BigInt(0));
    const badgeCount = totalMentionMe > BigInt(0)
      ? totalMentionMe
      : totalMentionAll > BigInt(0)
        ? totalMentionAll
        : totalUnread;
    const badgeType: GroupChatBadgeType = totalMentionMe > BigInt(0)
      ? 'mention-me'
      : totalMentionAll > BigInt(0)
        ? 'mention-all'
        : totalUnread > BigInt(0)
          ? 'unread'
          : !hasCachedGroups
            ? 'intro-dot'
            : 'none';

    return {
      totalUnread,
      totalMentionMe,
      totalMentionAll,
      badgeType,
      badgeCount,
      badgeLabel: badgeCount > BigInt(99) ? '99+' : badgeCount.toString(),
      latestGroupId: unreadStates
        .slice()
        .sort((left, right) => (right.lastCheckedAt || 0) - (left.lastCheckedAt || 0))[0]?.groupId,
      groupsWithUnread: unreadStates
        .filter((state) => state.unreadCount > BigInt(0) || state.unreadMentionMeCount > BigInt(0) || state.unreadMentionAllCount > BigInt(0))
        .map((state) => state.groupId)
        .filter((groupId): groupId is bigint => !!groupId),
    };
  }, [hasCachedGroups, statesByGroup, watchedGroups]);

  const value = useMemo<GroupChatSyncContextValue>(
    () => ({
      status,
      activeGroupId,
      registerGroups,
      registerWatchedGroups,
      registerActiveChat,
      markGroupRead,
      refreshGroup,
      refreshGroups,
      refreshAll,
      getGroupState,
      unreadSummary,
    }),
    [
      activeGroupId,
      getGroupState,
      markGroupRead,
      refreshAll,
      refreshGroup,
      refreshGroups,
      registerActiveChat,
      registerGroups,
      registerWatchedGroups,
      status,
      unreadSummary,
    ],
  );

  return (
    <GroupChatSyncContext.Provider value={value}>
      {children}
    </GroupChatSyncContext.Provider>
  );
}

function useGroupChatSyncContext() {
  const context = useContext(GroupChatSyncContext);
  if (!context) {
    throw new Error('GroupChatSyncProvider is required');
  }
  return context;
}

export function useRegisterWatchedGroups(groupIds: readonly (bigint | undefined)[], source: GroupChatWatchSource) {
  const { registerWatchedGroups } = useGroupChatSyncContext();
  const groupIdsKey = uniquePositiveGroupIds(groupIds).map((groupId) => groupId.toString()).join(',');

  useEffect(() => {
    return registerWatchedGroups(groupIdsFromKey(groupIdsKey), source);
  }, [groupIdsKey, registerWatchedGroups, source]);
}

export function useRegisterGroupChatGroups(options: {
  groupIds: readonly (bigint | undefined)[];
  source: string;
  scope: GroupChatSyncScope;
  frequency: GroupChatSyncFrequency;
}) {
  const { registerGroups } = useGroupChatSyncContext();
  const groupIdsKey = uniquePositiveGroupIds(options.groupIds).map((groupId) => groupId.toString()).join(',');

  useEffect(() => {
    return registerGroups({
      source: options.source,
      scope: options.scope,
      frequency: options.frequency,
      groupIds: groupIdsFromKey(groupIdsKey),
    });
  }, [groupIdsKey, options.frequency, options.scope, options.source, registerGroups]);
}

export function useRegisterActiveChat(groupId: bigint | undefined) {
  const { registerActiveChat } = useGroupChatSyncContext();
  const key = groupKey(groupId);

  useEffect(() => {
    return registerActiveChat(groupId);
  }, [groupId, key, registerActiveChat]);
}

export function useGroupChatSyncState(groupId: bigint | undefined) {
  const { getGroupState } = useGroupChatSyncContext();
  return getGroupState(groupId);
}

export function useGroupChatUnreadSummary() {
  const { unreadSummary } = useGroupChatSyncContext();
  return unreadSummary;
}

export function useMarkGroupRead() {
  const { markGroupRead } = useGroupChatSyncContext();
  return markGroupRead;
}

export function useRefreshGroupChatCounts() {
  const { refreshGroup, refreshGroups, refreshAll } = useGroupChatSyncContext();
  return { refreshGroup, refreshGroups, refreshAll };
}

import {
  CACHED_GROUP_SETS_CHANGED_EVENT,
  CACHED_GROUP_SETS_STORAGE_KEY,
  FOLLOWED_GROUPS_CHANGED_EVENT,
  FOLLOWED_GROUPS_STORAGE_KEY,
  MENTION_ALL_READ_CURSORS_CHANGED_EVENT,
  MENTION_ALL_READ_CURSORS_STORAGE_KEY,
  MESSAGE_PREFERENCES_STORAGE_KEY,
  OWNED_CHAIN_GROUPS_CHANGED_EVENT,
  OWNED_CHAIN_GROUPS_STORAGE_KEY,
  SELECTED_CHAT_SENDER_STORAGE_KEY,
} from './chatConstants';
import { GROUP_CHAT_CONTRACT_ADDRESS } from '@/src/hooks/contracts/useGroupChat';

type AccountAddress = `0x${string}` | undefined;
type TokenAddress = `0x${string}` | undefined;

export type CachedGroupSets = {
  recommendedGroupIds: string[];
  initializedAt: number;
  updatedAt: number;
};

export type MessagePreferences = {
  showBannedMessages: boolean;
  showMessageTimes: boolean;
};

export const DEFAULT_MESSAGE_PREFERENCES: MessagePreferences = {
  showBannedMessages: false,
  showMessageTimes: false,
};

export function readJsonArrayStorage(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

export function groupChatStorageScope(account: AccountAddress) {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || process.env.NEXT_PUBLIC_CHAIN || 'unknown-chain';
  const accountKey = account?.toLowerCase() || 'anonymous';
  return `${chainId}:${GROUP_CHAT_CONTRACT_ADDRESS.toLowerCase()}:${accountKey}`;
}

export function followedGroupsStorageKey(account: AccountAddress) {
  return `${FOLLOWED_GROUPS_STORAGE_KEY}:${groupChatStorageScope(account)}`;
}

export function ownedChainGroupsStorageKey(account: AccountAddress) {
  return `${OWNED_CHAIN_GROUPS_STORAGE_KEY}:${groupChatStorageScope(account)}`;
}

export function selectedChatSenderStorageKey(account: AccountAddress, groupId: bigint | undefined) {
  return `${SELECTED_CHAT_SENDER_STORAGE_KEY}:${groupChatStorageScope(account)}:${groupId?.toString() || 'no-group'}`;
}

export function cachedGroupSetsScopePrefix(account: AccountAddress) {
  return `${groupChatStorageScope(account)}:`;
}

export function cachedGroupSetsKey(account: AccountAddress, tokenAddress: TokenAddress) {
  return `${cachedGroupSetsScopePrefix(account)}${tokenAddress?.toLowerCase() || 'no-token'}`;
}

export function readFollowedGroupIds(account: AccountAddress) {
  if (!account) return [];
  return readJsonArrayStorage(followedGroupsStorageKey(account));
}

export function writeFollowedGroupIds(account: AccountAddress, groupIds: readonly string[]) {
  if (typeof window === 'undefined' || !account) return;
  window.localStorage.setItem(followedGroupsStorageKey(account), JSON.stringify(groupIds));
  window.dispatchEvent(new Event(FOLLOWED_GROUPS_CHANGED_EVENT));
}

export function followGroupId(account: AccountAddress, groupId: bigint | undefined) {
  if (typeof window === 'undefined' || !account || !groupId || groupId <= BigInt(0)) return;
  const key = groupId.toString();
  const current = readFollowedGroupIds(account);
  if (current.includes(key)) return;
  writeFollowedGroupIds(account, [key, ...current]);
}

export function readOwnedChainGroupIds(account: AccountAddress) {
  if (!account) return [];
  return readJsonArrayStorage(ownedChainGroupsStorageKey(account));
}

export function writeOwnedChainGroupIds(account: AccountAddress, groupIds: readonly string[]) {
  if (typeof window === 'undefined' || !account) return;
  window.localStorage.setItem(ownedChainGroupsStorageKey(account), JSON.stringify(groupIds));
  window.dispatchEvent(new Event(OWNED_CHAIN_GROUPS_CHANGED_EVENT));
}

export function readRecordStorage(key: string): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([entryKey, value]) => [String(entryKey), String(value)]),
    );
  } catch {
    return {};
  }
}

function safeStorageBigInt(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return BigInt(0);
  return BigInt(value);
}

export function readSelectedChatSenderId(account: AccountAddress, groupId: bigint | undefined) {
  if (typeof window === 'undefined' || !account || !groupId || groupId <= BigInt(0)) return undefined;
  return safeStorageBigInt(window.localStorage.getItem(selectedChatSenderStorageKey(account, groupId)) || undefined) || undefined;
}

export function writeSelectedChatSenderId(
  account: AccountAddress,
  groupId: bigint | undefined,
  senderId: bigint | undefined,
) {
  if (typeof window === 'undefined' || !account || !groupId || groupId <= BigInt(0)) return;
  const key = selectedChatSenderStorageKey(account, groupId);
  if (!senderId || senderId <= BigInt(0)) {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, senderId.toString());
}

export function mentionAllReadCursorsStorageKey(account: AccountAddress) {
  return `${MENTION_ALL_READ_CURSORS_STORAGE_KEY}:${groupChatStorageScope(account)}`;
}

export function readMentionAllReadCursors(account: AccountAddress) {
  return readRecordStorage(mentionAllReadCursorsStorageKey(account));
}

export function writeMentionAllReadCursor(
  account: AccountAddress,
  groupId: bigint | undefined,
  latestMessageId: bigint | undefined,
) {
  if (typeof window === 'undefined' || !groupId || groupId <= BigInt(0)) return;
  const key = groupId.toString();
  const cursor = latestMessageId && latestMessageId > BigInt(0) ? latestMessageId : BigInt(0);
  const cursors = readMentionAllReadCursors(account);
  if (cursor <= safeStorageBigInt(cursors[key])) return;
  window.localStorage.setItem(
    mentionAllReadCursorsStorageKey(account),
    JSON.stringify({ ...cursors, [key]: cursor.toString() }),
  );
  window.dispatchEvent(new Event(MENTION_ALL_READ_CURSORS_CHANGED_EVENT));
}

export function readCachedGroupSets(cacheKey: string): CachedGroupSets | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = JSON.parse(window.localStorage.getItem(CACHED_GROUP_SETS_STORAGE_KEY) || '{}');
    const item = raw?.[cacheKey];
    if (!item || typeof item !== 'object' || Array.isArray(item)) return undefined;
    return {
      recommendedGroupIds: Array.isArray(item.recommendedGroupIds)
        ? item.recommendedGroupIds.map((value: unknown) => String(value))
        : [],
      initializedAt: typeof item.initializedAt === 'number' ? item.initializedAt : 0,
      updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : 0,
    };
  } catch {
    return undefined;
  }
}

export function writeCachedGroupSets(cacheKey: string, value: Omit<CachedGroupSets, 'initializedAt' | 'updatedAt'>) {
  if (typeof window === 'undefined') return;
  try {
    const raw = JSON.parse(window.localStorage.getItem(CACHED_GROUP_SETS_STORAGE_KEY) || '{}');
    const previous = raw?.[cacheKey];
    const now = Date.now();
    window.localStorage.setItem(
      CACHED_GROUP_SETS_STORAGE_KEY,
      JSON.stringify({
        ...(raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}),
        [cacheKey]: {
          ...value,
          initializedAt: typeof previous?.initializedAt === 'number' ? previous.initializedAt : now,
          updatedAt: now,
        },
      }),
    );
    window.dispatchEvent(new Event(CACHED_GROUP_SETS_CHANGED_EVENT));
  } catch {
    window.localStorage.setItem(
      CACHED_GROUP_SETS_STORAGE_KEY,
      JSON.stringify({
        [cacheKey]: {
          ...value,
          initializedAt: Date.now(),
          updatedAt: Date.now(),
        },
      }),
    );
    window.dispatchEvent(new Event(CACHED_GROUP_SETS_CHANGED_EVENT));
  }
}

export function readMessagePreferences(): MessagePreferences {
  if (typeof window === 'undefined') return DEFAULT_MESSAGE_PREFERENCES;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(MESSAGE_PREFERENCES_STORAGE_KEY) || '{}');
    return {
      showBannedMessages: parsed?.showBannedMessages === true,
      showMessageTimes: parsed?.showMessageTimes === true,
    };
  } catch {
    return DEFAULT_MESSAGE_PREFERENCES;
  }
}

export function writeMessagePreferences(value: MessagePreferences) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(MESSAGE_PREFERENCES_STORAGE_KEY, JSON.stringify(value));
}

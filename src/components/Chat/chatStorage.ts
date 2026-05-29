import {
  CACHED_GROUP_SETS_CHANGED_EVENT,
  CACHED_GROUP_SETS_STORAGE_KEY,
  MESSAGE_PREFERENCES_STORAGE_KEY,
} from './chatConstants';

export type CachedGroupSets = {
  pinnedGroupIds: string[];
  myChainGroupIds: string[];
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

export function readCachedGroupSets(cacheKey: string): CachedGroupSets | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = JSON.parse(window.localStorage.getItem(CACHED_GROUP_SETS_STORAGE_KEY) || '{}');
    const item = raw?.[cacheKey];
    if (!item || typeof item !== 'object' || Array.isArray(item)) return undefined;
    return {
      pinnedGroupIds: Array.isArray(item.pinnedGroupIds) ? item.pinnedGroupIds.map((value: unknown) => String(value)) : [],
      myChainGroupIds: Array.isArray(item.myChainGroupIds) ? item.myChainGroupIds.map((value: unknown) => String(value)) : [],
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

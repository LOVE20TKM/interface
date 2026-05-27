import { MESSAGE_PREFERENCES_STORAGE_KEY } from './chatConstants';

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

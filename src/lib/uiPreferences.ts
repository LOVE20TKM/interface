const canUseStorage = () => typeof window !== 'undefined' && !!window.localStorage;

export const createBooleanPreference = (key: string, eventName: string, defaultValue: boolean) => ({
  get: () => {
    if (!canUseStorage()) return defaultValue;
    const value = window.localStorage.getItem(key);
    if (value === null) return defaultValue;
    return value === '1';
  },
  set: (enabled: boolean) => {
    if (!canUseStorage()) return;
    window.localStorage.setItem(key, enabled ? '1' : '0');
    window.dispatchEvent(new Event(eventName));
  },
  eventName,
});

export const assetProtectionPreference = createBooleanPreference(
  'love20:transfer:assetProtectionEnabled',
  'assetProtectionPreferenceChanged',
  true,
);

export const liquidityZapPreference = createBooleanPreference(
  'love20:dex:liquidityZapEnabled',
  'liquidityZapPreferenceChanged',
  false,
);

const BURN_ACTIVITY_NOTICE_STORAGE_KEY = 'love20:apps:newChainLaunchVisitedRound';
const LEGACY_NEW_CHAIN_LAUNCH_VISITED_KEY = 'love20:apps:newChainLaunchVisited';
const BURN_ACTIVITY_NOTICE_EVENT = 'burnActivityNoticeChanged';
export type BurnActivityNoticeMarker = bigint | 'pre-start' | 'ended';

export const burnActivityNoticePreference = {
  getMarker: (currentMarker?: BurnActivityNoticeMarker): BurnActivityNoticeMarker | undefined => {
    if (!canUseStorage()) return undefined;
    const value = window.localStorage.getItem(BURN_ACTIVITY_NOTICE_STORAGE_KEY);
    if (value) {
      if (value === 'pre-start' || value === 'ended') return value;
      try {
        return BigInt(value);
      } catch {
        return undefined;
      }
    }

    const legacyValue = window.localStorage.getItem(LEGACY_NEW_CHAIN_LAUNCH_VISITED_KEY);
    if (legacyValue === null || currentMarker === undefined) return undefined;
    window.localStorage.removeItem(LEGACY_NEW_CHAIN_LAUNCH_VISITED_KEY);
    if (legacyValue !== '1') return undefined;
    if (currentMarker === 'pre-start' || currentMarker === 'ended') {
      window.localStorage.setItem(BURN_ACTIVITY_NOTICE_STORAGE_KEY, currentMarker);
      return currentMarker;
    }
    return undefined;
  },
  setMarker: (marker: BurnActivityNoticeMarker) => {
    if (!canUseStorage()) return;
    window.localStorage.setItem(
      BURN_ACTIVITY_NOTICE_STORAGE_KEY,
      typeof marker === 'bigint' ? marker.toString() : marker,
    );
    window.localStorage.removeItem(LEGACY_NEW_CHAIN_LAUNCH_VISITED_KEY);
    window.dispatchEvent(new Event(BURN_ACTIVITY_NOTICE_EVENT));
  },
  eventName: BURN_ACTIVITY_NOTICE_EVENT,
};

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

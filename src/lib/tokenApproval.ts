import { maxUint256 } from 'viem';

export type TokenApprovalMode = 'preference' | 'exact' | 'unlimited';

const APPROVAL_PREFERENCE_KEY = 'love20:tokenApproval:useUnlimitedByDefault';

const canUseStorage = () => typeof window !== 'undefined' && !!window.localStorage;

export const getUseUnlimitedTokenApprovalByDefault = () => {
  if (!canUseStorage()) return false;
  return window.localStorage.getItem(APPROVAL_PREFERENCE_KEY) === '1';
};

export const setUseUnlimitedTokenApprovalByDefault = (enabled: boolean) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(APPROVAL_PREFERENCE_KEY, enabled ? '1' : '0');
  window.dispatchEvent(new Event('tokenApprovalPreferenceChanged'));
};

export const resolveTokenApprovalValue = (value: bigint, mode: TokenApprovalMode = 'preference') => {
  if (value <= BigInt(0)) return value;
  if (mode === 'exact') return value;
  if (mode === 'unlimited') return maxUint256;
  if (!getUseUnlimitedTokenApprovalByDefault()) return value;
  return maxUint256;
};

export const isUnlimitedTokenApproval = (value: bigint | undefined) => {
  if (value === undefined) return false;
  return value > maxUint256 / BigInt(2);
};

import assert from 'node:assert/strict';
import { burnActivityNoticePreference } from '../src/lib/uiPreferences';

const values = new Map<string, string>();
const storage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
  removeItem: (key: string) => values.delete(key),
};

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { localStorage: storage, dispatchEvent: () => true },
});

values.set('love20:apps:newChainLaunchVisited', '1');
assert.equal(burnActivityNoticePreference.getMarker('pre-start'), 'pre-start');
assert.equal(values.get('love20:apps:newChainLaunchVisitedRound'), 'pre-start');
assert.equal(values.has('love20:apps:newChainLaunchVisited'), false);

values.set('love20:apps:newChainLaunchVisited', '1');
values.delete('love20:apps:newChainLaunchVisitedRound');
assert.equal(burnActivityNoticePreference.getMarker(BigInt(8)), undefined);
assert.equal(values.has('love20:apps:newChainLaunchVisited'), false);

console.log('ui preferences ok');

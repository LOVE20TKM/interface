import assert from 'node:assert/strict';
import {
  applyTheme,
  DEFAULT_THEME,
  getTheme,
  resolveTheme,
  THEME_BOOTSTRAP_SCRIPT,
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  THEMES,
} from '../src/lib/theme';

assert.equal(new Set(THEMES.map(({ id }) => id)).size, THEMES.length);
THEMES.forEach(({ id }) => {
  assert.equal(resolveTheme(id), id);
  assert.ok(THEME_BOOTSTRAP_SCRIPT.includes(`\"${id}\"`));
});
assert.equal(resolveTheme(null), DEFAULT_THEME);
assert.equal(resolveTheme('unknown'), DEFAULT_THEME);
assert.equal(getTheme(), DEFAULT_THEME);

const classNames = new Set<string>();
const dataset: Record<string, string> = {};
const style: Record<string, string> = {};
const storage = new Map<string, string>();
const events: string[] = [];

Object.defineProperty(globalThis, 'document', {
  configurable: true,
  value: {
    documentElement: {
      dataset,
      style,
      classList: {
        toggle(name: string, force: boolean) {
          force ? classNames.add(name) : classNames.delete(name);
        },
      },
    },
  },
});
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    setItem(key: string, value: string) {
      storage.set(key, value);
    },
  },
});
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    dispatchEvent(event: Event) {
      events.push(event.type);
    },
  },
});

applyTheme('dark');
assert.equal(getTheme(), 'dark');
assert.equal(dataset.theme, 'dark');
assert.equal(style.colorScheme, 'dark');
assert.equal(classNames.has('dark'), true);
assert.equal(storage.get('theme'), 'dark');
assert.equal(events.at(-1), THEME_CHANGE_EVENT);

applyTheme('light');
assert.equal(getTheme(), 'light');
assert.equal(dataset.theme, 'light');
assert.equal(style.colorScheme, 'light');
assert.equal(classNames.has('dark'), false);
assert.equal(storage.get('theme'), 'light');

applyTheme('dark', false);
assert.equal(getTheme(), 'dark');
assert.equal(storage.get(THEME_STORAGE_KEY), 'light');

console.log('theme registry ok');

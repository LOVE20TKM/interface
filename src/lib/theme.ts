export const THEMES = [
  { id: 'light', label: '浅色', colorScheme: 'light', swatch: '#ffffff' },
  { id: 'dark', label: '深色', colorScheme: 'dark', swatch: '#171717' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

export const DEFAULT_THEME: ThemeId = 'light';
export const THEME_CHANGE_EVENT = 'love20:theme-change';
export const THEME_STORAGE_KEY = 'theme';

const themeIds = new Set<string>(THEMES.map(({ id }) => id));

export function resolveTheme(value: string | null | undefined): ThemeId {
  return value && themeIds.has(value) ? (value as ThemeId) : DEFAULT_THEME;
}

export function getTheme(): ThemeId {
  return typeof document === 'undefined' ? DEFAULT_THEME : resolveTheme(document.documentElement.dataset.theme);
}

export function applyTheme(theme: ThemeId, persist = true): void {
  const definition = THEMES.find(({ id }) => id === theme) ?? THEMES[0];
  const root = document.documentElement;

  root.dataset.theme = definition.id;
  root.classList.toggle('dark', definition.colorScheme === 'dark');
  root.style.colorScheme = definition.colorScheme;

  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, definition.id);
    } catch {
      // The theme still applies to the current page when storage is unavailable.
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }
}

const bootstrapThemes = Object.fromEntries(THEMES.map(({ id, colorScheme }) => [id, colorScheme]));

export const THEME_BOOTSTRAP_SCRIPT = `
  try {
    var themes = ${JSON.stringify(bootstrapThemes)};
    var storedTheme = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var theme = Object.prototype.hasOwnProperty.call(themes, storedTheme) ? storedTheme : ${JSON.stringify(DEFAULT_THEME)};
    var root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.classList.toggle('dark', themes[theme] === 'dark');
    root.style.colorScheme = themes[theme];
  } catch (error) {
    document.documentElement.setAttribute('data-theme', ${JSON.stringify(DEFAULT_THEME)});
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  }
`;

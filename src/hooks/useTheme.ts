import { useCallback, useEffect, useState } from 'react';

import {
  applyTheme,
  DEFAULT_THEME,
  getTheme,
  resolveTheme,
  THEME_CHANGE_EVENT,
} from '@/src/lib/theme';

export function useTheme() {
  const [theme, setTheme] = useState(DEFAULT_THEME);

  useEffect(() => {
    const syncTheme = () => setTheme(getTheme());

    syncTheme();
    window.addEventListener(THEME_CHANGE_EVENT, syncTheme);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, syncTheme);
  }, []);

  const selectTheme = useCallback((value: string) => {
    applyTheme(resolveTheme(value));
  }, []);

  return { theme, selectTheme };
}

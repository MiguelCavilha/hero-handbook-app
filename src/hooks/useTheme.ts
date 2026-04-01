import { useState, useEffect } from 'react';
import { getPreferences, savePreferences } from '@/lib/db';

export function useTheme() {
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>(() => getPreferences().theme);

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
    root.classList.toggle('dark', isDark);
  }, [theme]);

  const setTheme = (t: 'light' | 'dark' | 'system') => {
    setThemeState(t);
    savePreferences({ theme: t });
  };

  const toggle = () => {
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    setTheme(isDark ? 'light' : 'dark');
  };

  return { theme, setTheme, toggle };
}

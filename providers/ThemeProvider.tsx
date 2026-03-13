import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { DarkTheme, LightTheme, ThemeColors } from '@/constants/colors';

const THEME_KEY = 'healing_soundscapes_theme';

export type ThemeMode = 'dark' | 'light';

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');

  const themeQuery = useQuery({
    queryKey: ['theme'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      return (stored as ThemeMode) ?? 'dark';
    },
  });

  useEffect(() => {
    if (themeQuery.data) {
      setThemeMode(themeQuery.data);
    }
  }, [themeQuery.data]);

  const toggleTheme = useCallback(() => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    void AsyncStorage.setItem(THEME_KEY, next);
    console.log('[Theme] Switched to:', next);
  }, [themeMode]);

  const colors: ThemeColors = themeMode === 'dark' ? DarkTheme : LightTheme;
  const isDark = themeMode === 'dark';

  return useMemo(() => ({
    themeMode,
    colors,
    isDark,
    toggleTheme,
  }), [themeMode, colors, isDark, toggleTheme]);
});

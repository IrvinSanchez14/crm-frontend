/**
 * Theme Provider
 * Single Responsibility: Manages theme state and DOM updates
 * Dependency Inversion: Depends on ThemeService abstraction
 */

import { useEffect, useState, useMemo, type ReactNode } from 'react';
import type { Theme } from '../../core/domain/theme.types';
import { ThemeService } from '../../core/services/theme.service';
import { ThemeContext } from './ThemeContext';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return ThemeService.getStoredTheme() ?? defaultTheme;
  });

  // Derive actual theme from theme preference
  const actualTheme = useMemo(() => {
    return ThemeService.resolveTheme(theme);
  }, [theme]);

  // Listen to system theme changes when theme is set to 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    return ThemeService.createSystemThemeListener(() => {
      // Force a re-render by updating theme state
      setThemeState('system');
    });
  }, [theme]);

  // Apply theme class to document root
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(actualTheme);
  }, [actualTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    ThemeService.setStoredTheme(newTheme);
  };

  const value = useMemo(
    () => ({ theme, actualTheme, setTheme }),
    [theme, actualTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

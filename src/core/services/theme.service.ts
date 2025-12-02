/**
 * Theme Service
 * Single Responsibility: Handles theme detection and storage
 * Open/Closed: Can extend with new storage mechanisms without modification
 */

import type { Theme } from '../domain/theme.types';

const THEME_STORAGE_KEY = 'crm-theme';

export class ThemeService {
  /**
   * Gets the stored theme preference from localStorage
   */
  static getStoredTheme(): Theme | null {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Stores the theme preference in localStorage
   */
  static setStoredTheme(theme: Theme): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  /**
   * Detects the system theme preference
   */
  static getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light';

    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  /**
   * Resolves the actual theme based on user preference and system theme
   */
  static resolveTheme(theme: Theme): 'light' | 'dark' {
    if (theme === 'system') {
      return this.getSystemTheme();
    }
    return theme;
  }

  /**
   * Creates a listener for system theme changes
   */
  static createSystemThemeListener(
    callback: (theme: 'light' | 'dark') => void
  ): () => void {
    if (typeof window === 'undefined') return () => {};

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = (e: MediaQueryListEvent) => {
      callback(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }
}

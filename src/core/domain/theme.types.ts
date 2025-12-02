/**
 * Theme types following SOLID principles
 * Single Responsibility: Only defines theme-related types
 */

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

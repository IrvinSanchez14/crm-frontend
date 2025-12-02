/**
 * useTheme Hook
 * Single Responsibility: Provides theme context access
 * Interface Segregation: Only exposes what consumers need
 */

import { useContext } from 'react';
import { ThemeContext } from '../providers/ThemeContext';

export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

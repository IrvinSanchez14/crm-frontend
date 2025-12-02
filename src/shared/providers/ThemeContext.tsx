/**
 * Theme Context
 * Separated for Fast Refresh compatibility
 */

import { createContext } from 'react';
import type { ThemeContextValue } from '../../core/domain/theme.types';

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined
);

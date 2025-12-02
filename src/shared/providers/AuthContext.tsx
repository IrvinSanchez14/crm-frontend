/**
 * Auth Context
 * Separated for Fast Refresh compatibility
 */

import { createContext } from 'react';
import type { AuthContextValue } from '../../core/domain/auth.types';

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);


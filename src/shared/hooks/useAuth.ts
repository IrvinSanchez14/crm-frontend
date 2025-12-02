/**
 * useAuth Hook
 * Provides access to authentication state via Zustand
 * Maintains the same API as before for backward compatibility
 * 
 * Performance: Uses selectors to prevent unnecessary re-renders
 */

import { useMemo } from 'react';
import { useAuthStore } from '../stores/auth.store';

export function useAuth() {
  // Use selectors to subscribe only to specific state slices
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  // Memoize computed value to prevent unnecessary recalculations
  const isAuthenticated = useMemo(() => user !== null, [user]);

  // Memoize return object to maintain referential equality
  return useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
    }),
    [user, isAuthenticated, isLoading, login, logout]
  );
}


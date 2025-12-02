/**
 * useAuth Hook
 * Provides access to authentication state via Zustand
 * Maintains the same API as before for backward compatibility
 */

import { useAuthStore } from '../stores/auth.store';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  return {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    logout,
  };
}


/**
 * Auth Provider
 * Single Responsibility: Manages authentication state
 * Dependency Inversion: Depends on AuthService abstraction
 */

import { useEffect, useState, useMemo, useCallback, type ReactNode } from 'react';
import type { AuthContextValue } from '../../core/domain/auth.types';
import { AuthService } from '../../core/services/auth.service';
import { AuthContext } from './AuthContext';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthContextValue['user']>(() => {
    return AuthService.getStoredUser();
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user on mount
  useEffect(() => {
    const storedUser = AuthService.getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  // Memoize login function to prevent unnecessary re-renders
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const userData = await AuthService.login(email, password);
      setUser(userData);
      AuthService.setStoredUser(userData);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Memoize logout function to prevent unnecessary re-renders
  const logout = useCallback((): void => {
    setUser(null);
    AuthService.clearStoredUser();
  }, []);

  // Memoize computed value
  const isAuthenticated = useMemo(() => user !== null, [user]);

  // Memoize context value with all dependencies including stable functions
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
    }),
    [user, isAuthenticated, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


/**
 * Auth Store
 * Zustand store for authentication state
 * Single Responsibility: Manages authentication state
 * Dependency Inversion: Depends on AuthService abstraction for API calls
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../../core/domain/auth.types';
import { AuthService } from '../../core/services/auth.service';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const userData = await AuthService.login(email, password);
          set({
            user: userData,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        AuthService.clearStoredUser();
        set({
          user: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// Selector for computed isAuthenticated value
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.user !== null);


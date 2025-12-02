/**
 * Auth Service
 * Single Responsibility: Handles authentication state and storage
 * Open/Closed: Can extend with new storage mechanisms without modification
 */

import type { User } from '../domain/auth.types';

const AUTH_STORAGE_KEY = 'crm-auth-user';

export class AuthService {
  /**
   * Gets the stored user from localStorage
   */
  static getStoredUser(): User | null {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as User;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Stores the user in localStorage
   */
  static setStoredUser(user: User): void {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  /**
   * Removes the stored user from localStorage
   */
  static clearStoredUser(): void {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  /**
   * Simulates login API call
   * In a real app, this would make an actual API request
   */
  static async login(email: string, password: string): Promise<User> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // In a real app, validate credentials with backend
    // For now, accept any email/password combination
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Mock user data
    const user: User = {
      id: '1',
      email,
      name: email.split('@')[0] || 'User',
    };

    return user;
  }
}


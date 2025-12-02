/**
 * Token Service
 * Single Responsibility: Manages JWT token storage and retrieval
 * Open/Closed: Can extend with different storage mechanisms
 * Dependency Inversion: Depends on storage abstraction
 */

import type { User } from '../domain/auth.types';
import { decodeJwt, isTokenExpired, getTimeUntilExpiration } from '../utils/jwt.utils';

const AUTH_STORAGE_KEY = 'crm-auth-user';
const TOKEN_STORAGE_KEY = 'crm-auth-token';

export interface TokenInfo {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type?: string;
}

export class TokenService {
  /**
   * Gets stored tokens from localStorage
   */
  static getStoredTokens(): TokenInfo | null {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored) as User;
        if (user.access_token && user.refresh_token) {
          return {
            access_token: user.access_token,
            refresh_token: user.refresh_token,
            expires_in: user.expires_in,
            token_type: user.token_type,
          };
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Stores tokens in localStorage
   */
  static storeTokens(tokens: TokenInfo): void {
    try {
      // Get existing user data if any
      const existing = this.getStoredUser();
      const user: User = {
        ...existing,
        id: existing?.id || this.extractUserIdFromToken(tokens.access_token),
        email: existing?.email || this.extractEmailFromToken(tokens.access_token) || '',
        name: existing?.name || this.extractNameFromToken(tokens.access_token) || 'User',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type,
        expires_in: tokens.expires_in,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_STORAGE_KEY, tokens.access_token);
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  /**
   * Clears stored tokens
   */
  static clearTokens(): void {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  /**
   * Gets the stored user (includes tokens)
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
   * Checks if access token is expired or will expire soon
   */
  static isAccessTokenExpired(): boolean {
    const tokens = this.getStoredTokens();
    if (!tokens?.access_token) {
      return true;
    }
    return isTokenExpired(tokens.access_token);
  }

  /**
   * Checks if refresh token is expired
   */
  static isRefreshTokenExpired(): boolean {
    const tokens = this.getStoredTokens();
    if (!tokens?.refresh_token) {
      return true;
    }
    return isTokenExpired(tokens.refresh_token);
  }

  /**
   * Gets time until access token expires (in milliseconds)
   */
  static getTimeUntilAccessTokenExpires(): number | null {
    const tokens = this.getStoredTokens();
    if (!tokens?.access_token) {
      return null;
    }
    return getTimeUntilExpiration(tokens.access_token);
  }

  /**
   * Extracts user ID from JWT token
   */
  private static extractUserIdFromToken(token: string): string {
    const payload = decodeJwt(token);
    return payload?.sub || '';
  }

  /**
   * Extracts email from JWT token (if available)
   */
  private static extractEmailFromToken(token: string): string | null {
    const payload = decodeJwt(token);
    return (payload?.email as string) || null;
  }

  /**
   * Extracts name from JWT token (if available)
   */
  private static extractNameFromToken(token: string): string | null {
    const payload = decodeJwt(token);
    return (payload?.name as string) || (payload?.email as string)?.split('@')[0] || null;
  }
}


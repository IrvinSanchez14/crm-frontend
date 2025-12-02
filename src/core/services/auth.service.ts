/**
 * Auth Service
 * Single Responsibility: Handles authentication business logic
 * Open/Closed: Can extend with new authentication methods without modification
 * Dependency Inversion: Depends on TokenService and ApiClient abstractions
 */

import type { User } from '../domain/auth.types';
import { apiClient } from '../../infrastructure/api/api.client';
import { TokenService } from './token.service';
import { decodeJwt } from '../utils/jwt.utils';

export class AuthService {
  /**
   * Gets the stored user from localStorage
   * Also initializes API client with stored token
   */
  static getStoredUser(): User | null {
    const user = TokenService.getStoredUser();
    if (user?.access_token) {
      // Set the auth token in the API client
      apiClient.setAuthToken(user.access_token);
    }
    return user;
  }

  /**
   * Stores the user in localStorage
   * Uses TokenService for proper separation of concerns
   */
  static setStoredUser(user: User): void {
    // Store tokens using TokenService
    TokenService.storeTokens({
      access_token: user.access_token,
      refresh_token: user.refresh_token,
      token_type: user.token_type,
      expires_in: user.expires_in,
    });

    // Also store full user object for quick access
    try {
      localStorage.setItem('crm-auth-user', JSON.stringify(user));
    } catch {
      // Silently fail if localStorage is not available
    }

    // Set the auth token in the API client
    apiClient.setAuthToken(user.access_token);
  }

  /**
   * Removes the stored user from localStorage
   */
  static clearStoredUser(): void {
    TokenService.clearTokens();
    apiClient.clearAuthToken();
  }

  /**
   * Login API call to canas-construction backend
   * POST /api/v1/auth/login
   * 
   * Extracts user information from JWT token payload
   */
  static async login(email: string, password: string): Promise<User> {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    try {
      // Call the real API endpoint
      const tokenResponse = await apiClient.login({ email, password });

      // Extract user info from JWT token
      const payload = decodeJwt(tokenResponse.access_token);
      
      if (!payload) {
        throw new Error('Invalid token received from server');
      }

      // Build user object from token payload
      const user: User = {
        id: payload.sub || email, // Use user ID from token
        email: (payload.email as string) || email,
        name: (payload.name as string) || email.split('@')[0] || 'User',
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        token_type: tokenResponse.token_type,
        expires_in: tokenResponse.expires_in,
      };

      // Store user and set auth token
      this.setStoredUser(user);

      return user;
    } catch (error) {
      // Re-throw with user-friendly message
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Login failed. Please try again.');
    }
  }

  /**
   * Checks if the current session is valid
   */
  static isSessionValid(): boolean {
    if (TokenService.isRefreshTokenExpired()) {
      return false;
    }
    return !TokenService.isAccessTokenExpired();
  }

  /**
   * Refreshes the access token using refresh token
   */
  static async refreshAccessToken(): Promise<User | null> {
    const tokens = TokenService.getStoredTokens();
    if (!tokens?.refresh_token) {
      return null;
    }

    try {
      const tokenResponse = await apiClient.refreshToken(tokens.refresh_token);
      
      // Get existing user to preserve user data
      const existingUser = TokenService.getStoredUser();
      
      const user: User = {
        ...existingUser!,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        token_type: tokenResponse.token_type,
        expires_in: tokenResponse.expires_in,
      };

      this.setStoredUser(user);
      return user;
    } catch (error) {
      // Refresh failed, clear everything
      this.clearStoredUser();
      return null;
    }
  }
}


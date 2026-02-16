import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TokenService } from '../../core/services/token.service';

describe('TokenService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('storeTokens', () => {
    it('should store tokens in localStorage', () => {
      const tokens = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      };

      TokenService.storeTokens(tokens);

      const stored = localStorage.getItem('crm-auth-user');
      expect(stored).toBeDefined();
      const user = JSON.parse(stored!);
      expect(user.access_token).toBe(tokens.access_token);
      expect(user.refresh_token).toBe(tokens.refresh_token);
    });
  });

  describe('getStoredTokens', () => {
    it('should retrieve tokens from localStorage', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      };
      localStorage.setItem('crm-auth-user', JSON.stringify(user));

      const result = TokenService.getStoredTokens();

      expect(result?.access_token).toBe('test-access-token');
      expect(result?.refresh_token).toBe('test-refresh-token');
    });

    it('should return null when no tokens are stored', () => {
      const result = TokenService.getStoredTokens();

      expect(result).toBeNull();
    });

    it('should return null when stored data is invalid', () => {
      localStorage.setItem('crm-auth-user', 'invalid-json');

      const result = TokenService.getStoredTokens();

      expect(result).toBeNull();
    });
  });

  describe('clearTokens', () => {
    it('should remove tokens from localStorage', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      };
      localStorage.setItem('crm-auth-user', JSON.stringify(user));
      localStorage.setItem('crm-auth-token', 'test-access-token');

      TokenService.clearTokens();

      const storedUser = localStorage.getItem('crm-auth-user');
      const storedToken = localStorage.getItem('crm-auth-token');
      expect(storedUser).toBeNull();
      expect(storedToken).toBeNull();
    });
  });

  describe('getStoredTokens with valid tokens', () => {
    it('should return tokens when user is properly stored', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
      };
      localStorage.setItem('crm-auth-user', JSON.stringify(user));

      const result = TokenService.getStoredTokens();

      expect(result).toEqual({
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: undefined,
        token_type: undefined,
      });
    });

    it('should return null when user has no access_token', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        refresh_token: 'test-refresh-token',
      };
      localStorage.setItem('crm-auth-user', JSON.stringify(user));

      const result = TokenService.getStoredTokens();

      expect(result).toBeNull();
    });
  });
});

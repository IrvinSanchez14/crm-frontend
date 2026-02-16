import { describe, it, expect } from 'vitest';
import { decodeJwt } from '../jwt.utils';

describe('jwt.utils', () => {
  describe('decodeJwt', () => {
    it('should decode a valid JWT token', () => {
      // Mock JWT token (header.payload.signature)
      const payload = { company_id: '123', user_id: '456', email: 'test@example.com' };
      const encodedPayload = btoa(JSON.stringify(payload));
      const mockToken = `header.${encodedPayload}.signature`;

      const result = decodeJwt(mockToken);

      expect(result).toEqual(payload);
    });

    it('should return null for invalid token', () => {
      const result = decodeJwt('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null for empty token', () => {
      const result = decodeJwt('');

      expect(result).toBeNull();
    });

    it('should handle tokens with special characters', () => {
      const payload = { company_id: 'abc-123', user_id: 'xyz-789' };
      const encodedPayload = btoa(JSON.stringify(payload));
      const mockToken = `header.${encodedPayload}.signature`;

      const result = decodeJwt(mockToken);

      expect(result).toEqual(payload);
    });
  });
});

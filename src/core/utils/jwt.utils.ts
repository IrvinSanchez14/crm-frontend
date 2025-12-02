/**
 * JWT Utilities
 * Single Responsibility: JWT token parsing and validation
 * Pure functions - no side effects
 */

export interface JwtPayload {
  sub: string; // User ID
  company_id?: string;
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
  type?: string; // Token type (access/refresh)
  [key: string]: unknown;
}

/**
 * Decodes a JWT token without verification
 * Note: This only decodes the payload, it does NOT verify the signature
 * For production, tokens should be verified on the backend
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode base64url (JWT uses base64url encoding)
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Checks if a JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) {
    return true; // Consider expired if we can't decode
  }

  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();

  // Add 5 minute buffer to refresh before actual expiration
  const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds

  return currentTime >= expirationTime - buffer;
}

/**
 * Gets the expiration time of a token in milliseconds
 */
export function getTokenExpirationTime(token: string): number | null {
  const payload = decodeJwt(token);
  if (!payload || !payload.exp) {
    return null;
  }
  return payload.exp * 1000; // Convert to milliseconds
}

/**
 * Gets time until token expiration in milliseconds
 */
export function getTimeUntilExpiration(token: string): number | null {
  const expirationTime = getTokenExpirationTime(token);
  if (expirationTime === null) {
    return null;
  }
  return Math.max(0, expirationTime - Date.now());
}


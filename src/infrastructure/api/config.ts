/**
 * API Configuration
 * Centralized configuration for API endpoints
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

console.log('[API Config] VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('[API Config] Using API_BASE_URL:', API_BASE_URL);


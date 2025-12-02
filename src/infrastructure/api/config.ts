/**
 * API Configuration
 * Centralized configuration for API endpoints
 */

// Default to localhost:8000 for development
// In production, this should be set via environment variables
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';


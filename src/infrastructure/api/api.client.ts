/**
 * API Client
 * Extends BaseApiClient for CRM backend API
 * Implements automatic token refresh and request interceptors
 */

import { BaseApiClient, ApiError } from './base-api.client';
import { API_BASE_URL } from './config';
import { TokenService } from '../../core/services/token.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

type RequestInterceptor = (config: RequestInit) => RequestInit | Promise<RequestInit>;
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

export class ApiClient extends BaseApiClient {
  private refreshPromise: Promise<TokenResponse> | null = null;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor() {
    super({
      baseURL: API_BASE_URL,
    });

    // Initialize token from storage if available
    const tokens = TokenService.getStoredTokens();
    if (tokens?.access_token) {
      this.setAuthToken(tokens.access_token);
    }

    // Add automatic token refresh interceptor
    this.addResponseInterceptor(this.handleTokenRefresh.bind(this));
  }

  /**
   * Adds a request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Adds a response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Login endpoint
   */
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    try {
      const response = await this.post<TokenResponse, LoginRequest>(
        '/auth/login',
        credentials
      );
      return response.data;
    } catch (error) {
      // Handle API errors with better error messages
      if (error instanceof ApiError) {
        if (error.status === 401) {
          throw new Error('Incorrect email or password');
        }
        if (error.status === 422) {
          throw new Error('Invalid email or password format');
        }
        throw new Error(error.message || 'Login failed. Please try again.');
      }
      throw error;
    }
  }

  /**
   * Refresh token endpoint
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const response = await this.post<TokenResponse, RefreshTokenRequest>(
        '/auth/refresh',
        { refresh_token: refreshToken }
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          // Refresh token is invalid, clear storage
          TokenService.clearTokens();
          this.clearAuthToken();
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(error.message || 'Failed to refresh token');
      }
      throw error;
    }
  }

  /**
   * Handles automatic token refresh on 401 responses
   */
  private async handleTokenRefresh(response: Response): Promise<Response> {
    // Only handle 401 Unauthorized errors
    if (response.status !== 401) {
      return response;
    }

    // Don't retry refresh token endpoint
    const url = response.url;
    if (url.includes('/auth/refresh') || url.includes('/auth/login')) {
      return response;
    }

    // Check if we have a refresh token
    const tokens = TokenService.getStoredTokens();
    if (!tokens?.refresh_token || TokenService.isRefreshTokenExpired()) {
      // No valid refresh token, clear everything
      TokenService.clearTokens();
      this.clearAuthToken();
      return response;
    }

    // Use existing refresh promise if one is in progress
    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshToken(tokens.refresh_token);
    }

    try {
      const newTokens = await this.refreshPromise;
      
      // Store new tokens
      TokenService.storeTokens(newTokens);
      this.setAuthToken(newTokens.access_token);
      
      // Clear refresh promise
      this.refreshPromise = null;
      
      // Retry the original request with new token
      // Note: This is a simplified version. In a full implementation,
      // you'd want to retry the original request here
      return response;
    } catch (error) {
      // Refresh failed, clear everything
      this.refreshPromise = null;
      TokenService.clearTokens();
      this.clearAuthToken();
      return response;
    }
  }

  /**
   * Override request method to add interceptors
   * Uses composition to wrap the base request method
   */
  protected async request<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    headers?: Record<string, string>
  ): Promise<import('./base-api.client').ApiResponse<T>> {
    // Get default headers from parent class
    const defaultHeaders = this.getDefaultHeaders();
    
    // Apply request interceptors
    let requestConfig: RequestInit = {
      method,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    };

    for (const interceptor of this.requestInterceptors) {
      requestConfig = await interceptor(requestConfig);
    }

    const url = `${this.baseURL}${endpoint}`;

    try {
      let response = await fetch(url, requestConfig);

      // Apply response interceptors
      for (const interceptor of this.responseInterceptors) {
        response = await interceptor(response);
      }

      // Read response text first (can only read once)
      const responseText = await response.text();

      if (!response.ok) {
        // Try to extract error message from response body
        let errorMessage = `Request failed: ${method} ${endpoint}`;
        try {
          const errorData = JSON.parse(responseText);
          // FastAPI typically returns errors in { "detail": "message" } format
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } catch {
          // If response is not JSON, use status text or response text
          errorMessage = response.statusText || responseText || errorMessage;
        }

        throw new ApiError(
          response.status,
          response.statusText,
          errorMessage
        );
      }

      // Parse successful response as JSON
      const responseData = responseText ? JSON.parse(responseText) : ({} as T);

      return {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        500,
        'Network Error',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
}

/**
 * Client interfaces
 */
export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface ClientsListParams {
  company_id: string;
  skip?: number;
  limit?: number;
  include_projects?: boolean;
}

// Export singleton instance
export const apiClient = new ApiClient();

/**
 * Client creation interface
 */
export interface ClientCreate {
  name: string;
  email?: string;
  phone?: string;
  company_id: string;
}

/**
 * Clients API methods
 */
export async function getClients(params: ClientsListParams): Promise<Client[]> {
  const { company_id, skip = 0, limit = 100, include_projects = false } = params;
  const queryParams = new URLSearchParams({
    company_id,
    skip: skip.toString(),
    limit: limit.toString(),
    include_projects: include_projects.toString(),
  });
  
  const response = await apiClient.get<Client[]>(`/clients?${queryParams.toString()}`);
  return response.data;
}

export async function createClient(clientData: ClientCreate): Promise<Client> {
  const response = await apiClient.post<Client, ClientCreate>('/clients/', clientData);
  return response.data;
}

/**
 * User interfaces
 */
export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  company_id: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  company_id: string;
  role_ids?: string[];
}

/**
 * Users API methods
 */
export async function createUser(userData: UserCreate): Promise<User> {
  const response = await apiClient.post<User, UserCreate>('/users/', userData);
  return response.data;
}


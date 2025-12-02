/**
 * Base API Client
 * Single Responsibility: Handles HTTP requests
 * Open/Closed: Can be extended for specific API endpoints
 */

export interface ApiConfig {
  baseURL: string;
  headers?: Record<string, string>;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

export class ApiError extends Error {
  status: number;
  statusText: string;

  constructor(status: number, statusText: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
  }
}

export class BaseApiClient {
  protected baseURL: string;
  protected defaultHeaders: Record<string, string>;

  constructor(config: ApiConfig) {
    this.baseURL = config.baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  /**
   * Gets default headers (for use in subclasses)
   */
  protected getDefaultHeaders(): Record<string, string> {
    return { ...this.defaultHeaders };
  }

  /**
   * Makes a GET request
   */
  protected async get<T>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, headers);
  }

  /**
   * Makes a POST request
   */
  protected async post<T, D = unknown>(
    endpoint: string,
    data?: D,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, headers);
  }

  /**
   * Makes a PUT request
   */
  protected async put<T, D = unknown>(
    endpoint: string,
    data?: D,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, headers);
  }

  /**
   * Makes a PATCH request
   */
  protected async patch<T, D = unknown>(
    endpoint: string,
    data?: D,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, data, headers);
  }

  /**
   * Makes a DELETE request
   */
  protected async delete<T>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, headers);
  }

  /**
   * Core request method
   * Protected to allow extension in subclasses
   */
  protected async request<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          ...this.defaultHeaders,
          ...headers,
        },
        body: data ? JSON.stringify(data) : undefined,
      });

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

  /**
   * Updates the authorization header
   */
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Removes the authorization header
   */
  clearAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }
}

/**
 * API Client
 * Extends BaseApiClient for CRM backend API
 * Implements automatic token refresh and request interceptors
 */

import { BaseApiClient, ApiError, type ApiResponse } from './base-api.client';
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
    } catch {
      // Refresh failed, clear everything
      this.refreshPromise = null;
      TokenService.clearTokens();
      this.clearAuthToken();
      return response;
    }
  }

  /**
   * Public GET method for external use
   */
  async getPublic<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.get<T>(endpoint, headers);
  }

  /**
   * Public POST method for external use
   */
  async postPublic<T, D = unknown>(
    endpoint: string,
    data?: D,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.post<T, D>(endpoint, data, headers);
  }

  /**
   * Public PUT method for external use
   */
  async putPublic<T, D = unknown>(
    endpoint: string,
    data?: D,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.put<T, D>(endpoint, data, headers);
  }

  /**
   * Public PATCH method for external use
   */
  async patchPublic<T, D = unknown>(
    endpoint: string,
    data?: D,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.patch<T, D>(endpoint, data, headers);
  }

  /**
   * Public DELETE method for external use
   */
  async deletePublic<T>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.delete<T>(endpoint, headers);
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
  
  const response = await apiClient.getPublic<Client[]>(`/clients?${queryParams.toString()}`);
  return response.data;
}

export async function createClient(clientData: ClientCreate): Promise<Client> {
  const response = await apiClient.postPublic<Client, ClientCreate>('/clients/', clientData);
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
  const response = await apiClient.postPublic<User, UserCreate>('/users/', userData);
  return response.data;
}

/**
 * Project Category interfaces
 */
export interface ProjectCategory {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectCategoriesListParams {
  company_id: string;
  skip?: number;
  limit?: number;
  active_only?: boolean;
}

export interface ProjectCategoryCreate {
  name: string;
  description?: string;
  is_active?: boolean;
  company_id: string;
}

/**
 * Catalog Item interfaces
 */
export type UnitType = 'lb' | 'sq ft' | 'ft' | 'cu yd' | 'each' | 'hr' | 'day';

export interface CatalogItem {
  id: string;
  name: string;
  description: string | null;
  unity: UnitType;
  price_base: string;
  is_active: boolean;
  company_id: string;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CatalogItemsListParams {
  company_id: string;
  skip?: number;
  limit?: number;
  active_only?: boolean;
  unity?: UnitType;
  include_creator?: boolean;
}

export interface CatalogItemCreate {
  name: string;
  description?: string;
  unity: UnitType;
  price_base: string;
  is_active?: boolean;
  company_id: string;
}

/**
 * Catalog Items API methods
 */
export async function getCatalogItems(
  params: CatalogItemsListParams
): Promise<CatalogItem[]> {
  const {
    company_id,
    skip = 0,
    limit = 100,
    active_only = false,
    unity,
    include_creator = false,
  } = params;
  
  const queryParams = new URLSearchParams({
    company_id,
    skip: skip.toString(),
    limit: limit.toString(),
    active_only: active_only.toString(),
    include_creator: include_creator.toString(),
  });
  
  if (unity) {
    queryParams.append('unity', unity);
  }
  
  const response = await apiClient.getPublic<CatalogItem[]>(
    `/catalog-items?${queryParams.toString()}`
  );
  return response.data;
}



/**
 * Project interfaces
 */
export type ProjectStatus = 
  | 'lead' 
  | 'quoted' 
  | 'approved' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'on_hold';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  estimated_budget: string | null;
  actual_cost: string | null;
  start_date: string | null;
  estimated_completion_date: string | null;
  actual_completion_date: string | null;
  address: string | null;
  client_id: string;
  category_id: string;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectDetail extends Project {
  client: Client;
  category: ProjectCategory;
  created_by_name: string | null;
}

export interface ProjectsListParams {
  company_id: string;
  skip?: number;
  limit?: number;
  status?: ProjectStatus;
  category_id?: string;
  client_id?: string;
  include_details?: boolean;
  include_creator?: boolean;
}

export interface ProjectCreate {
  name: string;
  description?: string;
  status?: ProjectStatus;
  estimated_budget?: string;
  actual_cost?: string;
  start_date?: string;
  estimated_completion_date?: string;
  actual_completion_date?: string;
  address?: string;
  client_id: string;
  category_id: string;
  created_by_user_id?: string;
}

/**
 * Project Categories API methods
 */
export async function getProjectCategories(
  params: ProjectCategoriesListParams
): Promise<ProjectCategory[]> {
  const { company_id, skip = 0, limit = 100, active_only = false } = params;
  const queryParams = new URLSearchParams({
    company_id,
    skip: skip.toString(),
    limit: limit.toString(),
    active_only: active_only.toString(),
  });
  
  const response = await apiClient.getPublic<ProjectCategory[]>(
    `/project-categories?${queryParams.toString()}`
  );
  return response.data;
}

export async function createProjectCategory(
  categoryData: ProjectCategoryCreate
): Promise<ProjectCategory> {
  const response = await apiClient.postPublic<ProjectCategory, ProjectCategoryCreate>(
    '/project-categories/',
    categoryData
  );
  return response.data;
}

/**
 * Projects API methods
 */
export async function getProjects(
  params: ProjectsListParams
): Promise<ProjectDetail[]> {
  const {
    company_id,
    skip = 0,
    limit = 100,
    status,
    category_id,
    client_id,
    include_details = true,
    include_creator = true,
  } = params;
  
  const queryParams = new URLSearchParams({
    company_id,
    skip: skip.toString(),
    limit: limit.toString(),
    include_details: include_details.toString(),
    include_creator: include_creator.toString(),
  });
  
  if (status) queryParams.append('status', status);
  if (category_id) queryParams.append('category_id', category_id);
  if (client_id) queryParams.append('client_id', client_id);
  
  const response = await apiClient.getPublic<ProjectDetail[]>(
    `/projects?${queryParams.toString()}`
  );
  return response.data;
}

export async function createProject(
  projectData: ProjectCreate,
  companyId: string
): Promise<Project> {
  const queryParams = new URLSearchParams({
    company_id: companyId,
  });
  
  const response = await apiClient.postPublic<Project, ProjectCreate>(
    `/projects/?${queryParams.toString()}`,
    projectData
  );
  return response.data;
}

/**
 * Visit interfaces
 */
export type VisitStatus = 
  | 'planning' 
  | 'in_review' 
  | 'approved' 
  | 'inspection_required' 
  | 'visited';

export interface Visit {
  id: string;
  title: string;
  description: string | null;
  status: VisitStatus;
  visit_date: string | null;
  inspection_notes: string | null;
  estimated_materials_cost: string | null;
  estimated_labor_cost: string | null;
  estimated_total_cost: string | null;
  images: string[] | null;
  attachments: string[] | null;
  project_id: string;
  created_by_user_id: string | null;
  edited_by_user_id: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisitDetail extends Visit {
  created_by_name: string | null;
  edited_by_name: string | null;
}

export interface VisitItem {
  name: string;
  description?: string;
  quantity: number;
  unit_price: string;
  total_price?: string;
}

export interface VisitCreate {
  title: string;
  description?: string;
  status?: VisitStatus;
  visit_date?: string;
  inspection_notes?: string;
  estimated_materials_cost?: string;
  estimated_labor_cost?: string;
  estimated_total_cost?: string;
  images?: string[];
  attachments?: string[];
  visit_items?: VisitItem[];
  project_id: string;
  created_by_user_id?: string;
}

export interface VisitUpdate {
  title?: string;
  description?: string;
  status?: VisitStatus;
  visit_date?: string;
  inspection_notes?: string;
  estimated_materials_cost?: string;
  estimated_labor_cost?: string;
  estimated_total_cost?: string;
  images?: string[];
  attachments?: string[];
  visit_items?: VisitItem[];
  edited_by_user_id?: string;
}

export interface VisitsListParams {
  company_id: string;
  project_id?: string;
  status?: VisitStatus;
  skip?: number;
  limit?: number;
  include_details?: boolean;
}

/**
 * Budget interfaces
 */
export type BudgetStatus = 
  | 'draft' 
  | 'pending_approval' 
  | 'accepted' 
  | 'rejected' 
  | 'revised';

export interface BudgetItem {
  id: string;
  section_name: string | null;
  description: string;
  unit: string | null;
  quantity: string;
  unit_price: string;
  subtotal: string;
  order_index: number;
  catalog_item_id: string | null;
  budget_id: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetItemDetail extends BudgetItem {
  catalog_item_name: string | null;
}

export interface Budget {
  id: string;
  title: string;
  description: string | null;
  status: BudgetStatus;
  total_amount: string;
  visit_id: string;
  accepted_by_user_id: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetDetail extends Budget {
  budget_items: BudgetItemDetail[];
  accepted_by_name: string | null;
}

export interface BudgetItemCreate {
  section_name?: string;
  description: string;
  unit?: string;
  quantity: string;
  unit_price: string;
  subtotal?: string;
  order_index?: number;
  catalog_item_id?: string;
}

export interface BudgetCreate {
  title: string;
  description?: string;
  status?: BudgetStatus;
  total_amount?: string;
  visit_id: string;
  budget_items?: BudgetItemCreate[];
}

export interface BudgetItemUpdate {
  section_name?: string;
  description?: string;
  unit?: string;
  quantity?: string;
  unit_price?: string;
  subtotal?: string;
  order_index?: number;
  catalog_item_id?: string;
}

export interface BudgetUpdate {
  title?: string;
  description?: string;
  status?: BudgetStatus;
  total_amount?: string;
}

export interface BudgetAcceptRequest {
  accepted_by_user_id: string;
}

/**
 * Visits API methods
 */
export async function getVisits(
  params: VisitsListParams
): Promise<VisitDetail[]> {
  const {
    company_id,
    project_id,
    status,
    skip = 0,
    limit = 100,
    include_details = true,
  } = params;
  
  const queryParams = new URLSearchParams({
    company_id,
    skip: skip.toString(),
    limit: limit.toString(),
    include_details: include_details.toString(),
  });
  
  if (project_id) {
    queryParams.append('project_id', project_id);
  }
  if (status) {
    queryParams.append('status', status);
  }
  
  const response = await apiClient.getPublic<VisitDetail[]>(
    `/visits?${queryParams.toString()}`
  );
  return response.data;
}

export async function getVisit(
  visitId: string,
  company_id: string
): Promise<VisitDetail> {
  const queryParams = new URLSearchParams({ company_id });
  const response = await apiClient.getPublic<VisitDetail>(
    `/visits/${visitId}?${queryParams.toString()}`
  );
  return response.data;
}

export async function createVisit(
  visitData: VisitCreate,
  company_id: string,
  created_by_user_id?: string
): Promise<Visit> {
  const queryParams = new URLSearchParams({ company_id });
  if (created_by_user_id) {
    queryParams.append('created_by_user_id', created_by_user_id);
  }
  
  const response = await apiClient.postPublic<Visit, VisitCreate>(
    `/visits/?${queryParams.toString()}`,
    visitData
  );
  return response.data;
}

export async function updateVisit(
  visitId: string,
  visitData: VisitUpdate,
  company_id: string,
  edited_by_user_id?: string
): Promise<VisitDetail> {
  const queryParams = new URLSearchParams({ company_id });
  if (edited_by_user_id) {
    queryParams.append('edited_by_user_id', edited_by_user_id);
  }
  
  const response = await apiClient.putPublic<VisitDetail, VisitUpdate>(
    `/visits/${visitId}?${queryParams.toString()}`,
    visitData
  );
  return response.data;
}

export async function changeVisitStatus(
  visitId: string,
  status: VisitStatus,
  company_id: string,
  reviewed_by_user_id?: string
): Promise<VisitDetail> {
  const queryParams = new URLSearchParams({ 
    company_id,
    new_status: status,
  });
  if (reviewed_by_user_id) {
    queryParams.append('reviewed_by_user_id', reviewed_by_user_id);
  }
  
  const response = await apiClient.patchPublic<VisitDetail>(
    `/visits/${visitId}/status?${queryParams.toString()}`
  );
  return response.data;
}

/**
 * Budgets API methods
 */
export interface BudgetsListParams {
  company_id: string;
  visit_id?: string;
  status?: BudgetStatus;
  skip?: number;
  limit?: number;
}

export async function getBudgets(
  params: BudgetsListParams
): Promise<BudgetDetail[]> {
  const {
    company_id,
    visit_id,
    status,
    skip = 0,
    limit = 100,
  } = params;
  
  const queryParams = new URLSearchParams({
    company_id,
    skip: skip.toString(),
    limit: limit.toString(),
  });
  
  if (visit_id) {
    queryParams.append('visit_id', visit_id);
  }
  if (status) {
    queryParams.append('status', status);
  }
  
  const response = await apiClient.getPublic<BudgetDetail[]>(
    `/budgets?${queryParams.toString()}`
  );
  return response.data;
}

export async function getBudgetByVisit(
  visitId: string,
  company_id: string
): Promise<BudgetDetail | null> {
  try {
    const queryParams = new URLSearchParams({ company_id });
    const response = await apiClient.getPublic<BudgetDetail>(
      `/budgets/visit/${visitId}?${queryParams.toString()}`
    );
    return response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getBudget(
  budgetId: string,
  company_id: string
): Promise<BudgetDetail> {
  const queryParams = new URLSearchParams({ company_id });
  const response = await apiClient.getPublic<BudgetDetail>(
    `/budgets/${budgetId}?${queryParams.toString()}`
  );
  return response.data;
}

export async function createBudget(
  budgetData: BudgetCreate,
  company_id: string,
  created_by_user_id?: string
): Promise<BudgetDetail> {
  const queryParams = new URLSearchParams({ company_id });
  if (created_by_user_id) {
    queryParams.append('created_by_user_id', created_by_user_id);
  }
  
  const response = await apiClient.postPublic<BudgetDetail, BudgetCreate>(
    `/budgets/?${queryParams.toString()}`,
    budgetData
  );
  return response.data;
}

export async function updateBudget(
  budgetId: string,
  budgetData: BudgetUpdate,
  company_id: string
): Promise<BudgetDetail> {
  const queryParams = new URLSearchParams({ company_id });
  const response = await apiClient.putPublic<BudgetDetail, BudgetUpdate>(
    `/budgets/${budgetId}?${queryParams.toString()}`,
    budgetData
  );
  return response.data;
}

export async function addBudgetItem(
  budgetId: string,
  itemData: BudgetItemCreate,
  company_id: string
): Promise<BudgetItemDetail> {
  const queryParams = new URLSearchParams({ company_id });
  const response = await apiClient.postPublic<BudgetItemDetail, BudgetItemCreate>(
    `/budgets/${budgetId}/items?${queryParams.toString()}`,
    itemData
  );
  return response.data;
}

export async function updateBudgetItem(
  budgetId: string,
  itemId: string,
  itemData: BudgetItemUpdate,
  company_id: string
): Promise<BudgetItemDetail> {
  const queryParams = new URLSearchParams({ company_id });
  const response = await apiClient.putPublic<BudgetItemDetail, BudgetItemUpdate>(
    `/budgets/${budgetId}/items/${itemId}?${queryParams.toString()}`,
    itemData
  );
  return response.data;
}

export async function deleteBudgetItem(
  budgetId: string,
  itemId: string,
  company_id: string
): Promise<void> {
  const queryParams = new URLSearchParams({ company_id });
  await apiClient.deletePublic(
    `/budgets/${budgetId}/items/${itemId}?${queryParams.toString()}`
  );
}

export async function acceptBudget(
  budgetId: string,
  acceptRequest: BudgetAcceptRequest,
  company_id: string
): Promise<BudgetDetail> {
  const queryParams = new URLSearchParams({ company_id });
  const response = await apiClient.postPublic<BudgetDetail, BudgetAcceptRequest>(
    `/budgets/${budgetId}/accept?${queryParams.toString()}`,
    acceptRequest
  );
  return response.data;
}

export async function rejectBudget(
  budgetId: string,
  company_id: string
): Promise<BudgetDetail> {
  const queryParams = new URLSearchParams({ company_id });
  const response = await apiClient.postPublic<BudgetDetail>(
    `/budgets/${budgetId}/reject?${queryParams.toString()}`
  );
  return response.data;
}

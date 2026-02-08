import { API_BASE_URL } from '@/lib/apiConfig';

// Endpoints that should not trigger redirect on 401 (non-critical, can fail silently)
const SKIP_AUTH_REDIRECT_ENDPOINTS = [
  '/plaid/accounts',
  '/chats/overview',
  '/chats/category',
  '/chats/goal',
];

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Load token from localStorage
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  /**
   * Handle 401 Unauthorized errors by logging out and redirecting to login
   */
  private handleUnauthorized() {
    // Clear token
    this.clearToken();
    // Clear all auth-related storage
    localStorage.removeItem('auth_token');
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth = true,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(includeAuth),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    // Handle 401 Unauthorized - token expired
    if (response.status === 401) {
      // Check if this endpoint should skip the auth redirect
      const shouldSkipRedirect = SKIP_AUTH_REDIRECT_ENDPOINTS.some(skipEndpoint =>
        endpoint.startsWith(skipEndpoint)
      );

      if (!shouldSkipRedirect) {
        this.handleUnauthorized();
      }
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(error.message || 'An error occurred');
    }

    return response.json();
  }

  async get<T>(endpoint: string, includeAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, includeAuth);
  }

  async post<T>(endpoint: string, data?: any, includeAuth = true): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      includeAuth,
    );
  }

  async patch<T>(endpoint: string, data?: any, includeAuth = true): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
      includeAuth,
    );
  }

  async put<T>(endpoint: string, data?: any, includeAuth = true): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      includeAuth,
    );
  }

  async delete<T>(endpoint: string, includeAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, includeAuth);
  }

  /**
   * Streaming POST request for Server-Sent Events (SSE)
   * Returns a readable stream that emits SSE data
   */
  async postStream(endpoint: string, data?: any, includeAuth = true): Promise<ReadableStream> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(includeAuth),
      body: JSON.stringify(data),
    });

    // Handle 401 Unauthorized - token expired
    if (response.status === 401) {
      // Check if this endpoint should skip the auth redirect
      const shouldSkipRedirect = SKIP_AUTH_REDIRECT_ENDPOINTS.some(skipEndpoint =>
        endpoint.startsWith(skipEndpoint)
      );

      if (!shouldSkipRedirect) {
        this.handleUnauthorized();
      }
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(`Stream error: ${response.statusText}`);
    }

    return response.body!;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

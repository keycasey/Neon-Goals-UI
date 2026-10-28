import { API_BASE_URL } from '@/lib/apiConfig';

type UnauthorizedCallback = () => void;

export class ApiClientError extends Error {
  status: number;
  code?: string;
  reconnectRequired?: boolean;
  payload?: unknown;

  constructor(
    message: string,
    status: number,
    options: { code?: string; reconnectRequired?: boolean; payload?: unknown } = {},
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = options.code;
    this.reconnectRequired = options.reconnectRequired;
    this.payload = options.payload;
  }
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private onUnauthorized: UnauthorizedCallback | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Load token from localStorage
    this.token = localStorage.getItem('auth_token');
  }

  // Set callback for 401 handling (called instead of automatic redirect)
  setUnauthorizedCallback(callback: UnauthorizedCallback | null) {
    this.onUnauthorized = callback;
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
   * Handle 401 Unauthorized errors
   * If a callback is registered, it will be called instead of automatic redirect
   */
  private handleUnauthorized() {
    // Clear token
    this.clearToken();
    // Clear all auth-related storage
    localStorage.removeItem('auth_token');

    // Call registered callback if available (handles user state + redirect)
    if (this.onUnauthorized) {
      this.onUnauthorized();
      return;
    }

    // Fallback: redirect to login page (only if no callback registered)
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
    // Prepend /api if not already present
    const apiEndpoint = endpoint.startsWith('/api')
      ? endpoint
      : `/api${endpoint}`;

    const url = `${this.baseUrl}${apiEndpoint}`;

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
      this.handleUnauthorized();
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      const message = Array.isArray(error?.message)
        ? error.message.join(', ')
        : error?.message || 'An error occurred';
      throw new ApiClientError(message, response.status, {
        code: error?.code,
        reconnectRequired: error?.reconnectRequired,
        payload: error,
      });
    }

    return response.json();
  }

  async get<T>(endpoint: string, includeAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, includeAuth);
  }

  async post<T>(endpoint: string, data?: unknown, includeAuth = true): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      includeAuth,
    );
  }

  async patch<T>(endpoint: string, data?: unknown, includeAuth = true): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
      includeAuth,
    );
  }

  async put<T>(endpoint: string, data?: unknown, includeAuth = true): Promise<T> {
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
  async postStream(endpoint: string, data?: unknown, includeAuth = true): Promise<ReadableStream> {
    // Prepend /api if not already present
    const apiEndpoint = endpoint.startsWith('/api')
      ? endpoint
      : `/api${endpoint}`;

    const url = `${this.baseUrl}${apiEndpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(includeAuth),
      body: JSON.stringify(data),
    });

    // Handle 401 Unauthorized - token expired
    if (response.status === 401) {
      this.handleUnauthorized();
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      throw new Error(`Stream error: ${response.statusText}`);
    }

    return response.body!;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

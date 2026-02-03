import { apiClient } from './apiClient';
import { API_BASE_URL } from '@/lib/apiConfig';

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    githubLogin?: string;
  };
}

export const authService = {
  async getGitHubAuthUrl() {
    // Return backend GitHub OAuth URL
    return `${API_BASE_URL}/auth/github`;
  },

  async login(token: string) {
    // Store token in localStorage
    localStorage.setItem('auth_token', token);
    apiClient.setToken(token);

    // Fetch user profile from backend
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      apiClient.clearToken();
      throw new Error('Invalid token');
    }

    return await response.json();
  },

  async demoLogin() {
    // Call backend demo endpoint to get a valid JWT token
    const response = await fetch(`${API_BASE_URL}/auth/demo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Demo login failed');
    }

    const data = await response.json();

    // Store token in localStorage
    localStorage.setItem('auth_token', data.access_token);
    apiClient.setToken(data.access_token);

    return data.user;
  },

  async getProfile() {
    return apiClient.get<{
      id: string;
      name: string;
      email: string;
      avatar?: string;
      githubLogin?: string;
      githubBio?: string | null;
      githubLocation?: string | null;
      githubBlog?: string | null;
    }>('/auth/me');
  },

  logout() {
    apiClient.clearToken();
    localStorage.removeItem('auth_token');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  // Initialize auth on app load
  initializeAuth() {
    const token = localStorage.getItem('auth_token');
    if (token) {
      apiClient.setToken(token);
    }
    return token;
  },

  // ============ Email/Password Authentication Methods ============

  /**
   * Register a new user with email and password
   * Returns verification info - user must verify email before logging in
   */
  async register(
    email: string,
    password: string,
    name: string
  ): Promise<{ message: string; userId: string; verificationToken?: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return await response.json();
  },

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Email verification failed');
    }

    const data = await response.json();

    // Store token in localStorage
    localStorage.setItem('auth_token', data.access_token);
    apiClient.setToken(data.access_token);

    return data;
  },

  /**
   * Resend verification email
   */
  async resendVerification(email: string): Promise<{ message: string; verificationToken?: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to resend verification email');
    }

    return await response.json();
  },

  /**
   * Login with email and password
   */
  async loginWithEmail(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();

    // Store token in localStorage
    localStorage.setItem('auth_token', data.access_token);
    apiClient.setToken(data.access_token);

    return data;
  },

  /**
   * Initiate password reset
   */
  async forgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Password reset request failed');
    }

    return await response.json();
  },

  /**
   * Complete password reset
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Password reset failed');
    }

    return await response.json();
  },
};

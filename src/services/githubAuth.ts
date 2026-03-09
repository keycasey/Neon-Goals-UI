import type { User } from '@/types/goals';
import { apiClient } from './apiClient';
import { API_BASE_URL } from '@/lib/apiConfig';

/**
 * Initiate GitHub OAuth flow by redirecting to backend
 */
export const initiateGitHubLogin = () => {
  // Redirect to backend GitHub OAuth endpoint with /api/ prefix
  window.location.href = `${API_BASE_URL}/api/auth/github`;
};

/**
 * Handle GitHub OAuth callback from backend
 * The backend returns a token in the query params
 */
export const handleGitHubCallback = async (token: string): Promise<User> => {
  // Store the token
  localStorage.setItem('auth_token', token);
  apiClient.setToken(token);

  // Fetch user profile from backend using apiClient
  return apiClient.get<User>('/auth/me', true);
};

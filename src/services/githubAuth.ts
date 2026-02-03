import { API_BASE_URL } from '@/lib/apiConfig';

/**
 * Initiate GitHub OAuth flow by redirecting to backend
 */
export const initiateGitHubLogin = () => {
  // Redirect to backend GitHub OAuth endpoint
  window.location.href = `${API_BASE_URL}/auth/github`;
};

/**
 * Handle GitHub OAuth callback from backend
 * The backend returns a token in the query params
 */
export const handleGitHubCallback = async (token: string) => {
  // Store the token
  localStorage.setItem('auth_token', token);

  // Fetch user profile from backend
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }

  return await response.json();
};

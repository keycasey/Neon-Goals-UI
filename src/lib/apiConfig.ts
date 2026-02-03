/**
 * Dynamic API URL configuration
 * In development, uses the same host as the origin but with port 3001
 * This allows testing from localhost, network IP, or Tailscale URLs
 * In production, uses the configured VITE_API_URL
 */
export const getApiUrl = (): string => {
  // In development (not production), always use dynamic URL from origin
  // This ensures it works for localhost, network IP, or any origin
  if (!import.meta.env.PROD && typeof window !== 'undefined') {
    const url = new URL(window.location.origin);
    url.port = '3001'; // Backend API port
    // Remove trailing slash to avoid double slashes when concatenating paths
    let urlStr = url.toString();
    if (urlStr.endsWith('/')) {
      urlStr = urlStr.slice(0, -1);
    }
    return urlStr;
  }

  // In production, use the configured URL from env
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    // Remove trailing slash to avoid double slashes
    return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  }

  // Fallback for SSR or server-side rendering
  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiUrl();

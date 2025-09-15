/**
 * API Utilities for Harare Metro
 * Handles environment-aware API URL resolution
 */

/**
 * Get the base URL for API calls
 * In development: localhost:5173
 * In production: same origin (worker handles both frontend and API)
 */
export function getApiBaseUrl(request: Request): string {
  const url = new URL(request.url);
  
  // In development, use localhost with port
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return 'http://localhost:5173';
  }
  
  // In production, use same origin (worker handles both)
  return url.origin;
}

/**
 * Build API URL with base URL resolution
 */
export function buildApiUrl(request: Request, endpoint: string, params?: URLSearchParams): string {
  const baseUrl = getApiBaseUrl(request);
  const apiUrl = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  if (params) {
    return `${apiUrl}?${params.toString()}`;
  }
  
  return apiUrl;
}
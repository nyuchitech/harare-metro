/**
 * API Utilities for Mukoko News Frontend
 * Handles API URL resolution - same-origin in single-worker architecture
 */

/**
 * Get the base URL for API calls
 * Single-worker: same origin
 */
export function getApiBaseUrl(request) {
  return '';
}

/**
 * Build API URL
 */
export function buildApiUrl(request, endpoint, params) {
  const apiUrl = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (params) {
    return `${apiUrl}?${params.toString()}`;
  }

  return apiUrl;
}

/**
 * Build image proxy URL
 */
export function buildImageUrl(request, imageUrl) {
  return `/api/image?url=${encodeURIComponent(imageUrl)}`;
}

/**
 * Build image URL for client-side use
 */
export function buildClientImageUrl(imageUrl) {
  return imageUrl || '';
}

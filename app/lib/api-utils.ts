/**
 * API Utilities for Harare Metro Frontend
 * Handles API URL resolution for backend calls
 */

/**
 * Get the base URL for API calls
 * In development: localhost:8787 (backend dev server)
 * In production: admin.hararemetro.co.zw (backend worker)
 */
export function getApiBaseUrl(request: Request): string {
  const url = new URL(request.url);
  
  // In development, use backend dev server
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return 'http://localhost:8787';
  }
  
  // In production, use dedicated backend worker
  return 'https://admin.hararemetro.co.zw';
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

/**
 * Build image proxy URL for secure image handling
 */
export function buildImageUrl(request: Request, imageUrl: string): string {
  const baseUrl = getApiBaseUrl(request);
  return `${baseUrl}/api/image?url=${encodeURIComponent(imageUrl)}`;
}

/**
 * Build image proxy URL for client-side use
 * Prioritizes Cloudflare Images URLs, falls back to proxy
 */
export function buildClientImageUrl(imageUrl: string): string {
  // If image is already from Cloudflare Images, use it directly
  if (imageUrl && imageUrl.includes('imagedelivery.net')) {
    return imageUrl;
  }
  
  // In development, use backend dev server
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return `http://localhost:8787/api/image?url=${encodeURIComponent(imageUrl)}`;
  }
  
  // In production, use dedicated backend worker
  return `https://admin.hararemetro.co.zw/api/image?url=${encodeURIComponent(imageUrl)}`;
}
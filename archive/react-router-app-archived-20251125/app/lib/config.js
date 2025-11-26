/**
 * Environment Configuration
 * Provides environment-aware URLs for API calls
 */

/**
 * Get the backend API URL based on environment
 * - Development: http://localhost:8787
 * - Production: https://admin.hararemetro.co.zw
 */
export function getBackendUrl(): string {
  // Check if we're in browser or server
  if (typeof window !== 'undefined') {
    // Browser: check hostname
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8787';
    }
  } else {
    // Server: check request URL or environment
    // In dev, React Router dev server runs on localhost
    // In production, it runs on www.hararemetro.co.zw
    if (import.meta.env.MODE === 'development') {
      return 'http://localhost:8787';
    }
  }

  return 'https://admin.hararemetro.co.zw';
}

/**
 * Get the auth cookie domain based on environment
 * - Development: localhost
 * - Production: .hararemetro.co.zw
 */
export function getCookieDomain(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'localhost';
    }
  } else {
    if (import.meta.env.MODE === 'development') {
      return 'localhost';
    }
  }

  return '.hararemetro.co.zw';
}

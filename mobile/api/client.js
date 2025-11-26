/**
 * API Client for Mukoko News Mobile
 * Connects to Cloudflare Worker backend
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = '@mukoko_auth_token';

/**
 * Get auth token from storage
 */
async function getAuthToken() {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('[API] Get token error:', error);
    return null;
  }
}

// Backend URLs - Mukoko News Architecture:
// - news.mukoko.com → Expo Web frontend (Vercel)
// - news-worker.mukoko.com → Mukoko News backend (Cloudflare Workers)
// - api.mukoko.com → Future unified API gateway (separate worker)
const BASE_URL = __DEV__
  ? 'https://mukoko-news-backend.nyuchi.workers.dev'  // Deployed Cloudflare Workers for testing
  // ? 'http://localhost:3000'  // Local dev server (uncomment for local testing)
  : 'https://news-worker.mukoko.com';  // Production backend (custom domain)

// All APIs are on the same domain
const API_BASE_URL = BASE_URL;
const ADMIN_API_URL = BASE_URL; // Admin at /admin

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  // Get auth token if available
  const token = await getAuthToken();

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(token && { Cookie: `auth_token=${token}` }),
      ...options.headers,
    },
    credentials: 'include', // Include cookies for cross-origin requests
  };

  try {
    const response = await fetch(url, config);

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    const data = contentType && contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const errorMessage = typeof data === 'object' && data.error
        ? data.error
        : `API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    return { data, error: null };
  } catch (error) {
    console.error(`[API] ${endpoint}:`, error);
    return { data: null, error: error.message };
  }
}

/**
 * Authentication API
 */
export const auth = {
  /**
   * Sign in with email and password
   */
  async signIn(email, password) {
    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * Register new user
   */
  async signUp(email, password, displayName) {
    return apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
  },

  /**
   * Sign out
   */
  async signOut() {
    return apiRequest('/api/auth/logout', {
      method: 'POST',
    });
  },

  /**
   * Get current session
   */
  async getSession() {
    return apiRequest('/api/auth/session');
  },
};

/**
 * Articles/News Feed API
 */
export const articles = {
  /**
   * Get article feed
   */
  async getFeed({ limit = 20, offset = 0, category = null } = {}) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (category) {
      params.append('category', category);
    }

    return apiRequest(`/api/feeds?${params.toString()}`);
  },

  /**
   * Get single article by source and slug
   */
  async getBySourceSlug(source, slug) {
    const params = new URLSearchParams({ source, slug });
    return apiRequest(`/api/article/by-source-slug?${params.toString()}`);
  },

  /**
   * Like/unlike article
   */
  async toggleLike(articleId) {
    return apiRequest(`/api/articles/${articleId}/like`, {
      method: 'POST',
    });
  },

  /**
   * Bookmark/unbookmark article
   */
  async toggleBookmark(articleId) {
    return apiRequest(`/api/articles/${articleId}/save`, {
      method: 'POST',
    });
  },

  /**
   * Track article view
   */
  async trackView(articleId) {
    return apiRequest(`/api/articles/${articleId}/view`, {
      method: 'POST',
    });
  },
};

/**
 * Categories API
 */
export const categories = {
  /**
   * Get all categories
   */
  async getAll() {
    return apiRequest('/api/categories');
  },
};

/**
 * User API
 */
export const user = {
  /**
   * Get user preferences
   */
  async getPreferences() {
    return apiRequest('/api/user/me/preferences');
  },

  /**
   * Update user preferences
   */
  async updatePreferences(preferences) {
    return apiRequest('/api/user/me/preferences', {
      method: 'POST',
      body: JSON.stringify(preferences),
    });
  },

  /**
   * Follow source/journalist
   */
  async follow(type, id) {
    return apiRequest('/api/user/me/follows', {
      method: 'POST',
      body: JSON.stringify({ type, id }),
    });
  },

  /**
   * Unfollow source/journalist
   */
  async unfollow(type, id) {
    return apiRequest(`/api/user/me/follows/${type}/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Comments API
 */
export const comments = {
  /**
   * Get comments for article
   */
  async getForArticle(articleId) {
    return apiRequest(`/api/articles/${articleId}/comments`);
  },

  /**
   * Add comment to article
   */
  async add(articleId, content) {
    return apiRequest(`/api/articles/${articleId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },
};

/**
 * NewsBytes API (TikTok-style short news)
 */
export const newsBytes = {
  /**
   * Get NewsBytes feed
   */
  async getFeed({ limit = 10, offset = 0 } = {}) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    return apiRequest(`/api/bytes?${params.toString()}`);
  },
};

/**
 * Pulse AI API (AI summaries)
 */
export const pulse = {
  /**
   * Generate Pulse summary for article
   */
  async generate(articleId) {
    return apiRequest(`/api/pulse/generate`, {
      method: 'POST',
      body: JSON.stringify({ articleId }),
    });
  },

  /**
   * Get batch summaries
   */
  async getBatch(articleIds) {
    return apiRequest(`/api/pulse/batch`, {
      method: 'POST',
      body: JSON.stringify({ articleIds }),
    });
  },
};

/**
 * Health check
 */
export const health = {
  async check() {
    return apiRequest('/api/health');
  },
};

export default {
  auth,
  articles,
  categories,
  user,
  comments,
  newsBytes,
  pulse,
  health,
};

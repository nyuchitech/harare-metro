/**
 * Simple Auth Client for Mukoko News
 * Single-worker architecture - all API calls to same origin
 * Uses cookies for session storage
 */

// No need for separate backend URL - everything is same origin now
const BACKEND_URL = '';

class AuthClient {
  /**
   * Register a new user
   */
  async signUp(email, password, metadata) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          displayName: metadata?.displayName
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          user: null,
          session: null,
          error: data.error || 'Registration failed'
        };
      }

      return {
        user: data.user,
        session: null,
        error: undefined
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error.message || 'Network error'
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email, password) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          user: null,
          session: null,
          error: data.error || 'Login failed'
        };
      }

      return {
        user: data.user,
        session: data.session,
        error: undefined
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error.message || 'Network error'
      };
    }
  }

  /**
   * Sign out
   */
  async signOut() {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Get current session from API
   */
  async getSession() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/session`, {
        credentials: 'include',
      });

      if (!response.ok) {
        return { user: null, session: null };
      }

      const data = await response.json();

      if (!data.session) {
        return { user: null, session: null };
      }

      return {
        user: data.user,
        session: data.session,
        error: undefined
      };
    } catch (error) {
      return { user: null, session: null };
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback) {
    this.getSession().then(({ session }) => {
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
    });

    return {
      unsubscribe: () => {}
    };
  }
}

// Export singleton instance
export const authClient = new AuthClient();

// Export for compatibility
export const auth = {
  signUp: (email, password, metadata) => authClient.signUp(email, password, metadata),
  signIn: (email, password) => authClient.signIn(email, password),
  signOut: () => authClient.signOut(),
  getSession: () => authClient.getSession(),
  onAuthStateChange: (callback) => authClient.onAuthStateChange(callback),
};

// Check if auth is configured
export const isAuthConfigured = () => true;

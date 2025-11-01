/**
 * Simple Auth Client for Harare Metro
 * Replaces Supabase with backend API calls
 * Uses cookies for session storage (cross-worker compatible)
 */

const BACKEND_URL = 'https://admin.hararemetro.co.zw';

export interface User {
  id: string;
  email: string;
  display_name?: string;
  role: string;
}

export interface Session {
  access_token: string;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error?: string;
}

class AuthClient {
  /**
   * Register a new user
   */
  async signUp(email: string, password: string, metadata?: { displayName?: string }): Promise<AuthResponse> {
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

      const data: any = await response.json();

      if (!response.ok) {
        return {
          user: null,
          session: null,
          error: data.error || 'Registration failed'
        };
      }

      return {
        user: data.user,
        session: null, // Registration doesn't create session automatically
        error: undefined
      };
    } catch (error: any) {
      return {
        user: null,
        session: null,
        error: error.message || 'Network error'
      };
    }
  }

  /**
   * Sign in with email and password
   * Note: Cookie is set by the backend via Set-Cookie header
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in request
        body: JSON.stringify({ email, password }),
      });

      const data: any = await response.json();

      if (!response.ok) {
        return {
          user: null,
          session: null,
          error: data.error || 'Login failed'
        };
      }

      // Cookie is set by backend, no need to store locally
      return {
        user: data.user,
        session: data.session,
        error: undefined
      };
    } catch (error: any) {
      return {
        user: null,
        session: null,
        error: error.message || 'Network error'
      };
    }
  }

  /**
   * Sign out
   * Cookie is cleared by backend
   */
  async signOut(): Promise<void> {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Include cookies in request
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Get current session from API
   * Uses cookie authentication
   */
  async getSession(): Promise<AuthResponse> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/session`, {
        credentials: 'include', // Include cookies in request
      });

      if (!response.ok) {
        return { user: null, session: null };
      }

      const data: any = await response.json();

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
   * Simple implementation - checks session on mount
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    // Check current session from API
    this.getSession().then(({ session }) => {
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
    });

    // Return unsubscribe function
    return {
      unsubscribe: () => {}
    };
  }
}

// Export singleton instance
export const authClient = new AuthClient();

// Export for compatibility with Supabase-style code
export const auth = {
  signUp: (email: string, password: string, metadata?: any) => authClient.signUp(email, password, metadata),
  signIn: (email: string, password: string) => authClient.signIn(email, password),
  signOut: () => authClient.signOut(),
  getSession: () => authClient.getSession(),
  onAuthStateChange: (callback: any) => authClient.onAuthStateChange(callback),
};

// Check if auth is configured (always true for our simple implementation)
export const isAuthConfigured = () => true;

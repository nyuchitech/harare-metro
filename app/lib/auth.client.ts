/**
 * Simple Auth Client for Harare Metro
 * Replaces Supabase with backend API calls
 * Uses localStorage for session storage (client-side only)
 */

const BACKEND_URL = 'https://admin.hararemetro.co.zw';
const SESSION_KEY = 'harare_metro_session';

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
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      // Store session in localStorage
      if (typeof window !== 'undefined' && data.session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(data.session));
      }

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
   */
  async signOut(): Promise<void> {
    try {
      const session = this.getStoredSession();
      if (session) {
        await fetch(`${BACKEND_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local session
      if (typeof window !== 'undefined') {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }

  /**
   * Get current session from API
   */
  async getSession(): Promise<AuthResponse> {
    try {
      const storedSession = this.getStoredSession();
      if (!storedSession) {
        return { user: null, session: null };
      }

      const response = await fetch(`${BACKEND_URL}/api/auth/session`, {
        headers: {
          'Authorization': `Bearer ${storedSession.access_token}`,
        },
      });

      const data: any = await response.json();

      if (!response.ok || !data.session) {
        // Session invalid, clear it
        if (typeof window !== 'undefined') {
          localStorage.removeItem(SESSION_KEY);
        }
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
   * Get stored session from localStorage
   */
  private getStoredSession(): Session | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  /**
   * Subscribe to auth state changes
   * Simple implementation - just returns initial state
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    // For now, just call the callback immediately with current session
    const session = this.getStoredSession();
    callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);

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

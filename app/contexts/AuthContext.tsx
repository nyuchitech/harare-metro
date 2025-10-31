import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthContextType, User, Session, AuthResponse, AuthError } from '~/types/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured] = useState(true); // Always configured with our simple auth

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        // Dynamically import our auth client only on client side
        const { authClient } = await import('../lib/auth.client');

        // Get initial session
        const { user, session, error } = await authClient.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else {
          setSession(session);
          setUser(user);
        }

        // Listen for auth changes (simple implementation - checks on mount)
        const { unsubscribe } = authClient.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event);
            if (session) {
              const response = await authClient.getSession();
              setSession(response.session);
              setUser(response.user);
            } else {
              setSession(null);
              setUser(null);
            }
            setLoading(false);
          }
        );

        setLoading(false);

        return () => {
          unsubscribe();
        };

      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>): Promise<AuthResponse> => {
    try {
      const { authClient } = await import('../lib/auth.client');
      const result = await authClient.signUp(email, password, {
        displayName: metadata?.display_name as string
      });

      if (result.error) {
        return { data: { user: null, session: null }, error: { message: result.error } as AuthError };
      }

      return { data: { user: result.user, session: result.session }, error: null };
    } catch (error) {
      console.error('Error in signUp:', error);
      return { data: { user: null, session: null }, error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const { authClient } = await import('../lib/auth.client');
      const result = await authClient.signIn(email, password);

      if (result.error) {
        return { data: { user: null, session: null }, error: { message: result.error } as AuthError };
      }

      // Update local state
      setUser(result.user);
      setSession(result.session);

      return { data: { user: result.user, session: result.session }, error: null };
    } catch (error) {
      console.error('Error in signIn:', error);
      return { data: { user: null, session: null }, error: error as AuthError };
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'github'): Promise<AuthResponse> => {
    // OAuth not implemented yet
    return {
      data: { user: null, session: null },
      error: { message: 'OAuth not implemented' } as AuthError
    };
  };

  const signOut = async (): Promise<{ error: AuthError | null }> => {
    try {
      const { authClient } = await import('../lib/auth.client');
      await authClient.signOut();

      // Update local state
      setUser(null);
      setSession(null);

      return { error: null };
    } catch (error) {
      console.error('Error in signOut:', error);
      return { error: error as AuthError };
    }
  };

  const resetPassword = async (email: string): Promise<AuthResponse> => {
    // Password reset not implemented yet
    return {
      data: { user: null, session: null },
      error: { message: 'Password reset not implemented' } as AuthError
    };
  };

  const updatePassword = async (password: string): Promise<AuthResponse> => {
    // Password update not implemented yet
    return {
      data: { user: null, session: null },
      error: { message: 'Password update not implemented' } as AuthError
    };
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    resetPassword,
    updatePassword,
    isConfigured
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

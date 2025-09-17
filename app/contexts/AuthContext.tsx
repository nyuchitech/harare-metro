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
  const [isConfigured, setIsConfigured] = useState(false);
  const [supabaseClient, setSupabaseClient] = useState<{
    supabase: any;
    auth: any;
  } | null>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        // Dynamically import Supabase client only on client side
        const module = await import('../lib/supabase.client');
        const { supabase, auth, isSupabaseConfigured } = module;
        
        if (!isSupabaseConfigured()) {
          setLoading(false);
          return;
        }

        setIsConfigured(true);
        setSupabaseClient({ supabase, auth });

        // Get initial session
        const { data: { session }, error } = await auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email);
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
          }
        );

        setLoading(false);

        return () => {
          subscription.unsubscribe();
        };

      } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>): Promise<AuthResponse> => {
    if (!supabaseClient?.auth) {
      return { data: { user: null, session: null }, error: { message: 'Supabase not initialized' } as AuthError };
    }
    try {
      const result = await supabaseClient.auth.signUp(email, password, metadata);
      return result;
    } catch (error) {
      console.error('Error in signUp:', error);
      return { data: { user: null, session: null }, error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    if (!supabaseClient?.auth) {
      return { data: { user: null, session: null }, error: { message: 'Supabase not initialized' } as AuthError };
    }
    try {
      const result = await supabaseClient.auth.signIn(email, password);
      return result;
    } catch (error) {
      console.error('Error in signIn:', error);
      return { data: { user: null, session: null }, error: error as AuthError };
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'github'): Promise<AuthResponse> => {
    if (!supabaseClient?.auth) {
      return { data: { user: null, session: null }, error: { message: 'Supabase not initialized' } as AuthError };
    }
    try {
      const result = await supabaseClient.auth.signInWithOAuth(provider);
      return result;
    } catch (error) {
      console.error('Error in signInWithOAuth:', error);
      return { data: { user: null, session: null }, error: error as AuthError };
    }
  };

  const signOut = async (): Promise<{ error: AuthError | null }> => {
    if (!supabaseClient?.auth) {
      return { error: { message: 'Supabase not initialized' } as AuthError };
    }
    try {
      const result = await supabaseClient.auth.signOut();
      return result;
    } catch (error) {
      console.error('Error in signOut:', error);
      return { error: error as AuthError };
    }
  };

  const resetPassword = async (email: string): Promise<AuthResponse> => {
    if (!supabaseClient?.auth) {
      return { data: { user: null, session: null }, error: { message: 'Supabase not initialized' } as AuthError };
    }
    try {
      const result = await supabaseClient.auth.resetPassword(email);
      return result;
    } catch (error) {
      console.error('Error in resetPassword:', error);
      return { data: { user: null, session: null }, error: error as AuthError };
    }
  };

  const updatePassword = async (password: string): Promise<AuthResponse> => {
    if (!supabaseClient?.auth) {
      return { data: { user: null, session: null }, error: { message: 'Supabase not initialized' } as AuthError };
    }
    try {
      const result = await supabaseClient.auth.updatePassword(password);
      return result;
    } catch (error) {
      console.error('Error in updatePassword:', error);
      return { data: { user: null, session: null }, error: error as AuthError };
    }
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
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Import Supabase types
interface User {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string;
}

interface Session {
  user: User;
  access_token: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<any>;
  signOut: () => Promise<any>;
  resetPassword: (email: string) => Promise<any>;
  updatePassword: (password: string) => Promise<any>;
  isConfigured: boolean;
}

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
  const [supabaseClient, setSupabaseClient] = useState<any>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        // Dynamically import Supabase client only on client side
        const { supabase, auth, isSupabaseConfigured } = await import('../lib/supabase.client');
        
        if (!isSupabaseConfigured()) {
          setLoading(false);
          return;
        }

        setIsConfigured(true);
        setSupabaseClient({ supabase, auth });

        // Get initial session
        const { data: session, error } = await auth.getSession();
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

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    if (!supabaseClient?.auth) {
      return { data: null, error: { message: 'Supabase not initialized' } };
    }
    try {
      const result = await supabaseClient.auth.signUp(email, password, metadata);
      return result;
    } catch (error) {
      console.error('Error in signUp:', error);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!supabaseClient?.auth) {
      return { data: null, error: { message: 'Supabase not initialized' } };
    }
    try {
      const result = await supabaseClient.auth.signIn(email, password);
      return result;
    } catch (error) {
      console.error('Error in signIn:', error);
      return { data: null, error };
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    if (!supabaseClient?.auth) {
      return { data: null, error: { message: 'Supabase not initialized' } };
    }
    try {
      const result = await supabaseClient.auth.signInWithOAuth(provider);
      return result;
    } catch (error) {
      console.error('Error in signInWithOAuth:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    if (!supabaseClient?.auth) {
      return { error: { message: 'Supabase not initialized' } };
    }
    try {
      const result = await supabaseClient.auth.signOut();
      return result;
    } catch (error) {
      console.error('Error in signOut:', error);
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    if (!supabaseClient?.auth) {
      return { data: null, error: { message: 'Supabase not initialized' } };
    }
    try {
      const result = await supabaseClient.auth.resetPassword(email);
      return result;
    } catch (error) {
      console.error('Error in resetPassword:', error);
      return { data: null, error };
    }
  };

  const updatePassword = async (password: string) => {
    if (!supabaseClient?.auth) {
      return { data: null, error: { message: 'Supabase not initialized' } };
    }
    try {
      const result = await supabaseClient.auth.updatePassword(password);
      return result;
    } catch (error) {
      console.error('Error in updatePassword:', error);
      return { data: null, error };
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
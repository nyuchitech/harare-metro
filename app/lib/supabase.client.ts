// Client-side only Supabase configuration
// This module should only be imported on the client side

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== 'https://placeholder.supabase.co' && 
    supabaseAnonKey !== 'placeholder-key');
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// Auth helper functions
export const auth = {
  signUp: async (email: string, password: string, options?: any) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: options ? { data: options } : undefined
    });
  },

  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password
    });
  },

  signInWithOAuth: async (provider: 'google' | 'github') => {
    return await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin
      }
    });
  },

  signOut: async () => {
    return await supabase.auth.signOut();
  },

  getSession: async () => {
    return await supabase.auth.getSession();
  },

  resetPassword: async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
  },

  updatePassword: async (password: string) => {
    return await supabase.auth.updateUser({ password });
  }
};

// Database helper functions (placeholder for now)
export const db = {
  profiles: {
    get: async (userId: string) => {
      return await supabase.from('profiles').select('*').eq('id', userId).single();
    },
    update: async (userId: string, data: any) => {
      return await supabase.from('profiles').update(data).eq('id', userId);
    }
  },
  
  bookmarks: {
    get: async (userId: string) => {
      return await supabase.from('bookmarks').select('*').eq('user_id', userId);
    }
  },
  
  likes: {
    get: async (userId: string) => {
      return await supabase.from('likes').select('article_id').eq('user_id', userId);
    }
  }
};
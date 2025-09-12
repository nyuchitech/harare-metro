import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create Supabase client
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
)

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  const configured = !!(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl !== 'https://placeholder.supabase.co' && 
    supabaseUrl !== 'https://your-project.supabase.co' && 
    supabaseAnonKey !== 'placeholder-key' &&
    supabaseAnonKey !== 'your_supabase_anon_key'
  )
  
  return configured
}

// Auth helpers - simplified and reliable for React Router
export const auth = {
  // Sign up with email
  signUp: async (email: string, password: string, metadata: Record<string, any> = {}) => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Supabase not configured. Please check your environment variables.' } }
    }
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      })
      return { data, error }
    } catch (err: any) {
      return { data: null, error: { message: err.message } }
    }
  },

  // Sign in with email
  signIn: async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Supabase not configured. Please check your environment variables.' } }
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      return { data, error }
    } catch (err: any) {
      return { data: null, error: { message: err.message } }
    }
  },

  // Sign in with OAuth (Google, GitHub, etc.)
  signInWithOAuth: async (provider: 'google' | 'github') => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Supabase not configured. Please check your environment variables.' } }
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/confirm`
        }
      })
      return { data, error }
    } catch (err: any) {
      return { data: null, error: { message: err.message } }
    }
  },

  // Sign out
  signOut: async () => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase not configured. Please check your environment variables.' } }
    }
    
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (err: any) {
      return { error: { message: err.message } }
    }
  },

  // Get current user
  getCurrentUser: async () => {
    if (!isSupabaseConfigured()) {
      return { user: null, error: { message: 'Supabase not configured. Please check your environment variables.' } }
    }
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      return { user, error }
    } catch (err: any) {
      return { user: null, error: { message: err.message } }
    }
  },

  // Get session
  getSession: async () => {
    if (!isSupabaseConfigured()) {
      return { session: null, error: { message: 'Supabase not configured. Please check your environment variables.' } }
    }
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      return { session, error }
    } catch (err: any) {
      return { session: null, error: { message: err.message } }
    }
  },

  // Reset password
  resetPassword: async (email: string) => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Supabase not configured. Please check your environment variables.' } }
    }
    
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm`
      })
      return { data, error }
    } catch (err: any) {
      return { data: null, error: { message: err.message } }
    }
  },

  // Update password
  updatePassword: async (password: string) => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Supabase not configured. Please check your environment variables.' } }
    }
    
    try {
      const { data, error } = await supabase.auth.updateUser({
        password
      })
      return { data, error }
    } catch (err: any) {
      return { data: null, error: { message: err.message } }
    }
  }
}

// Database helpers
export const db = {
  // User profiles
  profiles: {
    get: async (userId: string) => {
      if (!supabase) {
        return { data: null, error: { message: 'Supabase not configured' } }
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      return { data, error }
    },

    upsert: async (profile: Record<string, any>) => {
      if (!supabase) {
        return { data: null, error: { message: 'Supabase not configured' } }
      }
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profile)
        .select()
        .single()
      return { data, error }
    },

    update: async (userId: string, updates: Record<string, any>) => {
      if (!supabase) {
        return { data: null, error: { message: 'Supabase not configured' } }
      }
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()
      return { data, error }
    }
  },

  // Bookmarks
  bookmarks: {
    get: async (userId: string) => {
      if (!supabase) {
        return { data: [], error: { message: 'Supabase not configured' } }
      }
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      return { data, error }
    },

    add: async (bookmark: Record<string, any>) => {
      if (!supabase) {
        return { data: null, error: { message: 'Supabase not configured' } }
      }
      const { data, error } = await supabase
        .from('bookmarks')
        .insert(bookmark)
        .select()
        .single()
      return { data, error }
    },

    remove: async (userId: string, articleId: string) => {
      if (!supabase) {
        return { error: { message: 'Supabase not configured' } }
      }
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('article_id', articleId)
      return { error }
    }
  },

  // Likes
  likes: {
    get: async (userId: string) => {
      if (!supabase) {
        return { data: [], error: { message: 'Supabase not configured' } }
      }
      const { data, error } = await supabase
        .from('likes')
        .select('article_id')
        .eq('user_id', userId)
      return { 
        data: data ? data.map((item: any) => item.article_id) : [], 
        error 
      }
    },

    add: async (like: Record<string, any>) => {
      if (!supabase) {
        return { data: null, error: { message: 'Supabase not configured' } }
      }
      const { data, error } = await supabase
        .from('likes')
        .insert(like)
        .select()
        .single()
      return { data, error }
    },

    remove: async (userId: string, articleId: string) => {
      if (!supabase) {
        return { error: { message: 'Supabase not configured' } }
      }
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', userId)
        .eq('article_id', articleId)
      return { error }
    }
  }
}

export default supabase
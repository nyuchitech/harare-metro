import { createClient } from '@supabase/supabase-js'

// Get environment variables - these should be set in your .env.local file
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

// Auth helpers - simplified and more reliable
export const auth = {
  // Sign up with email
  signUp: async (email, password, metadata = {}) => {
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
    } catch (err) {
      return { data: null, error: { message: err.message } }
    }
  },

  // Sign in with email
  signIn: async (email, password) => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Supabase not configured. Please check your environment variables.' } }
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      return { data, error }
    } catch (err) {
      return { data: null, error: { message: err.message } }
    }
  },

  // Sign in with OAuth (Google, GitHub, etc.)
  signInWithOAuth: async (provider) => {
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
      return { session: null, error: { message: err.message } }
    }
  },

  // Reset password
  resetPassword: async (email) => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Supabase not configured. Please check your environment variables.' } }
    }
    
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm`
      })
      return { data, error }
    } catch (err) {
      return { data: null, error: { message: err.message } }
    }
  },

  // Update password
  updatePassword: async (password) => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: { message: 'Supabase not configured. Please check your environment variables.' } }
    }
    
    try {
      const { data, error } = await supabase.auth.updateUser({
        password
      })
      return { data, error }
    } catch (err) {
      return { data: null, error: { message: err.message } }
    }
  }
}

// Database helpers
export const db = {
  // User profiles
  profiles: {
    get: async (userId) => {
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

    upsert: async (profile) => {
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

    update: async (userId, updates) => {
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

  // User preferences
  preferences: {
    get: async (userId) => {
      if (!supabase) {
        return { data: null, error: { message: 'Supabase not configured' } }
      }
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()
      return { data, error }
    },

    upsert: async (preferences) => {
      if (!supabase) {
        return { data: null, error: { message: 'Supabase not configured' } }
      }
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(preferences)
        .select()
        .single()
      return { data, error }
    }
  },

  // Bookmarks
  bookmarks: {
    get: async (userId) => {
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

    add: async (bookmark) => {
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

    remove: async (userId, articleId) => {
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
    get: async (userId) => {
      if (!supabase) {
        return { data: [], error: { message: 'Supabase not configured' } }
      }
      const { data, error } = await supabase
        .from('likes')
        .select('article_id')
        .eq('user_id', userId)
      return { 
        data: data ? data.map(item => item.article_id) : [], 
        error 
      }
    },

    add: async (like) => {
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

    remove: async (userId, articleId) => {
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
  },

  // Reading history
  readingHistory: {
    get: async (userId, limit = 100) => {
      if (!supabase) {
        return { data: [], error: { message: 'Supabase not configured' } }
      }
      const { data, error } = await supabase
        .from('reading_history')
        .select('*')
        .eq('user_id', userId)
        .order('viewed_at', { ascending: false })
        .limit(limit)
      return { data, error }
    },

    add: async (historyEntry) => {
      if (!supabase) {
        return { data: null, error: { message: 'Supabase not configured' } }
      }
      const { data, error } = await supabase
        .from('reading_history')
        .insert(historyEntry)
        .select()
        .single()
      return { data, error }
    }
  },

  // Analytics
  analytics: {
    track: async (event) => {
      if (!supabase) {
        return { data: null, error: { message: 'Supabase not configured' } }
      }
      const { data, error } = await supabase
        .from('analytics_events')
        .insert(event)
      return { data, error }
    },

    get: async (userId, eventType = null, limit = 100) => {
      if (!supabase) {
        return { data: [], error: { message: 'Supabase not configured' } }
      }
      let query = supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (eventType) {
        query = query.eq('event_type', eventType)
      }

      const { data, error } = await query
      return { data, error }
    }
  }
}

// Real-time subscriptions
export const realtime = {
  // Subscribe to user data changes
  subscribeToUserData: (userId, callback) => {
    if (!supabase) {
      // Supabase not configured, realtime subscription disabled
      return { unsubscribe: () => {} }
    }
    return supabase
      .channel(`user-${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles',
          filter: `id=eq.${userId}`
        }, 
        callback
      )
      .subscribe()
  },

  // Subscribe to bookmarks changes
  subscribeToBookmarks: (userId, callback) => {
    if (!supabase) {
      // Supabase not configured, realtime subscription disabled
      return { unsubscribe: () => {} }
    }
    return supabase
      .channel(`bookmarks-${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`
        }, 
        callback
      )
      .subscribe()
  }
}

export default supabase
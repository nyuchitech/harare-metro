import { supabase } from './supabase.js'

/**
 * User Service for handling user data operations with Supabase
 * Replaces the old D1UserService with Supabase integration
 */

class UserService {
  // Get user profile
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error
      }
      
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  }

  // Update user profile
  async updateUserProfile(userId, profileData) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: userId, ...profileData })
        .select()
        .single()
      
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  }

  // User likes operations
  async getUserLikes(userId) {
    try {
      const { data, error } = await supabase
        .from('user_likes')
        .select('article_url, article_title, created_at, article_data')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      return { data: data || [], error }
    } catch (err) {
      return { data: [], error: err }
    }
  }

  async addUserLike(userId, article) {
    try {
      const { data, error } = await supabase
        .from('user_likes')
        .upsert({
          user_id: userId,
          article_url: article.link || article.url,
          article_title: article.title,
          article_data: article
        })
        .select()
      
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  }

  async removeUserLike(userId, articleUrl) {
    try {
      const { data, error } = await supabase
        .from('user_likes')
        .delete()
        .eq('user_id', userId)
        .eq('article_url', articleUrl)
      
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  }

  // User bookmarks operations
  async getUserBookmarks(userId) {
    try {
      const { data, error } = await supabase
        .from('user_bookmarks')
        .select('article_url, article_title, created_at, article_data')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      return { data: data || [], error }
    } catch (err) {
      return { data: [], error: err }
    }
  }

  async addUserBookmark(userId, article) {
    try {
      const { data, error } = await supabase
        .from('user_bookmarks')
        .upsert({
          user_id: userId,
          article_url: article.link || article.url,
          article_title: article.title,
          article_data: article
        })
        .select()
      
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  }

  async removeUserBookmark(userId, articleUrl) {
    try {
      const { data, error } = await supabase
        .from('user_bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('article_url', articleUrl)
      
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  }

  // Reading history
  async getUserHistory(userId) {
    try {
      const { data, error } = await supabase
        .from('user_history')
        .select('article_url, article_title, viewed_at, article_data')
        .eq('user_id', userId)
        .order('viewed_at', { ascending: false })
        .limit(100) // Limit to last 100 articles
      
      return { data: data || [], error }
    } catch (err) {
      return { data: [], error: err }
    }
  }

  async addUserHistory(userId, article) {
    try {
      const { data, error } = await supabase
        .from('user_history')
        .upsert({
          user_id: userId,
          article_url: article.link || article.url,
          article_title: article.title,
          article_data: article
        })
        .select()
      
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  }
}

// Export singleton instance
export const userService = new UserService()
export default userService

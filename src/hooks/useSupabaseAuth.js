// Enhanced Supabase auth hook with user data management
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { supabase, db, isSupabaseConfigured } from '../lib/supabase'

export function useSupabaseAuth() {
  const auth = useAuth()
  const [bookmarks, setBookmarks] = useState([])
  const [likes, setLikes] = useState(new Set())
  const [readingHistory, setReadingHistory] = useState([])
  const [preferences, setPreferences] = useState(null)
  const [userDataLoading, setUserDataLoading] = useState(false)
  const [userDataError, setUserDataError] = useState(null)

  // Load user data when user logs in
  const loadUserData = useCallback(async () => {
    if (!auth.user || !isSupabaseConfigured()) return

    setUserDataLoading(true)
    setUserDataError(null)

    try {
      // Load all user data in parallel
      const [bookmarksResult, likesResult, historyResult, preferencesResult] = await Promise.all([
        db.bookmarks.get(auth.user.id),
        db.likes.get(auth.user.id),
        db.readingHistory.get(auth.user.id, 50),
        db.preferences.get(auth.user.id)
      ])

      // Set bookmarks
      if (bookmarksResult.data && !bookmarksResult.error) {
        setBookmarks(bookmarksResult.data)
      }

      // Set likes
      if (likesResult.data && !likesResult.error) {
        setLikes(new Set(likesResult.data))
      }

      // Set reading history
      if (historyResult.data && !historyResult.error) {
        setReadingHistory(historyResult.data)
      }

      // Set preferences
      if (preferencesResult.data && !preferencesResult.error) {
        setPreferences(preferencesResult.data)
      } else if (preferencesResult.error?.message?.includes('No rows returned')) {
        // Create default preferences if none exist
        const defaultPrefs = {
          user_id: auth.user.id,
          theme: 'system',
          language: 'en',
          categories: [],
          notifications: {
            email: true,
            push: true,
            news_updates: true
          },
          privacy: {
            profile_visible: true,
            reading_history_visible: false
          }
        }
        
        const { data: createdPrefs } = await db.preferences.upsert(defaultPrefs)
        if (createdPrefs) {
          setPreferences(createdPrefs)
        }
      }

    } catch (error) {
      console.error('Failed to load user data:', error)
      setUserDataError(error.message)
    } finally {
      setUserDataLoading(false)
    }
  }, [auth.user])

  // Load user data when user changes
  useEffect(() => {
    if (auth.user) {
      loadUserData()
    } else {
      // Clear user data when user logs out
      setBookmarks([])
      setLikes(new Set())
      setReadingHistory([])
      setPreferences(null)
    }
  }, [auth.user, loadUserData])

  // Enhanced bookmark functions with Supabase sync
  const toggleBookmark = useCallback(async (article) => {
    if (!auth.user || !isSupabaseConfigured()) {
      // Fallback to local storage if not authenticated
      const current = JSON.parse(localStorage.getItem('hm_user_bookmarks') || '[]')
      const exists = current.find(b => b.article_id === (article.id || article.slug || article.link))
      
      if (exists) {
        const updated = current.filter(b => b.article_id !== (article.id || article.slug || article.link))
        localStorage.setItem('hm_user_bookmarks', JSON.stringify(updated))
        setBookmarks(updated)
        return false
      } else {
        const bookmark = {
          article_id: article.id || article.slug || article.link,
          article_title: article.title,
          article_url: article.link,
          article_source: article.source,
          article_category: article.category,
          article_image_url: article.optimizedImageUrl || article.imageUrl || article.image_url,
          article_published_at: article.publishedAt || article.pubDate || article.published_at,
          article_data: article,
          created_at: new Date().toISOString()
        }
        const updated = [...current, bookmark]
        localStorage.setItem('hm_user_bookmarks', JSON.stringify(updated))
        setBookmarks(updated)
        return true
      }
    }

    const articleId = article.id || article.slug || article.link
    const isCurrentlyBookmarked = bookmarks.some(b => b.article_id === articleId)

    // Optimistic update
    if (isCurrentlyBookmarked) {
      setBookmarks(prev => prev.filter(b => b.article_id !== articleId))
    } else {
      const newBookmark = {
        user_id: auth.user.id,
        article_id: articleId,
        article_title: article.title,
        article_url: article.link,
        article_source: article.source,
        article_category: article.category,
        article_image_url: article.optimizedImageUrl || article.imageUrl || article.image_url,
        article_published_at: article.publishedAt || article.pubDate || article.published_at,
        article_data: article,
        created_at: new Date().toISOString()
      }
      setBookmarks(prev => [...prev, newBookmark])
    }

    try {
      if (isCurrentlyBookmarked) {
        await db.bookmarks.remove(auth.user.id, articleId)
      } else {
        await db.bookmarks.add({
          user_id: auth.user.id,
          article_id: articleId,
          article_title: article.title,
          article_url: article.link,
          article_source: article.source,
          article_category: article.category,
          article_image_url: article.optimizedImageUrl || article.imageUrl || article.image_url,
          article_published_at: article.publishedAt || article.pubDate || article.published_at,
          article_data: article
        })
      }

      return !isCurrentlyBookmarked
    } catch (error) {
      console.error('Failed to sync bookmark:', error)
      // Revert optimistic update on error
      if (isCurrentlyBookmarked) {
        setBookmarks(prev => [...prev, bookmarks.find(b => b.article_id === articleId)])
      } else {
        setBookmarks(prev => prev.filter(b => b.article_id !== articleId))
      }
      return isCurrentlyBookmarked
    }
  }, [auth.user, bookmarks])

  // Enhanced like functions with Supabase sync
  const toggleLike = useCallback(async (article) => {
    if (!auth.user || !isSupabaseConfigured()) {
      // Fallback to local storage if not authenticated
      const current = new Set(JSON.parse(localStorage.getItem('hm_user_likes') || '[]'))
      const articleId = article.id || article.slug || article.link
      
      if (current.has(articleId)) {
        current.delete(articleId)
        localStorage.setItem('hm_user_likes', JSON.stringify([...current]))
        setLikes(new Set(current))
        return false
      } else {
        current.add(articleId)
        localStorage.setItem('hm_user_likes', JSON.stringify([...current]))
        setLikes(new Set(current))
        return true
      }
    }

    const articleId = article.id || article.slug || article.link
    const isCurrentlyLiked = likes.has(articleId)

    // Optimistic update
    const newLikes = new Set(likes)
    if (isCurrentlyLiked) {
      newLikes.delete(articleId)
    } else {
      newLikes.add(articleId)
    }
    setLikes(newLikes)

    try {
      if (isCurrentlyLiked) {
        await db.likes.remove(auth.user.id, articleId)
      } else {
        await db.likes.add({
          user_id: auth.user.id,
          article_id: articleId
        })
      }

      return !isCurrentlyLiked
    } catch (error) {
      console.error('Failed to sync like:', error)
      // Revert optimistic update on error
      setLikes(likes)
      return isCurrentlyLiked
    }
  }, [auth.user, likes])

  // Track article reading
  const trackArticleRead = useCallback(async (article, readingTime = 0, scrollPercentage = 0) => {
    if (!auth.user || !isSupabaseConfigured()) return

    try {
      await db.readingHistory.add({
        user_id: auth.user.id,
        article_id: article.id || article.slug || article.link,
        article_title: article.title,
        article_url: article.link,
        reading_time_seconds: Math.floor(readingTime / 1000),
        scroll_percentage: Math.floor(scrollPercentage),
        viewed_at: new Date().toISOString()
      })

      // Update local state
      setReadingHistory(prev => [
        {
          user_id: auth.user.id,
          article_id: article.id || article.slug || article.link,
          article_title: article.title,
          article_url: article.link,
          reading_time_seconds: Math.floor(readingTime / 1000),
          scroll_percentage: Math.floor(scrollPercentage),
          viewed_at: new Date().toISOString()
        },
        ...prev.slice(0, 49) // Keep only 50 recent items
      ])
    } catch (error) {
      console.error('Failed to track article read:', error)
    }
  }, [auth.user])

  // Update user preferences
  const updatePreferences = useCallback(async (updates) => {
    if (!auth.user || !isSupabaseConfigured()) return

    const updatedPreferences = {
      ...preferences,
      ...updates,
      updated_at: new Date().toISOString()
    }

    // Optimistic update
    setPreferences(updatedPreferences)

    try {
      const { data } = await db.preferences.upsert(updatedPreferences)
      if (data) {
        setPreferences(data)
      }
      return { data, error: null }
    } catch (error) {
      console.error('Failed to update preferences:', error)
      // Revert optimistic update
      setPreferences(preferences)
      return { data: null, error }
    }
  }, [auth.user, preferences])

  // Utility functions
  const isBookmarked = useCallback((articleId) => {
    return bookmarks.some(b => b.article_id === articleId)
  }, [bookmarks])

  const isLiked = useCallback((articleId) => {
    return likes.has(articleId)
  }, [likes])

  // Get user stats
  const getUserStats = useCallback(() => {
    return {
      bookmarksCount: bookmarks.length,
      likesCount: likes.size,
      readingHistoryCount: readingHistory.length,
      totalReadingTime: readingHistory.reduce((total, item) => total + (item.reading_time_seconds || 0), 0)
    }
  }, [bookmarks.length, likes.size, readingHistory])

  return {
    // Auth state (from useAuth)
    ...auth,
    
    // User data
    bookmarks,
    likes,
    readingHistory,
    preferences,
    userDataLoading,
    userDataError,
    
    // Enhanced functions
    toggleBookmark,
    toggleLike,
    trackArticleRead,
    updatePreferences,
    loadUserData,
    
    // Utility functions
    isBookmarked,
    isLiked,
    getUserStats,
    
    // Supabase availability
    isSupabaseConfigured: isSupabaseConfigured()
  }
}
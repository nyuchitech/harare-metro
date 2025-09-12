import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import userService from '../lib/userService'

/**
 * Hook for managing user data operations (likes, bookmarks, history)
 * Replaces the old worker-based user endpoints with direct Supabase integration
 */

export function useUserData() {
  const { user, isAuthenticated } = useAuth()
  const [likes, setLikes] = useState([])
  const [bookmarks, setBookmarks] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load user data when authenticated
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return
      
      setLoading(true)
      setError(null)
      
      try {
        const [likesResult, bookmarksResult, historyResult] = await Promise.all([
          userService.getUserLikes(user.id),
          userService.getUserBookmarks(user.id),
          userService.getUserHistory(user.id)
        ])
        
        if (likesResult.error) throw likesResult.error
        if (bookmarksResult.error) throw bookmarksResult.error
        if (historyResult.error) throw historyResult.error
        
        setLikes(likesResult.data || [])
        setBookmarks(bookmarksResult.data || [])
        setHistory(historyResult.data || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated && user?.id) {
      loadUserData()
    } else {
      // Clear data when not authenticated
      setLikes([])
      setBookmarks([])
      setHistory([])
    }
  }, [isAuthenticated, user?.id])

  // Like operations
  const addLike = async (article) => {
    if (!user?.id) return { error: 'Not authenticated' }
    
    try {
      const { data, error } = await userService.addUserLike(user.id, article)
      if (error) throw error
      
      // Optimistically update local state
      setLikes(prev => {
        const exists = prev.some(like => like.article_url === (article.link || article.url))
        if (exists) return prev
        return [{ 
          article_url: article.link || article.url, 
          article_title: article.title, 
          article_data: article,
          created_at: new Date().toISOString()
        }, ...prev]
      })
      
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }

  const removeLike = async (articleUrl) => {
    if (!user?.id) return { error: 'Not authenticated' }
    
    try {
      const { error } = await userService.removeUserLike(user.id, articleUrl)
      if (error) throw error
      
      // Optimistically update local state
      setLikes(prev => prev.filter(like => like.article_url !== articleUrl))
      
      return { error: null }
    } catch (err) {
      return { error: err.message }
    }
  }

  const isLiked = (articleUrl) => {
    return likes.some(like => like.article_url === articleUrl)
  }

  // Bookmark operations
  const addBookmark = async (article) => {
    if (!user?.id) return { error: 'Not authenticated' }
    
    try {
      const { data, error } = await userService.addUserBookmark(user.id, article)
      if (error) throw error
      
      // Optimistically update local state
      setBookmarks(prev => {
        const exists = prev.some(bookmark => bookmark.article_url === (article.link || article.url))
        if (exists) return prev
        return [{ 
          article_url: article.link || article.url, 
          article_title: article.title, 
          article_data: article,
          created_at: new Date().toISOString()
        }, ...prev]
      })
      
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }

  const removeBookmark = async (articleUrl) => {
    if (!user?.id) return { error: 'Not authenticated' }
    
    try {
      const { error } = await userService.removeUserBookmark(user.id, articleUrl)
      if (error) throw error
      
      // Optimistically update local state
      setBookmarks(prev => prev.filter(bookmark => bookmark.article_url !== articleUrl))
      
      return { error: null }
    } catch (err) {
      return { error: err.message }
    }
  }

  const isBookmarked = (articleUrl) => {
    return bookmarks.some(bookmark => bookmark.article_url === articleUrl)
  }

  // History operations
  const addToHistory = async (article) => {
    if (!user?.id) return { error: 'Not authenticated' }
    
    try {
      const { data, error } = await userService.addUserHistory(user.id, article)
      if (error) throw error
      
      // Optimistically update local state
      setHistory(prev => {
        const filtered = prev.filter(item => item.article_url !== (article.link || article.url))
        return [{ 
          article_url: article.link || article.url, 
          article_title: article.title, 
          article_data: article,
          viewed_at: new Date().toISOString()
        }, ...filtered].slice(0, 100) // Keep only last 100
      })
      
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }

  const isInHistory = (articleUrl) => {
    return history.some(item => item.article_url === articleUrl)
  }

  return {
    // Data
    likes,
    bookmarks,
    history,
    loading,
    error,
    
    // Operations
    addLike,
    removeLike,
    isLiked,
    
    addBookmark,
    removeBookmark,
    isBookmarked,
    
    addToHistory,
    isInHistory
  }
}

export default useUserData

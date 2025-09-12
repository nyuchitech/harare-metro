// Optimized feeds hook with HYBRID architecture:
// - DirectDataService for fast initial loading (minimal server calls)
// - MultiTierCacheManager for advanced features (optimistic updates, analytics)
// Provides the best of both worlds: speed + sophistication

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import multiTierCacheManager from '../services/MultiTierCacheManager.js'
import directDataService from '../services/DirectDataService.js'
import clientCache from '../services/ClientCacheService.js'
import { useSupabaseAuth } from './useSupabaseAuth'
import useUserInterests from './useUserInterests'
import { logger } from '../utils/logger'

export function useOptimizedFeeds({
  selectedCategory = 'all',
  searchQuery = '',
  selectedTimeframe = 'all', 
  sortBy = 'newest',
  enableInfiniteScroll = true,
  autoRefresh = true,
  refreshInterval = 5 * 60 * 1000 // 5 minutes
} = {}) {
  
  // Supabase auth integration and user interests
  const supabaseAuth = useSupabaseAuth()
  const { interests, hasSetupInterests } = useUserInterests()
  
  // Refs for tracking user behavior
  const scrollPositionRef = useRef(0)
  const lastFeedIndexRef = useRef(0)
  const readingStartTimeRef = useRef(null)
  const userBehaviorRef = useRef({
    articlesViewed: 0,
    articlesSkipped: 0,
    articlesLiked: 0,
    totalReadingTime: 0
  })
  
  // State management with intelligent caching
  const [feeds, setFeeds] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // Feed metadata
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  
  // Optimistic state for instant UX feedback
  const [optimisticLikes, setOptimisticLikes] = useState(new Map())
  const [optimisticBookmarks, setOptimisticBookmarks] = useState(new Map())
  const [optimisticViews, setOptimisticViews] = useState(new Map())
  
  // Scroll and interaction tracking
  const [scrollDirection, setScrollDirection] = useState('down')
  const [scrollVelocity, setScrollVelocity] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const [visibleArticles, setVisibleArticles] = useState(new Set())
  const [hasReached25Percent, setHasReached25Percent] = useState(false)
  
  // Performance tracking and metrics
  const [performanceMetrics, setPerformanceMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    scrollSmoothness: 100,
    cacheHitRate: 0
  })

  // Interest-based prioritization data
  const [categories, setCategories] = useState({})
  const [categoryKeywords, setCategoryKeywords] = useState({})

  // User ID from Supabase auth
  const userId = useMemo(() => supabaseAuth.user?.id || 'anonymous', [supabaseAuth.user])

  // Initialize client cache on mount
  useEffect(() => {
    const initializeClientCache = async () => {
      try {
        logger.debug('💾 Initializing client cache...')
        await clientCache.initialize()
        
        // Optional: preload cache if needed
        const needsRefresh = await clientCache.preloadCache()
        if (needsRefresh) {
          logger.debug('💾 Client cache needs refresh - will fetch fresh data')
        }
      } catch (error) {
        logger.warn('💾 Client cache initialization failed:', error.message)
      }
    }
    
    initializeClientCache()
  }, []) // Run once on mount

  // Load categories and keywords for interest-based prioritization
  useEffect(() => {
    const loadCategoryData = async () => {
      try {
        const [categoriesRes, keywordsRes] = await Promise.all([
          fetch('/api/config/categories'),
          fetch('/api/config/category-keywords')
        ])

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          if (categoriesData.success) {
            const categoryMap = {}
            categoriesData.categories.forEach(cat => {
              categoryMap[cat.id] = cat
            })
            setCategories(categoryMap)
          }
        }

        if (keywordsRes.ok) {
          const keywordsData = await keywordsRes.json()
          if (keywordsData.success) {
            setCategoryKeywords(keywordsData.keywords)
          }
        }
      } catch (error) {
        logger.error('Failed to load category data for interests:', error)
      }
    }

    loadCategoryData()
  }, [])

  // Calculate article relevance score based on user interests
  const calculateRelevanceScore = useCallback((article) => {
    if (!hasSetupInterests() || interests.length === 0) {
      return 0 // No personalization if user hasn't set interests
    }

    let score = 0
    const content = `${article.title} ${article.description || ''} ${article.category || ''}`.toLowerCase()

    // Check each user interest
    interests.forEach((interestId, index) => {
      const interestKeywords = categoryKeywords[interestId] || []
      const interestWeight = 1.0 - (index * 0.1) // First interest gets full weight, others slightly less

      // Check if article matches this interest
      let interestMatches = 0
      interestKeywords.forEach(keyword => {
        if (content.includes(keyword.toLowerCase())) {
          interestMatches++
        }
      })

      // Calculate interest score (percentage of keywords matched)
      const interestScore = interestKeywords.length > 0 
        ? (interestMatches / interestKeywords.length) 
        : 0

      score += interestScore * interestWeight
    })

    // Boost score if article category matches user interests directly
    if (article.category && interests.includes(article.category)) {
      score += 2.0
    }

    return Math.min(score, 5.0) // Cap at 5.0
  }, [hasSetupInterests, interests, categoryKeywords])

  // Enhanced feeds with interest-based prioritization
  const prioritizedFeeds = useMemo(() => {
    if (!feeds || feeds.length === 0) {
      return []
    }

    const feedsWithScores = feeds.map(article => ({
      ...article,
      relevanceScore: calculateRelevanceScore(article),
      isPersonalized: hasSetupInterests() && interests.length > 0
    }))

    // Sort by relevance score (highest first), then by publish date
    return feedsWithScores.sort((a, b) => {
      // If user has interests, prioritize by relevance score
      if (hasSetupInterests() && interests.length > 0) {
        if (a.relevanceScore !== b.relevanceScore) {
          return b.relevanceScore - a.relevanceScore
        }
      }

      // Secondary sort by publish date (newest first)
      const dateA = new Date(a.pubDate || a.publishedAt || a.published || 0)
      const dateB = new Date(b.pubDate || b.publishedAt || b.published || 0)
      return dateB - dateA
    })
  }, [feeds, calculateRelevanceScore, hasSetupInterests, interests])
  
  // CLIENT-CACHE-FIRST fetch function: localStorage -> Server -> Fallback
  const fetchFeeds = useCallback(async (append = false) => {
    const startTime = performance.now()
    
    try {
      if (!append) {
        setLoading(true)
        setError(null)
      } else {
        setLoadingMore(true)
      }

      const offset = append ? feeds.length : 0
      const limit = append ? 12 : 24 // Mobile-optimized: 24 initial, 12 per page
      
      logger.debug(`🎯 CLIENT-CACHE-FIRST fetch: offset=${offset}, limit=${limit}, append=${append}`)
      
      // CLIENT-CACHE-FIRST STRATEGY:
      // 1. Check client cache first (fastest - 0ms)
      // 2. If stale or missing, fetch from server and cache
      // 3. Background refresh for fresh data
      
      let result
      let cacheHit = false
      
      if (!append && offset === 0) {
        // INITIAL LOAD: Try client cache first
        logger.debug('💾 Checking client cache first...')
        const cachedArticles = await clientCache.getCachedArticles(selectedCategory)
        const cacheInfo = await clientCache.getCacheInfo(selectedCategory)
        
        if (cachedArticles && cachedArticles.length > 0 && !cacheInfo?.isStale) {
          // CACHE HIT: Use cached data immediately
          logger.debug(`⚡ CACHE HIT: ${cachedArticles.length} articles from client cache`)
          result = {
            articles: cachedArticles.slice(0, limit),
            total: cachedArticles.length,
            hasMore: cachedArticles.length > limit,
            source: 'client-cache'
          }
          cacheHit = true
          
          // Background refresh if cache is getting old (but still valid)
          if (cacheInfo && cacheInfo.age > 15 * 60 * 1000) { // 15 minutes
            logger.debug('🔄 Background refresh triggered for stale cache')
            setTimeout(() => fetchFreshDataAndCache(), 100)
          }
          
        } else {
          // CACHE MISS: Fetch from server and cache
          result = await fetchFreshDataAndCache()
        }
        
      } else if (append) {
        // PAGINATION: Check if we have more cached data
        logger.debug('📄 Pagination - checking cached data...')
        const cachedArticles = await clientCache.getCachedArticles(selectedCategory)
        
        if (cachedArticles && cachedArticles.length > offset) {
          // Use cached data for pagination
          const paginatedArticles = cachedArticles.slice(offset, offset + limit)
          result = {
            articles: paginatedArticles,
            total: cachedArticles.length,
            hasMore: cachedArticles.length > offset + limit,
            source: 'client-cache-pagination'
          }
          cacheHit = true
          logger.debug(`📄 Paginated from cache: ${paginatedArticles.length} articles`)
        } else {
          // Need to fetch more from server
          result = await directDataService.getMoreArticles({
            limit,
            offset,
            category: selectedCategory !== 'all' ? selectedCategory : null,
            search: searchQuery?.trim() || null,
            sortBy
          })
        }
        
      } else {
        // FALLBACK: Use existing services
        result = await directDataService.getInitialArticles({
          limit,
          category: selectedCategory !== 'all' ? selectedCategory : null,
          search: searchQuery?.trim() || null,
          sortBy
        })
      }
      
      // Helper function to fetch fresh data and cache it
      async function fetchFreshDataAndCache() {
        logger.debug('🌐 Fetching fresh data from server...')
        
        try {
          // Try DirectDataService first (fastest server call)
          const serverResult = await directDataService.getInitialArticles({
            limit: Math.max(limit, 50), // Fetch more to populate cache
            category: selectedCategory !== 'all' ? selectedCategory : null,
            search: searchQuery?.trim() || null,
            sortBy
          })
          
          // Cache the fresh data
          if (serverResult.articles && serverResult.articles.length > 0) {
            await clientCache.cacheArticles(serverResult.articles, selectedCategory)
            logger.debug(`💾 Cached ${serverResult.articles.length} articles locally`)
            
            // Seed MultiTierCacheManager for advanced features
            multiTierCacheManager.seedWithArticles(serverResult.articles)
          }
          
          return {
            ...serverResult,
            source: 'server-cached'
          }
          
        } catch (serverError) {
          logger.warn('🌐 Server fetch failed, trying fallback...', serverError.message)
          
          // Fallback to MultiTierCacheManager
          const fallbackResult = await multiTierCacheManager.getArticles({
            limit,
            offset: 0,
            category: selectedCategory !== 'all' ? selectedCategory : null,
            search: searchQuery?.trim() || null,
            sortBy
          })
          
          return {
            ...fallbackResult,
            source: 'fallback-server'
          }
        }
      }
      
      const loadTime = performance.now() - startTime
      setPerformanceMetrics(prev => ({ ...prev, loadTime }))
      
      if (result.articles) {
        if (append) {
          setFeeds(prev => {
            const existingIds = new Set(prev.map(article => article.id || article.slug || article.link))
            const newArticles = result.articles.filter(article => 
              !existingIds.has(article.id || article.slug || article.link)
            )
            return [...prev, ...newArticles]
          })
        } else {
          setFeeds(result.articles)
          setCurrentPage(0)
          setCurrentIndex(0)
        }
        
        setTotalCount(result.total || 0)
        setHasMore(result.hasMore !== false)
        
        const source = result.source || 'unknown'
        const cacheStatus = cacheHit ? 'CACHE HIT' : 'CACHE MISS'
        logger.debug(`✅ CLIENT-CACHE-FIRST fetch completed: ${result.articles.length} articles in ${loadTime.toFixed(0)}ms (${source}) - ${cacheStatus}`)
        
        // Update cache hit rate metrics
        setPerformanceMetrics(prev => ({
          ...prev,
          cacheHitRate: cacheHit ? Math.min(prev.cacheHitRate + 10, 100) : Math.max(prev.cacheHitRate - 2, 0)
        }))
        
        // Log performance insights
        if (source.includes('client-cache')) {
          logger.debug('⚡ INSTANT: Client cache used - 0ms network time')
        } else if (source.includes('server')) {
          logger.debug('🌐 NETWORK: Server fetch required')
        } else {
          logger.debug('🔧 FALLBACK: Advanced processing used')
        }
      }
      
      return { success: true, count: result.articles?.length || 0 }
      
    } catch (error) {
      logger.error('❌ Optimized fetch failed:', error)
      setError(error.message)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [selectedCategory, searchQuery, sortBy, feeds.length])

  // Infinite scroll with optimized smooth loading
  const loadMoreFeeds = useCallback(async () => {
    if (loadingMore || !hasMore) return
    
    const nextPage = currentPage + 1
    setCurrentPage(nextPage)
    
    logger.debug(`📱 Loading more articles: page ${nextPage}`)
    
    // Track user behavior
    const behavior = userBehaviorRef.current
    behavior.articlesViewed += feeds.length - behavior.articlesViewed
    
    return await fetchFeeds(true)
  }, [fetchFeeds, loadingMore, hasMore, currentPage, feeds.length])

  // Enhanced like toggle with Supabase integration
  const toggleLike = useCallback(async (article) => {
    // Use Supabase auth's optimistic like function
    const newLikeState = await supabaseAuth.toggleLike(article)
    
    // Update local optimistic state for immediate feedback
    const articleId = article.id || article.slug || article.link
    setOptimisticLikes(prev => new Map(prev.set(articleId, newLikeState)))
    
    // Update user behavior tracking for analytics
    if (newLikeState) {
      userBehaviorRef.current.articlesLiked++
      multiTierCacheManager.updateUserBehavior('article_like', { articleId })
    }
    
    // Background sync with optimistic update mechanism
    multiTierCacheManager.optimisticUpdate(articleId, 'like', newLikeState)
    
    logger.debug(`🔐 Supabase like update: ${articleId} = ${newLikeState}`)
    
    return newLikeState
  }, [supabaseAuth])

  // Enhanced bookmark toggle with Supabase integration
  const toggleBookmark = useCallback(async (article) => {
    // Use Supabase auth's optimistic bookmark function
    const newBookmarkState = await supabaseAuth.toggleBookmark(article)
    
    // Update local optimistic state for immediate feedback
    const articleId = article.id || article.slug || article.link
    setOptimisticBookmarks(prev => new Map(prev.set(articleId, newBookmarkState)))
    
    // Update analytics tracking
    multiTierCacheManager.optimisticUpdate(articleId, 'bookmark', newBookmarkState)
    
    logger.debug(`🔖 Supabase bookmark update: ${articleId} = ${newBookmarkState}`)
    
    return newBookmarkState
  }, [supabaseAuth])

  // Track article view with Supabase and intelligent analytics
  const trackArticleView = useCallback((article, viewDuration = null) => {
    const articleId = article.id || article.slug || article.link
    const currentViews = optimisticViews.get(articleId) ?? 0
    
    // Optimistic view count increment
    setOptimisticViews(prev => new Map(prev.set(articleId, currentViews + 1)))
    
    // Track reading time and sync with Supabase
    if (viewDuration) {
      userBehaviorRef.current.totalReadingTime += viewDuration
      
      // Calculate scroll percentage (estimate based on reading time)
      const scrollPercentage = Math.min(100, Math.floor((viewDuration / 1000) * 10))
      
      // Track in Supabase reading history
      supabaseAuth.trackArticleRead(article, viewDuration, scrollPercentage)
      
      // Also track in MultiTierCacheManager for analytics
      multiTierCacheManager.updateUserBehavior('article_read', { 
        articleId, 
        duration: viewDuration,
        scrollPercentage
      })
    }
    
    // Background sync
    multiTierCacheManager.optimisticUpdate(articleId, 'view', currentViews + 1)
    
  }, [optimisticViews, supabaseAuth])

  // Intelligent scroll tracking with smooth performance
  useEffect(() => {
    if (!enableInfiniteScroll) return

    let scrollTimeout
    let lastScrollY = window.scrollY
    let lastScrollTime = Date.now()

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const currentTime = Date.now()
      const scrollDelta = currentScrollY - lastScrollY
      const timeDelta = currentTime - lastScrollTime
      
      // Calculate scroll velocity for optimization
      const velocity = Math.abs(scrollDelta) / Math.max(timeDelta, 1)
      setScrollVelocity(velocity)
      
      // Update scroll direction
      if (scrollDelta > 0) {
        setScrollDirection('down')
      } else if (scrollDelta < 0) {
        setScrollDirection('up')
      }
      
      setIsScrolling(true)
      scrollPositionRef.current = currentScrollY
      
      // Clear existing timeout
      clearTimeout(scrollTimeout)
      
      // Set scrolling to false after scroll ends
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false)
        
        // Track scroll smoothness
        const smoothness = Math.max(0, 100 - (velocity * 2))
        setPerformanceMetrics(prev => ({ 
          ...prev, 
          scrollSmoothness: smoothness 
        }))
      }, 100)
      
      // Infinite scroll trigger with smooth loading
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollPercentage = currentScrollY / (documentHeight - windowHeight)
      
      // Track 25% scroll for scroll-to-top button
      setHasReached25Percent(scrollPercentage >= 0.25)
      
      // Trigger load more when 80% scrolled (earlier than typical)
      if (scrollPercentage >= 0.8 && hasMore && !loadingMore) {
        loadMoreFeeds()
      }
      
      lastScrollY = currentScrollY
      lastScrollTime = currentTime
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [enableInfiniteScroll, hasMore, loadingMore, loadMoreFeeds])

  // Article visibility tracking with viewport detection
  useEffect(() => {
    if (!window.IntersectionObserver) return

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: [0.25, 0.5, 0.75] // Track multiple visibility levels
    }

    const handleIntersection = (entries) => {
      entries.forEach(entry => {
        const articleId = entry.target.getAttribute('data-article-id')
        if (!articleId) return
        
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          // Article is prominently visible
          setVisibleArticles(prev => new Set(prev.add(articleId)))
          
          // Start reading time tracking
          if (!readingStartTimeRef.current) {
            readingStartTimeRef.current = Date.now()
          }
          
        } else if (entry.intersectionRatio < 0.25) {
          // Article is mostly out of view
          setVisibleArticles(prev => {
            const newSet = new Set(prev)
            newSet.delete(articleId)
            return newSet
          })
          
          // Track reading time if we were tracking
          if (readingStartTimeRef.current) {
            const readingTime = Date.now() - readingStartTimeRef.current
            if (readingTime > 3000) { // Only track if read for more than 3 seconds
              const article = feeds.find(f => 
                (f.id || f.slug || f.link) === articleId
              )
              if (article) {
                trackArticleView(article, readingTime)
              }
            }
            readingStartTimeRef.current = null
          }
        }
      })
    }

    const observer = new IntersectionObserver(handleIntersection, observerOptions)

    // Observe all article elements
    const articleElements = document.querySelectorAll('[data-article-id]')
    articleElements.forEach(element => observer.observe(element))

    return () => observer.disconnect()
  }, [feeds, trackArticleView])

  // Auto-refresh with background updates
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(async () => {
      // Only auto-refresh if user isn't actively scrolling
      if (!isScrolling && scrollVelocity < 0.1) {
        logger.debug('🔄 Auto-refresh (background)')
        await fetchFeeds(false)
      }
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, isScrolling, scrollVelocity, fetchFeeds])

  // Parameter change effect
  useEffect(() => {
    logger.debug('🔄 Parameters changed, refreshing feeds...')
    fetchFeeds(false)
  }, [selectedCategory, searchQuery, selectedTimeframe, sortBy])

  // Performance reporting and metrics
  useEffect(() => {
    const interval = setInterval(() => {
      const cacheStats = multiTierCacheManager.getCacheStats()
      setPerformanceMetrics(prev => ({
        ...prev,
        cacheHitRate: cacheStats.totalRequests > 0 
          ? (cacheStats.hitRate / cacheStats.totalRequests) * 100 
          : 0
      }))
    }, 10000) // Every 10 seconds

    return () => clearInterval(interval)
  }, [])

  // HYBRID utility functions with optimistic state and DirectDataService fallback
  const isLiked = useCallback((articleId) => {
    // Check optimistic state first, then Supabase auth as fallback
    return optimisticLikes.get(articleId) ?? supabaseAuth.isLiked(articleId)
  }, [optimisticLikes, supabaseAuth])

  const isBookmarked = useCallback((articleId) => {
    // Check optimistic state first, then Supabase auth as fallback
    return optimisticBookmarks.get(articleId) ?? supabaseAuth.isBookmarked(articleId)
  }, [optimisticBookmarks, supabaseAuth])

  const getViewCount = useCallback((article) => {
    const articleId = article.id || article.slug || article.link
    const optimisticCount = optimisticViews.get(articleId) ?? 0
    const originalCount = article.view_count || 0
    return originalCount + optimisticCount
  }, [optimisticViews])

  // CLIENT-CACHE-FIRST force refresh with all cache clearing
  const forceRefresh = useCallback(async () => {
    logger.debug('🚀 CLIENT-CACHE-FIRST force refresh - clearing all caches...')
    
    setLoading(true)
    setError(null)
    
    try {
      // Clear all cache systems - CLIENT CACHE FIRST
      await clientCache.clearCache('articles', selectedCategory)
      multiTierCacheManager.clearCache()
      directDataService.clearCache()
      
      logger.debug('💾 All caches cleared (client + server)')
      
      // Reset optimistic state
      setOptimisticLikes(new Map())
      setOptimisticBookmarks(new Map()) 
      setOptimisticViews(new Map())
      
      // Fetch fresh data (will be cached immediately)
      await fetchFeeds(false)
      
      logger.debug('✅ Force refresh completed with fresh cache')
      return { success: true }
      
    } catch (error) {
      logger.error('❌ Force refresh failed:', error)
      setError(error.message)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [fetchFeeds, selectedCategory])

  // Scroll to top functionality
  const scrollToTop = useCallback(() => {
    window.scrollTo({ 
      top: 0, 
      behavior: 'smooth' 
    })
    setCurrentIndex(0)
  }, [])

  // Get performance insights and analytics
  const getPerformanceInsights = useCallback(() => {
    return {
      ...performanceMetrics,
      cacheStats: multiTierCacheManager.getCacheStats(),
      userBehavior: userBehaviorRef.current,
      visibleArticleCount: visibleArticles.size,
      scrollMetrics: {
        direction: scrollDirection,
        velocity: scrollVelocity,
        isScrolling
      }
    }
  }, [performanceMetrics, visibleArticles.size, scrollDirection, scrollVelocity, isScrolling])

  return {
    // Feed data with intelligent optimizations and interest-based prioritization
    feeds: prioritizedFeeds,
    rawFeeds: feeds, // Original feeds without prioritization
    loading,
    loadingMore,
    error,
    totalCount,
    hasMore,
    currentIndex,
    currentPage,
    
    // Optimistic user interactions
    toggleLike,
    toggleBookmark,
    trackArticleView,
    isLiked,
    isBookmarked,
    getViewCount,
    
    // Actions
    loadFeeds: fetchFeeds,
    loadMoreFeeds,
    refreshFeeds: () => fetchFeeds(false),
    forceRefresh,
    scrollToTop,
    
    // Performance and behavioral insights
    visibleArticles,
    scrollDirection,
    scrollVelocity,
    isScrolling,
    hasReached25Percent,
    performanceMetrics,
    getPerformanceInsights,
    
    // Cache manager access
    cacheManager: multiTierCacheManager,
    
    // Status flags
    isEmpty: !loading && feeds.length === 0,
    isInitialLoad: loading && feeds.length === 0,
    
    // User ID and auth data
    userId,
    user: supabaseAuth.user,
    bookmarks: supabaseAuth.bookmarks,
    likes: supabaseAuth.likes,
    readingHistory: supabaseAuth.readingHistory,
    preferences: supabaseAuth.preferences,
    userDataLoading: supabaseAuth.userDataLoading,
    userDataError: supabaseAuth.userDataError,
    getUserStats: supabaseAuth.getUserStats,
    updatePreferences: supabaseAuth.updatePreferences,
    isSupabaseConfigured: supabaseAuth.isSupabaseConfigured,
    
    // Utility
    clearError: () => setError(null)
  }
}

export default useOptimizedFeeds
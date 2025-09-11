// Direct Data Service - Fast initial loading with minimal server calls
// Uses single /api/direct-sync call then processes everything locally

class DirectDataService {
  constructor() {
    this.cache = {
      articles: null,
      config: null,
      lastUpdate: null,
      version: '2.0' // Updated for hybrid architecture
    }
    
    // Load from localStorage on init
    this.loadFromStorage()
    
    // Auto-refresh every 5 minutes (only if cache is being used)
    setInterval(() => this.backgroundRefresh(), 5 * 60 * 1000)
  }

  // Load cached data from localStorage
  loadFromStorage() {
    try {
      const cached = localStorage.getItem('hm_direct_cache')
      if (cached) {
        this.cache = { ...this.cache, ...JSON.parse(cached) }
        console.log('📱 DirectDataService: Loaded from localStorage', {
          articles: this.cache.articles?.length || 0,
          cacheAge: this.cache.lastUpdate ? Date.now() - this.cache.lastUpdate : null
        })
      }
    } catch (error) {
      console.warn('DirectDataService: Failed to load cache from localStorage:', error)
    }
  }

  // Save data to localStorage
  saveToStorage() {
    try {
      localStorage.setItem('hm_direct_cache', JSON.stringify({
        ...this.cache,
        lastUpdate: Date.now()
      }))
    } catch (error) {
      console.warn('DirectDataService: Failed to save cache to localStorage:', error)
    }
  }

  // Check if cache is fresh (under 5 minutes)
  isCacheFresh() {
    if (!this.cache.lastUpdate) return false
    return (Date.now() - this.cache.lastUpdate) < (5 * 60 * 1000) // 5 minutes
  }

  // Minimal worker call only when cache is stale - SINGLE FETCH for all data
  async ensureFreshData() {
    if (this.isCacheFresh() && this.cache.articles?.length > 0) {
      return true // Cache is fresh, no worker call needed
    }

    try {
      console.log('📱 DirectDataService: Cache stale, fetching fresh data from worker...')
      
      // Single worker call to get ALL data at once
      const response = await fetch('/api/direct-sync', {
        headers: {
          'X-Cache-Strategy': 'direct-minimal',
          'X-Data-Strategy': 'initial-load' // Signal this is for initial loading
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          this.cache.articles = data.articles || []
          this.cache.config = data.config || {}
          this.cache.meta = data.meta || {}
          this.cache.lastUpdate = Date.now()
          this.saveToStorage()
          
          console.log(`✅ DirectDataService: Synced ${this.cache.articles.length} articles directly`)
          return true
        }
      }
      
      console.warn('DirectDataService: Worker sync failed, using cached data')
      return false
    } catch (error) {
      console.error('DirectDataService: Sync failed:', error)
      return false
    }
  }

  // Background refresh without blocking UI - only if cache is being actively used
  async backgroundRefresh() {
    if (this.isCacheFresh()) return
    
    try {
      console.log('🔄 DirectDataService: Background refresh...')
      await this.ensureFreshData()
    } catch (error) {
      console.warn('DirectDataService: Background refresh failed:', error)
    }
  }

  // Get pagination config directly from cache
  async getPaginationConfig() {
    await this.ensureFreshData()
    
    return this.cache.config?.pagination || {
      initialLoad: 24,
      pageSize: 12,
      preloadNextPage: true,
      cachePages: 3,
      imageCompression: true,
      previewTextLimit: 150
    }
  }

  // FAST initial articles for immediate UI response - NO API CALLS after initial sync
  async getInitialArticles({ 
    limit = 24, 
    category = null, 
    search = null, 
    sortBy = 'newest'
  } = {}) {
    
    await this.ensureFreshData()
    
    if (!this.cache.articles || this.cache.articles.length === 0) {
      return {
        articles: [],
        total: 0,
        hasMore: false,
        source: 'direct-cache-empty',
        fromCache: true
      }
    }

    let filteredArticles = [...this.cache.articles]

    // Apply filters locally - NO DATABASE/WORKER CALLS
    if (category && category !== 'all') {
      filteredArticles = filteredArticles.filter(article => 
        article.category?.toLowerCase() === category.toLowerCase()
      )
    }

    if (search?.trim()) {
      const query = search.toLowerCase().trim()
      filteredArticles = filteredArticles.filter(article => 
        article.title?.toLowerCase().includes(query) ||
        article.description?.toLowerCase().includes(query) ||
        article.content?.toLowerCase().includes(query) ||
        article.source?.toLowerCase().includes(query)
      )
    }

    // Sort locally - NO DATABASE CALLS
    filteredArticles.sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.pubDate || a.published_at)
      const dateB = new Date(b.publishedAt || b.pubDate || b.published_at)
      
      switch (sortBy) {
        case 'oldest': return dateA - dateB
        case 'source': return (a.source || '').localeCompare(b.source || '')
        case 'category': return (a.category || '').localeCompare(b.category || '')
        case 'title': return (a.title || '').localeCompare(b.title || '')
        case 'newest':
        default: return dateB - dateA
      }
    })

    // Apply initial limit for fast loading
    const initialArticles = filteredArticles.slice(0, limit)

    return {
      articles: initialArticles,
      total: filteredArticles.length,
      totalCached: this.cache.articles.length,
      hasMore: filteredArticles.length > limit,
      source: 'direct-cache-local',
      fromCache: true,
      cacheAge: Date.now() - (this.cache.lastUpdate || 0),
      processingTime: 'instant' // Local processing is instant
    }
  }

  // Get more articles for pagination - STILL LOCAL, NO SERVER CALLS
  async getMoreArticles({ 
    limit = 12, 
    offset = 0, 
    category = null, 
    search = null, 
    sortBy = 'newest'
  } = {}) {
    
    // Use same filtering logic but with offset
    const result = await this.getInitialArticles({ 
      limit: offset + limit, 
      category, 
      search, 
      sortBy 
    })
    
    // Return only the slice we need
    const articles = result.articles.slice(offset, offset + limit)
    
    return {
      ...result,
      articles,
      hasMore: (offset + limit) < result.total,
      source: 'direct-cache-pagination'
    }
  }

  // Get single article by slug - LOCAL SEARCH
  async getArticleBySlug(slug) {
    await this.ensureFreshData()
    
    if (!this.cache.articles || this.cache.articles.length === 0) {
      return null
    }

    const article = this.cache.articles.find(a => a.slug === slug)
    
    if (article) {
      // Update view count locally (sync later in background)
      article.view_count = (article.view_count || 0) + 1
      article.last_viewed_at = new Date().toISOString()
      this.saveToStorage()
      
      // Background sync view count to worker (fire and forget)
      this.trackViewBackground(slug)
    }

    return article || null
  }

  // Background view tracking - non-blocking
  async trackViewBackground(slug) {
    try {
      fetch('/api/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          slug, 
          timestamp: Date.now(),
          source: 'direct-data-service' 
        })
      }).catch(() => {}) // Silent fail
    } catch (error) {
      // Silent fail for background operations
    }
  }

  // User data management - LOCAL STORAGE ONLY
  getUserId() {
    let userId = localStorage.getItem('hm_user_id')
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2)
      localStorage.setItem('hm_user_id', userId)
    }
    return userId
  }

  getLikes() {
    try {
      const likes = localStorage.getItem('hm_user_likes')
      return likes ? new Set(JSON.parse(likes)) : new Set()
    } catch {
      return new Set()
    }
  }

  setLikes(likes) {
    try {
      localStorage.setItem('hm_user_likes', JSON.stringify([...likes]))
      return true
    } catch {
      return false
    }
  }

  getBookmarks() {
    try {
      const bookmarks = localStorage.getItem('hm_user_bookmarks')
      return bookmarks ? JSON.parse(bookmarks) : []
    } catch {
      return []
    }
  }

  setBookmarks(bookmarks) {
    try {
      localStorage.setItem('hm_user_bookmarks', JSON.stringify(bookmarks))
      return true
    } catch {
      return false
    }
  }

  toggleLike(articleId) {
    const likes = this.getLikes()
    const wasLiked = likes.has(articleId)
    
    if (wasLiked) {
      likes.delete(articleId)
    } else {
      likes.add(articleId)
    }
    
    this.setLikes(likes)
    return !wasLiked
  }

  toggleBookmark(article) {
    const bookmarks = this.getBookmarks()
    const articleId = article.id || article.slug || article.link
    const existingIndex = bookmarks.findIndex(b => 
      (b.id || b.slug || b.link) === articleId
    )
    
    if (existingIndex >= 0) {
      bookmarks.splice(existingIndex, 1)
    } else {
      bookmarks.push({
        ...article,
        savedAt: new Date().toISOString()
      })
    }
    
    this.setBookmarks(bookmarks)
    return existingIndex === -1
  }

  isLiked(articleId) {
    return this.getLikes().has(articleId)
  }

  isBookmarked(articleId) {
    return this.getBookmarks().some(b => 
      (b.id || b.slug || b.link) === articleId
    )
  }

  // Get cache statistics for monitoring
  getCacheStats() {
    return {
      articlesCount: this.cache.articles?.length || 0,
      lastUpdate: this.cache.lastUpdate,
      cacheAge: this.cache.lastUpdate ? Date.now() - this.cache.lastUpdate : null,
      isFresh: this.isCacheFresh(),
      version: this.cache.version,
      source: 'direct-data-service'
    }
  }

  // Force refresh cache
  async forceRefresh() {
    console.log('🚀 DirectDataService: Force refresh...')
    this.cache.lastUpdate = null
    return await this.ensureFreshData()
  }

  // Clear all cache
  clearCache() {
    this.cache = {
      articles: null,
      config: null,
      lastUpdate: null,
      version: '2.0'
    }
    localStorage.removeItem('hm_direct_cache')
    console.log('🗑️ DirectDataService: Cache cleared')
  }

  // Check if service is ready for fast responses
  isReady() {
    return this.cache.articles && this.cache.articles.length > 0
  }

  // Get service status for debugging
  getStatus() {
    return {
      ready: this.isReady(),
      cached: !!this.cache.articles,
      fresh: this.isCacheFresh(),
      articlesCount: this.cache.articles?.length || 0,
      lastUpdate: this.cache.lastUpdate ? new Date(this.cache.lastUpdate).toISOString() : null
    }
  }
}

// Singleton instance for fast initial loading
const directDataService = new DirectDataService()

// Initialize immediately for fastest possible initial load
directDataService.ensureFreshData().then(() => {
  console.log('📱 DirectDataService: Ready for fast responses')
}).catch(error => {
  console.warn('DirectDataService: Initial load failed, will use cache/fallbacks', error)
})

export default directDataService
// Client-side caching service for articles and feeds
// Using localStorage with IndexedDB fallback for larger datasets
import { logger } from '../utils/logger'

class ClientCacheService {
  constructor() {
    this.CACHE_PREFIX = 'hm_'
    this.CACHE_VERSION = '1.0'
    this.DEFAULT_TTL = 30 * 60 * 1000 // 30 minutes
    this.MAX_CACHE_SIZE = 5 * 1024 * 1024 // 5MB for localStorage
    this.isIndexedDBSupported = this.checkIndexedDBSupport()
  }

  // Check if IndexedDB is available
  checkIndexedDBSupport() {
    try {
      return typeof window !== 'undefined' && 'indexedDB' in window && indexedDB !== null
    } catch (e) {
      return false
    }
  }

  // Generate cache key
  getCacheKey(type, identifier = '') {
    return `${this.CACHE_PREFIX}${type}${identifier ? '_' + identifier : ''}_v${this.CACHE_VERSION}`
  }

  // Get current timestamp
  now() {
    return Date.now()
  }

  // Check if cache entry is valid
  isValid(cacheEntry) {
    if (!cacheEntry || !cacheEntry.timestamp) return false
    const ttl = cacheEntry.ttl || this.DEFAULT_TTL
    return (this.now() - cacheEntry.timestamp) < ttl
  }

  // === localStorage methods ===

  // Set data in localStorage with metadata
  setLocalStorage(key, data, ttl = this.DEFAULT_TTL) {
    try {
      const cacheEntry = {
        data,
        timestamp: this.now(),
        ttl,
        version: this.CACHE_VERSION
      }
      
      const serialized = JSON.stringify(cacheEntry)
      
      // Check if we're approaching localStorage limits
      if (serialized.length > this.MAX_CACHE_SIZE * 0.8) {
        logger.warn('ClientCache: Large cache entry, consider cleanup')
        this.cleanup()
      }
      
      localStorage.setItem(key, serialized)
      return true
    } catch (error) {
      logger.warn('ClientCache: localStorage write failed:', error.message)
      // Clear some space and try again
      this.cleanup()
      try {
        localStorage.setItem(key, JSON.stringify({ data, timestamp: this.now(), ttl }))
        return true
      } catch (retryError) {
        logger.error('ClientCache: localStorage write failed after cleanup:', retryError.message)
        return false
      }
    }
  }

  // Get data from localStorage
  getLocalStorage(key) {
    try {
      const item = localStorage.getItem(key)
      if (!item) return null
      
      const cacheEntry = JSON.parse(item)
      
      // Check if entry is valid
      if (!this.isValid(cacheEntry)) {
        localStorage.removeItem(key)
        return null
      }
      
      return cacheEntry.data
    } catch (error) {
      logger.warn('ClientCache: localStorage read failed:', error.message)
      return null
    }
  }

  // === Articles caching ===

  // Cache articles with smart deduplication
  async cacheArticles(articles, category = 'all') {
    if (!Array.isArray(articles) || articles.length === 0) return

    const key = this.getCacheKey('articles', category)
    
    // Get existing articles to merge
    const existingData = this.getLocalStorage(key)
    const existingArticles = existingData ? existingData.articles : []
    
    // Create a map for deduplication based on URL or title
    const articleMap = new Map()
    
    // Add existing articles
    existingArticles.forEach(article => {
      const dedupeKey = article.link || article.url || article.title
      if (dedupeKey) articleMap.set(dedupeKey, article)
    })
    
    // Add new articles (will overwrite if same key)
    articles.forEach(article => {
      const dedupeKey = article.link || article.url || article.title
      if (dedupeKey) articleMap.set(dedupeKey, article)
    })
    
    // Convert back to array and sort by date
    const mergedArticles = Array.from(articleMap.values())
      .sort((a, b) => {
        const dateA = new Date(a.publishedAt || a.pubDate || a.published_at || 0)
        const dateB = new Date(b.publishedAt || b.pubDate || b.published_at || 0)
        return dateB - dateA
      })
      .slice(0, 200) // Keep latest 200 articles
    
    const cacheData = {
      articles: mergedArticles,
      category,
      count: mergedArticles.length,
      lastUpdated: this.now()
    }
    
    return this.setLocalStorage(key, cacheData, 30 * 60 * 1000) // 30 minutes TTL
  }

  // Get cached articles
  async getCachedArticles(category = 'all') {
    const key = this.getCacheKey('articles', category)
    const data = this.getLocalStorage(key)
    return data ? data.articles : null
  }

  // Get cache metadata
  async getCacheInfo(category = 'all') {
    const key = this.getCacheKey('articles', category)
    const data = this.getLocalStorage(key)
    return data ? {
      count: data.count,
      lastUpdated: data.lastUpdated,
      age: this.now() - data.lastUpdated,
      isStale: !this.isValid({ timestamp: data.lastUpdated, ttl: this.DEFAULT_TTL })
    } : null
  }

  // === Feed state caching ===

  // Cache current feed state (filters, page, etc.)
  async cacheFeedState(state) {
    const key = this.getCacheKey('feed_state')
    return this.setLocalStorage(key, state, 24 * 60 * 60 * 1000) // 24 hours
  }

  // Get cached feed state
  async getCachedFeedState() {
    const key = this.getCacheKey('feed_state')
    return this.getLocalStorage(key)
  }

  // === Categories caching ===

  // Cache categories configuration
  async cacheCategories(categories) {
    const key = this.getCacheKey('categories')
    return this.setLocalStorage(key, { categories, count: categories.length }, 60 * 60 * 1000) // 1 hour
  }

  // Get cached categories
  async getCachedCategories() {
    const key = this.getCacheKey('categories')
    const data = this.getLocalStorage(key)
    return data ? data.categories : null
  }

  // === User preferences caching ===

  // Cache user interests/preferences
  async cacheUserPreferences(preferences) {
    const key = this.getCacheKey('user_prefs')
    return this.setLocalStorage(key, preferences, 7 * 24 * 60 * 60 * 1000) // 7 days
  }

  // Get cached user preferences
  async getCachedUserPreferences() {
    const key = this.getCacheKey('user_prefs')
    return this.getLocalStorage(key)
  }

  // === Cache management ===

  // Clear specific cache
  async clearCache(type, identifier = '') {
    const key = this.getCacheKey(type, identifier)
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      logger.warn('ClientCache: Clear failed:', error.message)
      return false
    }
  }

  // Clear all cache
  async clearAllCache() {
    try {
      const keys = Object.keys(localStorage)
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX))
      
      cacheKeys.forEach(key => localStorage.removeItem(key))
      
      logger.debug(`ClientCache: Cleared ${cacheKeys.length} cache entries`)
      return true
    } catch (error) {
      logger.error('ClientCache: Clear all failed:', error.message)
      return false
    }
  }

  // Cleanup expired entries
  async cleanup() {
    try {
      const keys = Object.keys(localStorage)
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX))
      let cleanedCount = 0
      
      for (const key of cacheKeys) {
        try {
          const item = localStorage.getItem(key)
          if (item) {
            const cacheEntry = JSON.parse(item)
            if (!this.isValid(cacheEntry)) {
              localStorage.removeItem(key)
              cleanedCount++
            }
          }
        } catch (e) {
          // Invalid JSON, remove it
          localStorage.removeItem(key)
          cleanedCount++
        }
      }
      
      if (cleanedCount > 0) {
        logger.debug(`ClientCache: Cleaned up ${cleanedCount} expired entries`)
      }
      
      return cleanedCount
    } catch (error) {
      logger.warn('ClientCache: Cleanup failed:', error.message)
      return 0
    }
  }

  // Get cache statistics
  async getCacheStats() {
    try {
      const keys = Object.keys(localStorage)
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX))
      
      let totalSize = 0
      let validEntries = 0
      let expiredEntries = 0
      
      for (const key of cacheKeys) {
        try {
          const item = localStorage.getItem(key)
          if (item) {
            totalSize += item.length * 2 // Rough size estimation (UTF-16)
            const cacheEntry = JSON.parse(item)
            if (this.isValid(cacheEntry)) {
              validEntries++
            } else {
              expiredEntries++
            }
          }
        } catch (e) {
          expiredEntries++
        }
      }
      
      return {
        totalEntries: cacheKeys.length,
        validEntries,
        expiredEntries,
        totalSizeKB: Math.round(totalSize / 1024),
        maxSizeKB: Math.round(this.MAX_CACHE_SIZE / 1024),
        usagePercent: Math.round((totalSize / this.MAX_CACHE_SIZE) * 100)
      }
    } catch (error) {
      logger.warn('ClientCache: Stats failed:', error.message)
      return {
        totalEntries: 0,
        validEntries: 0,
        expiredEntries: 0,
        totalSizeKB: 0,
        maxSizeKB: Math.round(this.MAX_CACHE_SIZE / 1024),
        usagePercent: 0
      }
    }
  }

  // Preload cache with essential data
  async preloadCache() {
    logger.debug('ClientCache: Starting preload...')
    
    // Clean up expired entries first
    await this.cleanup()
    
    // Check if we have recent articles
    const cacheInfo = await this.getCacheInfo('all')
    if (cacheInfo && !cacheInfo.isStale) {
      logger.debug('ClientCache: Cache is fresh, no preload needed')
      return true
    }
    
    // Cache needs refresh
    logger.debug('ClientCache: Cache is stale or empty, needs refresh')
    return false
  }

  // Initialize cache service
  async initialize() {
    logger.debug('ClientCache: Initializing...')
    
    // Run cleanup on startup
    const cleaned = await this.cleanup()
    
    // Get cache stats
    const stats = await this.getCacheStats()
    logger.debug('ClientCache: Initialized', {
      entries: stats.validEntries,
      sizeKB: stats.totalSizeKB,
      cleanedEntries: cleaned
    })
    
    return true
  }
}

// Export singleton instance
const clientCache = new ClientCacheService()

export default clientCache
export { ClientCacheService }
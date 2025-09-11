// worker/services/CacheService.js
export class CacheService {
  constructor(newsStorageKV, contentCacheKV, articleService = null) {
    this.newsStorage = newsStorageKV     // For articles and news-related cache
    this.contentCache = contentCacheKV   // For search results and other non-news content
    this.articleService = articleService // Optional D1 database service for article persistence
    
    this.TTL = {
      ARTICLES: 14 * 24 * 60 * 60,        // 2 weeks
      CONFIG: 30 * 24 * 60 * 60,          // 30 days 
      SEARCH: 60 * 60,                    // 1 hour
      METADATA: 60 * 60,                  // 1 hour
      LOCKS: 30 * 60                      // 30 minutes
    }
    
    this.KEYS = {
      // Article cache (NEWS_STORAGE)
      ALL_ARTICLES: 'cache:all_articles',
      LAST_REFRESH: 'cache:last_refresh',
      ARTICLE_COUNT: 'cache:article_count',
      REFRESH_LOCK: 'cache:refresh_lock',
      SCHEDULED_LOCK: 'cache:scheduled_lock',
      LAST_SCHEDULED_RUN: 'cache:last_scheduled_run',
      
      // RSS metadata cache (NEWS_STORAGE)
      RSS_METADATA: 'cache:rss_metadata',
      FEED_STATUS: 'cache:feed_status',
      
      // Content cache (CONTENT_CACHE) - ONLY for search and general content
      SEARCH_PREFIX: 'search:',
      USER_PREFIX: 'user:'
      // REMOVED: IMAGE_PREFIX - using Cloudflare Images instead
      // REMOVED: ANALYTICS_PREFIX - using Analytics Engine instead
    }
  }

  // === ARTICLE CACHING (NEWS_STORAGE) ===
  
  async getCachedArticles() {
    try {
      console.log('🔍 Getting cached articles from NEWS_STORAGE...')
      const cached = await this.newsStorage?.get(this.KEYS.ALL_ARTICLES, { type: 'json' })
      
      if (cached && Array.isArray(cached)) {
        console.log(`✅ Retrieved ${cached.length} articles from NEWS_STORAGE`)
        return cached
      } else if (cached) {
        console.log('⚠️ Cached data exists but is not an array:', typeof cached)
        return []
      } else {
        console.log('ℹ️ No cached articles found in NEWS_STORAGE')
        return []
      }
    } catch (error) {
      console.log('❌ Error retrieving cached articles:', error)
      return []
    }
  }

  async setCachedArticles(articles) {
    try {
      if (!this.newsStorage) {
        console.log('⚠️ NEWS_STORAGE not available, skipping cache')
        return articles
      }

      const sortedArticles = articles
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, 40000) // Max articles limit - TODO: Make configurable

      // Store articles in NEWS_STORAGE
      await this.newsStorage.put(
        this.KEYS.ALL_ARTICLES, 
        JSON.stringify(sortedArticles),
        { expirationTtl: this.TTL.ARTICLES }
      )

      // Store metadata in NEWS_STORAGE
      await this.newsStorage.put(
        this.KEYS.LAST_REFRESH, 
        new Date().toISOString(),
        { expirationTtl: this.TTL.ARTICLES }
      )

      await this.newsStorage.put(
        this.KEYS.ARTICLE_COUNT, 
        sortedArticles.length.toString(),
        { expirationTtl: this.TTL.ARTICLES }
      )

      // Store articles in D1 database if ArticleService is available
      let d1SavedCount = 0
      if (this.articleService) {
        console.log(`💾 Saving ${sortedArticles.length} articles to D1 database...`)
        
        for (const article of sortedArticles) {
          try {
            // Map RSS article format to D1 article format
            const articleData = {
              title: article.title,
              description: article.description || article.contentSnippet || '',
              content: article.fullContent || article.content || article.contentSnippet || '',
              author: article.author || article.creator || '',
              source: article.source || 'Unknown',
              source_url: article.sourceUrl || '',
              category: article.category || 'general',
              tags: Array.isArray(article.keywords) ? article.keywords.join(', ') : (article.tags || ''),
              published_at: article.pubDate || article.publishedAt || new Date().toISOString(),
              image_url: article.imageUrl || article.image_url || '',
              optimized_image_url: article.optimizedImageUrl || '',
              original_url: article.link || article.url || '',
              rss_guid: typeof article.guid === 'object' ? (article.guid['#text'] || JSON.stringify(article.guid)) : (article.id || article.guid || ''),
              status: 'published',
              priority: typeof article.priority === 'boolean' ? (article.priority ? 1 : 0) : (article.priority || 0)
            }
            
            const result = await this.articleService.upsertArticle(articleData)
            if (result) {
              d1SavedCount++
            }
          } catch (articleError) {
            console.warn(`⚠️ Failed to save article "${article.title}" to D1:`, articleError.message)
            // Continue with other articles even if one fails
          }
        }
        
        console.log(`💾 Saved ${d1SavedCount}/${sortedArticles.length} articles to D1 database`)
      }

      console.log(`✅ Cached ${sortedArticles.length} articles in NEWS_STORAGE${this.articleService ? ` and ${d1SavedCount} in D1` : ''}`)
      return sortedArticles
    } catch (error) {
      console.log('❌ Error caching articles:', error)
      return articles
    }
  }

  async getArticleMetadata() {
    try {
      const lastRefresh = await this.newsStorage?.get(this.KEYS.LAST_REFRESH)
      const articleCount = await this.newsStorage?.get(this.KEYS.ARTICLE_COUNT)
      
      return {
        lastRefresh: lastRefresh || 'Never',
        articleCount: parseInt(articleCount) || 0,
        cacheStatus: lastRefresh ? 'active' : 'empty'
      }
    } catch (error) {
      console.log('❌ Error getting article metadata:', error)
      return {
        lastRefresh: 'Error',
        articleCount: 0,
        cacheStatus: 'error'
      }
    }
  }

  // === LOCK MANAGEMENT (NEWS_STORAGE) ===
  
  async acquireRefreshLock() {
    if (!this.newsStorage) return false
    
    const lockKey = this.KEYS.REFRESH_LOCK
    const lockValue = `lock-${Date.now()}-${Math.random()}`
    
    try {
      await this.newsStorage.put(lockKey, lockValue, { 
        expirationTtl: this.TTL.LOCKS,
        metadata: { acquiredAt: new Date().toISOString() }
      })
      
      const currentLock = await this.newsStorage.get(lockKey)
      const acquired = currentLock === lockValue
      
      if (acquired) {
        console.log('🔒 Refresh lock acquired in NEWS_STORAGE')
      } else {
        console.log('⚠️ Failed to acquire refresh lock - another process running')
      }
      
      return acquired
    } catch (error) {
      console.log('❌ Error acquiring refresh lock:', error)
      return false
    }
  }

  async releaseRefreshLock() {
    try {
      if (this.newsStorage) {
        await this.newsStorage.delete(this.KEYS.REFRESH_LOCK)
        console.log('🔓 Refresh lock released from NEWS_STORAGE')
      }
    } catch (error) {
      console.log('❌ Error releasing refresh lock:', error)
    }
  }

  async isRefreshLocked() {
    try {
      const lock = await this.newsStorage?.get(this.KEYS.REFRESH_LOCK)
      return !!lock
    } catch (error) {
      return false
    }
  }

  // === SCHEDULED REFRESH TRACKING (NEWS_STORAGE) ===
  
  async getLastScheduledRun() {
    try {
      return await this.newsStorage?.get(this.KEYS.LAST_SCHEDULED_RUN)
    } catch (error) {
      return null
    }
  }

  async setLastScheduledRun() {
    try {
      if (this.newsStorage) {
        await this.newsStorage.put(
          this.KEYS.LAST_SCHEDULED_RUN,
          new Date().toISOString(),
          { expirationTtl: this.TTL.ARTICLES }
        )
        console.log('✅ Last scheduled run timestamp saved to NEWS_STORAGE')
      }
    } catch (error) {
      console.log('❌ Error setting last scheduled run:', error)
    }
  }

  async shouldRunScheduledRefresh(intervalSeconds = 3600) {
    try {
      const lastRun = await this.getLastScheduledRun()
      if (!lastRun) return true

      const lastRunTime = new Date(lastRun)
      const now = new Date()
      const timeDiff = (now - lastRunTime) / 1000

      return timeDiff >= intervalSeconds
    } catch (error) {
      console.log('❌ Error checking scheduled refresh status:', error)
      return true
    }
  }

  // === RSS METADATA CACHE (NEWS_STORAGE) ===
  
  async getCachedRSSMetadata() {
    try {
      return await this.newsStorage?.get(this.KEYS.RSS_METADATA, { type: 'json' })
    } catch (error) {
      return null
    }
  }

  async setCachedRSSMetadata(metadata) {
    try {
      if (!this.newsStorage) return

      await this.newsStorage.put(
        this.KEYS.RSS_METADATA,
        JSON.stringify(metadata),
        { expirationTtl: this.TTL.METADATA }
      )
      console.log('✅ RSS metadata cached in NEWS_STORAGE')
    } catch (error) {
      console.log('❌ Error caching RSS metadata:', error)
    }
  }

  // === SEARCH CACHE (CONTENT_CACHE) ===
  
  async getCachedSearch(query, category, limit) {
    try {
      const searchKey = `${this.KEYS.SEARCH_PREFIX}${this.hashString(`${query}-${category}-${limit}`)}`
      return await this.contentCache?.get(searchKey, { type: 'json' })
    } catch (error) {
      return null
    }
  }

  async setCachedSearch(query, category, limit, results) {
    try {
      if (!this.contentCache) return

      const searchKey = `${this.KEYS.SEARCH_PREFIX}${this.hashString(`${query}-${category}-${limit}`)}`
      await this.contentCache.put(searchKey, JSON.stringify(results), {
        expirationTtl: this.TTL.SEARCH
      })
      console.log('✅ Search results cached in CONTENT_CACHE')
    } catch (error) {
      console.log('❌ Error caching search results:', error)
    }
  }

  // REMOVED: Image caching methods - using Cloudflare Images instead
  // REMOVED: Analytics caching methods - using Analytics Engine instead

  // === CACHE MANAGEMENT ===
  
  async clearAllCache() {
    const results = { newsStorage: null, contentCache: null }

    // Clear NEWS_STORAGE (articles and news data)
    if (this.newsStorage) {
      try {
        console.log('🗑️ Clearing NEWS_STORAGE...')
        
        const newsKeysToDelete = [
          this.KEYS.ALL_ARTICLES,
          this.KEYS.LAST_REFRESH,
          this.KEYS.ARTICLE_COUNT,
          this.KEYS.REFRESH_LOCK,
          this.KEYS.SCHEDULED_LOCK,
          this.KEYS.LAST_SCHEDULED_RUN,
          this.KEYS.RSS_METADATA,
          this.KEYS.FEED_STATUS
        ]
        
        const newsDeletePromises = newsKeysToDelete.map(key => 
          this.newsStorage.delete(key).catch(err => 
            console.log(`Failed to delete ${key} from NEWS_STORAGE:`, err)
          )
        )
        
        await Promise.all(newsDeletePromises)
        
        results.newsStorage = {
          success: true,
          clearedKeys: newsKeysToDelete.length,
          keys: newsKeysToDelete
        }
        
        console.log('✅ NEWS_STORAGE cleared successfully')
      } catch (error) {
        console.log('❌ Error clearing NEWS_STORAGE:', error)
        results.newsStorage = { success: false, error: error.message }
      }
    }

    // Clear CONTENT_CACHE (search results only)
    if (this.contentCache) {
      try {
        console.log('🗑️ Clearing CONTENT_CACHE search results...')
        
        results.contentCache = {
          success: true,
          message: 'Search cache items will expire based on TTL',
          note: 'Only search results are cached here - images use Cloudflare Images, analytics use Analytics Engine'
        }
        
        console.log('✅ CONTENT_CACHE cleared (TTL-based expiration)')
      } catch (error) {
        console.log('❌ Error clearing CONTENT_CACHE:', error)
        results.contentCache = { success: false, error: error.message }
      }
    }
    
    const overallSuccess = (!this.newsStorage || results.newsStorage?.success) && 
                          (!this.contentCache || results.contentCache?.success)
    
    return {
      success: overallSuccess,
      message: 'Cache clearing completed',
      details: results,
      clearedFrom: {
        newsStorage: !!this.newsStorage,
        contentCache: !!this.contentCache
      },
      note: 'Images and analytics are handled by dedicated Cloudflare services',
      timestamp: new Date().toISOString()
    }
  }

  async getCacheStats() {
    try {
      const metadata = await this.getArticleMetadata()
      const isLocked = await this.isRefreshLocked()
      const lastScheduled = await this.getLastScheduledRun()
      
      return {
        articles: {
          count: metadata.articleCount,
          lastRefresh: metadata.lastRefresh,
          status: metadata.cacheStatus,
          storage: 'NEWS_STORAGE'
        },
        locks: {
          refreshLocked: isLocked,
          storage: 'NEWS_STORAGE'
        },
        scheduled: {
          lastRun: lastScheduled || 'Never',
          storage: 'NEWS_STORAGE'
        },
        cache: {
          newsStorage: !!this.newsStorage,
          contentCache: !!this.contentCache,
          provider: 'Cloudflare KV'
        },
        services: {
          images: 'Cloudflare Images (not KV)',
          analytics: 'Analytics Engine (not KV)',
          search: 'CONTENT_CACHE KV'
        }
      }
    } catch (error) {
      return {
        error: error.message,
        cache: {
          newsStorage: !!this.newsStorage,
          contentCache: !!this.contentCache,
          provider: 'Cloudflare KV'
        }
      }
    }
  }

  // === UTILITY METHODS ===
  
  hashString(str) {
    let hash = 0
    if (str.length === 0) return hash.toString(36)
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    
    return Math.abs(hash).toString(36)
  }

  formatCacheKey(key) {
    return key.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()
  }

  async getCacheInfo() {
    try {
      return {
        provider: 'Cloudflare KV + Dedicated Services',
        newsStorage: !!this.newsStorage,
        contentCache: !!this.contentCache,
        ttlConfig: this.TTL,
        keyPrefixes: this.KEYS,
        separation: {
          'NEWS_STORAGE': 'Articles, RSS metadata, refresh locks, scheduled runs',
          'CONTENT_CACHE': 'Search results cache only',
          'Cloudflare Images': 'Image optimization and delivery',
          'Analytics Engine': 'Event tracking and analytics data'
        }
      }
    } catch (error) {
      return { error: error.message }
    }
  }
}
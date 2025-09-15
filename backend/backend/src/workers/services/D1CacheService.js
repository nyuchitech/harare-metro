// worker/services/D1CacheService.js
// Replaces CacheService.js - uses D1 instead of KV storage

import { D1Service } from '../../../database/D1Service.js'

export class D1CacheService {
  constructor(database, articleService = null) {
    this.d1 = new D1Service(database)
    this.articleService = articleService
    
    this.TTL = {
      ARTICLES: 14 * 24 * 60 * 60,        // 2 weeks
      CONFIG: 30 * 24 * 60 * 60,          // 30 days 
      SEARCH: 60 * 60,                    // 1 hour
      METADATA: 60 * 60,                  // 1 hour
      LOCKS: 30 * 60                      // 30 minutes
    }
  }

  // =============================================================================
  // ARTICLE CACHING METHODS
  // =============================================================================

  async getCachedArticles() {
    try {
      console.log('🔍 Getting cached articles from D1...')
      
      const articles = await this.d1.getArticles({
        limit: 40000, // Get all articles
        orderBy: 'published_at',
        orderDirection: 'DESC'
      })
      
      console.log(`✅ Retrieved ${articles.length} articles from D1`)
      return articles
    } catch (error) {
      console.log('❌ Error retrieving cached articles from D1:', error)
      return []
    }
  }

  async setCachedArticles(articles) {
    try {
      console.log(`💾 Caching ${articles.length} articles in D1 database...`)
      
      const sortedArticles = articles
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, 40000) // Max articles limit

      let savedCount = 0
      let errorCount = 0
      
      for (const article of sortedArticles) {
        try {
          // Map RSS article format to D1 article format
          const articleData = {
            title: article.title,
            description: article.description || article.contentSnippet || '',
            content: article.fullContent || article.content || article.contentSnippet || '',
            content_snippet: article.contentSnippet || article.description?.substring(0, 400) || '',
            author: article.author || article.creator || '',
            source: article.source || 'Unknown',
            source_id: article.sourceId || null,
            source_url: article.sourceUrl || '',
            category_id: article.category || 'general',
            tags: Array.isArray(article.keywords) ? article.keywords : (article.tags || []),
            published_at: article.pubDate || article.publishedAt || new Date().toISOString(),
            image_url: article.imageUrl || article.image_url || '',
            optimized_image_url: article.optimizedImageUrl || '',
            original_url: article.link || article.url || '',
            rss_guid: typeof article.guid === 'object' ? 
              (article.guid['#text'] || JSON.stringify(article.guid)) : 
              (article.id || article.guid || ''),
            status: 'published',
            priority: typeof article.priority === 'boolean' ? 
              (article.priority ? 1 : 0) : 
              (article.priority || 0)
          }
          
          const result = await this.d1.upsertArticle(articleData)
          if (result) {
            savedCount++
          }
        } catch (articleError) {
          console.warn(`⚠️ Failed to save article "${article.title}" to D1:`, articleError.message)
          errorCount++
        }
      }

      // Update cache metadata
      await this.d1.setCacheData(
        'articles_last_refresh',
        'metadata', 
        {
          lastRefresh: new Date().toISOString(),
          articleCount: savedCount,
          totalProcessed: sortedArticles.length,
          errorCount: errorCount
        },
        this.TTL.METADATA
      )

      console.log(`✅ Cached ${savedCount}/${sortedArticles.length} articles in D1 (${errorCount} errors)`)
      return sortedArticles
    } catch (error) {
      console.log('❌ Error caching articles in D1:', error)
      return articles
    }
  }

  async getArticleMetadata() {
    try {
      const metadata = await this.d1.getCacheData('articles_last_refresh', 'metadata')
      
      if (metadata) {
        return {
          lastRefresh: metadata.lastRefresh,
          articleCount: metadata.articleCount || 0,
          cacheStatus: 'active'
        }
      }

      // Fallback - get count directly from D1
      const count = await this.d1.getArticleCount()
      return {
        lastRefresh: 'Unknown',
        articleCount: count,
        cacheStatus: count > 0 ? 'active' : 'empty'
      }
    } catch (error) {
      console.log('❌ Error getting article metadata from D1:', error)
      return {
        lastRefresh: 'Error',
        articleCount: 0,
        cacheStatus: 'error'
      }
    }
  }

  // =============================================================================
  // LOCK MANAGEMENT
  // =============================================================================

  async acquireRefreshLock() {
    try {
      const lockKey = 'refresh_lock'
      const lockValue = `lock-${Date.now()}-${Math.random()}`
      
      // Check if lock already exists and is still valid
      const existingLock = await this.d1.getCacheData(lockKey, 'lock')
      if (existingLock) {
        console.log('⚠️ Refresh lock already exists - another process running')
        return false
      }
      
      // Set new lock
      await this.d1.setCacheData(lockKey, 'lock', {
        lockValue,
        acquiredAt: new Date().toISOString(),
        process: 'rss-refresh'
      }, this.TTL.LOCKS)
      
      console.log('🔒 Refresh lock acquired in D1')
      return true
    } catch (error) {
      console.log('❌ Error acquiring refresh lock:', error)
      return false
    }
  }

  async releaseRefreshLock() {
    try {
      // D1 doesn't have a direct delete cache method, but we can expire it immediately
      await this.d1.setCacheData('refresh_lock', 'lock', null, 1) // Expire in 1 second
      console.log('🔓 Refresh lock released from D1')
    } catch (error) {
      console.log('❌ Error releasing refresh lock:', error)
    }
  }

  async isRefreshLocked() {
    try {
      const lock = await this.d1.getCacheData('refresh_lock', 'lock')
      return !!lock
    } catch (error) {
      return false
    }
  }

  // =============================================================================
  // SCHEDULED REFRESH TRACKING
  // =============================================================================

  async getLastScheduledRun() {
    try {
      const data = await this.d1.getCacheData('last_scheduled_run', 'metadata')
      return data?.timestamp || null
    } catch (error) {
      return null
    }
  }

  async setLastScheduledRun() {
    try {
      await this.d1.setCacheData(
        'last_scheduled_run',
        'metadata',
        { timestamp: new Date().toISOString() },
        this.TTL.METADATA
      )
      console.log('✅ Last scheduled run timestamp saved to D1')
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

  // =============================================================================
  // RSS METADATA CACHE
  // =============================================================================

  async getCachedRSSMetadata() {
    try {
      return await this.d1.getCacheData('rss_metadata', 'metadata')
    } catch (error) {
      return null
    }
  }

  async setCachedRSSMetadata(metadata) {
    try {
      await this.d1.setCacheData(
        'rss_metadata',
        'metadata',
        metadata,
        this.TTL.METADATA
      )
      console.log('✅ RSS metadata cached in D1')
    } catch (error) {
      console.log('❌ Error caching RSS metadata:', error)
    }
  }

  // =============================================================================
  // SEARCH CACHE
  // =============================================================================

  async getCachedSearch(query, category, limit) {
    try {
      const searchKey = `search_${this.hashString(`${query}-${category}-${limit}`)}`
      return await this.d1.getCacheData(searchKey, 'search')
    } catch (error) {
      return null
    }
  }

  async setCachedSearch(query, category, limit, results) {
    try {
      const searchKey = `search_${this.hashString(`${query}-${category}-${limit}`)}`
      await this.d1.setCacheData(searchKey, 'search', results, this.TTL.SEARCH)
      console.log('✅ Search results cached in D1')
    } catch (error) {
      console.log('❌ Error caching search results:', error)
    }
  }

  // =============================================================================
  // FEED STATUS MANAGEMENT
  // =============================================================================

  async updateFeedStatus(sourceId, status, errorMessage = null, processingDuration = null, articlesFetched = 0) {
    try {
      await this.d1.updateFeedStatus(sourceId, status, errorMessage, processingDuration, articlesFetched)
      console.log(`✅ Updated feed status for ${sourceId}: ${status}`)
    } catch (error) {
      console.log(`❌ Error updating feed status for ${sourceId}:`, error)
    }
  }

  async getFeedStatus(sourceId) {
    try {
      return await this.d1.getFeedStatus(sourceId)
    } catch (error) {
      console.log(`❌ Error getting feed status for ${sourceId}:`, error)
      return null
    }
  }

  // =============================================================================
  // CACHE MANAGEMENT
  // =============================================================================

  async clearAllCache() {
    try {
      console.log('🗑️ Clearing expired cache from D1...')
      
      const result = await this.d1.clearExpiredCache()
      
      console.log('✅ D1 cache cleared successfully')
      
      return {
        success: true,
        message: 'D1 cache cleared successfully',
        details: {
          d1Database: {
            success: result.success,
            deletedRows: result.deletedRows || 0,
            note: 'Only expired cache items were removed. Articles remain intact.'
          }
        },
        clearedFrom: {
          d1Database: true,
          kvStorage: false
        },
        note: 'Articles are permanent in D1. Only cache metadata was cleared.',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.log('❌ Error clearing D1 cache:', error)
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  async getCacheStats() {
    try {
      const metadata = await this.getArticleMetadata()
      const isLocked = await this.isRefreshLocked()
      const lastScheduled = await this.getLastScheduledRun()
      const dbStats = await this.d1.getStats()
      
      return {
        articles: {
          count: metadata.articleCount,
          lastRefresh: metadata.lastRefresh,
          status: metadata.cacheStatus,
          storage: 'D1 Database'
        },
        locks: {
          refreshLocked: isLocked,
          storage: 'D1 Database'
        },
        scheduled: {
          lastRun: lastScheduled || 'Never',
          storage: 'D1 Database'
        },
        database: {
          provider: 'Cloudflare D1',
          healthy: dbStats.error ? false : true,
          stats: dbStats
        },
        services: {
          articles: 'D1 Database (not KV)',
          configuration: 'D1 Database (not KV)', 
          cache: 'D1 Database (not KV)',
          images: 'Cloudflare Images',
          analytics: 'Analytics Engine'
        }
      }
    } catch (error) {
      return {
        error: error.message,
        database: {
          provider: 'Cloudflare D1',
          healthy: false
        }
      }
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

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
      const dbStats = await this.d1.getStats()
      
      return {
        provider: 'Cloudflare D1 Database',
        database: !!this.d1.db,
        ttlConfig: this.TTL,
        storage: {
          'Articles': 'Permanent storage in D1 articles table',
          'Cache Metadata': 'Temporary cache with TTL in D1 cache_metadata table',
          'RSS Sources': 'Configuration in D1 rss_sources table',
          'Categories': 'Configuration in D1 categories table',
          'Feed Status': 'Processing status in D1 feed_status table'
        },
        statistics: dbStats
      }
    } catch (error) {
      return { error: error.message }
    }
  }

  // Health check
  async healthCheck() {
    return await this.d1.healthCheck()
  }
}

export default D1CacheService
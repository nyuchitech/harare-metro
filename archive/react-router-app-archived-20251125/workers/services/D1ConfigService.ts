// worker/services/D1ConfigService.js
// Replaces ConfigService.js - uses D1 instead of KV storage

import { D1Service } from '../../database/D1Service.js'

export class D1ConfigService {
  constructor(database) {
    this.d1 = new D1Service(database)
    this.fallbackConfig = this.initializeFallbackConfig()
  }

  // Initialize comprehensive fallback configuration
  initializeFallbackConfig() {
    return {
      // System settings with mobile-optimized defaults
      system: {
        siteName: 'Harare Metro',
        maxTotalArticles: 40000,
        maxArticlesPerSource: 500,
        articleContentLimit: 1000000,
        
        // Mobile-first pagination
        pagination: {
          initialLoad: 24,
          pageSize: 12,
          preloadNextPage: true,
          cachePages: 3,
          imageCompression: true,
          previewTextLimit: 400
        },
        
        // API limits
        apiMinLimit: 12,
        apiMaxLimit: 24,
        
        // Smart caching for mobile
        cacheStrategy: {
          articlesTtl: 14 * 24 * 60 * 60, // 2 weeks
          refreshInterval: 60,
          maxCacheSize: '100MB',
          mobileMaxCache: '25MB',
          preloadCache: 24,
          backgroundRefresh: true
        },
        
        // RSS fetching
        rssTimeout: 10000,
        refreshIntervalMinutes: 60,
        
        // Data-conscious settings
        dataOptimization: {
          compressImages: true,
          lazyLoadImages: true,
          prefetchLimit: 3,
          lowDataMode: false,
          textFirst: true,
          backgroundUpdates: true
        },
        
        // Content processing
        unlimitedContent: true,
        enableAnalytics: true,
        enableCloudflareImages: true,
        
        // Security
        adminKey: 'hararemetro-admin-2025-secure-key',
        
        // Role configuration
        rolesEnabled: true,
        defaultRole: 'creator',
        adminRoles: ['admin', 'super_admin', 'moderator'],
        creatorRoles: ['creator', 'business-creator', 'author']
      }
    }
  }

  // =============================================================================
  // SYSTEM CONFIGURATION METHODS
  // =============================================================================

  async getSystemConfig(isPreview = false) {
    try {
      const config = await this.getAllSystemConfig()
      
      // Apply preview overrides if in preview environment
      if (isPreview && config.preview) {
        return {
          ...config,
          ...config.preview
        }
      }
      
      return config
    } catch (error) {
      console.error('[D1-CONFIG] Error getting system config:', error)
      return this.fallbackConfig.system
    }
  }

  async getAllSystemConfig() {
    try {
      const config = await this.d1.getAllSystemConfig()
      
      // If config is empty, return fallback
      if (Object.keys(config).length === 0) {
        console.log('[D1-CONFIG] No config found in D1, using fallback')
        return this.fallbackConfig.system
      }
      
      // Transform flat config keys into nested structure
      const systemConfig = {
        siteName: config.site_name || this.fallbackConfig.system.siteName,
        maxTotalArticles: parseInt(config.max_total_articles) || this.fallbackConfig.system.maxTotalArticles,
        maxArticlesPerSource: parseInt(config.max_articles_per_source) || this.fallbackConfig.system.maxArticlesPerSource,
        articleContentLimit: parseInt(config.article_content_limit) || this.fallbackConfig.system.articleContentLimit,
        
        pagination: {
          initialLoad: parseInt(config.pagination_initial_load) || this.fallbackConfig.system.pagination.initialLoad,
          pageSize: parseInt(config.pagination_page_size) || this.fallbackConfig.system.pagination.pageSize,
          preloadNextPage: config.pagination_preload_next_page === 'true',
          cachePages: parseInt(config.pagination_cache_pages) || this.fallbackConfig.system.pagination.cachePages,
          imageCompression: true,
          previewTextLimit: 400
        },
        
        cacheStrategy: {
          articlesTtl: parseInt(config.cache_strategy_ttl) * 24 * 60 * 60 || this.fallbackConfig.system.cacheStrategy.articlesTtl,
          refreshInterval: parseInt(config.cache_strategy_refresh_interval) || this.fallbackConfig.system.cacheStrategy.refreshInterval,
          maxCacheSize: '100MB',
          backgroundRefresh: true
        },
        
        rssTimeout: parseInt(config.rss_timeout) || this.fallbackConfig.system.rssTimeout,
        refreshIntervalMinutes: parseInt(config.refresh_interval_minutes) || this.fallbackConfig.system.refreshIntervalMinutes,
        
        dataOptimization: {
          compressImages: config.data_optimization_compress_images === 'true',
          lazyLoadImages: config.data_optimization_lazy_load === 'true',
          textFirst: config.data_optimization_text_first === 'true',
          prefetchLimit: 3,
          lowDataMode: false,
          backgroundUpdates: true
        },
        
        enableAnalytics: config.enable_analytics === 'true',
        enableCloudflareImages: config.enable_cloudflare_images === 'true',
        
        adminKey: config.admin_key || this.fallbackConfig.system.adminKey,
        
        rolesEnabled: config.roles_enabled === 'true',
        defaultRole: config.default_role || this.fallbackConfig.system.defaultRole,
        adminRoles: config.admin_roles || this.fallbackConfig.system.adminRoles,
        creatorRoles: config.creator_roles || this.fallbackConfig.system.creatorRoles
      }
      
      return systemConfig
    } catch (error) {
      console.error('[D1-CONFIG] Error getting all system config:', error)
      return this.fallbackConfig.system
    }
  }

  // Convenience methods for commonly used system settings
  async getMaxArticlesPerSource(isPreview = false) {
    const config = await this.getSystemConfig(isPreview)
    return config.maxArticlesPerSource
  }

  async getMaxTotalArticles(isPreview = false) {
    const config = await this.getSystemConfig(isPreview)  
    return config.maxTotalArticles
  }

  async getArticleContentLimit(isPreview = false) {
    const config = await this.getSystemConfig(isPreview)
    return config.articleContentLimit
  }

  async getRssTimeout(isPreview = false) {
    const config = await this.getSystemConfig(isPreview)
    return config.rssTimeout
  }

  async getPaginationConfig(isPreview = false) {
    const config = await this.getSystemConfig(isPreview)
    return config.pagination
  }

  // =============================================================================
  // RSS SOURCES METHODS
  // =============================================================================

  async getRSSources() {
    try {
      const sources = await this.d1.getRSSSources()
      console.log(`[D1-CONFIG] Retrieved ${sources.length} RSS sources from D1`)
      return sources
    } catch (error) {
      console.error('[D1-CONFIG] Error getting RSS sources:', error)
      return this.getFallbackRSSSources()
    }
  }

  getFallbackRSSSources() {
    return [
      { id: 'herald-zimbabwe', name: 'Herald Zimbabwe', url: 'https://www.herald.co.zw/feed/', category: 'general', enabled: true, priority: 5 },
      { id: 'newsday-zimbabwe', name: 'NewsDay Zimbabwe', url: 'https://www.newsday.co.zw/feed/', category: 'general', enabled: true, priority: 5 },
      { id: 'chronicle-zimbabwe', name: 'Chronicle Zimbabwe', url: 'https://www.chronicle.co.zw/feed/', category: 'general', enabled: true, priority: 5 },
      { id: 'zbc-news', name: 'ZBC News', url: 'https://www.zbc.co.zw/feed/', category: 'news', enabled: true, priority: 4 },
      { id: 'techzim', name: 'Techzim', url: 'https://www.techzim.co.zw/feed/', category: 'technology', enabled: true, priority: 4 }
    ]
  }

  async setRSSources(sources) {
    // This would require implementing bulk update methods in D1Service
    console.log('[D1-CONFIG] RSS sources updates should be done via admin interface')
    return { success: true, message: 'RSS sources are managed in D1 database' }
  }

  // =============================================================================
  // CATEGORIES METHODS
  // =============================================================================

  async getCategories() {
    try {
      const categories = await this.d1.getCategories()
      console.log(`[D1-CONFIG] Retrieved ${categories.length} categories from D1`)
      return categories
    } catch (error) {
      console.error('[D1-CONFIG] Error getting categories:', error)
      return this.getFallbackCategories()
    }
  }

  getFallbackCategories() {
    return [
      { id: 'all', name: 'All News', emoji: '📰', color: '#6B7280', description: 'All news articles', keywords: [], isDefault: true, order: 0 },
      { id: 'politics', name: 'Politics', emoji: '🏛️', color: '#DC2626', description: 'Political news', keywords: ['politics', 'government'], order: 1 },
      { id: 'economy', name: 'Economy', emoji: '💰', color: '#059669', description: 'Economic news', keywords: ['economy', 'business'], order: 2 },
      { id: 'sports', name: 'Sports', emoji: '⚽', color: '#DC2626', description: 'Sports news', keywords: ['sports', 'football'], order: 3 }
    ]
  }

  async getCategoryKeywords() {
    try {
      const keywords = await this.d1.getCategoryKeywords()
      console.log(`[D1-CONFIG] Retrieved keywords for ${Object.keys(keywords).length} categories from D1`)
      return keywords
    } catch (error) {
      console.error('[D1-CONFIG] Error getting category keywords:', error)
      return {
        politics: ['politics', 'government', 'election'],
        economy: ['economy', 'business', 'finance'],
        sports: ['sports', 'football', 'cricket'],
        general: ['news', 'zimbabwe', 'africa']
      }
    }
  }

  async getPriorityKeywords() {
    const keywords = [
      'harare', 'zimbabwe', 'zim', 'bulawayo', 'mutare', 'gweru', 'kwekwe',
      'parliament', 'government', 'mnangagwa', 'zanu-pf', 'mdc', 'chamisa',
      'economy', 'inflation', 'currency', 'bond', 'rtgs', 'usd',
      'mining', 'tobacco', 'agriculture', 'maize', 'cotton',
      'warriors', 'dynamos', 'caps united', 'highlanders'
    ]
    console.log(`[D1-CONFIG] Using ${keywords.length} priority keywords`)
    return keywords
  }

  // =============================================================================
  // CATEGORY DETECTION
  // =============================================================================

  async detectCategory(content) {
    const categories = await this.getCategories()
    const categoryKeywords = await this.getCategoryKeywords()
    
    let maxMatches = 0
    let detectedCategory = 'all' // Default to "all"
    
    // Skip "all" category during detection since it's the fallback
    const categoriesForDetection = categories.filter(cat => cat.id !== 'all')
    
    for (const category of categoriesForDetection) {
      const keywords = categoryKeywords[category.id] || []
      const matches = keywords.filter(keyword => 
        content.toLowerCase().includes(keyword.toLowerCase())
      ).length

      if (matches > maxMatches) {
        maxMatches = matches
        detectedCategory = category.id
      }
    }

    return detectedCategory
  }

  // =============================================================================
  // ADMIN METHODS
  // =============================================================================

  async initializeFromFallback() {
    try {
      console.log('[D1-CONFIG] Initializing D1 database from fallback configuration...')
      
      // This would be handled by running the migration scripts
      // The migration scripts already populate initial data
      
      return { 
        success: true, 
        message: 'D1 database initialized via migration scripts',
        note: 'Run migration scripts 001_init_schema.sql and 002_seed_initial_data.sql'
      }
    } catch (error) {
      console.error('[D1-CONFIG] Error initializing from fallback:', error)
      return { success: false, error: error.message }
    }
  }

  // Check if D1 is available and functional
  isD1Available() {
    return !!(this.d1 && this.d1.db)
  }

  // Health check
  async healthCheck() {
    return await this.d1.healthCheck()
  }

  // Get statistics
  async getStats() {
    return await this.d1.getStats()
  }
}

export default D1ConfigService
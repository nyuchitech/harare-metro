// Multi-tier Caching & Intelligent State Management
// Implements sophisticated caching strategies for optimal user experience

/* eslint-env browser */
/* global setTimeout, setInterval, clearTimeout, clearInterval */
import { logger } from '../utils/logger.js'

class MultiTierCacheManager {
  constructor() {
    this.version = '2.0.0'
    
    // Multi-tier cache structure for optimal performance
    this.cache = {
      // L1: Hot cache - Currently visible + adjacent articles (RAM equivalent)
      hot: new Map(), // 10-15 articles max
      
      // L2: Warm cache - Recently viewed articles (SSD equivalent)
      warm: new Map(), // 50-100 articles max
      
      // L3: Cold cache - Background prefetched articles (Disk equivalent)
      cold: new Map(), // 200-500 articles max
      
      // Metadata cache - Article metadata only (thumbnails, titles)
      meta: new Map(), // 1000+ articles metadata
      
      // User interaction cache - Optimistic updates
      interactions: new Map(),
      
      // Prediction cache - AI-predicted next articles
      predictions: new Map()
    }
    
    // Multi-tier cache state management
    this.state = {
      currentIndex: 0,
      scrollDirection: 'down',
      preloadQueue: [],
      networkCondition: 'unknown', // wifi, 4g, 3g, slow
      userBehavior: {
        avgReadTime: 30000, // 30 seconds average
        skipRate: 0.3,
        likeRate: 0.1,
        shareRate: 0.05,
        lastActivity: Date.now()
      },
      cacheStats: {
        hitRate: 0,
        missRate: 0,
        preloadSuccess: 0,
        totalRequests: 0
      }
    }
    
    // Adaptive loading configuration for different network conditions
    this.config = {
      // Cache sizes (articles count)
      hotCacheSize: 15,
      warmCacheSize: 100,
      coldCacheSize: 500,
      metaCacheSize: 1000,
      
      // Preloading strategy
      preloadAhead: 3,
      preloadBehind: 2,
      prefetchBatch: 10,
      
      // Network adaptive settings
      wifi: { preloadAhead: 5, quality: 'high', prefetchBatch: 15 },
      '4g': { preloadAhead: 3, quality: 'medium', prefetchBatch: 10 },
      '3g': { preloadAhead: 2, quality: 'low', prefetchBatch: 5 },
      'slow': { preloadAhead: 1, quality: 'minimal', prefetchBatch: 3 },
      
      // Storage limits (MB)
      maxStorageSize: 100 * 1024 * 1024, // 100MB storage limit
      maxArticleSize: 500 * 1024, // 500KB per article
      
      // TTL settings
      hotTTL: 5 * 60 * 1000,      // 5 minutes
      warmTTL: 30 * 60 * 1000,    // 30 minutes  
      coldTTL: 2 * 60 * 60 * 1000, // 2 hours
      metaTTL: 24 * 60 * 60 * 1000 // 24 hours
    }
    
    // Performance tracking for monitoring and optimization
    this.performance = {
      loadTimes: [],
      scrollSmoothness: [],
      cacheHitRates: [],
      networkLatency: []
    }
    
    this.init()
  }
  
  init() {
    // Load from localStorage
    this.loadFromStorage()
    
    // Setup network monitoring for adaptive caching
    this.setupNetworkMonitoring()
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring()
    
    // Setup cleanup intervals
    this.setupCleanupScheduler()
    
    // Load user behavior patterns
    this.loadUserBehaviorData()
    
    logger.debug('🎯 Multi-tier cache manager initialized', this.getCacheStats())
  }
  
  // Network condition detection and monitoring
  setupNetworkMonitoring() {
    if ('connection' in navigator) {
      const updateNetworkCondition = () => {
        const connection = navigator.connection
        const effectiveType = connection.effectiveType
        
        let condition = 'unknown'
        if (effectiveType === '4g' && connection.downlink > 10) {
          condition = 'wifi'
        } else if (effectiveType === '4g') {
          condition = '4g'
        } else if (effectiveType === '3g') {
          condition = '3g'
        } else {
          condition = 'slow'
        }
        
        if (condition !== this.state.networkCondition) {
          logger.debug(`📶 Network condition changed: ${this.state.networkCondition} → ${condition}`)
          this.state.networkCondition = condition
          this.adaptToNetworkConditions()
        }
      }
      
      navigator.connection.addEventListener('change', updateNetworkCondition)
      updateNetworkCondition()
    }
    
    // Fallback: Measure network speed periodically
    this.measureNetworkSpeed()
    setInterval(() => this.measureNetworkSpeed(), 30000) // Every 30 seconds
  }
  
  async measureNetworkSpeed() {
    const startTime = Date.now()
    try {
      // Small test request to measure latency
      await fetch('/api/health', { cache: 'no-cache' })
      const latency = Date.now() - startTime
      
      this.performance.networkLatency.push(latency)
      if (this.performance.networkLatency.length > 10) {
        this.performance.networkLatency.shift()
      }
      
      // Estimate network condition from latency
      const avgLatency = this.performance.networkLatency.reduce((a, b) => a + b, 0) / this.performance.networkLatency.length
      
      if (avgLatency < 50) {
        this.state.networkCondition = 'wifi'
      } else if (avgLatency < 200) {
        this.state.networkCondition = '4g'
      } else if (avgLatency < 500) {
        this.state.networkCondition = '3g'
      } else {
        this.state.networkCondition = 'slow'
      }
      
    } catch (error) {
      logger.warn('Network speed test failed:', error)
    }
  }
  
  // Adapt cache strategy to network conditions dynamically
  adaptToNetworkConditions() {
    const networkConfig = this.config[this.state.networkCondition] || this.config['3g']
    
    this.config.preloadAhead = networkConfig.preloadAhead
    this.config.prefetchBatch = networkConfig.prefetchBatch
    
    logger.debug(`⚙️ Adapted to ${this.state.networkCondition} network:`, networkConfig)
    
    // Trigger cache optimization
    this.optimizeCacheForNetwork()
  }
  
  // Intelligent article retrieval with multi-tier caching
  async getArticles({ limit = 24, offset = 0, category = null, search = null, sortBy = 'newest' } = {}) {
    const cacheKey = this.generateCacheKey({ limit, offset, category, search, sortBy })
    const startTime = Date.now()
    
    this.state.cacheStats.totalRequests++
    
    // L1 Hot cache check - instant access
    if (this.cache.hot.has(cacheKey) && this.isCacheValid(this.cache.hot.get(cacheKey))) {
      this.state.cacheStats.hitRate++
      logger.debug('🔥 Hot cache hit:', cacheKey)
      
      const result = this.cache.hot.get(cacheKey)
      this.triggerIntelligentPreloading(result, offset, limit)
      return result.data
    }
    
    // L2 Warm cache check
    if (this.cache.warm.has(cacheKey) && this.isCacheValid(this.cache.warm.get(cacheKey))) {
      this.state.cacheStats.hitRate++
      logger.debug('🔶 Warm cache hit:', cacheKey)
      
      const result = this.cache.warm.get(cacheKey)
      // Promote to hot cache
      this.promoteToHotCache(cacheKey, result)
      this.triggerIntelligentPreloading(result, offset, limit)
      return result.data
    }
    
    // L3 Cold cache check
    if (this.cache.cold.has(cacheKey) && this.isCacheValid(this.cache.cold.get(cacheKey))) {
      this.state.cacheStats.hitRate++
      logger.debug('🔷 Cold cache hit:', cacheKey)
      
      const result = this.cache.cold.get(cacheKey)
      // Promote to warm cache
      this.promoteToWarmCache(cacheKey, result)
      this.triggerIntelligentPreloading(result, offset, limit)
      return result.data
    }
    
    // Cache miss - fetch from worker with CDN-style fallback
    this.state.cacheStats.missRate++
    logger.debug('❌ Cache miss, fetching from worker:', cacheKey)
    
    try {
      const response = await this.fetchFromWorker({ limit, offset, category, search, sortBy })
      const loadTime = Date.now() - startTime
      
      this.performance.loadTimes.push(loadTime)
      if (this.performance.loadTimes.length > 20) {
        this.performance.loadTimes.shift()
      }
      
      // Store in hot cache for immediate future access
      this.storeInCache('hot', cacheKey, {
        data: response,
        timestamp: Date.now(),
        accessCount: 1,
        lastAccess: Date.now()
      })
      
      // Trigger intelligent preloading
      this.triggerIntelligentPreloading(response, offset, limit)
      
      // Background: Store metadata for future predictions
      this.storeArticleMetadata(response.articles)
      
      return response
      
    } catch (error) {
      logger.error('🚨 Failed to fetch from worker:', error)
      
      // Fallback: Return stale cache if available
      const staleResults = this.getStaleCache(cacheKey)
      if (staleResults) {
        logger.debug('⚠️ Serving stale cache as fallback')
        return staleResults
      }
      
      throw error
    }
  }
  
  // Intelligent preloading with user behavior prediction
  async triggerIntelligentPreloading(currentResult, currentOffset, currentLimit) {
    if (!currentResult?.articles) return
    
    const networkConfig = this.config[this.state.networkCondition] || this.config['3g']
    
    // Predict next likely requests based on user behavior
    const predictions = this.predictNextRequests(currentOffset, currentLimit)
    
    // Preload based on network conditions and user behavior
    for (let i = 0; i < Math.min(predictions.length, networkConfig.preloadAhead); i++) {
      const prediction = predictions[i]
      
      // Don't preload if already cached
      if (this.isAnyCacheHit(prediction.cacheKey)) continue
      
      // Add to preload queue with priority
      this.state.preloadQueue.push({
        ...prediction,
        priority: i === 0 ? 'high' : 'medium',
        timestamp: Date.now()
      })
    }
    
    // Process preload queue in background for optimal UX
    this.processPreloadQueue()
  }
  
  // Behavior-based prediction algorithm using machine learning principles
  predictNextRequests(currentOffset, currentLimit) {
    const predictions = []
    const behavior = this.state.userBehavior
    
    // Primary prediction: Next page (highest probability)
    predictions.push({
      cacheKey: this.generateCacheKey({ 
        limit: currentLimit, 
        offset: currentOffset + currentLimit 
      }),
      probability: 0.8,
      reason: 'sequential_scroll'
    })
    
    // Secondary prediction: Skip ahead (based on skip rate)
    if (behavior.skipRate > 0.2) {
      predictions.push({
        cacheKey: this.generateCacheKey({ 
          limit: currentLimit, 
          offset: currentOffset + (currentLimit * 2) 
        }),
        probability: behavior.skipRate * 0.6,
        reason: 'skip_pattern'
      })
    }
    
    // Tertiary prediction: Different category (based on exploration behavior)
    const categories = ['politics', 'economy', 'sports', 'technology']
    const randomCategory = categories[Math.floor(Math.random() * categories.length)]
    predictions.push({
      cacheKey: this.generateCacheKey({ 
        limit: currentLimit, 
        offset: 0, 
        category: randomCategory 
      }),
      probability: 0.3,
      reason: 'category_exploration'
    })
    
    // Sort by probability descending
    return predictions.sort((a, b) => b.probability - a.probability)
  }
  
  // Background preloading processor for seamless user experience
  async processPreloadQueue() {
    if (this.state.preloadQueue.length === 0) return
    
    const networkConfig = this.config[this.state.networkCondition] || this.config['3g']
    const maxConcurrent = Math.min(3, networkConfig.prefetchBatch / 3)
    
    // Process high priority items first
    const highPriorityItems = this.state.preloadQueue
      .filter(item => item.priority === 'high')
      .slice(0, maxConcurrent)
    
    const promises = highPriorityItems.map(async (item) => {
      try {
        logger.debug(`🔄 Preloading (${item.reason}):`, item.cacheKey)
        
        // Extract parameters from cache key
        const params = this.parseCacheKey(item.cacheKey)
        const response = await this.fetchFromWorker(params)
        
        // Store in cold cache for future use
        this.storeInCache('cold', item.cacheKey, {
          data: response,
          timestamp: Date.now(),
          accessCount: 0,
          lastAccess: null,
          preloaded: true
        })
        
        this.state.cacheStats.preloadSuccess++
        logger.debug('✅ Preloaded successfully:', item.cacheKey)
        
      } catch (error) {
        logger.warn('⚠️ Preload failed:', item.cacheKey, error.message)
      }
    })
    
    // Remove processed items from queue
    this.state.preloadQueue = this.state.preloadQueue
      .filter(item => !highPriorityItems.includes(item))
    
    await Promise.allSettled(promises)
    
    // Continue processing if more items exist
    if (this.state.preloadQueue.length > 0) {
      setTimeout(() => this.processPreloadQueue(), 1000)
    }
  }
  
  // Optimistic state updates for instant user feedback
  optimisticUpdate(articleId, action, value) {
    const interactionKey = `${articleId}:${action}`
    
    // Store optimistic update
    this.cache.interactions.set(interactionKey, {
      value,
      timestamp: Date.now(),
      synced: false,
      retryCount: 0
    })
    
    logger.debug(`⚡ Optimistic update: ${action} on ${articleId}`)
    
    // Background synchronization for data consistency
    this.backgroundSyncInteraction(articleId, action, value)
    
    return value
  }
  
  async backgroundSyncInteraction(articleId, action, value) {
    try {
      // Simulate network delay for demo
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Fire and forget sync to worker
      fetch('/api/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          action,
          value,
          timestamp: Date.now()
        })
      }).catch(error => {
        logger.warn('Background sync failed:', error)
        
        // Mark for retry
        const interactionKey = `${articleId}:${action}`
        const interaction = this.cache.interactions.get(interactionKey)
        if (interaction && interaction.retryCount < 3) {
          interaction.retryCount++
          setTimeout(() => this.backgroundSyncInteraction(articleId, action, value), 
                    Math.pow(2, interaction.retryCount) * 1000) // Exponential backoff
        }
      })
      
      // Mark as synced
      const interactionKey = `${articleId}:${action}`
      const interaction = this.cache.interactions.get(interactionKey)
      if (interaction) {
        interaction.synced = true
      }
      
    } catch (error) {
      logger.warn('Background sync failed:', error)
    }
  }
  
  // Multi-tier cache management with LRU eviction
  storeInCache(tier, key, data) {
    const cache = this.cache[tier]
    if (!cache) return
    
    // Enforce size limits
    const maxSize = this.config[`${tier}CacheSize`]
    if (cache.size >= maxSize) {
      this.evictLRU(tier)
    }
    
    cache.set(key, data)
    
    // Update access patterns
    if (data.accessCount !== undefined) {
      data.accessCount++
      data.lastAccess = Date.now()
    }
  }
  
  // LRU eviction algorithm for optimal cache performance
  evictLRU(tier) {
    const cache = this.cache[tier]
    if (cache.size === 0) return
    
    let oldestKey = null
    let oldestTime = Date.now()
    
    for (const [key, data] of cache.entries()) {
      if (data.lastAccess && data.lastAccess < oldestTime) {
        oldestTime = data.lastAccess
        oldestKey = key
      }
    }
    
    if (oldestKey) {
      cache.delete(oldestKey)
      logger.debug(`🗑️ Evicted from ${tier} cache:`, oldestKey)
    }
  }
  
  // Cache promotion strategies for frequently accessed data
  promoteToHotCache(key, data) {
    // Remove from current tier
    this.cache.warm.delete(key)
    this.cache.cold.delete(key)
    
    // Add to hot cache
    this.storeInCache('hot', key, data)
  }
  
  promoteToWarmCache(key, data) {
    this.cache.cold.delete(key)
    this.storeInCache('warm', key, data)
  }
  
  // Cache utilities
  generateCacheKey(params) {
    const { limit, offset, category, search, sortBy } = params
    return `articles:${limit}:${offset}:${category || 'all'}:${search || ''}:${sortBy || 'newest'}`
  }
  
  parseCacheKey(cacheKey) {
    const [, limit, offset, category, search, sortBy] = cacheKey.split(':')
    return {
      limit: parseInt(limit),
      offset: parseInt(offset),
      category: category === 'all' ? null : category,
      search: search || null,
      sortBy: sortBy || 'newest'
    }
  }
  
  isCacheValid(cacheData) {
    if (!cacheData || !cacheData.timestamp) return false
    
    const age = Date.now() - cacheData.timestamp
    return age < this.config.hotTTL // Use hot TTL as base
  }
  
  isAnyCacheHit(cacheKey) {
    return this.cache.hot.has(cacheKey) || 
           this.cache.warm.has(cacheKey) || 
           this.cache.cold.has(cacheKey)
  }
  
  getStaleCache(cacheKey) {
    // Try all cache tiers even if stale
    for (const tier of ['hot', 'warm', 'cold']) {
      if (this.cache[tier].has(cacheKey)) {
        return this.cache[tier].get(cacheKey).data
      }
    }
    return null
  }
  
  // Worker communication
  async fetchFromWorker(params) {
    const startTime = Date.now()
    
    try {
      const response = await fetch('/api/direct-sync', {
        headers: {
          'X-Cache-Strategy': 'multi-tier',
          'X-Network-Condition': this.state.networkCondition
        }
      })
      
      if (!response.ok) {
        throw new Error(`Worker fetch failed: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Worker returned failure')
      }
      
      const responseTime = Date.now() - startTime
      logger.debug(`⚡ Worker fetch completed in ${responseTime}ms`)
      
      return data
      
    } catch (error) {
      logger.error('Worker fetch failed:', error)
      throw error
    }
  }
  
  // Performance monitoring and optimization
  setupPerformanceMonitoring() {
    // Track scroll smoothness
    let lastScrollTime = Date.now()
    let scrollSamples = []
    
    window.addEventListener('scroll', () => {
      const now = Date.now()
      const timeSinceLastScroll = now - lastScrollTime
      scrollSamples.push(timeSinceLastScroll)
      
      if (scrollSamples.length > 10) {
        const avgScrollTime = scrollSamples.reduce((a, b) => a + b, 0) / scrollSamples.length
        this.performance.scrollSmoothness.push(avgScrollTime)
        
        if (this.performance.scrollSmoothness.length > 50) {
          this.performance.scrollSmoothness.shift()
        }
        
        scrollSamples = []
      }
      
      lastScrollTime = now
    }, { passive: true })
    
    // Regular performance reporting
    setInterval(() => {
      this.reportPerformanceMetrics()
    }, 60000) // Every minute
  }
  
  reportPerformanceMetrics() {
    const stats = this.getCacheStats()
    const avgLoadTime = this.performance.loadTimes.length > 0 
      ? this.performance.loadTimes.reduce((a, b) => a + b, 0) / this.performance.loadTimes.length 
      : 0
    
    logger.debug('📊 Multi-tier Cache Performance Metrics:', {
      cacheHitRate: `${((stats.hitRate / stats.totalRequests) * 100).toFixed(1)}%`,
      avgLoadTime: `${avgLoadTime.toFixed(0)}ms`,
      networkCondition: this.state.networkCondition,
      preloadSuccess: stats.preloadSuccess,
      totalCachedArticles: stats.totalCachedArticles
    })
  }
  
  // User behavior tracking
  loadUserBehaviorData() {
    try {
      const saved = localStorage.getItem('hm_user_behavior')
      if (saved) {
        this.state.userBehavior = { ...this.state.userBehavior, ...JSON.parse(saved) }
      }
    } catch (error) {
      logger.warn('Failed to load user behavior data:', error)
    }
  }
  
  updateUserBehavior(action, data) {
    const behavior = this.state.userBehavior
    
    switch (action) {
      case 'article_read':
        behavior.avgReadTime = (behavior.avgReadTime * 0.9) + (data.duration * 0.1)
        break
      case 'article_skip':
        behavior.skipRate = (behavior.skipRate * 0.9) + (0.1)
        break
      case 'article_like':
        behavior.likeRate = (behavior.likeRate * 0.9) + (0.1)
        break
      case 'article_share':
        behavior.shareRate = (behavior.shareRate * 0.9) + (0.1)
        break
    }
    
    behavior.lastActivity = Date.now()
    
    // Save to localStorage
    try {
      localStorage.setItem('hm_user_behavior', JSON.stringify(behavior))
    } catch (error) {
      logger.warn('Failed to save user behavior:', error)
    }
  }
  
  // Storage management
  loadFromStorage() {
    try {
      const saved = localStorage.getItem('hm_multitier_cache')
      if (saved) {
        const data = JSON.parse(saved)
        
        // Restore cache data
        if (data.cache) {
          Object.keys(data.cache).forEach(tier => {
            if (this.cache[tier] && data.cache[tier]) {
              data.cache[tier].forEach(([key, value]) => {
                this.cache[tier].set(key, value)
              })
            }
          })
        }
        
        // Restore state
        if (data.state) {
          this.state = { ...this.state, ...data.state }
        }
      }
    } catch (error) {
      logger.warn('Failed to load cache from storage:', error)
    }
  }
  
  saveToStorage() {
    try {
      const data = {
        version: this.version,
        cache: {},
        state: this.state,
        timestamp: Date.now()
      }
      
      // Save cache data (convert Maps to arrays)
      Object.keys(this.cache).forEach(tier => {
        if (this.cache[tier] instanceof Map) {
          data.cache[tier] = Array.from(this.cache[tier].entries())
        }
      })
      
      localStorage.setItem('hm_multitier_cache', JSON.stringify(data))
    } catch (error) {
      logger.warn('Failed to save cache to storage:', error)
    }
  }
  
  // Cleanup scheduler for background maintenance
  setupCleanupScheduler() {
    // Clean expired cache every 5 minutes
    setInterval(() => this.cleanExpiredCache(), 5 * 60 * 1000)
    
    // Full cleanup every hour
    setInterval(() => this.fullCleanup(), 60 * 60 * 1000)
    
    // Save cache to storage every 2 minutes
    setInterval(() => this.saveToStorage(), 2 * 60 * 1000)
  }
  
  cleanExpiredCache() {
    let cleanedCount = 0
    
    Object.keys(this.cache).forEach(tier => {
      const cache = this.cache[tier]
      if (!(cache instanceof Map)) return
      
      const ttl = this.config[`${tier}TTL`] || this.config.hotTTL
      const now = Date.now()
      
      for (const [key, data] of cache.entries()) {
        if (data.timestamp && (now - data.timestamp) > ttl) {
          cache.delete(key)
          cleanedCount++
        }
      }
    })
    
    if (cleanedCount > 0) {
      logger.debug(`🧹 Cleaned ${cleanedCount} expired cache entries`)
    }
  }
  
  fullCleanup() {
    // Clean up interaction cache
    const interactionCleanup = Date.now() - (24 * 60 * 60 * 1000) // 24 hours
    let cleanedInteractions = 0
    
    for (const [key, data] of this.cache.interactions.entries()) {
      if (data.timestamp < interactionCleanup && data.synced) {
        this.cache.interactions.delete(key)
        cleanedInteractions++
      }
    }
    
    // Optimize cache sizes
    this.optimizeCacheSizes()
    
    logger.debug(`🔧 Full cleanup completed: ${cleanedInteractions} interactions cleaned`)
  }
  
  optimizeCacheSizes() {
    // Resize caches based on network condition
    const networkConfig = this.config[this.state.networkCondition] || this.config['3g']
    
    // Adjust cache sizes dynamically
    const multiplier = {
      'wifi': 1.5,
      '4g': 1.2,
      '3g': 1.0,
      'slow': 0.7
    }[this.state.networkCondition] || 1.0
    
    const newHotSize = Math.floor(this.config.hotCacheSize * multiplier)
    const newWarmSize = Math.floor(this.config.warmCacheSize * multiplier)
    
    // Trim if necessary
    while (this.cache.hot.size > newHotSize) {
      this.evictLRU('hot')
    }
    
    while (this.cache.warm.size > newWarmSize) {
      this.evictLRU('warm')
    }
  }
  
  optimizeCacheForNetwork() {
    const condition = this.state.networkCondition
    
    if (condition === 'slow' || condition === '3g') {
      // Aggressive cleanup for slow networks
      this.cache.cold.clear()
      
      // Keep only essential hot cache
      while (this.cache.hot.size > 5) {
        this.evictLRU('hot')
      }
    } else if (condition === 'wifi') {
      // Preload more aggressively on WiFi
      this.config.preloadAhead = 5
      this.config.prefetchBatch = 15
    }
  }
  
  // Public API
  getCacheStats() {
    return {
      version: this.version,
      networkCondition: this.state.networkCondition,
      totalRequests: this.state.cacheStats.totalRequests,
      hitRate: this.state.cacheStats.hitRate,
      missRate: this.state.cacheStats.missRate,
      preloadSuccess: this.state.cacheStats.preloadSuccess,
      totalCachedArticles: this.cache.hot.size + this.cache.warm.size + this.cache.cold.size,
      cacheDistribution: {
        hot: this.cache.hot.size,
        warm: this.cache.warm.size,
        cold: this.cache.cold.size,
        meta: this.cache.meta.size,
        interactions: this.cache.interactions.size
      },
      preloadQueueSize: this.state.preloadQueue.length,
      userBehavior: this.state.userBehavior
    }
  }
  
  // Seed MultiTierCache with articles from DirectDataService for hybrid approach
  seedWithArticles(articles) {
    if (!articles || !Array.isArray(articles)) {
      logger.warn('MultiTierCacheManager: Invalid articles for seeding')
      return
    }
    
    logger.debug(`🌱 MultiTierCacheManager: Seeding with ${articles.length} articles from DirectDataService`)
    
    // Store articles in hot cache for immediate access
    const cacheKey = this.generateCacheKey({ limit: articles.length, offset: 0 })
    
    const cacheEntry = {
      data: {
        articles: articles,
        total: articles.length,
        hasMore: false,
        source: 'seeded-from-direct'
      },
      timestamp: Date.now(),
      accessCount: 1,
      lastAccess: Date.now(),
      tier: 'hot'
    }
    
    // Store in hot cache for fastest access
    this.storeInCache('hot', cacheKey, cacheEntry)
    
    // Also seed metadata cache for performance tracking
    this.storeArticleMetadata(articles)
    
    logger.debug('✅ MultiTierCacheManager: Seeding complete, ready for optimistic updates')
  }
  
  clearCache() {
    Object.keys(this.cache).forEach(tier => {
      if (this.cache[tier] instanceof Map) {
        this.cache[tier].clear()
      }
    })
    
    this.state.preloadQueue = []
    localStorage.removeItem('hm_multitier_cache')
    
    logger.debug('🗑️ All caches cleared')
  }
  
  // Article metadata storage for predictions
  storeArticleMetadata(articles) {
    if (!Array.isArray(articles)) return
    
    articles.forEach(article => {
      const metaKey = article.id || article.slug || article.link
      if (!metaKey) return
      
      this.cache.meta.set(metaKey, {
        title: article.title,
        category: article.category,
        source: article.source,
        publishedAt: article.publishedAt,
        readingTime: article.reading_time,
        wordCount: article.word_count,
        timestamp: Date.now()
      })
    })
    
    // Limit metadata cache size
    while (this.cache.meta.size > this.config.metaCacheSize) {
      const firstKey = this.cache.meta.keys().next().value
      this.cache.meta.delete(firstKey)
    }
  }
}

// Singleton instance for global multi-tier cache management
const multiTierCacheManager = new MultiTierCacheManager()
export default multiTierCacheManager
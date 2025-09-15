// worker/services/AnalyticsEngineService.js
export class AnalyticsEngineService {
  constructor(env) {
    this.env = env
    this.datasets = {
      NEWS_ANALYTICS: env.NEWS_ANALYTICS,
      SEARCH_ANALYTICS: env.SEARCH_ANALYTICS,
      CATEGORY_ANALYTICS: env.CATEGORY_ANALYTICS,
      USER_ANALYTICS: env.USER_ANALYTICS,
      PERFORMANCE_ANALYTICS: env.PERFORMANCE_ANALYTICS  // ✅ Add this line only
    }
  }

  // Article View Tracking
  async trackArticleView(data) {
    try {
      const {
        articleId,
        source,
        category,
        title,
        userAgent,
        country,
        referer,
        userId,
        timestamp = Date.now()
      } = data

      const deviceType = this.extractDevice(userAgent)
      const browserInfo = this.extractBrowser(userAgent)

      if (this.datasets.NEWS_ANALYTICS) {
        this.datasets.NEWS_ANALYTICS.writeDataPoint({
          blobs: [
            'article_view',           // Event type
            source || 'unknown',      // News source
            category || 'general',    // Article category
            country || 'unknown',     // User country
            deviceType,               // Device type
            browserInfo.name,         // Browser name
            referer || 'direct',      // Referrer
            userId || 'anonymous'     // User ID (hashed)
          ],
          doubles: [
            1,                        // View count
            timestamp,                // Timestamp
            title ? title.length : 0 // Title length for engagement metrics
          ],
          indexes: [articleId || 'unknown'] // Article ID for sampling
        })
      }

      console.log(`Tracked article view: ${articleId} from ${source}`)
      return { success: true, event: 'article_view' }
    } catch (error) {
      console.log('Error tracking article view:', error)
      return { success: false, error: error.message }
    }
  }

  // Search Query Tracking
  async trackSearch(data) {
    try {
      const {
        query,
        category,
        source,
        resultsCount,
        userAgent,
        country,
        userId,
        timestamp = Date.now()
      } = data

      const deviceType = this.extractDevice(userAgent)
      const searchId = this.generateSearchId()

      if (this.datasets.SEARCH_ANALYTICS) {
        this.datasets.SEARCH_ANALYTICS.writeDataPoint({
          blobs: [
            'search_query',
            query ? query.toLowerCase().substring(0, 100) : '', // Limit query length
            category || 'all',       // Filtered category
            source || 'all',         // Filtered source
            country || 'unknown',    // User country
            deviceType,              // Device type
            userId || 'anonymous'    // User ID
          ],
          doubles: [
            1,                       // Search count
            query ? query.length : 0, // Query length
            resultsCount || 0,       // Number of results
            timestamp                // Search timestamp
          ],
          indexes: [searchId]        // Unique search session
        })
      }

      console.log(`Tracked search: "${query}" in ${category}`)
      return { success: true, event: 'search_query', searchId }
    } catch (error) {
      console.log('Error tracking search:', error)
      return { success: false, error: error.message }
    }
  }

  // Category Click Tracking
  async trackCategoryClick(data) {
    try {
      const {
        category,
        source,
        userAgent,
        country,
        userId,
        timestamp = Date.now()
      } = data

      const deviceType = this.extractDevice(userAgent)

      if (this.datasets.CATEGORY_ANALYTICS) {
        this.datasets.CATEGORY_ANALYTICS.writeDataPoint({
          blobs: [
            'category_click',
            category || 'unknown',   // Category clicked
            source || 'all',         // Source filter if any
            country || 'unknown',    // User country
            deviceType,              // Device type
            userId || 'anonymous'    // User ID
          ],
          doubles: [
            1,                       // Click count
            timestamp                // Click timestamp
          ],
          indexes: [category || 'unknown'] // Category as sampling key
        })
      }

      console.log(`Tracked category click: ${category}`)
      return { success: true, event: 'category_click' }
    } catch (error) {
      console.log('Error tracking category click:', error)
      return { success: false, error: error.message }
    }
  }

  // User Interaction Tracking
  async trackUserInteraction(data) {
    try {
      const {
        interactionType, // 'like', 'bookmark', 'share', 'comment'
        articleId,
        source,
        category,
        userAgent,
        country,
        userId,
        timestamp = Date.now()
      } = data

      const deviceType = this.extractDevice(userAgent)

      if (this.datasets.USER_ANALYTICS) {
        this.datasets.USER_ANALYTICS.writeDataPoint({
          blobs: [
            'user_interaction',
            interactionType || 'unknown', // Type of interaction
            source || 'unknown',          // News source
            category || 'general',        // Article category
            country || 'unknown',         // User country
            deviceType,                   // Device type
            userId || 'anonymous'         // User ID
          ],
          doubles: [
            1,                            // Interaction count
            timestamp                     // Interaction timestamp
          ],
          indexes: [articleId || 'unknown'] // Article ID for sampling
        })
      }

      console.log(`Tracked user interaction: ${interactionType} on ${articleId}`)
      return { success: true, event: 'user_interaction' }
    } catch (error) {
      console.log('Error tracking user interaction:', error)
      return { success: false, error: error.message }
    }
  }

  // Page View Tracking
  async trackPageView(data) {
    try {
      const {
        path,
        referer,
        userAgent,
        country,
        userId,
        loadTime,
        timestamp = Date.now()
      } = data

      const deviceType = this.extractDevice(userAgent)
      const browserInfo = this.extractBrowser(userAgent)

      if (this.datasets.NEWS_ANALYTICS) {
        this.datasets.NEWS_ANALYTICS.writeDataPoint({
          blobs: [
            'page_view',
            path || '/',              // Page path
            referer || 'direct',      // Referrer
            country || 'unknown',     // User country
            deviceType,               // Device type
            browserInfo.name,         // Browser name
            userId || 'anonymous'     // User ID
          ],
          doubles: [
            1,                        // Page view count
            loadTime || 0,            // Page load time
            timestamp                 // View timestamp
          ],
          indexes: [path || '/']      // Page path for sampling
        })
      }

      console.log(`Tracked page view: ${path}`)
      return { success: true, event: 'page_view' }
    } catch (error) {
      console.log('Error tracking page view:', error)
      return { success: false, error: error.message }
    }
  }

  // Performance Tracking - UPDATE TO USE PERFORMANCE_ANALYTICS
  async trackPerformance(data) {
    try {
      const {
        metric,        // 'feed_load', 'search_time', 'api_response'
        value,         // Time in milliseconds
        source,        // What triggered the metric
        userAgent,
        country,
        timestamp = Date.now()
      } = data

      const deviceType = this.extractDevice(userAgent)

      // ✅ Use PERFORMANCE_ANALYTICS dataset instead of NEWS_ANALYTICS
      if (this.datasets.PERFORMANCE_ANALYTICS) {
        this.datasets.PERFORMANCE_ANALYTICS.writeDataPoint({
          blobs: [
            'performance_metric',
            metric || 'unknown',      // Metric type
            source || 'unknown',      // Source of metric
            country || 'unknown',     // User country
            deviceType                // Device type
          ],
          doubles: [
            1,                        // Metric count
            value || 0,               // Metric value (time, size, etc.)
            timestamp                 // Metric timestamp
          ],
          indexes: [metric || 'unknown'] // Metric type for sampling
        })
      }

      console.log(`Tracked performance: ${metric} = ${value}ms`)
      return { success: true, event: 'performance_metric' }
    } catch (error) {
      console.log('Error tracking performance:', error)
      return { success: false, error: error.message }
    }
  }

  // Error Tracking
  async trackError(data) {
    try {
      const {
        errorType,     // 'feed_error', 'api_error', 'client_error'
        errorMessage,
        source,        // Where the error occurred
        userAgent,
        country,
        userId,
        timestamp = Date.now()
      } = data

      const deviceType = this.extractDevice(userAgent)

      if (this.datasets.NEWS_ANALYTICS) {
        this.datasets.NEWS_ANALYTICS.writeDataPoint({
          blobs: [
            'error_event',
            errorType || 'unknown',              // Error type
            source || 'unknown',                 // Error source
            errorMessage ? errorMessage.substring(0, 100) : '', // Error message (truncated)
            country || 'unknown',                // User country
            deviceType,                          // Device type
            userId || 'anonymous'                // User ID
          ],
          doubles: [
            1,                                   // Error count
            timestamp                            // Error timestamp
          ],
          indexes: [errorType || 'unknown']     // Error type for sampling
        })
      }

      console.log(`Tracked error: ${errorType} - ${errorMessage}`)
      return { success: true, event: 'error_event' }
    } catch (error) {
      console.log('Error tracking error (meta!):', error)
      return { success: false, error: error.message }
    }
  }

  // Batch Analytics for multiple events
  async trackBatch(events) {
    try {
      const results = []
      
      for (const event of events) {
        let result
        
        switch (event.type) {
          case 'article_view':
            result = await this.trackArticleView(event.data)
            break
          case 'search':
            result = await this.trackSearch(event.data)
            break
          case 'category_click':
            result = await this.trackCategoryClick(event.data)
            break
          case 'user_interaction':
            result = await this.trackUserInteraction(event.data)
            break
          case 'page_view':
            result = await this.trackPageView(event.data)
            break
          case 'performance':
            result = await this.trackPerformance(event.data)
            break
          case 'error':
            result = await this.trackError(event.data)
            break
          default:
            result = { success: false, error: 'Unknown event type' }
        }
        
        results.push({ event: event.type, result })
      }

      const successCount = results.filter(r => r.result.success).length
      console.log(`Batch tracking completed: ${successCount}/${events.length} successful`)
      
      return { 
        success: true, 
        processed: events.length,
        successful: successCount,
        results 
      }
    } catch (error) {
      console.log('Error in batch tracking:', error)
      return { success: false, error: error.message }
    }
  }

  // Helper Methods
  extractDevice(userAgent) {
    if (!userAgent) return 'unknown'
    
    const ua = userAgent.toLowerCase()
    
    if (/mobile|android|iphone|ipod/.test(ua)) return 'mobile'
    if (/tablet|ipad/.test(ua)) return 'tablet'
    if (/smart-tv|smarttv|googletv|apple-tv/.test(ua)) return 'tv'
    
    return 'desktop'
  }

  extractBrowser(userAgent) {
    if (!userAgent) return { name: 'unknown', version: 'unknown' }
    
    const ua = userAgent.toLowerCase()
    
    // Chrome
    if (ua.includes('chrome') && !ua.includes('edge')) {
      const match = ua.match(/chrome\/(\d+)/)
      return { name: 'chrome', version: match ? match[1] : 'unknown' }
    }
    
    // Firefox
    if (ua.includes('firefox')) {
      const match = ua.match(/firefox\/(\d+)/)
      return { name: 'firefox', version: match ? match[1] : 'unknown' }
    }
    
    // Safari
    if (ua.includes('safari') && !ua.includes('chrome')) {
      const match = ua.match(/version\/(\d+)/)
      return { name: 'safari', version: match ? match[1] : 'unknown' }
    }
    
    // Edge
    if (ua.includes('edge')) {
      const match = ua.match(/edge\/(\d+)/)
      return { name: 'edge', version: match ? match[1] : 'unknown' }
    }
    
    return { name: 'other', version: 'unknown' }
  }

  generateSearchId() {
    return Math.random().toString(36).substring(2, 15)
  }

  generateUserId(request) {
    // Generate a hashed user ID based on IP and User-Agent for privacy
    // This creates a pseudo-anonymous but consistent identifier
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
    const userAgent = request.headers.get('User-Agent') || 'unknown'
    
    // Simple hash function (in production, use a proper hash)
    let hash = 0
    const string = `${ip}-${userAgent}`
    
    for (let i = 0; i < string.length; i++) {
      const char = string.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return `user_${Math.abs(hash).toString(36)}`
  }

  // Analytics Query Helpers (for future admin dashboard)
  async queryAnalytics(dataset, query, timeRange = '24h') {
    try {
      // This would integrate with Cloudflare Analytics Engine SQL API
      // For now, return a placeholder
      console.log(`Analytics query for ${dataset}: ${query}`)
      
      return {
        success: true,
        message: 'Analytics querying not yet implemented',
        note: 'Use Cloudflare Analytics Engine SQL API directly'
      }
    } catch (error) {
      console.log('Error querying analytics:', error)
      return { success: false, error: error.message }
    }
  }

  // ✅ UPDATE: Add PERFORMANCE_ANALYTICS to the summary
  getAnalyticsSummary() {
    return {
      datasets: Object.keys(this.datasets).map(key => ({
        name: key,
        available: !!this.datasets[key],
        description: this.getDatasetDescription(key)
      })),
      supportedEvents: [
        'article_view', 'search_query', 'category_click', 
        'user_interaction', 'page_view', 'performance_metric', 'error_event'
      ],
      status: 'ready'
    }
  }

  // ✅ UPDATE: Add description for PERFORMANCE_ANALYTICS
  getDatasetDescription(datasetName) {
    const descriptions = {
      NEWS_ANALYTICS: 'Article views, page views, and general site analytics',
      SEARCH_ANALYTICS: 'Search queries and search behavior',
      CATEGORY_ANALYTICS: 'Category navigation and filtering',
      USER_ANALYTICS: 'User interactions like likes, bookmarks, and shares',
      PERFORMANCE_ANALYTICS: 'Performance metrics like load times and response times'  // ✅ Add this line
    }
    
    return descriptions[datasetName] || 'Analytics dataset'
  }
}
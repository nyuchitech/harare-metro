// worker/database/D1Service.js
// Centralized D1 database service to replace KV storage

export class D1Service {
  constructor(database) {
    this.db = database
  }

  // =============================================================================
  // SYSTEM CONFIGURATION METHODS
  // =============================================================================

  async getSystemConfig(key) {
    try {
      const result = await this.db.prepare(
        'SELECT value FROM system_config WHERE key = ?'
      ).bind(key).first()
      
      if (result) {
        // Try to parse JSON, fallback to string value
        try {
          return JSON.parse(result.value)
        } catch {
          return result.value
        }
      }
      return null
    } catch (error) {
      console.error(`[D1] Error getting system config ${key}:`, error)
      return null
    }
  }

  async setSystemConfig(key, value, description = null) {
    try {
      const jsonValue = typeof value === 'string' ? value : JSON.stringify(value)
      
      await this.db.prepare(`
        INSERT OR REPLACE INTO system_config (key, value, description, updated_at) 
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(key, jsonValue, description).run()
      
      return { success: true }
    } catch (error) {
      console.error(`[D1] Error setting system config ${key}:`, error)
      return { success: false, error: error.message }
    }
  }

  async getAllSystemConfig() {
    try {
      const result = await this.db.prepare(
        'SELECT key, value, description FROM system_config ORDER BY key'
      ).all()
      
      const config = {}
      for (const row of result.results) {
        try {
          config[row.key] = JSON.parse(row.value)
        } catch {
          config[row.key] = row.value
        }
      }
      
      return config
    } catch (error) {
      console.error('[D1] Error getting all system config:', error)
      return {}
    }
  }

  // =============================================================================
  // RSS SOURCES METHODS
  // =============================================================================

  async getRSSSources() {
    try {
      const result = await this.db.prepare(`
        SELECT id, name, url, category, enabled, priority, metadata, 
               last_fetched_at, fetch_count, error_count, last_error
        FROM rss_sources 
        WHERE enabled = 1 
        ORDER BY priority DESC, name
      `).all()
      
      return result.results.map(row => ({
        ...row,
        enabled: Boolean(row.enabled),
        metadata: row.metadata ? JSON.parse(row.metadata) : null
      }))
    } catch (error) {
      console.error('[D1] Error getting RSS sources:', error)
      return []
    }
  }

  async updateRSSSourceStatus(sourceId, status) {
    try {
      const updates = {
        last_fetched_at: new Date().toISOString(),
        fetch_count: 'fetch_count + 1'
      }
      
      if (status.error) {
        updates.error_count = 'error_count + 1'
        updates.last_error = status.error
      }

      await this.db.prepare(`
        UPDATE rss_sources 
        SET last_fetched_at = ?, 
            fetch_count = fetch_count + 1,
            error_count = CASE WHEN ? IS NOT NULL THEN error_count + 1 ELSE error_count END,
            last_error = COALESCE(?, last_error),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        updates.last_fetched_at,
        status.error || null,
        status.error || null,
        sourceId
      ).run()
      
      return { success: true }
    } catch (error) {
      console.error(`[D1] Error updating RSS source status for ${sourceId}:`, error)
      return { success: false, error: error.message }
    }
  }

  // =============================================================================
  // CATEGORIES METHODS
  // =============================================================================

  async getCategories() {
    try {
      const result = await this.db.prepare(`
        SELECT id, name, emoji, color, description, keywords, enabled, sort_order
        FROM categories 
        WHERE enabled = 1 
        ORDER BY sort_order, name
      `).all()
      
      return result.results.map(row => ({
        ...row,
        enabled: Boolean(row.enabled),
        keywords: row.keywords ? JSON.parse(row.keywords) : []
      }))
    } catch (error) {
      console.error('[D1] Error getting categories:', error)
      return []
    }
  }

  async getCategoryKeywords() {
    try {
      const categories = await this.getCategories()
      const keywords = {}
      
      for (const category of categories) {
        keywords[category.id] = category.keywords || []
      }
      
      return keywords
    } catch (error) {
      console.error('[D1] Error getting category keywords:', error)
      return {}
    }
  }

  // =============================================================================
  // ARTICLES METHODS
  // =============================================================================

  async upsertArticle(articleData) {
    try {
      // Generate slug from title
      const slug = this.generateSlug(articleData.title)
      
      const result = await this.db.prepare(`
        INSERT OR REPLACE INTO articles (
          title, slug, description, content, content_snippet, author, source, 
          source_id, source_url, category_id, tags, published_at, image_url, 
          optimized_image_url, original_url, rss_guid, status, priority,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        articleData.title,
        slug,
        articleData.description || '',
        articleData.content || '',
        articleData.content_snippet || articleData.description || '',
        articleData.author || '',
        articleData.source,
        articleData.source_id || null,
        articleData.source_url || '',
        articleData.category_id || 'general',
        JSON.stringify(articleData.tags || []),
        articleData.published_at,
        articleData.image_url || '',
        articleData.optimized_image_url || '',
        articleData.original_url,
        articleData.rss_guid || '',
        articleData.status || 'published',
        articleData.priority || 0
      ).run()
      
      return result.meta.changes > 0 ? result.meta.last_row_id : null
    } catch (error) {
      console.error('[D1] Error upserting article:', error)
      return null
    }
  }

  async getArticles(options = {}) {
    try {
      const {
        category = null,
        limit = 24,
        offset = 0,
        status = 'published',
        orderBy = 'published_at',
        orderDirection = 'DESC'
      } = options
      
      let query = `
        SELECT a.*, c.name as category_name, c.emoji as category_emoji, c.color as category_color
        FROM articles a
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.status = ?
      `
      const params = [status]
      
      if (category && category !== 'all') {
        query += ' AND a.category_id = ?'
        params.push(category)
      }
      
      query += ` ORDER BY a.${orderBy} ${orderDirection} LIMIT ? OFFSET ?`
      params.push(limit, offset)
      
      const result = await this.db.prepare(query).bind(...params).all()
      
      return result.results.map(row => ({
        ...row,
        tags: row.tags ? JSON.parse(row.tags) : [],
        priority: Boolean(row.priority)
      }))
    } catch (error) {
      console.error('[D1] Error getting articles:', error)
      return []
    }
  }

  async searchArticles(query, options = {}) {
    try {
      const {
        category = null,
        limit = 24,
        offset = 0
      } = options
      
      let sql = `
        SELECT a.*, c.name as category_name, c.emoji as category_emoji, c.color as category_color
        FROM articles a
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.status = 'published' 
        AND (a.title LIKE ? OR a.description LIKE ? OR a.content LIKE ?)
      `
      const searchTerm = `%${query}%`
      const params = [searchTerm, searchTerm, searchTerm]
      
      if (category && category !== 'all') {
        sql += ' AND a.category_id = ?'
        params.push(category)
      }
      
      sql += ' ORDER BY a.published_at DESC LIMIT ? OFFSET ?'
      params.push(limit, offset)
      
      const result = await this.db.prepare(sql).bind(...params).all()
      
      return result.results.map(row => ({
        ...row,
        tags: row.tags ? JSON.parse(row.tags) : [],
        priority: Boolean(row.priority)
      }))
    } catch (error) {
      console.error('[D1] Error searching articles:', error)
      return []
    }
  }

  async getArticleBySourceSlug(sourceId, slug) {
    try {
      const result = await this.db.prepare(`
        SELECT a.*, c.name as category_name, c.emoji as category_emoji, c.color as category_color
        FROM articles a
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.source_id = ? AND a.slug = ? AND a.status = 'published'
        LIMIT 1
      `).bind(sourceId, slug).first()
      
      if (!result) {
        return null
      }
      
      return {
        ...result,
        tags: result.tags ? JSON.parse(result.tags) : [],
        priority: Boolean(result.priority)
      }
    } catch (error) {
      console.error('[D1] Error getting article by source and slug:', error)
      return null
    }
  }
  async getArticleCount(options = null) {
    try {
      let query = "SELECT COUNT(*) as count FROM articles WHERE status = 'published'"
      const params = []
      
      // Handle both old category parameter and new options object
      const category = typeof options === 'string' ? options : options?.category_id || options?.source_id;
      
      if (options && typeof options === 'object') {
        if (options.category_id && options.category_id !== 'all') {
          query += ' AND category_id = ?'
          params.push(options.category_id)
        }
        if (options.source_id) {
          query += ' AND source_id = ?'
          params.push(options.source_id)
        }
      } else if (category && category !== 'all') {
        query += ' AND category_id = ?'
        params.push(category)
      }
      
      const result = await this.db.prepare(query).bind(...params).first()
      return result?.count || 0
    } catch (error) {
      console.error('[D1] Error getting article count:', error)
      return 0
    }
  }

  // =============================================================================
  // CACHE METHODS
  // =============================================================================

  async getCacheData(cacheKey, cacheType) {
    try {
      const result = await this.db.prepare(`
        SELECT data, expires_at FROM cache_metadata 
        WHERE cache_key = ? AND cache_type = ? AND 
        (expires_at IS NULL OR expires_at > datetime('now'))
      `).bind(cacheKey, cacheType).first()
      
      if (result?.data) {
        try {
          return JSON.parse(result.data)
        } catch {
          return result.data
        }
      }
      return null
    } catch (error) {
      console.error(`[D1] Error getting cache data for ${cacheKey}:`, error)
      return null
    }
  }

  async setCacheData(cacheKey, cacheType, data, ttlSeconds = null) {
    try {
      const jsonData = typeof data === 'string' ? data : JSON.stringify(data)
      const expiresAt = ttlSeconds ? 
        new Date(Date.now() + (ttlSeconds * 1000)).toISOString() : 
        null
      
      await this.db.prepare(`
        INSERT OR REPLACE INTO cache_metadata 
        (cache_key, cache_type, data, expires_at, updated_at) 
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(cacheKey, cacheType, jsonData, expiresAt).run()
      
      return { success: true }
    } catch (error) {
      console.error(`[D1] Error setting cache data for ${cacheKey}:`, error)
      return { success: false, error: error.message }
    }
  }

  async clearExpiredCache() {
    try {
      const result = await this.db.prepare(`
        DELETE FROM cache_metadata 
        WHERE expires_at IS NOT NULL AND expires_at <= datetime('now')
      `).run()
      
      return { success: true, deletedRows: result.meta.changes }
    } catch (error) {
      console.error('[D1] Error clearing expired cache:', error)
      return { success: false, error: error.message }
    }
  }

  // =============================================================================
  // FEED STATUS METHODS
  // =============================================================================

  async getFeedStatus(sourceId) {
    try {
      const result = await this.db.prepare(`
        SELECT * FROM feed_status WHERE source_id = ? ORDER BY created_at DESC LIMIT 1
      `).bind(sourceId).first()
      
      return result
    } catch (error) {
      console.error(`[D1] Error getting feed status for ${sourceId}:`, error)
      return null
    }
  }

  async updateFeedStatus(sourceId, status, errorMessage = null, processingDuration = null, articlesFetched = 0) {
    try {
      await this.db.prepare(`
        INSERT OR REPLACE INTO feed_status 
        (source_id, status, last_run_at, run_count, error_message, 
         processing_duration, articles_fetched, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP, 
                COALESCE((SELECT run_count FROM feed_status WHERE source_id = ?), 0) + 1,
                ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(sourceId, status, sourceId, errorMessage, processingDuration, articlesFetched).run()
      
      return { success: true }
    } catch (error) {
      console.error(`[D1] Error updating feed status for ${sourceId}:`, error)
      return { success: false, error: error.message }
    }
  }

  // =============================================================================
  // ANALYTICS METHODS
  // =============================================================================

  async logSearch(query, categoryFilter = null, resultsCount = 0, sessionId = null) {
    try {
      await this.db.prepare(`
        INSERT INTO search_logs 
        (query, category_filter, results_count, session_id, created_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(query, categoryFilter, resultsCount, sessionId).run()
      
      return { success: true }
    } catch (error) {
      console.error('[D1] Error logging search:', error)
      return { success: false, error: error.message }
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .substring(0, 50) // Limit length
  }

  async runMigration(migrationSql) {
    try {
      // Split by semicolon and execute each statement
      const statements = migrationSql.split(';').filter(stmt => stmt.trim())
      
      for (const statement of statements) {
        if (statement.trim()) {
          await this.db.prepare(statement.trim()).run()
        }
      }
      
      return { success: true }
    } catch (error) {
      console.error('[D1] Migration error:', error)
      return { success: false, error: error.message }
    }
  }

  // Health check method
  async healthCheck() {
    try {
      const result = await this.db.prepare('SELECT 1 as health').first()
      return { healthy: result.health === 1, timestamp: new Date().toISOString() }
    } catch (error) {
      return { healthy: false, error: error.message, timestamp: new Date().toISOString() }
    }
  }

  // Get database statistics
  async getStats() {
    try {
      const results = await Promise.all([
        this.db.prepare('SELECT COUNT(*) as count FROM articles').first(),
        this.db.prepare('SELECT COUNT(*) as count FROM rss_sources WHERE enabled = 1').first(),
        this.db.prepare('SELECT COUNT(*) as count FROM categories WHERE enabled = 1').first(),
        this.db.prepare('SELECT COUNT(*) as count FROM cache_metadata WHERE expires_at IS NULL OR expires_at > datetime("now")').first(),
      ])
      
      return {
        articles: results[0].count,
        rssSources: results[1].count,
        categories: results[2].count,
        activeCache: results[3].count,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('[D1] Error getting stats:', error)
      return { error: error.message }
    }
  }
}
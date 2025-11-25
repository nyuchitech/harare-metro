/**
 * Comprehensive Observability Service for Harare Metro
 * Provides logging, metrics, tracing, and health monitoring
 * Integrates with Cloudflare's observability stack
 */

export interface LogEntry {
  timestamp: number
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  message: string
  metadata?: Record<string, any>
  requestId?: string
  userId?: string
  duration?: number
  error?: Error
}

export interface MetricEntry {
  name: string
  value: number
  type: 'counter' | 'gauge' | 'histogram' | 'timer'
  tags?: Record<string, string>
  timestamp: number
}

export interface HealthCheck {
  service: string
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: number
  responseTime?: number
  error?: string
  metadata?: Record<string, any>
}

export class ObservabilityService {
  private db: D1Database
  private logLevel: string
  private metrics: Map<string, MetricEntry[]> = new Map()
  private requestStartTimes: Map<string, number> = new Map()

  constructor(db: D1Database, logLevel: string = 'info') {
    this.db = db
    this.logLevel = logLevel
  }

  /**
   * Generate unique request ID for tracing
   */
  generateRequestId(): string {
    return crypto.randomUUID()
  }

  /**
   * Start request tracking
   */
  startRequest(requestId: string): void {
    this.requestStartTimes.set(requestId, Date.now())
  }

  /**
   * End request tracking and log performance
   */
  async endRequest(requestId: string, method: string, path: string, status: number, userId?: string): Promise<void> {
    const startTime = this.requestStartTimes.get(requestId)
    if (!startTime) return

    const duration = Date.now() - startTime
    this.requestStartTimes.delete(requestId)

    // Log request completion
    await this.log('info', `${method} ${path} ${status}`, {
      requestId,
      userId,
      duration,
      status,
      method,
      path
    })

    // Record metrics
    await this.recordMetric('http_requests_total', 1, 'counter', {
      method,
      path,
      status: status.toString()
    })

    await this.recordMetric('http_request_duration_ms', duration, 'histogram', {
      method,
      path
    })
  }

  /**
   * Log messages with structured data
   */
  async log(level: LogEntry['level'], message: string, metadata?: Record<string, any>): Promise<void> {
    const logLevels = { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 }
    const currentLevel = logLevels[this.logLevel as keyof typeof logLevels] || 1
    
    if (logLevels[level] < currentLevel) {
      return // Skip logging below configured level
    }

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      metadata
    }

    // Console output for development
    console.log(JSON.stringify(entry))

    // Store in D1 for analysis (async, don't await to avoid blocking)
    this.storeLogEntry(entry).catch(error => {
      console.error('Failed to store log entry:', error)
    })
  }

  /**
   * Record performance metrics
   */
  async recordMetric(name: string, value: number, type: MetricEntry['type'], tags?: Record<string, string>): Promise<void> {
    const metric: MetricEntry = {
      name,
      value,
      type,
      tags,
      timestamp: Date.now()
    }

    // Store in memory for immediate access
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const metrics = this.metrics.get(name)!
    metrics.push(metric)
    
    // Keep only last 100 entries per metric
    if (metrics.length > 100) {
      metrics.shift()
    }

    // Store in D1 for historical analysis
    this.storeMetric(metric).catch(error => {
      console.error('Failed to store metric:', error)
    })
  }

  /**
   * Perform health checks on all services
   */
  async performHealthChecks(bindings: any): Promise<Record<string, HealthCheck>> {
    const checks: Record<string, HealthCheck> = {}

    // Database health check
    checks.database = await this.checkDatabaseHealth()

    // KV health check
    if (bindings.AUTH_STORAGE) {
      checks.auth_storage = await this.checkKVHealth(bindings.AUTH_STORAGE)
    }

    // Analytics engine health check
    if (bindings.CATEGORY_CLICKS) {
      checks.analytics_engine = await this.checkAnalyticsEngineHealth(bindings)
    }

    // Durable Objects health check
    if (bindings.REALTIME_ANALYTICS) {
      checks.realtime_analytics = await this.checkDurableObjectHealth(bindings.REALTIME_ANALYTICS)
    }

    return checks
  }

  /**
   * Check database connectivity and performance
   */
  private async checkDatabaseHealth(): Promise<HealthCheck> {
    const startTime = Date.now()
    
    try {
      const result = await this.db.prepare('SELECT 1 as test').first()
      const responseTime = Date.now() - startTime
      
      return {
        service: 'database',
        status: result?.test === 1 ? 'healthy' : 'unhealthy',
        timestamp: Date.now(),
        responseTime,
        metadata: { query: 'SELECT 1' }
      }
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Check KV storage health
   */
  private async checkKVHealth(kv: KVNamespace): Promise<HealthCheck> {
    const startTime = Date.now()
    const testKey = `health_check_${Date.now()}`
    
    try {
      await kv.put(testKey, 'test', { expirationTtl: 60 })
      const value = await kv.get(testKey)
      await kv.delete(testKey)
      
      return {
        service: 'kv_storage',
        status: value === 'test' ? 'healthy' : 'unhealthy',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        service: 'kv_storage',
        status: 'unhealthy',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Check Analytics Engine health
   */
  private async checkAnalyticsEngineHealth(bindings: any): Promise<HealthCheck> {
    const startTime = Date.now()
    
    try {
      // Try to write a test event
      await bindings.CATEGORY_CLICKS.writeDataPoint({
        blobs: ['health_check'],
        doubles: [Date.now()],
        indexes: ['health_check']
      })
      
      return {
        service: 'analytics_engine',
        status: 'healthy',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        service: 'analytics_engine',
        status: 'unhealthy',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Check Durable Object health
   */
  private async checkDurableObjectHealth(namespace: DurableObjectNamespace): Promise<HealthCheck> {
    const startTime = Date.now()
    
    try {
      const id = namespace.idFromName('health_check')
      const obj = namespace.get(id)
      const response = await obj.fetch('http://health/metrics')
      
      return {
        service: 'durable_objects',
        status: response.ok ? 'healthy' : 'unhealthy',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        service: 'durable_objects',
        status: 'unhealthy',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get current metrics summary
   */
  getMetricsSummary(): Record<string, any> {
    const summary: Record<string, any> = {}
    
    for (const [name, metrics] of this.metrics) {
      const recent = metrics.slice(-10) // Last 10 entries
      const values = recent.map(m => m.value)
      
      summary[name] = {
        current: values[values.length - 1] || 0,
        average: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
        min: Math.min(...values),
        max: Math.max(...values),
        count: recent.length,
        lastUpdated: recent[recent.length - 1]?.timestamp || 0
      }
    }
    
    return summary
  }

  /**
   * Store log entry in D1 database
   */
  private async storeLogEntry(entry: LogEntry): Promise<void> {
    try {
      await this.db
        .prepare(`
          INSERT INTO system_logs (
            level, message, metadata, request_id, user_id, 
            duration, error_message, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `)
        .bind(
          entry.level,
          entry.message,
          JSON.stringify(entry.metadata || {}),
          entry.requestId || null,
          entry.userId || null,
          entry.duration || null,
          entry.error?.message || null
        )
        .run()
    } catch (error) {
      console.error('Failed to store log entry in D1:', error)
    }
  }

  /**
   * Store metric in D1 database
   */
  private async storeMetric(metric: MetricEntry): Promise<void> {
    try {
      await this.db
        .prepare(`
          INSERT INTO system_metrics (
            name, value, type, tags, created_at
          ) VALUES (?, ?, ?, ?, datetime('now'))
        `)
        .bind(
          metric.name,
          metric.value,
          metric.type,
          JSON.stringify(metric.tags || {})
        )
        .run()
    } catch (error) {
      console.error('Failed to store metric in D1:', error)
    }
  }

  /**
   * Create alerting rules for monitoring
   */
  async checkAlerts(): Promise<any[]> {
    const alerts = []
    
    // Check error rate
    const errorRate = await this.getErrorRate()
    if (errorRate > 0.05) { // 5% error rate threshold
      alerts.push({
        type: 'error_rate',
        severity: 'warning',
        message: `High error rate detected: ${(errorRate * 100).toFixed(2)}%`,
        value: errorRate
      })
    }
    
    // Check response time
    const avgResponseTime = await this.getAverageResponseTime()
    if (avgResponseTime > 5000) { // 5 second threshold
      alerts.push({
        type: 'response_time',
        severity: 'warning',
        message: `High response time detected: ${avgResponseTime}ms`,
        value: avgResponseTime
      })
    }
    
    return alerts
  }

  /**
   * Calculate error rate from recent logs
   */
  private async getErrorRate(): Promise<number> {
    try {
      const result = await this.db
        .prepare(`
          SELECT 
            COUNT(CASE WHEN level IN ('error', 'fatal') THEN 1 END) as errors,
            COUNT(*) as total
          FROM system_logs 
          WHERE created_at > datetime('now', '-1 hour')
        `)
        .first() as any
      
      return result?.total > 0 ? result.errors / result.total : 0
    } catch (error) {
      console.error('Failed to calculate error rate:', error)
      return 0
    }
  }

  /**
   * Calculate average response time
   */
  private async getAverageResponseTime(): Promise<number> {
    try {
      const result = await this.db
        .prepare(`
          SELECT AVG(duration) as avg_duration
          FROM system_logs 
          WHERE duration IS NOT NULL 
          AND created_at > datetime('now', '-1 hour')
        `)
        .first() as any
      
      return result?.avg_duration || 0
    } catch (error) {
      console.error('Failed to calculate average response time:', error)
      return 0
    }
  }

  /**
   * Middleware for automatic request logging
   */
  requestLogger() {
    return async (c: any, next: any) => {
      const requestId = this.generateRequestId()
      const startTime = Date.now()
      
      c.set('requestId', requestId)
      c.set('observability', this)
      
      this.startRequest(requestId)
      
      try {
        await next()
      } catch (error) {
        await this.log('error', `Request failed: ${error}`, {
          requestId,
          error: error instanceof Error ? error.message : 'Unknown error',
          path: c.req.path,
          method: c.req.method
        })
        throw error
      } finally {
        const userId = c.get('user')?.id
        await this.endRequest(
          requestId, 
          c.req.method, 
          c.req.path, 
          c.res.status || 500,
          userId
        )
      }
    }
  }
}
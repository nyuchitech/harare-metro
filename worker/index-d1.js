/* eslint-env worker */
/* global Response, Request, URL, __STATIC_CONTENT_MANIFEST */
import { getAssetFromKV } from '@cloudflare/kv-asset-handler'
import D1ConfigService from './services/D1ConfigService.js'
import { ArticleService } from './services/ArticleService.js'
import { AnalyticsEngineService } from './services/AnalyticsEngineService.js'
import RSSFeedService from './services/RSSFeedService.js'
import { D1CacheService } from './services/D1CacheService.js'
import { handleApiRequest } from './api.js'
import { CloudflareImagesService } from './services/CloudflareImagesService.js'
import { logger } from './utils/logger.js'

// Cache headers - static configuration
const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=300, s-maxage=600',
  'CDN-Cache-Control': 'max-age=600', 
  'Cloudflare-CDN-Cache-Control': 'max-age=600'
}

// Helper to detect environment and get config
async function getConfig(configService, env) {
  const isPreview = env.NODE_ENV === 'development' || env.NODE_ENV === 'preview'
  
  const [
    maxArticlesPerSource,
    maxTotalArticles,
    rssTimeout,
    paginationConfig
  ] = await Promise.all([
    configService.getMaxArticlesPerSource(isPreview),
    configService.getMaxTotalArticles(isPreview),
    configService.getRssTimeout(isPreview),
    configService.getPaginationConfig(isPreview)
  ])
  
  return {
    maxArticlesPerSource,
    maxTotalArticles,
    rssTimeout,
    refreshInterval: 60 * 60 * 1000, // 60 minutes in milliseconds
    articlesTtl: 14 * 24 * 60 * 60, // 2 weeks in seconds
    apiMinLimit: paginationConfig.pageSize || 12,
    apiMaxLimit: paginationConfig.initialLoad || 24,
    cacheHeaders: CACHE_HEADERS
  }
}

// Initialize services with D1 database (no more KV!)
function initializeServices(env) {
  // D1 database - our primary data store
  const d1Database = env.ARTICLES_DB
  
  if (!d1Database) {
    console.error('[WORKER] ARTICLES_DB D1 binding not available!')
    throw new Error('D1 database binding (ARTICLES_DB) is required')
  }
  
  // Configuration service using D1
  const configService = new D1ConfigService(d1Database)
  
  // Articles database service 
  const articleService = new ArticleService(d1Database)
  
  // Cache service using D1 (replaces all KV storage)
  const cacheService = new D1CacheService(d1Database, articleService)
  
  // RSS feed processing service 
  const rssService = new RSSFeedService(configService)
  
  // Analytics service with correct 3 datasets
  const analyticsService = new AnalyticsEngineService({
    categoryClicks: env.CATEGORY_CLICKS || null,
    newsInteractions: env.NEWS_INTERACTIONS || null,
    searchQueries: env.SEARCH_QUERIES || null
  })
  
  // Image optimization service
  const imagesService = new CloudflareImagesService(env)

  console.log('[WORKER] Services initialized with D1 database')
  
  return {
    configService,
    articleService,
    cacheService,
    rssService,
    analyticsService,
    imagesService
  }
}

// Background scheduled refresh function - uses D1 only
async function runScheduledRefresh(env) {
  const startTime = Date.now()
  
  try {
    console.log('[CRON] Starting autonomous scheduled refresh')
    
    const { cacheService, rssService, configService } = initializeServices(env)
    const config = await getConfig(configService, env)
    
    // Check if refresh is needed (autonomous decision)
    const needsRefresh = await cacheService.shouldRunScheduledRefresh(config.refreshInterval / 1000)
    if (!needsRefresh) {
      console.log('[CRON] Scheduled refresh not needed yet')
      return { success: true, reason: 'Not time for refresh', skipped: true }
    }

    // Try to acquire lock (autonomous)
    const lockAcquired = await cacheService.acquireRefreshLock()
    if (!lockAcquired) {
      console.log('[CRON] Could not acquire refresh lock - another process running')
      return { success: true, reason: 'Another refresh in progress', skipped: true }
    }

    console.log('[CRON] Starting RSS fetch from all sources')
    
    // Fetch fresh articles autonomously using dynamic config
    const freshArticles = await rssService.fetchAllFeedsBackground(
      config.maxArticlesPerSource,
      config.maxTotalArticles
    )
    
    if (freshArticles && freshArticles.length > 0) {
      // Cache the articles using D1CacheService
      await cacheService.setCachedArticles(freshArticles)
      await cacheService.setLastScheduledRun()
      
      const duration = Date.now() - startTime
      console.log(`[CRON] Autonomous refresh completed successfully - ${freshArticles.length} articles in ${duration}ms`)
      
      return { 
        success: true, 
        articlesCount: freshArticles.length,
        duration: duration,
        timestamp: new Date().toISOString(),
        autonomous: true
      }
    } else {
      console.log('[CRON] No articles fetched during refresh')
      return { 
        success: false, 
        reason: 'No articles fetched',
        articlesCount: 0 
      }
    }
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('[CRON] Autonomous refresh failed:', error)
    return { 
      success: false, 
      reason: error.message,
      autonomous: true,
      duration: duration
    }
  } finally {
    // Always release lock
    try {
      const { cacheService } = initializeServices(env)
      await cacheService.releaseRefreshLock()
      console.log('[CRON] Refresh lock released')
    } catch (lockError) {
      console.error('[CRON] Failed to release lock:', lockError)
    }
  }
}

// Initial data loading function - uses D1 only
async function _ensureInitialData(env) {
  try {
    console.log('[INIT] Checking if initial data load is needed')
    
    const { cacheService, rssService, configService } = initializeServices(env)
    const config = await getConfig(configService, env)
    
    // Check if we have any cached articles in D1
    const existingArticles = await cacheService.getCachedArticles()
    
    if (existingArticles && existingArticles.length > 0) {
      console.log(`[INIT] Found ${existingArticles.length} cached articles, no initial load needed`)
      return { success: true, reason: 'Data already available', articlesCount: existingArticles.length }
    }
    
    console.log('[INIT] No cached data found, performing initial load')
    
    // Try to acquire lock for initial load
    const lockAcquired = await cacheService.acquireRefreshLock()
    if (!lockAcquired) {
      console.log('[INIT] Another process is loading data, waiting...')
      return { success: true, reason: 'Another process loading', skipped: true }
    }
    
    try {
      // Perform initial RSS fetch using dynamic config
      const articles = await rssService.fetchAllFeedsBackground(
        config.maxArticlesPerSource,
        config.maxTotalArticles
      )
      
      if (articles && articles.length > 0) {
        await cacheService.setCachedArticles(articles)
        await cacheService.setLastScheduledRun()
        
        console.log(`[INIT] Initial load completed - ${articles.length} articles`)
        return { 
          success: true, 
          articlesCount: articles.length,
          initialLoad: true 
        }
      } else {
        console.log('[INIT] No articles loaded during initial fetch')
        return { success: false, reason: 'No articles fetched' }
      }
      
    } finally {
      await cacheService.releaseRefreshLock()
    }
    
  } catch (error) {
    console.error('[INIT] Initial data load failed:', error)
    return { success: false, reason: error.message }
  }
}

// Validate environment function - updated for D1
function _validateEnvironment(env) {
  const issues = []
  const warnings = []
  
  // Critical bindings - D1 database is now primary
  if (!env.ARTICLES_DB) issues.push('ARTICLES_DB D1 binding missing (critical - app will not work)')
  
  // Analytics (optional but recommended)
  if (!env.CATEGORY_CLICKS) warnings.push('CATEGORY_CLICKS Analytics binding missing')
  if (!env.NEWS_INTERACTIONS) warnings.push('NEWS_INTERACTIONS Analytics binding missing')
  if (!env.SEARCH_QUERIES) warnings.push('SEARCH_QUERIES Analytics binding missing')
  
  // Image service
  if (!env.CLOUDFLARE_ACCOUNT_ID) warnings.push('CLOUDFLARE_ACCOUNT_ID missing (image optimization disabled)')
  if (!env.CLOUDFLARE_API_TOKEN) warnings.push('CLOUDFLARE_API_TOKEN missing (image optimization disabled)')
  
  return {
    valid: issues.length === 0,
    issues,
    warnings,
    bindingsOk: issues.length === 0,
    allFeaturesAvailable: issues.length === 0 && warnings.length === 0
  }
}

// Enhanced fallback HTML with D1 database access
async function getEnhancedFallbackHTML(env, debugInfo = {}) {
  try {
    console.log('[FALLBACK] Generating enhanced fallback HTML with D1 database')
    
    // Initialize D1 services to get articles for the fallback page
    const { cacheService, articleService } = initializeServices(env)
    
    // Get latest 12 articles from D1, with fallback
    let articles = []
    let articlesError = null
    let source = 'cache'
    
    try {
      const cachedArticles = await cacheService.getCachedArticles()
      articles = cachedArticles.slice(0, 12) // Get latest 12
      source = 'D1 cache'
    } catch (cacheError) {
      console.warn('[FALLBACK] Failed to load articles from D1 cache:', cacheError)
      articlesError = cacheError.message
      
      // Direct D1 database query
      try {
        console.log('[FALLBACK] Attempting direct D1 database query...')
        const dbArticles = await articleService.getArticles({ 
          limit: 12, 
          orderBy: 'published_at', 
          orderDirection: 'DESC' 
        })
        articles = dbArticles
        source = 'D1 direct'
        articlesError = null
        console.log(`[FALLBACK] Successfully loaded ${articles.length} articles from direct D1 query`)
      } catch (dbError) {
        console.error('[FALLBACK] Direct D1 query also failed:', dbError)
        articlesError = `D1 cache failed: ${cacheError.message}. D1 direct failed: ${dbError.message}`
        articles = []
      }
    }
    
    // Generate articles HTML
    let articlesHTML = ''
    if (articles.length > 0) {
      articlesHTML = articles.map(article => `
        <article class="article-card">
          <div class="article-content">
            <h3 class="article-title">
              <a href="${article.original_url || article.link || '#'}" target="_blank" rel="noopener">
                ${escapeHtml(article.title || 'Untitled Article')}
              </a>
            </h3>
            <p class="article-description">
              ${escapeHtml((article.description || article.content_snippet || '').substring(0, 150))}${(article.description || article.content_snippet || '').length > 150 ? '...' : ''}
            </p>
            <div class="article-meta">
              <span class="article-source">${escapeHtml(article.source || 'Unknown Source')}</span>
              <span class="article-date">${formatDate(article.published_at || article.created_at)}</span>
            </div>
          </div>
        </article>
      `).join('')
    } else {
      articlesHTML = `
        <div class="no-articles">
          <h3>📰 News Loading</h3>
          <p>Our latest articles are being updated from the D1 database. Please check back in a moment.</p>
        </div>
      `
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harare Metro - Zimbabwe News</title>
    <link rel="icon" type="image/png" href="/logo.png">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #0a0a0a; color: #ffffff; line-height: 1.6; -webkit-font-smoothing: antialiased;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .header { padding: 40px 0; text-align: center; border-bottom: 1px solid #262626; }
        .logo { display: inline-flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .logo-text { font-size: 2rem; font-weight: 700; color: #ffffff; }
        .tagline { color: #a3a3a3; font-size: 1.1rem; font-weight: 400; }
        .main-content { padding: 40px 0; }
        .section-title { font-size: 1.5rem; font-weight: 600; color: #ffffff; margin-bottom: 30px; text-align: center; }
        .articles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 24px; margin-bottom: 40px; }
        .article-card { background: #111111; border: 1px solid #262626; border-radius: 8px; padding: 24px; transition: all 0.2s ease; }
        .article-card:hover { border-color: #404040; background: #151515; }
        .article-title { font-size: 1.1rem; font-weight: 600; line-height: 1.4; margin-bottom: 12px; }
        .article-title a { color: #ffffff; text-decoration: none; }
        .article-title a:hover { color: #2563eb; }
        .article-description { color: #a3a3a3; font-size: 0.95rem; line-height: 1.5; margin-bottom: 16px; }
        .article-meta { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; color: #666666; }
        .article-source { font-weight: 500; color: #2563eb; }
        .no-articles { text-align: center; background: #111111; border: 1px solid #262626; border-radius: 8px; padding: 60px 40px; }
        .no-articles h3 { font-size: 1.25rem; color: #ffffff; margin-bottom: 12px; }
        .no-articles p { color: #a3a3a3; }
        .refresh-notice { text-align: center; padding: 20px; background: #111111; border: 1px solid #262626; border-radius: 8px; margin-top: 30px; }
        .refresh-notice p { color: #a3a3a3; font-size: 0.9rem; }
        .debug-info { margin-top: 2rem; padding: 1rem; background: #1a1a1a; border-radius: 8px; border-left: 4px solid #ef4444; }
        .debug-info h3 { color: #ef4444; font-size: 1.1rem; margin-bottom: 0.5rem; }
        .debug-details { font-family: 'Courier New', monospace; font-size: 0.8rem; color: #ccc; }
        @media (max-width: 768px) {
            .container { padding: 0 16px; }
            .articles-grid { grid-template-columns: 1fr; gap: 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <div class="logo">
                <span style="font-size: 2rem; font-weight: bold; background: linear-gradient(45deg, #22c55e, #facc15, #ef4444); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">HM</span>
                <h1 class="logo-text">Harare Metro</h1>
            </div>
            <p class="tagline">Zimbabwe's Premier News Aggregator (D1 Database)</p>
        </header>

        <main class="main-content">
            <h2 class="section-title">Latest News from D1 Database</h2>
            
            <div class="articles-grid">
                ${articlesHTML}
            </div>
            
            <div class="refresh-notice">
                <p>📱 For the best experience, please refresh the page to load our full interactive app.</p>
                <p style="margin-top: 8px; font-size: 0.8rem;">🗄️ Data sourced from Cloudflare D1 database (${source})</p>
            </div>
            
            <div class="debug-info">
                <h3>🚨 Fallback Mode Active - Using D1 Database</h3>
                <p style="font-size: 0.9rem; color: #888; margin-bottom: 1rem;">The React app failed to load. This fallback page shows articles from D1 database instead of KV storage.</p>
                
                <div class="debug-details">
                    <div><strong>Primary Error:</strong> ${debugInfo.reason || 'Static assets unavailable'}</div>
                    <div><strong>Database Source:</strong> Cloudflare D1 (${source})</div>
                    <div><strong>Articles Loaded:</strong> ${articles.length} articles</div>
                    ${articlesError ? `<div><strong>Database Error:</strong> ${escapeHtml(articlesError)}</div>` : ''}
                    <div><strong>Migration Status:</strong> KV storage replaced with D1 database</div>
                    <div><strong>Environment:</strong> ${env.NODE_ENV || 'production'}</div>
                    <div><strong>Timestamp:</strong> ${new Date().toISOString()}</div>
                </div>
            </div>
        </main>
    </div>

    <div id="root"></div>
    
    <script>
        console.log('🗄️ Enhanced D1 fallback loaded. Articles sourced from D1 database.');
        console.log('Press F5 or Ctrl+R to refresh and try loading the React app again.');
    </script>
</body>
</html>`
  } catch (error) {
    console.error('[FALLBACK] Failed to generate enhanced D1 fallback HTML:', error)
    // Fall back to basic HTML if enhanced version fails
    return getBasicHTML()
  }
}

// Basic HTML fallback
function getBasicHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harare Metro - Modern News Aggregator</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #000000; min-height: 100vh; color: #ffffff; }
        .container { max-width: 900px; margin: 0 auto; padding: 60px 24px; text-align: center; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; }
        .logo { font-size: 3rem; margin-bottom: 24px; }
        .tagline { color: #a3a3a3; font-size: 1.1rem; margin-bottom: 48px; }
        .loading { background: #0f0f0f; border: 1px solid #262626; border-radius: 12px; padding: 40px 32px; margin-bottom: 48px; }
        .spinner { width: 32px; height: 32px; border: 2px solid #404040; border-top: 2px solid #ffffff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 24px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">HM</div>
        <p class="tagline">Harare Metro - Zimbabwe's premier news aggregation platform</p>
        <div class="loading">
            <div class="spinner"></div>
            <h3>Loading Latest News from D1 Database...</h3>
            <p>Migrated from KV storage to Cloudflare D1 for better scalability</p>
        </div>
    </div>
    <div id="root"></div>
    <script>console.log('🗄️ Basic D1 fallback loaded. Press F5 to refresh.');</script>
</body>
</html>`
}

// Helper functions for HTML generation
function escapeHtml(text) {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatDate(dateString) {
  if (!dateString) return 'Recently'
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 7) {
      return date.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short' 
      })
    } else if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else {
      return 'Just now'
    }
  } catch {
    return 'Recently'
  }
}

// Export utility functions
export {
  getConfig,
  CACHE_HEADERS,
  initializeServices,
  runScheduledRefresh
}

// Main Cloudflare Worker export - D1 powered
export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url)
      
      // Validate D1 environment first
      const envValidation = _validateEnvironment(env)
      if (!envValidation.valid) {
        console.error('[WORKER] Environment validation failed:', envValidation.issues)
        return new Response(`Environment Error: ${envValidation.issues.join(', ')}`, { 
          status: 500, 
          headers: { 'Content-Type': 'text/plain' } 
        })
      }
      
      // Initialize asset manifest
      let assetManifest = {}
      try {
        assetManifest = __STATIC_CONTENT_MANIFEST || {}
      } catch {
        assetManifest = {}
      }
      
      // Handle CORS preflight requests
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-ID',
          }
        })
      }
      
      // Handle API requests (delegates to api.js - will need updating for D1)
      if (url.pathname.startsWith('/api/')) {
        return await handleApiRequest(request, env, ctx)
      }
      
      // Handle static files
      const isAssetRequest = (
        url.pathname.startsWith('/assets/') ||
        url.pathname.endsWith('.js') || 
        url.pathname.endsWith('.css') || 
        url.pathname.endsWith('.ico') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.jpg') ||
        url.pathname.endsWith('.jpeg') ||
        url.pathname.endsWith('.webp') ||
        url.pathname.endsWith('.woff') ||
        url.pathname.endsWith('.woff2') ||
        url.pathname.endsWith('.ttf') ||
        url.pathname.endsWith('.map') ||
        url.pathname === '/favicon.ico' ||
        url.pathname === '/vite.svg' ||
        url.pathname === '/manifest.json'
      )
      
      if (isAssetRequest) {
        try {
          if (!env.__STATIC_CONTENT) {
            if (url.pathname.endsWith('.map')) {
              return new Response('Source map not available', { 
                status: 404,
                headers: { 'Content-Type': 'text/plain' }
              })
            }
            
            if (url.pathname === '/favicon.ico' || url.pathname === '/vite.svg') {
              return new Response(`
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                  <text y="24" font-size="24">🇿🇼</text>
                </svg>
              `, { 
                status: 200,
                headers: { 
                  'Content-Type': 'image/svg+xml',
                  'Cache-Control': 'public, max-age=86400'
                }
              })
            }
            
            return new Response('Static content not configured', { 
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            })
          }

          const response = await getAssetFromKV({
            request,
            waitUntil: ctx.waitUntil.bind(ctx),
          }, {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: assetManifest,
          })
          
          const newResponse = new Response(response.body, response)
          
          if (url.pathname.startsWith('/assets/')) {
            newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
          } else {
            newResponse.headers.set('Cache-Control', 'public, max-age=86400')
          }
          
          return newResponse
          
        } catch (error) {
          if (url.pathname.endsWith('.map')) {
            return new Response('Source map not found', { 
              status: 404,
              headers: { 'Content-Type': 'text/plain' }
            })
          }
          
          return new Response('Asset not found', { 
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
          })
        }
      }

      // Serve React app (SPA fallback) for all other routes
      try {
        if (!env.__STATIC_CONTENT) {
          console.log('[WORKER] Static content not available, serving D1 fallback HTML')
          const fallbackHTML = await getEnhancedFallbackHTML(env, {
            reason: 'Static content environment variable not available',
            hasStaticContent: false,
            path: request.url
          })
          return new Response(fallbackHTML, {
            headers: { 
              'Content-Type': 'text/html;charset=UTF-8',
              'Cache-Control': 'public, max-age=300'
            }
          })
        }

        const response = await getAssetFromKV({
          request: new Request(new URL('/index.html', request.url)),
          waitUntil: ctx.waitUntil.bind(ctx),
        }, {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: assetManifest,
        })
        
        const newResponse = new Response(response.body, response)
        newResponse.headers.set('Cache-Control', 'public, max-age=3600')
        newResponse.headers.set('Content-Type', 'text/html;charset=UTF-8')
        return newResponse
        
      } catch (error) {
        console.log(`[WORKER] index.html not found, serving D1 fallback: ${error.message}`)
        const fallbackHTML = await getEnhancedFallbackHTML(env, {
          reason: `Asset loading failed: ${error.message}`,
          error: error.message,
          hasStaticContent: true,
          path: request.url
        })
        return new Response(fallbackHTML, {
          headers: { 
            'Content-Type': 'text/html;charset=UTF-8',
            'Cache-Control': 'public, max-age=300'
          }
        })
      }

    } catch (error) {
      console.error('[WORKER] Worker error:', error)
      return new Response(`Worker Error: ${error.message}`, { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      })
    }
  },

  // Scheduled event handler for Cloudflare Cron Triggers - D1 powered
  async scheduled(controller, env, _ctx) {
    console.log('[CRON] Cron trigger executed with D1 database')
    
    try {
      const result = await runScheduledRefresh(env)
      
      if (result.success) {
        console.log(`[CRON] Scheduled refresh successful: ${result.articlesCount || 0} articles in ${result.duration}ms`)
      } else {
        console.log(`[CRON] Scheduled refresh skipped: ${result.reason}`)
      }
      
      return result
    } catch (error) {
      console.error('[CRON] Scheduled event handler failed:', error)
      return { success: false, error: error.message }
    }
  }
}
/* eslint-env worker */
/* global Response, Request, URL, __STATIC_CONTENT_MANIFEST */
import { getAssetFromKV } from '@cloudflare/kv-asset-handler'
import ConfigService from './services/ConfigService.js'
import { ArticleService } from './services/ArticleService.js'
import { AnalyticsEngineService } from './services/AnalyticsEngineService.js'
import RSSFeedService from './services/RSSFeedService.js'
import { CacheService } from './services/CacheService.js'
import { handleApiRequest } from './api.js'
import { CloudflareImagesService } from './services/CloudflareImagesService.js'

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
    cacheSettings
  ] = await Promise.all([
    configService.getMaxArticlesPerSource(isPreview),
    configService.getMaxTotalArticles(isPreview),
    configService.getCacheSettings(isPreview)
  ])
  
  return {
    maxArticlesPerSource,
    maxTotalArticles,
    refreshInterval: cacheSettings.refreshInterval,
    articlesTtl: cacheSettings.articlesTtl,
    apiMinLimit: 100, // Keep static for now
    apiMaxLimit: 1000, // Keep static for now
    cacheHeaders: CACHE_HEADERS
  }
}

// Initialize services with CORRECT bindings
function initializeServices(env) {
  // Multi-tier storage architecture initialization
  
  // System configuration (app settings, limits)
  const configService = new ConfigService(env.HM_CONFIGURATIONS)
  
  // Articles database (D1 with slugs and content) 
  const articleService = new ArticleService(env.ARTICLES_DB)
  
  // News content storage (feeds, categories, keywords, tags)
  const newsStorageService = new ConfigService(env.HM_NEWS_STORAGE)
  
  // Cache configuration storage (cache settings, TTL, strategies)
  const cacheConfigService = new ConfigService(env.HM_CACHE_CONFIG)
  
  // Main articles cache storage (with D1 article persistence)
  const cacheService = new CacheService(
    env.HM_CACHE_STORAGE,  // Articles and news cache
    env.HM_CACHE_CONFIG,   // Cache configuration
    articleService         // D1 database service for article persistence
  )
  
  // User storage service (for user-specific data like bookmarks, likes)
  const userStorageService = new CacheService(
    env.HM_USER_STORAGE,   // User data storage
    env.HM_CACHE_CONFIG    // Cache configuration
  )
  
  // RSS feed processing service (now uses both config and news storage)
  const rssService = new RSSFeedService(configService, newsStorageService)
  
  // Analytics service with correct 3 datasets
  const analyticsService = new AnalyticsEngineService({
    categoryClicks: env.CATEGORY_CLICKS || null,
    newsInteractions: env.NEWS_INTERACTIONS || null,
    searchQueries: env.SEARCH_QUERIES || null
  })
  
  // Image optimization service
  const imagesService = new CloudflareImagesService(env)

  // Services initialized with multi-tier storage architecture
  
  return {
    configService,           // System configuration
    articleService,          // D1 articles database  
    newsStorageService,      // News content (feeds/categories/keywords)
    cacheConfigService,      // Cache configuration
    cacheService,            // Main articles cache storage
    userStorageService,      // Fast user data (likes/bookmarks/saves)
    rssService,              // RSS feed processing
    analyticsService,        // Analytics
    imagesService            // Image optimization
  }
}

// Background scheduled refresh function - FULLY AUTONOMOUS
async function runScheduledRefresh(env) {
  const startTime = Date.now()
  
  try {
    // Starting autonomous scheduled refresh
    
    const { userStorageService, rssService, configService, articleService } = initializeServices(env)
    const config = await getConfig(configService, env)
    
    // Check if refresh is needed (autonomous decision)
    const needsRefresh = await userStorageService.shouldRunScheduledRefresh(config.refreshInterval)
    if (!needsRefresh) {
      // Scheduled refresh not needed yet
      return { success: true, reason: 'Not time for refresh', skipped: true }
    }

    // Try to acquire lock (autonomous)
    const lockAcquired = await cacheService.acquireRefreshLock()
    if (!lockAcquired) {
      // Could not acquire refresh lock - another process running
      return { success: true, reason: 'Another refresh in progress', skipped: true }
    }

    // Starting RSS fetch from all sources
    
    // Fetch fresh articles autonomously using dynamic config
    const freshArticles = await rssService.fetchAllFeedsBackground(
      config.maxArticlesPerSource,
      config.maxTotalArticles
    )
    
    if (freshArticles && freshArticles.length > 0) {
      // Cache the articles using CacheService
      await cacheService.setCachedArticles(freshArticles)
      await cacheService.setLastScheduledRun()
      
      const duration = Date.now() - startTime
      // Autonomous refresh completed successfully
      
      return { 
        success: true, 
        articlesCount: freshArticles.length,
        duration: duration,
        timestamp: new Date().toISOString(),
        autonomous: true
      }
    } else {
      // No articles fetched during refresh
      return { 
        success: false, 
        reason: 'No articles fetched',
        articlesCount: 0 
      }
    }
    
  } catch (error) {
    const duration = Date.now() - startTime
    // Autonomous refresh failed
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
      // Refresh lock released
    } catch {
      // Failed to release lock
    }
  }
}

// Initial data loading function - AUTONOMOUS
async function _ensureInitialData(env) {
  try {
    // Checking if initial data load is needed
    
    const { cacheService, rssService, configService } = initializeServices(env)
    const config = await getConfig(configService, env)
    
    // Check if we have any cached articles
    const existingArticles = await cacheService.getCachedArticles()
    
    if (existingArticles && existingArticles.length > 0) {
      // Found cached articles, no initial load needed
      return { success: true, reason: 'Data already available', articlesCount: existingArticles.length }
    }
    
    // No cached data found, performing initial load
    
    // Try to acquire lock for initial load
    const lockAcquired = await cacheService.acquireRefreshLock()
    if (!lockAcquired) {
      // Another process is loading data, waiting...
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
        
        // Initial load completed
        return { 
          success: true, 
          articlesCount: articles.length,
          initialLoad: true 
        }
      } else {
        // No articles loaded during initial fetch
        return { success: false, reason: 'No articles fetched' }
      }
      
    } finally {
      await cacheService.releaseRefreshLock()
    }
    
  } catch (error) {
    // Initial data load failed
    return { success: false, reason: error.message }
  }
}

// MISSING: Validate environment function with CORRECT binding names
function _validateEnvironment(env) {
  const issues = []
  const warnings = []
  
  // Critical bindings - FIXED names
  if (!env.HM_NEWS_STORAGE) issues.push('HM_NEWS_STORAGE KV binding missing')
  if (!env.HM_CONFIGURATIONS) issues.push('HM_CONFIGURATIONS KV binding missing')
  if (!env.HM_CACHE_STORAGE) issues.push('HM_CACHE_STORAGE KV binding missing')
  if (!env.HM_CACHE_CONFIG) issues.push('HM_CACHE_CONFIG KV binding missing')
  if (!env.CONTENT_CACHE) issues.push('CONTENT_CACHE KV binding missing')
  
  // Optional but recommended - FIXED name
  if (!env.HM_USER_STORAGE) warnings.push('HM_USER_STORAGE binding missing (user features disabled)')
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

// Basic HTML fallback with embedded React app
function getBasicHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harare Metro - Modern News Aggregator</title>
    <link rel="icon" href="/favicon.png" type="image/png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        body { 
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #000000;
            min-height: 100vh;
            color: #ffffff;
            font-weight: 400;
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        .container { 
            max-width: 900px; 
            margin: 0 auto; 
            padding: 60px 24px; 
            text-align: center;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .logo-container {
            margin-bottom: 48px;
        }
        
        .logo {
            display: inline-block;
            padding: 24px;
            border: 2px solid #ffffff;
            margin-bottom: 24px;
        }
        
        .logo-inner {
            border: 1px solid #ffffff;
            padding: 20px 32px;
        }
        
        .logo-mk {
            font-family: 'Georgia', 'Times New Roman', serif;
            font-size: 3rem;
            font-weight: bold;
            color: #ffffff;
            margin-bottom: 8px;
            line-height: 1;
            letter-spacing: -0.02em;
        }
        
        .logo-text {
            font-family: 'Georgia', 'Times New Roman', serif;
            font-size: 0.9rem;
            color: #a3a3a3;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        
        .tagline {
            color: #a3a3a3;
            font-size: 1.1rem;
            font-weight: 300;
            margin-bottom: 48px;
        }
        
        .loading {
            background: #0f0f0f;
            border: 1px solid #262626;
            border-radius: 12px;
            padding: 40px 32px;
            margin-bottom: 48px;
        }
        
        .spinner {
            width: 32px;
            height: 32px;
            border: 2px solid #404040;
            border-top: 2px solid #ffffff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 24px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .loading h3 {
            font-size: 1.25rem;
            font-weight: 500;
            color: #ffffff;
            margin-bottom: 12px;
        }
        
        .loading p {
            color: #a3a3a3;
            font-weight: 300;
        }
        
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 24px;
            margin-top: 48px;
        }
        
        .feature {
            background: #0f0f0f;
            border: 1px solid #262626;
            padding: 32px 24px;
            border-radius: 12px;
            transition: all 0.2s ease;
        }
        
        .feature:hover {
            border-color: #404040;
            background: #1a1a1a;
        }
        
        .feature h3 {
            color: #ffffff;
            margin-bottom: 12px;
            font-weight: 500;
            font-size: 1.1rem;
        }
        
        .feature p {
            color: #a3a3a3;
            font-weight: 300;
            font-size: 0.95rem;
        }
        
        @media (max-width: 768px) {
            .container { 
                padding: 40px 20px; 
            }
            .logo-mk { 
                font-size: 2.5rem; 
            }
            .features {
                grid-template-columns: 1fr;
                gap: 20px;
            }
        }
        
        @media (prefers-color-scheme: light) {
            body {
                background: #ffffff;
                color: #000000;
            }
            .logo, .logo-inner {
                border-color: #000000;
            }
            .logo-mk {
                color: #000000;
            }
            .tagline, .loading p, .feature p {
                color: #666666;
            }
            .loading, .feature {
                background: #fafafa;
                border-color: #e5e5e5;
            }
            .feature:hover {
                border-color: #d4d4d4;
                background: #f5f5f5;
            }
            .loading h3, .feature h3 {
                color: #000000;
            }
            .spinner {
                border-color: #e5e5e5;
                border-top-color: #000000;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-container">
            <div class="logo">
                <div class="logo-inner">
                    <div class="logo-mk">HM</div>
                    <div class="logo-text">HARARE METRO</div>
                </div>
            </div>
            <p class="tagline">Zimbabwe's premier news aggregation platform</p>
        </div>
        
        <div class="loading">
            <div class="spinner"></div>
            <h3>Loading Latest News...</h3>
            <p>Aggregating news from trusted Zimbabwean sources</p>
        </div>

        <div class="features">
            <div class="feature">
                <h3>🌍 Global Sources</h3>
                <p>Curated news from trusted Zimbabwean publishers</p>
            </div>
            <div class="feature">
                <h3>🔍 Smart Search</h3>
                <p>AI-powered search to find exactly what matters</p>
            </div>
            <div class="feature">
                <h3>📱 Mobile First</h3>
                <p>Seamless experience across all your devices</p>
            </div>
        </div>
    </div>

    <div id="root"></div>
    
    <script>
        // Simple manual refresh - press F5 or Ctrl+R
        console.log('Fallback HTML loaded. Press F5 or Ctrl+R to refresh.');
    </script>
</body>
</html>`
}

// Enhanced fallback HTML with server-side rendered articles and error diagnostics
async function getEnhancedFallbackHTML(env, debugInfo = {}) {
  try {
    // Initialize services to get articles
    const { cacheService } = initializeServices(env)
    
    // Get latest 12 articles from cache, with D1 fallback
    let articles = []
    let articlesError = null
    let source = 'cache'
    
    try {
      const cachedArticles = await cacheService.getCachedArticles()
      articles = cachedArticles.slice(0, 12) // Get latest 12
    } catch (cacheError) {
      console.warn('Failed to load articles from cache for fallback HTML:', cacheError)
      articlesError = cacheError.message
      
      // Fallback to D1 database when cache fails
      try {
        console.log('Attempting to load articles from D1 database as fallback...')
        const { articleService } = initializeServices(env)
        const dbResult = await articleService.getArticles({ 
          limit: 12, 
          orderBy: 'published_at', 
          orderDirection: 'DESC' 
        })
        articles = dbResult.articles || []
        source = 'database'
        articlesError = null // Clear cache error since D1 worked
        console.log(`Successfully loaded ${articles.length} articles from D1 database`)
      } catch (dbError) {
        console.error('Failed to load articles from D1 database:', dbError)
        articlesError = `Cache failed: ${cacheError.message}. Database failed: ${dbError.message}`
        articles = [] // Use empty array if both cache and DB fail
      }
    }
    
    // Generate articles HTML
    let articlesHTML = ''
    if (articles.length > 0) {
      articlesHTML = articles.map(article => `
        <article class="article-card">
          <div class="article-content">
            <h3 class="article-title">
              <a href="${article.link || '#'}" target="_blank" rel="noopener">
                ${escapeHtml(article.title || 'Untitled Article')}
              </a>
            </h3>
            <p class="article-description">
              ${escapeHtml((article.description || article.contentSnippet || '').substring(0, 150))}${(article.description || article.contentSnippet || '').length > 150 ? '...' : ''}
            </p>
            <div class="article-meta">
              <span class="article-source">${escapeHtml(article.source || 'Unknown Source')}</span>
              <span class="article-date">${formatDate(article.pubDate || article.publishedAt)}</span>
            </div>
          </div>
        </article>
      `).join('')
    } else {
      articlesHTML = `
        <div class="no-articles">
          <h3>📰 News Loading</h3>
          <p>Our latest articles are being updated. Please check back in a moment.</p>
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
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #0a0a0a;
            color: #ffffff;
            font-weight: 400;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
        }
        
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 0 20px;
        }
        
        .header { 
            padding: 40px 0; 
            text-align: center;
            border-bottom: 1px solid #262626;
        }
        
        .logo {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
        }
        
        .logo-text {
            font-size: 2rem;
            font-weight: 700;
            color: #ffffff;
        }
        
        .tagline {
            color: #a3a3a3;
            font-size: 1.1rem;
            font-weight: 400;
        }
        
        .main-content {
            padding: 40px 0;
        }
        
        .section-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .articles-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 24px;
            margin-bottom: 40px;
        }
        
        .article-card {
            background: #111111;
            border: 1px solid #262626;
            border-radius: 8px;
            padding: 24px;
            transition: all 0.2s ease;
        }
        
        .article-card:hover {
            border-color: #404040;
            background: #151515;
        }
        
        .article-title {
            font-size: 1.1rem;
            font-weight: 600;
            line-height: 1.4;
            margin-bottom: 12px;
        }
        
        .article-title a {
            color: #ffffff;
            text-decoration: none;
        }
        
        .article-title a:hover {
            color: #2563eb;
        }
        
        .article-description {
            color: #a3a3a3;
            font-size: 0.95rem;
            line-height: 1.5;
            margin-bottom: 16px;
        }
        
        .article-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.85rem;
            color: #666666;
        }
        
        .article-source {
            font-weight: 500;
            color: #2563eb;
        }
        
        .no-articles {
            text-align: center;
            background: #111111;
            border: 1px solid #262626;
            border-radius: 8px;
            padding: 60px 40px;
        }
        
        .no-articles h3 {
            font-size: 1.25rem;
            color: #ffffff;
            margin-bottom: 12px;
        }
        
        .no-articles p {
            color: #a3a3a3;
        }
        
        .refresh-notice {
            text-align: center;
            padding: 20px;
            background: #111111;
            border: 1px solid #262626;
            border-radius: 8px;
            margin-top: 30px;
        }
        
        .refresh-notice p {
            color: #a3a3a3;
            font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
            .container { 
                padding: 0 16px; 
            }
            .header { 
                padding: 30px 0; 
            }
            .logo-text { 
                font-size: 1.75rem; 
            }
            .articles-grid {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            .article-card {
                padding: 20px;
            }
            .article-meta {
                flex-direction: column;
                align-items: flex-start;
                gap: 4px;
            }
        }
        
        @media (prefers-color-scheme: light) {
            body { background: #ffffff; color: #000000; }
            .article-card, .no-articles, .refresh-notice { background: #fafafa; border-color: #e5e5e5; }
            .article-card:hover { background: #f5f5f5; border-color: #d4d4d4; }
            .article-title a { color: #000000; }
            .article-description { color: #666666; }
            .tagline, .no-articles p, .refresh-notice p { color: #666666; }
            .no-articles h3 { color: #000000; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <div class="logo">
                <span style="font-size: 2rem; font-weight: bold; background: linear-gradient(45deg, #22c55e, #facc15, #ef4444); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; border: 2px solid; border-image: linear-gradient(45deg, #22c55e, #facc15, #ef4444) 1;">HM</span>
                <h1 class="logo-text">Harare Metro</h1>
            </div>
            <p class="tagline">Zimbabwe's Premier News Aggregator</p>
        </header>

        <main class="main-content">
            <h2 class="section-title">Latest News</h2>
            
            <div class="articles-grid">
                ${articlesHTML}
            </div>
            
            <div class="refresh-notice">
                <p>📱 For the best experience, please refresh the page to load our full interactive app.</p>
            </div>
            
            <!-- Debug Information -->
            <div class="debug-info" style="margin-top: 2rem; padding: 1rem; background: #1a1a1a; border-radius: 8px; border-left: 4px solid #ef4444;">
                <h3 style="color: #ef4444; font-size: 1.1rem; margin-bottom: 0.5rem;">🚨 Fallback Mode Active</h3>
                <p style="font-size: 0.9rem; color: #888; margin-bottom: 1rem;">The React app failed to load. This fallback page is showing instead.</p>
                
                <div class="debug-details" style="font-family: 'Courier New', monospace; font-size: 0.8rem; color: #ccc;">
                    <div><strong>Reason:</strong> ${debugInfo.reason || 'Static assets unavailable'}</div>
                    <div><strong>Static Content Available:</strong> ${debugInfo.hasStaticContent ? 'Yes' : 'No'}</div>
                    <div><strong>Articles Loaded:</strong> ${articles.length} articles (source: ${source})</div>
                    ${articlesError ? `<div><strong>Articles Error:</strong> ${articlesError}</div>` : ''}
                    <div><strong>Environment:</strong> ${env.NODE_ENV || 'unknown'}</div>
                    <div><strong>Timestamp:</strong> ${new Date().toISOString()}</div>
                </div>
                
                <p style="font-size: 0.8rem; color: #666; margin-top: 1rem;">
                    💡 This diagnostic info helps developers understand why the React app isn't loading.
                </p>
            </div>
        </main>
    </div>

    <div id="root"></div>
    
    <script>
        // Simple manual refresh instruction
        console.log('Enhanced fallback loaded. If you see this, press F5 to refresh.');
    </script>
</body>
</html>`
  } catch (error) {
    console.error('Failed to generate enhanced fallback HTML:', error)
    // Fall back to the basic HTML if enhanced version fails
    return getBasicHTML()
  }
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

// Export utility functions that the API file might need
export {
  getConfig,
  CACHE_HEADERS,
  initializeServices,
  runScheduledRefresh
}

// Main Cloudflare Worker export
export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url)
      
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
      
      // Handle API requests (delegates to api.js)
      if (url.pathname.startsWith('/api/')) {
        return await handleApiRequest(request, env, ctx)
      }
      
      // Handle static files - SIMPLIFIED for Vite build structure
      const isAssetRequest = (
        url.pathname.startsWith('/assets/') ||     // Vite assets folder
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
        url.pathname.endsWith('.map') ||          // Add source maps
        url.pathname === '/favicon.ico' ||
        url.pathname === '/vite.svg' ||
        url.pathname === '/manifest.json'
      )
      
      if (isAssetRequest) {
        try {
          // In development, bypass KV-Asset-Handler if it's having RPC issues
          const isDev = env.NODE_ENV === 'development'
          
          // Check if we have static content binding
          if (!env.__STATIC_CONTENT) {
            // For source maps, return 404 silently
            if (url.pathname.endsWith('.map')) {
              return new Response('Source map not available', { 
                status: 404,
                headers: { 'Content-Type': 'text/plain' }
              })
            }
            
            // For missing favicon, return a simple one
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

          // Try to get the asset directly from KV with better error handling
          let response
          try {
            response = await getAssetFromKV({
              request,
              waitUntil: ctx.waitUntil.bind(ctx),
            }, {
              ASSET_NAMESPACE: env.__STATIC_CONTENT,
              ASSET_MANIFEST: assetManifest,
            })
          } catch (kvError) {
            console.warn('KV Asset Handler failed:', kvError.message)
            
            // For persistent RPC issues, bypass KV entirely and serve fallback for SPA routes
            if (kvError.message.includes('RPC receiver') || kvError.message.includes('does not implement') || kvError.message.includes('method "get"')) {
              console.log('KV RPC issue detected, serving SPA fallback instead of retrying')
              
              // For critical SPA assets, redirect to SPA fallback
              if (url.pathname === '/index.html' || url.pathname === '/' || 
                  url.pathname.startsWith('/assets/') || 
                  url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
                
                // Instead of failing, serve the React app entry point
                const fallbackHTML = await getEnhancedFallbackHTML(env, {
                  reason: `KV RPC issues detected, serving enhanced fallback`,
                  hasStaticContent: true,
                  path: request.url
                })
                return new Response(fallbackHTML, {
                  headers: { 
                    'Content-Type': 'text/html;charset=UTF-8',
                    'Cache-Control': 'no-cache'
                  }
                })
              }
              
              // For other assets, return 404
              return new Response('Asset not available due to KV issues', { 
                status: 404,
                headers: { 'Content-Type': 'text/plain' }
              })
            } else {
              // If it's not an RPC issue, still provide fallback for critical assets
              if (url.pathname === '/index.html' || url.pathname === '/') {
                console.warn('Critical index.html failed to load, using fallback HTML')
                const fallbackHTML = await getEnhancedFallbackHTML(env, {
                  reason: `Asset loading failed: ${kvError.message}`,
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
              throw new Error(`Asset loading failed: ${kvError.message}`)
            }
          }
          
          const newResponse = new Response(response.body, response)
          
          // Set appropriate cache headers based on file type
          if (url.pathname.startsWith('/assets/')) {
            // Vite assets are hashed and immutable
            newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
          } else if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
            newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
          } else if (url.pathname.endsWith('.map')) {
            // Source maps - shorter cache
            newResponse.headers.set('Cache-Control', 'public, max-age=3600')
          } else {
            newResponse.headers.set('Cache-Control', 'public, max-age=86400')
          }
          
          return newResponse
          
        } catch (error) {
          // Handle source maps silently
          if (url.pathname.endsWith('.map')) {
            return new Response('Source map not found', { 
              status: 404,
              headers: { 'Content-Type': 'text/plain' }
            })
          }
          
          // Only log actual missing assets, not common ones
          if (!url.pathname.includes('favicon') && 
              !url.pathname.includes('vite.svg') && 
              !url.pathname.includes('manifest.json') &&
              !url.pathname.endsWith('.map')) {
            // Asset not found: ${url.pathname}
          }
          
          // For missing favicon/vite.svg, return a simple SVG
          if (url.pathname === '/favicon.ico' || url.pathname === '/vite.svg') {
            return new Response(`
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="14" fill="#2563eb"/>
                <text x="16" y="22" font-size="16" text-anchor="middle" fill="white">🇿🇼</text>
              </svg>
            `, { 
              status: 200,
              headers: { 
                'Content-Type': 'image/svg+xml',
                'Cache-Control': 'public, max-age=86400'
              }
            })
          }
          
          // Return proper 404 for other missing assets
          return new Response('Asset not found', { 
            status: 404,
            headers: { 'Content-Type': 'text/plain' }
          })
        }
      }

      // Serve React app (SPA fallback) for all other routes
      try {
        // Check if we have static content
        if (!env.__STATIC_CONTENT) {
          // Static content not available, serving enhanced fallback HTML with articles
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

        // Always serve index.html for SPA routes
        let response
        try {
          response = await getAssetFromKV({
            request: new Request(new URL('/index.html', request.url)),
            waitUntil: ctx.waitUntil.bind(ctx),
          }, {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: assetManifest,
          })
        } catch (kvError) {
          console.warn('Failed to load index.html from KV:', kvError.message)
          
          // In both development and production, retry for index.html due to RPC/KV issues
          if (kvError.message.includes('RPC receiver') || kvError.message.includes('does not implement') || kvError.message.includes('method "get"')) {
            console.log('Retrying index.html load due to KV RPC issues...')
            
            // Retry with delay
            await new Promise(resolve => setTimeout(resolve, 100))
            
            try {
              response = await getAssetFromKV({
                request: new Request(new URL('/index.html', request.url)),
                waitUntil: ctx.waitUntil.bind(ctx),
              }, {
                ASSET_NAMESPACE: env.__STATIC_CONTENT,
                ASSET_MANIFEST: assetManifest,
              })
              console.log('Index.html retry successful')
            } catch (retryError) {
              console.warn('Index.html retry failed, using fallback')
              // Only use fallback as last resort
              const fallbackHTML = await getEnhancedFallbackHTML(env, {
                reason: `Failed to load React app after retry: ${retryError.message}`,
                hasStaticContent: !!env.__STATIC_CONTENT,
                path: request.url
              })
              return new Response(fallbackHTML, {
                headers: { 
                  'Content-Type': 'text/html;charset=UTF-8',
                  'Cache-Control': 'public, max-age=300'
                }
              })
            }
          } else {
            // For non-development or other errors, use fallback
            const fallbackHTML = await getEnhancedFallbackHTML(env, {
              reason: `Failed to load React app: ${kvError.message}`,
              hasStaticContent: !!env.__STATIC_CONTENT,
              path: request.url
            })
            return new Response(fallbackHTML, {
              headers: { 
                'Content-Type': 'text/html;charset=UTF-8',
                'Cache-Control': 'public, max-age=300'
              }
            })
          }
        }
        
        const newResponse = new Response(response.body, response)
        newResponse.headers.set('Cache-Control', 'public, max-age=3600')
        newResponse.headers.set('Content-Type', 'text/html;charset=UTF-8')
        return newResponse
        
      } catch (error) {
        // index.html not found, serving enhanced fallback HTML with articles
        const fallbackHTML = await getEnhancedFallbackHTML(env, {
          reason: `Asset loading failed: ${error.message}`,
          hasStaticContent: true,
          path: request.url,
          error: error.message
        })
        return new Response(fallbackHTML, {
          headers: { 
            'Content-Type': 'text/html;charset=UTF-8',
            'Cache-Control': 'public, max-age=300'
          }
        })
      }

    } catch {
      // Worker error occurred
      return new Response('Internal Server Error', { status: 500 })
    }
  },

  // Scheduled event handler for Cloudflare Cron Triggers
  async scheduled(controller, env, _ctx) {
    // Cron trigger executed
    
    try {
      const result = await runScheduledRefresh(env)
      
      if (result.success) {
        // Scheduled refresh successful: articles in duration
      } else {
        // Scheduled refresh skipped: reason
      }
      
      return result
    } catch (error) {
      // Scheduled event handler failed
      return { success: false, error: error.message }
    }
  }
}
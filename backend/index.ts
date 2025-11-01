import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// Import all business logic services - backend does the heavy lifting
import { D1Service } from "../database/D1Service.js";
import { D1ConfigService } from "./services/D1ConfigService.js";
import { D1CacheService } from "./services/D1CacheService.js";
import { AnalyticsEngineService } from "./services/AnalyticsEngineService.js";
import { ArticleService } from "./services/ArticleService.js";
import { ArticleAIService } from "./services/ArticleAIService.js";
import { ContentProcessingPipeline } from "./services/ContentProcessingPipeline.js";
import { AuthorProfileService } from "./services/AuthorProfileService.js";
import { NewsSourceService } from "./services/NewsSourceService.js";
import { NewsSourceManager } from "./services/NewsSourceManager.js";
import { SimpleRSSService } from "./services/SimpleRSSService.js";
import { CloudflareImagesService } from "./services/CloudflareImagesService.js";
import { OpenAuthService } from "./services/OpenAuthService.js";
// Additional enhancement services
import { CategoryManager } from "./services/CategoryManager.js";
import { ObservabilityService } from "./services/ObservabilityService.js";
import { D1UserService } from "./services/D1UserService.js";
// Durable Objects temporarily disabled - uncomment when needed
// import { RealtimeAnalyticsDO } from "./durable-objects/RealtimeAnalyticsDO.js";
// import { ArticleInteractionsDO } from "./durable-objects/ArticleInteractionsDO.js";
// import { UserBehaviorDO } from "./durable-objects/UserBehaviorDO.js";
// import { RealtimeCountersDO } from "./durable-objects/RealtimeCountersDO.js";

// Import admin interface
import { getAdminHTML, getLoginHTML } from "./admin/index.js";

// Types for Cloudflare bindings
type Bindings = {
  DB: D1Database;
  AUTH_STORAGE: KVNamespace;
  // ARTICLE_INTERACTIONS: DurableObjectNamespace; // Temporarily disabled
  // USER_BEHAVIOR: DurableObjectNamespace; // Temporarily disabled
  // REALTIME_COUNTERS: DurableObjectNamespace; // Temporarily disabled  
  // REALTIME_ANALYTICS: DurableObjectNamespace; // Temporarily disabled
  NEWS_ANALYTICS: AnalyticsEngineDataset;
  SEARCH_ANALYTICS: AnalyticsEngineDataset;
  CATEGORY_ANALYTICS: AnalyticsEngineDataset;
  USER_ANALYTICS: AnalyticsEngineDataset;
  PERFORMANCE_ANALYTICS: AnalyticsEngineDataset;
  AI: Ai;
  VECTORIZE_INDEX: VectorizeIndex;
  IMAGES?: any; // Cloudflare Images binding (optional)
  NODE_ENV: string;
  LOG_LEVEL: string;
  ROLES_ENABLED: string;
  DEFAULT_ROLE: string;
  ADMIN_ROLES: string;
  CREATOR_ROLES: string;
  CLOUDFLARE_ACCOUNT_ID?: string; // Optional Cloudflare account ID for Images API
};

const app = new Hono<{ Bindings: Bindings }>();

// Add CORS middleware - allow credentials from frontend
app.use("*", cors({
  origin: ['https://www.hararemetro.co.zw', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposeHeaders: ['Set-Cookie'],
}));
app.use("*", logger());

// Protect all admin API routes (except login and backfill)
app.use("/api/admin/*", async (c, next) => {
  // Allow login endpoint and keyword backfill to bypass auth (temporary for setup)
  if (c.req.path === '/api/admin/login' || c.req.path === '/api/admin/backfill-keywords') {
    return await next();
  }

  // All other admin routes require authentication
  return await requireAdmin(c, next);
});

// Initialize all business services
function initializeServices(env: Bindings) {
  const d1Service = new D1Service(env.DB);
  const configService = new D1ConfigService(env.DB);
  const cacheService = new D1CacheService(env.DB);
  const analyticsService = new AnalyticsEngineService({
    NEWS_ANALYTICS: env.NEWS_ANALYTICS,
    SEARCH_ANALYTICS: env.SEARCH_ANALYTICS,
    CATEGORY_ANALYTICS: env.CATEGORY_ANALYTICS,
    USER_ANALYTICS: env.USER_ANALYTICS,
    PERFORMANCE_ANALYTICS: env.PERFORMANCE_ANALYTICS
  });
  const articleAIService = new ArticleAIService(env.AI, null, d1Service); // Vectorize disabled for now
  const contentPipeline = new ContentProcessingPipeline(d1Service, articleAIService);
  const authorProfileService = new AuthorProfileService(d1Service);
  const articleService = new ArticleService(env.DB); // Fix: ArticleService takes database directly
  const newsSourceService = new NewsSourceService(); // Fix: NewsSourceService takes no parameters
  const newsSourceManager = new NewsSourceManager(env.DB);

  // Initialize CloudflareImagesService if available
  let imagesService = null;
  if (env.IMAGES && env.CLOUDFLARE_ACCOUNT_ID) {
    imagesService = new CloudflareImagesService(env.IMAGES, env.CLOUDFLARE_ACCOUNT_ID);
    console.log('[INIT] CloudflareImagesService initialized successfully');
  } else {
    console.warn('[INIT] CloudflareImagesService not initialized - IMAGES binding or CLOUDFLARE_ACCOUNT_ID not configured. RSS images will not be optimized.');
  }

  // Initialize enhancement services for SimpleRSSService
  const categoryManager = new CategoryManager(env.DB);
  const observabilityService = new ObservabilityService(env.DB, env.LOG_LEVEL || 'info');
  const userService = new D1UserService(env.DB);

  console.log('[INIT] All services initialized - using SimpleRSSService for RSS processing');

  return {
    d1Service,
    configService,
    cacheService,
    analyticsService,
    articleAIService,
    contentPipeline,
    authorProfileService,
    articleService,
    newsSourceService,
    newsSourceManager,
    categoryManager,
    observabilityService,
    userService
  };
}

// Simple session-based authentication (temporary until OpenAuth is fully implemented)
const ADMIN_SESSION_SECRET = "harare-metro-admin-secret-2025"; // TODO: Move to environment variable

// Helper function to hash password (simple implementation)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + ADMIN_SESSION_SECRET);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper function to create session token
async function createSessionToken(email: string): Promise<string> {
  const timestamp = Date.now();
  const data = `${email}:${timestamp}:${ADMIN_SESSION_SECRET}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper function to get cookie value
function getCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map(c => c.trim());
  const cookie = cookies.find(c => c.startsWith(`${name}=`));
  return cookie ? cookie.substring(name.length + 1) : null;
}

// Authentication middleware - protect admin routes
// Uses shared auth_token cookie from frontend
const requireAdmin = async (c: any, next: any) => {
  const cookieHeader = c.req.header('cookie');
  const sessionToken = getCookie(cookieHeader, 'auth_token'); // Changed from admin_session
  const isApiRequest = c.req.path.startsWith('/api/');

  if (!sessionToken) {
    // No session - redirect to frontend login
    if (isApiRequest) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    return c.redirect('https://www.hararemetro.co.zw/auth/login', 302);
  }

  // Check if session token is valid (stored in shared KV)
  try {
    const sessionData = await c.env.AUTH_STORAGE.get(`session:${sessionToken}`, 'json');
    if (!sessionData || !sessionData.userId) {
      // Invalid session - redirect to frontend login
      if (isApiRequest) {
        return c.json({ error: 'Session expired or invalid' }, 401);
      }
      return c.redirect('https://www.hararemetro.co.zw/auth/login', 302);
    }

    // Check if user has admin role
    const adminRoles = c.env.ADMIN_ROLES?.split(',') || ['admin', 'super_admin', 'moderator'];
    if (!adminRoles.includes(sessionData.role)) {
      if (isApiRequest) {
        return c.json({ error: 'Admin access required' }, 403);
      }
      return c.redirect('https://www.hararemetro.co.zw', 302); // Redirect to homepage
    }

    // Session valid and user is admin, continue
    c.set('user', sessionData);
    await next();
  } catch (error) {
    console.error('[AUTH] Session validation error:', error);
    if (isApiRequest) {
      return c.json({ error: 'Authentication error' }, 401);
    }
    return c.redirect('https://www.hararemetro.co.zw/auth/login', 302);
  }
};

// Login page - redirect to frontend
app.get("/login", (c) => {
  return c.redirect("https://www.hararemetro.co.zw/auth/login", 302);
});

// Login API endpoint - uses D1 users table with role-based access
app.post("/api/admin/login", async (c) => {
  try {
    const { email, password } = await c.req.json();

    // Initialize OpenAuthService
    const openAuthService = new OpenAuthService({
      DB: c.env.DB,
      AUTH_STORAGE: c.env.AUTH_STORAGE
    });

    // Get user from D1 database
    const user = await openAuthService.getUserByEmail(email);

    if (!user) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Check if user has admin role
    const adminRoles = c.env.ADMIN_ROLES?.split(',') || ['admin', 'super_admin', 'moderator'];
    if (!adminRoles.includes(user.role)) {
      console.log('[AUTH] Login denied - user lacks admin role:', { email, role: user.role, requiredRoles: adminRoles });
      return c.json({ error: "Insufficient permissions - admin access required" }, 403);
    }

    // Validate password (for now, using simple hash - TODO: use bcrypt)
    const inputPasswordHash = await hashPassword(password);
    const storedPasswordHash = user.password_hash;

    if (!storedPasswordHash || inputPasswordHash !== storedPasswordHash) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Create session token
    const sessionToken = await createSessionToken(email);

    // Store session in KV (expires in 7 days)
    await c.env.AUTH_STORAGE.put(
      `session:${sessionToken}`,
      JSON.stringify({
        email: user.email,
        userId: user.id,
        username: user.username,
        role: user.role,
        loginAt: new Date().toISOString()
      }),
      { expirationTtl: 7 * 24 * 60 * 60 }
    );

    // Update user last login timestamp
    await c.env.DB
      .prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP, login_count = login_count + 1 WHERE id = ?')
      .bind(user.id)
      .run();

    console.log('[AUTH] Admin login successful:', { email, role: user.role, userId: user.id });

    return c.json({ success: true, token: sessionToken });
  } catch (error: any) {
    console.error('[AUTH] Login error:', error);
    return c.json({ error: "Login failed" }, 500);
  }
});

// Logout API endpoint
app.post("/api/admin/logout", async (c) => {
  const cookieHeader = c.req.header('cookie');
  const sessionToken = getCookie(cookieHeader, 'auth_token'); // Changed from admin_session

  if (sessionToken) {
    // Delete session from shared KV
    await c.env.AUTH_STORAGE.delete(`session:${sessionToken}`);
  }

  return c.json({ success: true });
});

// User management redirects - all redirect to frontend
app.get("/register", (c) => {
  return c.redirect("https://www.hararemetro.co.zw/auth/register", 302);
});

app.get("/onboarding", (c) => {
  return c.redirect("https://www.hararemetro.co.zw/onboarding", 302);
});

app.get("/profile", (c) => {
  return c.redirect("https://www.hararemetro.co.zw/settings/profile", 302);
});

app.get("/settings/*", (c) => {
  return c.redirect("https://www.hararemetro.co.zw/settings/profile", 302);
});

// Admin dashboard - PROTECTED route
app.get("/", requireAdmin, (c) => {
  c.header("Content-Type", "text/html");
  return c.html(getAdminHTML());
});

app.get("/admin", requireAdmin, (c) => {
  c.header("Content-Type", "text/html");
  return c.html(getAdminHTML());
});

// Health check endpoint with full service health
app.get("/api/health", async (c) => {
  try {
    const services = initializeServices(c.env);
    const health = await services.d1Service.healthCheck();
    
    return c.json({
      status: health.healthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      services: {
        database: health.healthy ? "operational" : "error",
        analytics: !!(c.env.NEWS_ANALYTICS && c.env.SEARCH_ANALYTICS && c.env.CATEGORY_ANALYTICS),
        cache: "operational",
        articles: "operational",
        newsSources: "operational"
      },
      environment: c.env.NODE_ENV || "production"
    });
  } catch (error) {
    return c.json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Comprehensive admin stats endpoint
// TODO: Add authentication back when OpenAuthService is fixed
app.get("/api/admin/stats", async (c) => {
  try {
    const services = initializeServices(c.env);
    
    // Get basic database statistics directly
    const totalArticles = await services.d1Service.getArticleCount();
    
    // Get RSS source count directly from database
    const sourcesResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM rss_sources WHERE enabled = 1'
    ).first();
    const activeSources = sourcesResult.count;
    
    // Get categories count directly from database  
    const categoriesResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM categories WHERE enabled = 1'
    ).first();
    const categoriesCount = categoriesResult.count;
    
    return c.json({
      database: {
        total_articles: totalArticles,
        active_sources: activeSources,
        categories: categoriesCount,
        size: 217088 // Approximate size from earlier query
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return c.json({ error: "Failed to fetch stats", details: error.message }, 500);
  }
});

// Full categories management endpoint
app.get("/api/categories", async (c) => {
  try {
    const services = initializeServices(c.env);
    const categories = await services.d1Service.getCategories();
    
    // Add statistics for each category
    const categoriesWithStats = await Promise.all(
      categories.map(async (cat) => {
        const articleCount = await services.d1Service.getArticleCount({ category_id: cat.id });
        return {
          ...cat,
          article_count: articleCount
        };
      })
    );
    
    return c.json({
      categories: categoriesWithStats
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return c.json({ error: "Failed to fetch categories" }, 500);
  }
});

// Full articles management with caching and analytics
app.get("/api/feeds", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");
    const category = c.req.query("category");

    // Get articles directly from database
    let articlesQuery = `
      SELECT id, title, slug, description, content_snippet, author, source, source_id,
             published_at, image_url, original_url, category_id, view_count,
             like_count, bookmark_count
      FROM articles
      WHERE status = 'published'
    `;

    let countQuery = `SELECT COUNT(*) as total FROM articles WHERE status = 'published'`;

    if (category && category !== 'all') {
      articlesQuery += ` AND category_id = ?`;
      countQuery += ` AND category_id = ?`;
    }

    articlesQuery += ` ORDER BY published_at DESC LIMIT ? OFFSET ?`;

    // Execute queries
    const articlesResult = category && category !== 'all' ?
      await c.env.DB.prepare(articlesQuery).bind(category, limit, offset).all() :
      await c.env.DB.prepare(articlesQuery).bind(limit, offset).all();

    const totalResult = category && category !== 'all' ?
      await c.env.DB.prepare(countQuery).bind(category).first() :
      await c.env.DB.prepare(countQuery).first();

    const totalCount = totalResult.total || 0;

    // Fetch keywords for each article
    const articles = articlesResult.results || [];
    for (const article of articles) {
      const keywordsResult = await c.env.DB.prepare(`
        SELECT k.id, k.name, k.slug
        FROM keywords k
        INNER JOIN article_keyword_links akl ON k.id = akl.keyword_id
        WHERE akl.article_id = ?
        ORDER BY akl.relevance_score DESC
        LIMIT 8
      `).bind(article.id).all();

      article.keywords = keywordsResult.results || [];
    }

    return c.json({
      articles: articles,
      total: totalCount,
      limit,
      offset,
      hasMore: offset + limit < totalCount
    });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return c.json({ error: "Failed to fetch articles" }, 500);
  }
});

// Simple RSS refresh endpoint - rebuild from scratch for reliability
// No complex AI pipeline, just fetch, parse, categorize, store
app.post("/api/refresh-rss", async (c) => {
  try {
    console.log("[API] Starting simple RSS refresh...");
    const startTime = Date.now();

    // Initialize simple RSS service
    const rssService = new SimpleRSSService(c.env.DB);

    // Fetch and process all feeds
    const results = await rssService.refreshAllFeeds();

    const processingTime = Date.now() - startTime;

    console.log(`[API] RSS refresh completed in ${processingTime}ms:`, results);

    return c.json({
      success: results.success,
      message: `RSS refresh completed. Processed ${results.newArticles} new articles.`,
      newArticles: results.newArticles,
      errors: results.errors,
      details: results.details,
      processing_time_ms: processingTime,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("[API] Error in RSS refresh:", error);
    return c.json({
      success: false,
      error: "Failed to refresh RSS feeds",
      message: error.message || "Unknown error",
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Backfill keywords for existing articles
app.post("/api/admin/backfill-keywords", async (c) => {
  try {
    console.log("[API] Starting keyword backfill...");
    const startTime = Date.now();

    // Initialize simple RSS service
    const rssService = new SimpleRSSService(c.env.DB);

    // Get all articles that don't have keywords
    const articlesWithoutKeywords = await c.env.DB
      .prepare(`
        SELECT a.id, a.title, a.description
        FROM articles a
        LEFT JOIN article_keyword_links akl ON a.id = akl.article_id
        WHERE akl.id IS NULL
        LIMIT 200
      `)
      .all();

    if (!articlesWithoutKeywords.results || articlesWithoutKeywords.results.length === 0) {
      return c.json({
        success: true,
        message: "No articles need keyword backfill",
        processed: 0,
        timestamp: new Date().toISOString()
      });
    }

    let processed = 0;
    let keywordsAdded = 0;

    for (const article of articlesWithoutKeywords.results) {
      try {
        // Extract keywords
        const keywords = rssService.extractKeywords(
          article.title as string,
          (article.description as string) || ''
        );

        if (keywords.length > 0) {
          // Store keywords (this method is private, so we need to make it public or create a new method)
          // For now, let's manually implement the storage logic
          for (const keyword of keywords) {
            const keywordId = keyword.toLowerCase().replace(/\s+/g, '-');
            const keywordSlug = keywordId;
            const keywordName = keyword.charAt(0).toUpperCase() + keyword.slice(1);

            // Check if keyword exists
            const existingKeyword = await c.env.DB
              .prepare('SELECT id FROM keywords WHERE id = ?')
              .bind(keywordId)
              .first();

            if (!existingKeyword) {
              // Create keyword
              await c.env.DB
                .prepare(`
                  INSERT INTO keywords (id, name, slug, type, enabled, created_at, updated_at)
                  VALUES (?, ?, ?, 'general', 1, datetime('now'), datetime('now'))
                `)
                .bind(keywordId, keywordName, keywordSlug)
                .run();
            }

            // Link keyword to article
            await c.env.DB
              .prepare(`
                INSERT INTO article_keyword_links (article_id, keyword_id, relevance_score, source, created_at)
                VALUES (?, ?, 1.0, 'auto', datetime('now'))
                ON CONFLICT(article_id, keyword_id) DO NOTHING
              `)
              .bind(article.id, keywordId)
              .run();

            // Update keyword article count
            await c.env.DB
              .prepare('UPDATE keywords SET article_count = article_count + 1 WHERE id = ?')
              .bind(keywordId)
              .run();

            keywordsAdded++;
          }
        }

        processed++;
        if (processed % 10 === 0) {
          console.log(`[API] Backfilled ${processed} articles, ${keywordsAdded} keywords added`);
        }
      } catch (error: any) {
        console.error(`[API] Error backfilling article ${article.id}:`, error.message);
      }
    }

    const processingTime = Date.now() - startTime;

    console.log(`[API] Keyword backfill completed in ${processingTime}ms`);

    return c.json({
      success: true,
      message: `Backfilled keywords for ${processed} articles`,
      processed,
      keywordsAdded,
      processing_time_ms: processingTime,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("[API] Error in keyword backfill:", error);
    return c.json({
      success: false,
      error: "Failed to backfill keywords",
      message: error.message || "Unknown error",
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// ===== BULK PULL ENDPOINTS FOR INITIAL SETUP AND TESTING =====

// Initial bulk pull with enhanced field testing
// TODO: Add authentication back when OpenAuthService is fixed
app.post("/api/admin/bulk-pull", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));

    console.log(`Starting BULK PULL using SimpleRSSService...`);

    // Use SimpleRSSService for bulk pull (same as regular refresh)
    const rssService = new SimpleRSSService(c.env.DB);
    const results = await rssService.refreshAllFeeds();

    // Track the bulk pull event for analytics
    const services = initializeServices(c.env);
    await services.analyticsService.trackEvent('initial_bulk_pull', {
      new_articles: results.newArticles,
      errors: results.errors,
      details: results.details
    });

    return c.json({
      success: results.success,
      message: `Bulk pull completed: ${results.newArticles} new articles`,
      newArticles: results.newArticles,
      errors: results.errors,
      details: results.details,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error in bulk pull:", error);
    return c.json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Add new Zimbabwe sources
// TODO: Add authentication back when OpenAuthService is fixed
app.post("/api/admin/add-zimbabwe-sources", async (c) => {
  try {
    const services = initializeServices(c.env);
    
    console.log("Adding comprehensive Zimbabwe news sources...");
    
    // Use the news source manager to add all Zimbabwe sources
    const results = await services.newsSourceManager.addZimbabweNewsSources();
    
    // Track the source addition event
    await services.analyticsService.trackEvent('zimbabwe_sources_added', {
      added: results.added,
      failed: results.failed,
      total_attempted: results.added + results.failed
    });
    
    return c.json({
      success: true,
      message: `Added ${results.added} Zimbabwe news sources (${results.failed} failed)`,
      ...results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error adding Zimbabwe sources:", error);
    return c.json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Get RSS configuration and source limits
// TODO: Add authentication back when OpenAuthService is fixed
app.get("/api/admin/rss-config", async (c) => {
  try {
    const services = initializeServices(c.env);
    
    // Get system configuration
    const systemConfig = await services.d1Service.db.prepare(`
      SELECT config_key, config_value, config_type, description, category 
      FROM system_config 
      WHERE category = 'rss' OR category = 'platform'
      ORDER BY category, config_key
    `).all();
    
    // Get sources with their current daily limits
    const sources = await services.d1Service.db.prepare(`
      SELECT id, name, url, category, enabled, priority, 
             daily_limit, articles_per_fetch, max_bulk_articles,
             quality_score, reliability_score, validation_status,
             last_fetched_at, fetch_count, error_count
      FROM rss_sources 
      ORDER BY priority DESC, name ASC
    `).all();
    
    // Get today's stats
    const todayStats = await services.d1Service.db.prepare(`
      SELECT source_id, articles_fetched, articles_stored, successful_fetches
      FROM daily_source_stats 
      WHERE date_tracked = DATE('now')
    `).all();
    
    const statsMap = {};
    for (const stat of todayStats.results) {
      statsMap[stat.source_id] = stat;
    }
    
    const sourcesWithStats = sources.results.map((source: any) => ({
      ...source,
      todayStats: statsMap[source.id] || { articles_fetched: 0, articles_stored: 0, successful_fetches: 0 }
    }));
    
    return c.json({
      systemConfig: systemConfig.results,
      sources: sourcesWithStats,
      totalSources: sources.results.length,
      enabledSources: sources.results.filter((s: any) => s.enabled).length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error getting RSS config:", error);
    return c.json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Update RSS source configuration
// TODO: Add authentication back when OpenAuthService is fixed
app.put("/api/admin/rss-source/:sourceId", async (c) => {
  try {
    const services = initializeServices(c.env);
    const sourceId = c.req.param("sourceId");
    const body = await c.req.json();
    
    const {
      daily_limit,
      articles_per_fetch,
      max_bulk_articles,
      enabled,
      priority
    } = body;
    
    // Update source configuration
    await services.d1Service.db.prepare(`
      UPDATE rss_sources 
      SET daily_limit = ?, 
          articles_per_fetch = ?, 
          max_bulk_articles = ?,
          enabled = ?,
          priority = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      daily_limit,
      articles_per_fetch, 
      max_bulk_articles,
      enabled ? 1 : 0,
      priority,
      sourceId
    ).run();
    
    return c.json({
      success: true,
      message: `Updated configuration for source ${sourceId}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error updating RSS source config:", error);
    return c.json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Admin sources management with full service integration
// TODO: Add authentication back when OpenAuthService is fixed
app.get("/api/admin/sources", async (c) => {
  try {
    const services = initializeServices(c.env);
    
    // Get actual news sources from the news source service
    const sources = await services.newsSourceService.getAllSources();
    
    // Enhance with statistics and status
    const sourcesWithStats = await Promise.all(
      sources.map(async (source) => {
        const articleCount = await services.d1Service.getArticleCount({ source_id: source.id });
        const lastFetch = await services.cacheService.getLastFetch(source.id);
        
        return {
          ...source,
          articles: articleCount,
          last_fetch: lastFetch || new Date().toISOString(),
          status: source.enabled ? "active" : "inactive"
        };
      })
    );
    
    return c.json({ sources: sourcesWithStats });
  } catch (error) {
    console.error("Error fetching sources:", error);
    return c.json({ error: "Failed to fetch sources" }, 500);
  }
});

// Analytics insights endpoint - backend heavy lifting
// TODO: Add authentication back when OpenAuthService is fixed
app.get("/api/admin/analytics", async (c) => {
  try {
    const services = initializeServices(c.env);

    // Get comprehensive analytics data
    const analytics = await services.analyticsService.getInsights({
      timeframe: c.req.query("timeframe") || "7d",
      category: c.req.query("category")
    });

    return c.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return c.json({ error: "Failed to fetch analytics" }, 500);
  }
});

// Cron job logs endpoint - view recent cron executions
app.get("/api/admin/cron-logs", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");

    const logs = await c.env.DB.prepare(`
      SELECT
        id,
        cron_type,
        status,
        trigger_time,
        completed_at,
        duration_ms,
        articles_processed,
        articles_new,
        sources_processed,
        sources_failed,
        error_message,
        created_at
      FROM cron_logs
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    const totalResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM cron_logs
    `).first();

    return c.json({
      logs: logs.results,
      total: totalResult.count,
      limit,
      offset
    });
  } catch (error) {
    console.error("Error fetching cron logs:", error);
    return c.json({ error: "Failed to fetch cron logs" }, 500);
  }
});

// Article by source/slug with full service integration
app.get("/api/article/by-source-slug", async (c) => {
  const source = c.req.query("source");
  const slug = c.req.query("slug");
  
  if (!source || !slug) {
    return c.json({ error: "Source and slug are required" }, 400);
  }

  try {
    const services = initializeServices(c.env);

    // Use article service for enhanced retrieval with caching
    const article = await services.articleService.getArticleBySlug(slug);

    if (!article) {
      return c.json({ error: "Article not found" }, 404);
    }

    // Fetch keywords for the article
    const keywordsResult = await c.env.DB.prepare(`
      SELECT k.id, k.name, k.slug
      FROM keywords k
      INNER JOIN article_keyword_links akl ON k.id = akl.keyword_id
      WHERE akl.article_id = ?
      ORDER BY akl.relevance_score DESC
      LIMIT 10
    `).bind(article.id).all();

    article.keywords = keywordsResult.results || [];

    // Track article access analytics
    await services.analyticsService.trackEvent('article_view', {
      source: source,
      slug: slug,
      category: article.category_id,
      admin_access: true
    });

    return c.json({ article });
  } catch (error) {
    console.error("Error fetching article:", error);
    return c.json({ error: "Failed to fetch article" }, 500);
  }
});

// ===== PHASE 1: PUBLIC USER-FACING ENDPOINTS =====

// News Bytes - Articles with images only (TikTok-like feed)
app.get("/api/news-bytes", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = parseInt(c.req.query("offset") || "0");
    const category = c.req.query("category");

    let query = `
      SELECT id, title, slug, description, content_snippet, author, source,
             published_at, image_url, original_url, category_id, view_count,
             like_count, bookmark_count
      FROM articles
      WHERE status = 'published'
      AND image_url IS NOT NULL
      AND image_url != ''
    `;

    let countQuery = `
      SELECT COUNT(*) as total FROM articles
      WHERE status = 'published'
      AND image_url IS NOT NULL
      AND image_url != ''
    `;

    if (category && category !== 'all') {
      query += ` AND category_id = ?`;
      countQuery += ` AND category_id = ?`;
    }

    query += ` ORDER BY published_at DESC LIMIT ? OFFSET ?`;

    const articlesResult = category && category !== 'all' ?
      await c.env.DB.prepare(query).bind(category, limit, offset).all() :
      await c.env.DB.prepare(query).bind(limit, offset).all();

    const totalResult = category && category !== 'all' ?
      await c.env.DB.prepare(countQuery).bind(category).first() :
      await c.env.DB.prepare(countQuery).first();

    const totalCount = totalResult.total || 0;

    return c.json({
      articles: articlesResult.results,
      total: totalCount,
      limit,
      offset,
      hasMore: offset + limit < totalCount
    });
  } catch (error) {
    console.error("Error fetching news bytes:", error);
    return c.json({ error: "Failed to fetch news bytes" }, 500);
  }
});

// Search endpoint - Full-text search with keywords
app.get("/api/search", async (c) => {
  try {
    const query = c.req.query("q");
    const category = c.req.query("category");
    const limit = parseInt(c.req.query("limit") || "50");

    if (!query || query.trim().length === 0) {
      return c.json({ error: "Search query is required" }, 400);
    }

    const searchTerm = `%${query.trim()}%`;

    // Search in title, description, and keywords
    let searchQuery = `
      SELECT DISTINCT a.id, a.title, a.slug, a.description, a.content_snippet,
             a.author, a.source, a.published_at, a.image_url, a.original_url,
             a.category_id, a.view_count, a.like_count, a.bookmark_count
      FROM articles a
      LEFT JOIN article_keywords ak ON a.id = ak.article_id
      WHERE a.status = 'published'
      AND (
        a.title LIKE ? OR
        a.description LIKE ? OR
        a.content LIKE ? OR
        a.content_snippet LIKE ? OR
        ak.keyword LIKE ?
      )
    `;

    const params = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];

    if (category && category !== 'all') {
      searchQuery += ` AND a.category_id = ?`;
      params.push(category);
    }

    searchQuery += ` ORDER BY a.published_at DESC LIMIT ?`;
    params.push(limit);

    const results = await c.env.DB.prepare(searchQuery).bind(...params).all();

    // Log search query for analytics
    try {
      await c.env.DB.prepare(`
        INSERT INTO search_logs (query, category_filter, results_count, session_id, created_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        query.trim(),
        category || null,
        results.results.length,
        c.req.header('x-session-id') || 'anonymous'
      ).run();
    } catch (logError) {
      console.error("Failed to log search:", logError);
      // Don't fail the search if logging fails
    }

    return c.json({
      results: results.results,
      query: query.trim(),
      count: results.results.length,
      category: category || 'all'
    });
  } catch (error) {
    console.error("Error searching articles:", error);
    return c.json({ error: "Failed to search articles" }, 500);
  }
});

// Public Authors endpoint (for user discovery)
app.get("/api/authors", async (c) => {
  try {
    const services = initializeServices(c.env);
    const limit = parseInt(c.req.query("limit") || "20");
    const outlet = c.req.query("outlet");

    // Get authors from the service (same logic as admin endpoint)
    const authors = await services.authorProfileService.getAuthors({
      limit,
      outlet
    });

    return c.json({
      authors,
      total: authors.length,
      limit
    });
  } catch (error) {
    console.error("Error fetching authors:", error);
    return c.json({ error: "Failed to fetch authors" }, 500);
  }
});

// Public Sources endpoint (for following)
app.get("/api/sources", async (c) => {
  try {
    const services = initializeServices(c.env);

    // Get active news sources
    const sources = await c.env.DB.prepare(`
      SELECT id, name, url, category, priority, metadata,
             last_fetched_at, fetch_count, error_count
      FROM rss_sources
      WHERE enabled = 1
      ORDER BY priority DESC, name ASC
    `).all();

    // Get article counts for each source
    const sourcesWithCounts = await Promise.all(
      sources.results.map(async (source) => {
        const countResult = await c.env.DB.prepare(`
          SELECT COUNT(*) as count FROM articles WHERE source_id = ?
        `).bind(source.id).first();

        return {
          ...source,
          article_count: countResult.count || 0
        };
      })
    );

    return c.json({
      sources: sourcesWithCounts,
      total: sourcesWithCounts.length
    });
  } catch (error) {
    console.error("Error fetching sources:", error);
    return c.json({ error: "Failed to fetch sources" }, 500);
  }
});

// User-triggered refresh endpoint (with rate limiting)
// Simple in-memory rate limiter (use KV or D1 for production)
const refreshRateLimiter = new Map();

app.post("/api/refresh", async (c) => {
  try {
    // Get user identifier (session ID or user ID)
    const userId = c.req.header('x-session-id') || c.req.header('x-user-id') || 'anonymous';

    // Check rate limit (5 minutes between refreshes)
    const lastRefresh = refreshRateLimiter.get(userId);
    const now = Date.now();
    const rateLimitMs = 5 * 60 * 1000; // 5 minutes

    if (lastRefresh && (now - lastRefresh) < rateLimitMs) {
      const remainingMs = rateLimitMs - (now - lastRefresh);
      const remainingSec = Math.ceil(remainingMs / 1000);

      return c.json({
        error: "Rate limit exceeded",
        message: `Please wait ${remainingSec} seconds before refreshing again`,
        retryAfter: remainingSec
      }, 429);
    }

    // Update rate limiter
    refreshRateLimiter.set(userId, now);

    // Clean up old entries (older than 10 minutes)
    for (const [key, timestamp] of refreshRateLimiter.entries()) {
      if (now - timestamp > 10 * 60 * 1000) {
        refreshRateLimiter.delete(key);
      }
    }

    // Trigger RSS refresh by calling the admin endpoint internally
    const services = initializeServices(c.env);
    console.log('[USER_REFRESH] User-triggered refresh initiated by:', userId);

    // Call RSS service directly instead of HTTP request
    const result = await services.rssService.refreshAllSources({
      limit: 5 // Limit to 5 articles per source for user refresh
    });

    // Track refresh in analytics
    if (c.env.NEWS_INTERACTIONS) {
      try {
        c.env.NEWS_INTERACTIONS.writeDataPoint({
          blobs: ['user_refresh', 'success', userId],
          doubles: [result.newArticles || 0],
          indexes: ['refresh_trigger']
        });
      } catch (analyticsError) {
        console.error('[USER_REFRESH] Analytics tracking failed:', analyticsError);
      }
    }

    return c.json({
      success: true,
      message: "Refresh completed",
      newArticles: result.newArticles || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("[USER_REFRESH] Error during user refresh:", error);
    return c.json({
      error: "Failed to refresh",
      message: "An error occurred while refreshing articles"
    }, 500);
  }
});

// ===== PHASE 2: USER ENGAGEMENT APIs (REQUIRE AUTH) =====

// Article Like/Unlike
app.post("/api/articles/:id/like", async (c) => {
  try {
    const articleId = c.req.param("id");
    // TODO: Get from authenticated user when auth is re-enabled
    const userId = c.req.header('x-user-id') || c.req.header('x-session-id') || 'anonymous';

    // Check if already liked
    const existing = await c.env.DB.prepare(`
      SELECT id FROM user_likes WHERE user_id = ? AND article_id = ?
    `).bind(userId, articleId).first();

    if (existing) {
      // Unlike
      await c.env.DB.prepare(`
        DELETE FROM user_likes WHERE user_id = ? AND article_id = ?
      `).bind(userId, articleId).run();

      await c.env.DB.prepare(`
        UPDATE articles SET like_count = like_count - 1 WHERE id = ?
      `).bind(articleId).run();

      return c.json({ success: true, liked: false, message: "Article unliked" });
    } else {
      // Like
      await c.env.DB.prepare(`
        INSERT INTO user_likes (user_id, article_id) VALUES (?, ?)
      `).bind(userId, articleId).run();

      await c.env.DB.prepare(`
        UPDATE articles SET like_count = like_count + 1 WHERE id = ?
      `).bind(articleId).run();

      // Track in analytics
      if (c.env.NEWS_ANALYTICS) {
        try {
          c.env.NEWS_ANALYTICS.writeDataPoint({
            blobs: ['article_like', userId, articleId.toString()],
            doubles: [Date.now()],
            indexes: ['engagement']
          });
        } catch (analyticsError) {
          console.error('[LIKE] Analytics tracking failed:', analyticsError);
        }
      }

      return c.json({ success: true, liked: true, message: "Article liked" });
    }
  } catch (error) {
    console.error("[LIKE] Error:", error);
    return c.json({ error: "Failed to like article" }, 500);
  }
});

// Article Save/Bookmark
app.post("/api/articles/:id/save", async (c) => {
  try {
    const articleId = c.req.param("id");
    const userId = c.req.header('x-user-id') || c.req.header('x-session-id') || 'anonymous';

    // Check if already saved
    const existing = await c.env.DB.prepare(`
      SELECT id FROM user_bookmarks WHERE user_id = ? AND article_id = ?
    `).bind(userId, articleId).first();

    if (existing) {
      // Unsave
      await c.env.DB.prepare(`
        DELETE FROM user_bookmarks WHERE user_id = ? AND article_id = ?
      `).bind(userId, articleId).run();

      await c.env.DB.prepare(`
        UPDATE articles SET bookmark_count = bookmark_count - 1 WHERE id = ?
      `).bind(articleId).run();

      return c.json({ success: true, saved: false, message: "Bookmark removed" });
    } else {
      // Save
      await c.env.DB.prepare(`
        INSERT INTO user_bookmarks (user_id, article_id) VALUES (?, ?)
      `).bind(userId, articleId).run();

      await c.env.DB.prepare(`
        UPDATE articles SET bookmark_count = bookmark_count + 1 WHERE id = ?
      `).bind(articleId).run();

      // Track in analytics
      if (c.env.NEWS_ANALYTICS) {
        try {
          c.env.NEWS_ANALYTICS.writeDataPoint({
            blobs: ['article_save', userId, articleId.toString()],
            doubles: [Date.now()],
            indexes: ['engagement']
          });
        } catch (analyticsError) {
          console.error('[SAVE] Analytics tracking failed:', analyticsError);
        }
      }

      return c.json({ success: true, saved: true, message: "Article bookmarked" });
    }
  } catch (error) {
    console.error("[SAVE] Error:", error);
    return c.json({ error: "Failed to save article" }, 500);
  }
});

// Article View Tracking
app.post("/api/articles/:id/view", async (c) => {
  try {
    const articleId = c.req.param("id");
    const userId = c.req.header('x-user-id') || c.req.header('x-session-id') || 'anonymous';

    const body = await c.req.json();
    const readingTime = body.reading_time || 0; // seconds
    const scrollDepth = body.scroll_depth || 0; // percentage 0-100

    // Insert or update reading history
    await c.env.DB.prepare(`
      INSERT INTO user_reading_history (user_id, article_id, reading_time, scroll_depth)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, article_id)
      DO UPDATE SET
        reading_time = reading_time + ?,
        scroll_depth = MAX(scroll_depth, ?),
        last_position_at = CURRENT_TIMESTAMP
    `).bind(userId, articleId, readingTime, scrollDepth, readingTime, scrollDepth).run();

    // Increment view count
    await c.env.DB.prepare(`
      UPDATE articles SET view_count = view_count + 1 WHERE id = ?
    `).bind(articleId).run();

    // Track in analytics
    if (c.env.NEWS_ANALYTICS) {
      try {
        c.env.NEWS_ANALYTICS.writeDataPoint({
          blobs: ['article_view', userId, articleId.toString()],
          doubles: [readingTime, scrollDepth],
          indexes: ['engagement']
        });
      } catch (analyticsError) {
        console.error('[VIEW] Analytics tracking failed:', analyticsError);
      }
    }

    return c.json({ success: true, message: "View tracked" });
  } catch (error) {
    console.error("[VIEW] Error:", error);
    return c.json({ error: "Failed to track view" }, 500);
  }
});

// Article Comment
app.post("/api/articles/:id/comment", async (c) => {
  try {
    const articleId = c.req.param("id");
    const userId = c.req.header('x-user-id') || c.req.header('x-session-id') || 'anonymous';

    const body = await c.req.json();
    const content = body.content;
    const parentCommentId = body.parent_comment_id || null;

    if (!content || content.trim().length === 0) {
      return c.json({ error: "Comment content is required" }, 400);
    }

    if (content.length > 1000) {
      return c.json({ error: "Comment too long (max 1000 characters)" }, 400);
    }

    // Insert comment
    const result = await c.env.DB.prepare(`
      INSERT INTO article_comments (article_id, user_id, parent_comment_id, content, status)
      VALUES (?, ?, ?, ?, 'published')
    `).bind(articleId, userId, parentCommentId, content.trim()).run();

    // Note: Triggers will handle comment_count and reply_count updates

    // Track in analytics
    if (c.env.NEWS_ANALYTICS) {
      try {
        c.env.NEWS_ANALYTICS.writeDataPoint({
          blobs: ['article_comment', userId, articleId.toString()],
          doubles: [Date.now()],
          indexes: ['engagement']
        });
      } catch (analyticsError) {
        console.error('[COMMENT] Analytics tracking failed:', analyticsError);
      }
    }

    return c.json({
      success: true,
      commentId: result.meta.last_row_id,
      message: "Comment posted"
    });
  } catch (error) {
    console.error("[COMMENT] Error:", error);
    return c.json({ error: "Failed to post comment" }, 500);
  }
});

// Get Article Comments
app.get("/api/articles/:id/comments", async (c) => {
  try {
    const articleId = c.req.param("id");
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");

    const comments = await c.env.DB.prepare(`
      SELECT
        id,
        article_id,
        user_id,
        parent_comment_id,
        content,
        like_count,
        reply_count,
        status,
        created_at,
        updated_at
      FROM article_comments
      WHERE article_id = ? AND status = 'published' AND parent_comment_id IS NULL
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(articleId, limit, offset).all();

    // Get replies for each comment
    for (const comment of comments.results) {
      const replies = await c.env.DB.prepare(`
        SELECT
          id,
          article_id,
          user_id,
          parent_comment_id,
          content,
          like_count,
          reply_count,
          status,
          created_at,
          updated_at
        FROM article_comments
        WHERE parent_comment_id = ? AND status = 'published'
        ORDER BY created_at ASC
        LIMIT 10
      `).bind(comment.id).all();

      (comment as any).replies = replies.results;
    }

    return c.json({
      comments: comments.results,
      total: comments.results.length,
      limit,
      offset
    });
  } catch (error) {
    console.error("[COMMENTS] Error:", error);
    return c.json({ error: "Failed to fetch comments" }, 500);
  }
});

// User Preferences - GET
app.get("/api/user/me/preferences", async (c) => {
  try {
    const userId = c.req.header('x-user-id') || c.req.header('x-session-id') || 'anonymous';

    // Get user preferences
    const prefs = await c.env.DB.prepare(`
      SELECT preference_key, preference_value
      FROM user_preferences
      WHERE user_id = ?
    `).bind(userId).all();

    const preferences = {};
    for (const pref of prefs.results) {
      preferences[pref.preference_key] = pref.preference_value;
    }

    // Get followed sources
    const followedSources = await c.env.DB.prepare(`
      SELECT follow_id as source_id, created_at
      FROM user_follows
      WHERE user_id = ? AND follow_type = 'source'
    `).bind(userId).all();

    // Get followed authors
    const followedAuthors = await c.env.DB.prepare(`
      SELECT follow_id as author_id, created_at
      FROM user_follows
      WHERE user_id = ? AND follow_type = 'author'
    `).bind(userId).all();

    // Get reading habits
    const readingStats = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as articles_read,
        SUM(reading_time) as total_reading_time,
        AVG(scroll_depth) as avg_scroll_depth
      FROM user_reading_history
      WHERE user_id = ?
    `).bind(userId).first();

    return c.json({
      preferences,
      followed_sources: followedSources.results,
      followed_authors: followedAuthors.results,
      reading_stats: readingStats
    });
  } catch (error) {
    console.error("[PREFERENCES_GET] Error:", error);
    return c.json({ error: "Failed to fetch preferences" }, 500);
  }
});

// User Preferences - UPDATE
app.post("/api/user/me/preferences", async (c) => {
  try {
    const userId = c.req.header('x-user-id') || c.req.header('x-session-id') || 'anonymous';
    const body = await c.req.json();

    // Update or insert preferences
    for (const [key, value] of Object.entries(body)) {
      await c.env.DB.prepare(`
        INSERT INTO user_preferences (user_id, preference_key, preference_value)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id, preference_key)
        DO UPDATE SET preference_value = ?, updated_at = CURRENT_TIMESTAMP
      `).bind(userId, key, value, value).run();
    }

    return c.json({ success: true, message: "Preferences updated" });
  } catch (error) {
    console.error("[PREFERENCES_UPDATE] Error:", error);
    return c.json({ error: "Failed to update preferences" }, 500);
  }
});

// Follow Source/Author
app.post("/api/user/me/follows", async (c) => {
  try {
    const userId = c.req.header('x-user-id') || c.req.header('x-session-id') || 'anonymous';
    const body = await c.req.json();

    const followType = body.follow_type; // 'source' or 'author'
    const followId = body.follow_id;

    if (!['source', 'author', 'category'].includes(followType)) {
      return c.json({ error: "Invalid follow_type. Must be 'source', 'author', or 'category'" }, 400);
    }

    if (!followId) {
      return c.json({ error: "follow_id is required" }, 400);
    }

    // Insert follow
    await c.env.DB.prepare(`
      INSERT INTO user_follows (user_id, follow_type, follow_id)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, follow_type, follow_id) DO NOTHING
    `).bind(userId, followType, followId).run();

    // Track in analytics
    if (c.env.USER_ANALYTICS) {
      try {
        c.env.USER_ANALYTICS.writeDataPoint({
          blobs: ['user_follow', userId, followType, followId],
          doubles: [Date.now()],
          indexes: ['follows']
        });
      } catch (analyticsError) {
        console.error('[FOLLOW] Analytics tracking failed:', analyticsError);
      }
    }

    return c.json({ success: true, message: `Now following ${followType}` });
  } catch (error) {
    console.error("[FOLLOW] Error:", error);
    return c.json({ error: "Failed to follow" }, 500);
  }
});

// Unfollow Source/Author
app.delete("/api/user/me/follows/:type/:id", async (c) => {
  try {
    const userId = c.req.header('x-user-id') || c.req.header('x-session-id') || 'anonymous';
    const followType = c.req.param("type");
    const followId = c.req.param("id");

    if (!['source', 'author', 'category'].includes(followType)) {
      return c.json({ error: "Invalid follow_type" }, 400);
    }

    // Delete follow
    await c.env.DB.prepare(`
      DELETE FROM user_follows
      WHERE user_id = ? AND follow_type = ? AND follow_id = ?
    `).bind(userId, followType, followId).run();

    // Track in analytics
    if (c.env.USER_ANALYTICS) {
      try {
        c.env.USER_ANALYTICS.writeDataPoint({
          blobs: ['user_unfollow', userId, followType, followId],
          doubles: [Date.now()],
          indexes: ['follows']
        });
      } catch (analyticsError) {
        console.error('[UNFOLLOW] Analytics tracking failed:', analyticsError);
      }
    }

    return c.json({ success: true, message: `Unfollowed ${followType}` });
  } catch (error) {
    console.error("[UNFOLLOW] Error:", error);
    return c.json({ error: "Failed to unfollow" }, 500);
  }
});

// ===== ADMIN ENDPOINTS (PROTECTED - TODO: Re-enable auth) =====

// AI Pipeline monitoring and author recognition endpoints
// TODO: Add authentication back when OpenAuthService is fixed
app.get("/api/admin/ai-pipeline-status", async (c) => {
  try {
    const services = initializeServices(c.env);
    
    // Get AI processing statistics
    const aiStats = await services.d1Service.db.prepare(`
      SELECT 
        processing_type,
        status,
        COUNT(*) as count,
        AVG(processing_time) as avg_time,
        MAX(created_at) as last_processed
      FROM ai_processing_log 
      WHERE created_at > datetime('now', '-24 hours')
      GROUP BY processing_type, status
      ORDER BY processing_type, status
    `).all();
    
    // Get author extraction statistics
    const authorStats = await services.d1Service.db.prepare(`
      SELECT 
        COUNT(DISTINCT a.id) as total_authors,
        COUNT(DISTINCT CASE WHEN a.verification_status = 'verified' THEN a.id END) as verified_authors,
        COUNT(DISTINCT aa.article_id) as articles_with_authors,
        AVG(aa.confidence_score) as avg_confidence
      FROM authors a
      LEFT JOIN article_authors aa ON a.id = aa.author_id
    `).first();
    
    // Get keyword extraction statistics  
    const keywordStats = await services.d1Service.db.prepare(`
      SELECT 
        COUNT(DISTINCT k.id) as total_keywords,
        COUNT(DISTINCT ak.article_id) as articles_with_keywords,
        AVG(ak.confidence_score) as avg_keyword_confidence,
        MAX(k.usage_count) as most_used_keyword_count
      FROM keywords k
      LEFT JOIN article_keywords ak ON k.id = ak.keyword_id
    `).first();
    
    // Get quality scoring statistics
    const qualityStats = await services.d1Service.db.prepare(`
      SELECT 
        COUNT(*) as articles_scored,
        AVG(quality_score) as avg_quality,
        COUNT(CASE WHEN quality_score > 0.8 THEN 1 END) as high_quality_count,
        COUNT(CASE WHEN quality_score < 0.5 THEN 1 END) as low_quality_count
      FROM articles 
      WHERE quality_score IS NOT NULL
    `).first();
    
    return c.json({
      ai_processing: aiStats.results,
      author_recognition: {
        total_authors: authorStats.total_authors || 0,
        verified_authors: authorStats.verified_authors || 0,
        articles_with_authors: authorStats.articles_with_authors || 0,
        avg_confidence: authorStats.avg_confidence || 0
      },
      keyword_extraction: {
        total_keywords: keywordStats.total_keywords || 0,
        articles_with_keywords: keywordStats.articles_with_keywords || 0,
        avg_confidence: keywordStats.avg_keyword_confidence || 0,
        most_used_count: keywordStats.most_used_keyword_count || 0
      },
      quality_assessment: {
        articles_scored: qualityStats.articles_scored || 0,
        avg_quality: qualityStats.avg_quality || 0,
        high_quality_count: qualityStats.high_quality_count || 0,
        low_quality_count: qualityStats.low_quality_count || 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching AI pipeline status:", error);
    return c.json({ error: "Failed to fetch AI pipeline status" }, 500);
  }
});

// Author recognition and journalism tracking
// TODO: Add authentication back when OpenAuthService is fixed
app.get("/api/admin/authors", async (c) => {
  try {
    const services = initializeServices(c.env);
    const limit = parseInt(c.req.query("limit") || "20");
    const outlet = c.req.query("outlet");
    
    let query = `
      SELECT 
        a.*,
        COUNT(DISTINCT aa.article_id) as article_count,
        AVG(ar.quality_score) as avg_article_quality,
        MAX(ar.published_at) as last_article_date
      FROM authors a
      LEFT JOIN article_authors aa ON a.id = aa.author_id
      LEFT JOIN articles ar ON aa.article_id = ar.id
    `;
    
    const params = [];
    if (outlet) {
      query += ` WHERE a.outlet = ?`;
      params.push(outlet);
    }
    
    query += `
      GROUP BY a.id
      ORDER BY article_count DESC, a.created_at DESC
      LIMIT ?
    `;
    params.push(limit);
    
    const authors = await services.d1Service.db.prepare(query).bind(...params).all();
    
    // Get outlets summary
    const outlets = await services.d1Service.db.prepare(`
      SELECT 
        outlet,
        COUNT(*) as author_count,
        SUM(article_count) as total_articles
      FROM authors 
      WHERE outlet IS NOT NULL
      GROUP BY outlet
      ORDER BY author_count DESC
    `).all();
    
    return c.json({
      authors: authors.results,
      outlets: outlets.results,
      recognition_message: "Celebrating Zimbabwe journalism through author recognition and byline tracking"
    });
  } catch (error) {
    console.error("Error fetching authors:", error);
    return c.json({ error: "Failed to fetch authors" }, 500);
  }
});

// Content quality insights
// TODO: Add authentication back when OpenAuthService is fixed
app.get("/api/admin/content-quality", async (c) => {
  try {
    const services = initializeServices(c.env);
    
    // Quality distribution
    const qualityDistribution = await services.d1Service.db.prepare(`
      SELECT 
        CASE 
          WHEN quality_score >= 0.8 THEN 'Excellent'
          WHEN quality_score >= 0.6 THEN 'Good'  
          WHEN quality_score >= 0.4 THEN 'Fair'
          ELSE 'Needs Improvement'
        END as quality_tier,
        COUNT(*) as count,
        AVG(quality_score) as avg_score
      FROM articles 
      WHERE quality_score IS NOT NULL
      GROUP BY quality_tier
      ORDER BY avg_score DESC
    `).all();
    
    // Top quality articles by category
    const topByCategory = await services.d1Service.db.prepare(`
      SELECT 
        category,
        title,
        quality_score,
        published_at,
        (SELECT name FROM authors WHERE id = (
          SELECT author_id FROM article_authors WHERE article_id = articles.id LIMIT 1
        )) as author_name
      FROM articles 
      WHERE quality_score IS NOT NULL
      ORDER BY quality_score DESC
      LIMIT 10
    `).all();
    
    return c.json({
      quality_distribution: qualityDistribution.results,
      top_quality_articles: topByCategory.results,
      ai_enhancements: {
        content_cleaning: "Active - removing image URLs and noise",
        grammar_assessment: "Active - AI grammar scoring",
        readability_analysis: "Active - readability metrics",
        headline_optimization: "Active - headline quality scoring"
      }
    });
  } catch (error) {
    console.error("Error fetching content quality data:", error);
    return c.json({ error: "Failed to fetch content quality data" }, 500);
  }
});

// ===== AUTHOR PROFILE & SOCIAL FEATURES =====

// Individual author profile pages (auto-generated)
app.get("/api/author/:slug", async (c) => {
  try {
    const services = initializeServices(c.env);
    const slug = c.req.param("slug");
    
    const profile = await services.authorProfileService.getAuthorProfile(slug);
    
    if (!profile) {
      return c.json({ error: "Author not found" }, 404);
    }
    
    // Track profile view
    await services.authorProfileService.trackProfileInteraction(
      profile.id,
      'view',
      undefined, // userId would come from auth
      {
        ipAddress: c.req.header('cf-connecting-ip'),
        userAgent: c.req.header('user-agent'),
        referrer: c.req.header('referer')
      }
    );
    
    return c.json({
      author: profile,
      journalism_recognition: "Celebrating Zimbabwe journalism through comprehensive author profiles",
      profile_features: [
        "Cross-outlet author tracking",
        "Article quality scoring",
        "Professional credibility metrics",
        "Social engagement tracking",
        "Follow functionality"
      ]
    });
  } catch (error) {
    console.error("Error fetching author profile:", error);
    return c.json({ error: "Failed to fetch author profile" }, 500);
  }
});

// Follow/unfollow an author
app.post("/api/author/:authorId/follow", async (c) => {
  try {
    const services = initializeServices(c.env);
    const authorId = parseInt(c.req.param("authorId"));
    
    // TODO: Get userId from authentication
    const userId = 1; // Placeholder - would come from auth middleware
    
    const result = await services.authorProfileService.toggleAuthorFollow(userId, authorId);
    
    return c.json(result);
  } catch (error) {
    console.error("Error toggling author follow:", error);
    return c.json({ error: "Failed to update follow status" }, 500);
  }
});

// Follow/unfollow a news source
app.post("/api/source/:sourceId/follow", async (c) => {
  try {
    const services = initializeServices(c.env);
    const sourceId = c.req.param("sourceId");
    
    // TODO: Get userId from authentication
    const userId = 1; // Placeholder - would come from auth middleware
    
    const result = await services.authorProfileService.toggleSourceFollow(userId, sourceId);
    
    return c.json(result);
  } catch (error) {
    console.error("Error toggling source follow:", error);
    return c.json({ error: "Failed to update follow status" }, 500);
  }
});

// Featured authors showcase
app.get("/api/featured-authors", async (c) => {
  try {
    const services = initializeServices(c.env);
    const limit = parseInt(c.req.query("limit") || "10");
    
    const authors = await services.authorProfileService.getFeaturedAuthors(limit);
    
    return c.json({
      featured_authors: authors,
      message: "Showcasing Zimbabwe's leading journalists and their contributions to news coverage"
    });
  } catch (error) {
    console.error("Error fetching featured authors:", error);
    return c.json({ error: "Failed to fetch featured authors" }, 500);
  }
});

// Trending authors based on recent engagement
app.get("/api/trending-authors", async (c) => {
  try {
    const services = initializeServices(c.env);
    const days = parseInt(c.req.query("days") || "7");
    const limit = parseInt(c.req.query("limit") || "10");
    
    const authors = await services.authorProfileService.getTrendingAuthors(days, limit);
    
    return c.json({
      trending_authors: authors,
      timeframe: `${days} days`,
      message: "Authors trending based on recent articles and reader engagement"
    });
  } catch (error) {
    console.error("Error fetching trending authors:", error);
    return c.json({ error: "Failed to fetch trending authors" }, 500);
  }
});

// Search authors across outlets
app.get("/api/search/authors", async (c) => {
  try {
    const services = initializeServices(c.env);
    const query = c.req.query("q");
    const limit = parseInt(c.req.query("limit") || "20");
    
    if (!query) {
      return c.json({ error: "Search query required" }, 400);
    }
    
    const authors = await services.authorProfileService.searchAuthors(query, limit);
    
    return c.json({
      authors,
      query,
      total: authors.length,
      cross_outlet_search: "Search includes authors across all Zimbabwe news outlets"
    });
  } catch (error) {
    console.error("Error searching authors:", error);
    return c.json({ error: "Failed to search authors" }, 500);
  }
});

// Enhanced author management for admin (with cross-outlet view)
// TODO: Add authentication back when OpenAuthService is fixed
app.get("/api/admin/authors/detailed", async (c) => {
  try {
    const services = initializeServices(c.env);
    const limit = parseInt(c.req.query("limit") || "50");
    const outlet = c.req.query("outlet");
    const verified = c.req.query("verified");
    
    let query = `
      SELECT 
        a.*,
        COUNT(DISTINCT ao.outlet_id) as outlet_count,
        COUNT(DISTINCT aa.article_id) as total_articles,
        AVG(ar.quality_score) as avg_quality,
        MAX(ar.published_at) as last_article,
        GROUP_CONCAT(DISTINCT ns.name) as outlets_list
      FROM authors a
      LEFT JOIN author_outlets ao ON a.id = ao.author_id
      LEFT JOIN article_authors aa ON a.id = aa.author_id
      LEFT JOIN articles ar ON aa.article_id = ar.id
      LEFT JOIN news_sources ns ON ao.outlet_id = ns.id
    `;
    
    const params = [];
    const conditions = [];
    
    if (outlet) {
      conditions.push('ao.outlet_id = ?');
      params.push(outlet);
    }
    
    if (verified !== undefined) {
      conditions.push('a.is_verified = ?');
      params.push(verified === 'true' ? 1 : 0);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += `
      GROUP BY a.id
      ORDER BY total_articles DESC, a.follower_count DESC
      LIMIT ?
    `;
    params.push(limit);
    
    const authors = await services.d1Service.db.prepare(query).bind(...params).all();
    
    // Get deduplication stats
    const deduplicationStats = await services.d1Service.db.prepare(`
      SELECT 
        COUNT(DISTINCT a.normalized_name) as unique_authors,
        COUNT(*) as total_records,
        COUNT(CASE WHEN outlet_count > 1 THEN 1 END) as cross_outlet_authors
      FROM (
        SELECT 
          a.normalized_name,
          COUNT(DISTINCT ao.outlet_id) as outlet_count
        FROM authors a
        LEFT JOIN author_outlets ao ON a.id = ao.author_id
        GROUP BY a.normalized_name
      ) a
    `).first();
    
    return c.json({
      authors: authors.results,
      deduplication_stats: deduplicationStats,
      cross_outlet_tracking: "Authors are deduplicated across all news outlets",
      features: [
        "Smart author deduplication",
        "Cross-outlet article tracking", 
        "Professional credibility scoring",
        "Social engagement metrics",
        "Automated profile generation"
      ]
    });
  } catch (error) {
    console.error("Error fetching detailed authors:", error);
    return c.json({ error: "Failed to fetch detailed authors" }, 500);
  }
});

// Category management with author expertise tracking
// TODO: Add authentication back when OpenAuthService is fixed
app.get("/api/admin/categories/with-authors", async (c) => {
  try {
    const services = initializeServices(c.env);
    
    // Get categories with author expertise data
    const categories = await services.d1Service.db.prepare(`
      SELECT 
        c.*,
        COUNT(DISTINCT ace.author_id) as expert_authors,
        COUNT(DISTINCT aa.article_id) as total_articles,
        AVG(ace.avg_quality_score) as category_quality,
        GROUP_CONCAT(DISTINCT a.name) as top_authors
      FROM categories c
      LEFT JOIN author_category_expertise ace ON c.id = ace.category_id
      LEFT JOIN authors a ON ace.author_id = a.id AND ace.expertise_level IN ('expert', 'specialist')
      LEFT JOIN article_authors aa ON a.id = aa.author_id
      LEFT JOIN articles ar ON aa.article_id = ar.id AND ar.category = c.id
      GROUP BY c.id
      ORDER BY expert_authors DESC, total_articles DESC
    `).all();
    
    // Get category managers
    const managers = await services.d1Service.db.prepare(`
      SELECT 
        cm.category_id,
        u.username as manager_name,
        cm.manager_type,
        cm.permissions
      FROM category_managers cm
      JOIN users u ON cm.user_id = u.id
      ORDER BY cm.category_id, cm.manager_type
    `).all();
    
    const managersByCategory = {};
    for (const manager of managers.results) {
      if (!managersByCategory[manager.category_id]) {
        managersByCategory[manager.category_id] = [];
      }
      managersByCategory[manager.category_id].push(manager);
    }
    
    const categoriesWithManagers = categories.results.map((category: any) => ({
      ...category,
      managers: managersByCategory[category.id] || [],
      top_authors: category.top_authors ? category.top_authors.split(',').slice(0, 5) : []
    }));
    
    return c.json({
      categories: categoriesWithManagers,
      author_expertise_tracking: "Categories track author expertise and specialization",
      management_features: [
        "Author expertise by category",
        "Category manager assignments",
        "Quality scoring by category",
        "Editorial oversight tools"
      ]
    });
  } catch (error) {
    console.error("Error fetching categories with authors:", error);
    return c.json({ error: "Failed to fetch categories with authors" }, 500);
  }
});

// Dynamic PWA manifest with full category management
app.get("/api/manifest.json", async (c) => {
  try {
    const services = initializeServices(c.env);
    const categories = await services.d1Service.getCategories();
    
    const shortcuts = categories
      .filter(cat => cat.id !== 'all' && cat.enabled)
      .slice(0, 4) // PWA spec recommends max 4 shortcuts
      .map(category => ({
        name: `${category.emoji || '📰'} ${category.name}`,
        url: `/?category=${category.id}`,
        description: `Browse ${category.name.toLowerCase()} news`
      }));

    const manifest = {
      name: "Harare Metro",
      short_name: "Harare Metro", 
      description: "Zimbabwe's Premier News Aggregation Platform",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#00A651",
      icons: [
        {
          src: "/icon-192x192.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "/icon-512x512.png",
          sizes: "512x512",
          type: "image/png"
        }
      ],
      shortcuts,
      categories: ["news", "lifestyle", "business"],
      lang: "en",
      dir: "ltr",
      orientation: "portrait-primary"
    };

    c.header("Content-Type", "application/manifest+json");
    c.header("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    
    // Track manifest generation
    await services.analyticsService.trackEvent('manifest_generated', {
      shortcuts: shortcuts.length,
      categories: categories.length
    });
    
    return c.json(manifest);
  } catch (error) {
    console.error("Error generating manifest:", error);
    return c.json({ error: "Failed to generate manifest" }, 500);
  }
});

// ===== CATEGORY MANAGEMENT ENDPOINTS (Using CategoryManager) =====

// Get category insights and analytics
app.get("/api/admin/category-insights", async (c) => {
  try {
    const services = initializeServices(c.env);
    const days = parseInt(c.req.query('days') || '30');

    const insights = await services.categoryManager.generateInsights(days);

    return c.json({
      success: true,
      insights,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[API] Error getting category insights:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get trending categories
app.get("/api/trending-categories", async (c) => {
  try {
    const services = initializeServices(c.env);
    const limit = parseInt(c.req.query('limit') || '5');

    const trending = await services.categoryManager.getTrendingCategories(limit);

    return c.json({
      success: true,
      trending,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[API] Error getting trending categories:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get user's personalized category recommendations
app.get("/api/user/personalized-categories", async (c) => {
  try {
    const services = initializeServices(c.env);
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ error: 'User ID required' }, 400);
    }

    const categories = await services.categoryManager.getPersonalizedCategories(userId, 10);

    return c.json({
      success: true,
      categories,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[API] Error getting personalized categories:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Initialize user category interest (for onboarding)
app.post("/api/user/me/category-interest", async (c) => {
  try {
    const services = initializeServices(c.env);
    const { categoryId, initialScore } = await c.req.json();

    // Get user ID from auth token
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // TODO: Extract user ID from token (for now, get from OpenAuthService)
    // This is a placeholder - you'll need to implement proper token validation
    const token = authHeader.substring(7);

    // For now, we'll get user ID from the session
    // In production, validate the token and extract user_id
    const sessionResult = await c.env.DB.prepare(`
      SELECT user_id FROM user_sessions WHERE token_hash = ? AND expires_at > datetime('now')
    `).bind(token).first() as any;

    if (!sessionResult) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    const userId = sessionResult.user_id;

    // Update category interest
    await services.categoryManager.updateInterestScore(
      userId,
      categoryId,
      initialScore || 10,
      'view'
    );

    return c.json({
      success: true,
      message: 'Category interest initialized',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[API] Error initializing category interest:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ===== OBSERVABILITY ENDPOINTS (Using ObservabilityService) =====

// Health check with full observability
app.get("/api/admin/observability/health", async (c) => {
  try {
    const services = initializeServices(c.env);
    const healthChecks = await services.observabilityService.performHealthChecks(c.env);

    return c.json({
      success: true,
      health: healthChecks,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[API] Error performing health checks:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get metrics summary
app.get("/api/admin/observability/metrics", async (c) => {
  try {
    const services = initializeServices(c.env);
    const metrics = services.observabilityService.getMetricsSummary();

    return c.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[API] Error getting metrics:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get alerts
app.get("/api/admin/observability/alerts", async (c) => {
  try {
    const services = initializeServices(c.env);
    const alerts = await services.observabilityService.checkAlerts();

    return c.json({
      success: true,
      alerts,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[API] Error checking alerts:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ===== USER SERVICE ENDPOINTS (Using D1UserService) =====

// Get user bookmarks
app.get("/api/user/bookmarks", async (c) => {
  try {
    const services = initializeServices(c.env);
    const userId = c.req.query('userId');
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');

    if (!userId) {
      return c.json({ error: 'User ID required' }, 400);
    }

    const bookmarks = await services.userService.getUserBookmarks(userId, limit, offset);

    return c.json({
      success: true,
      bookmarks,
      count: bookmarks.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[API] Error getting user bookmarks:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get user reading history
app.get("/api/user/history", async (c) => {
  try {
    const services = initializeServices(c.env);
    const userId = c.req.query('userId');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    if (!userId) {
      return c.json({ error: 'User ID required' }, 400);
    }

    const history = await services.userService.getUserReadingHistory(userId, limit, offset);

    return c.json({
      success: true,
      history,
      count: history.length,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[API] Error getting reading history:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get user statistics
app.get("/api/user/stats", async (c) => {
  try {
    const services = initializeServices(c.env);
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ error: 'User ID required' }, 400);
    }

    const stats = await services.userService.getUserStats(userId);

    return c.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[API] Error getting user stats:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ===== AUTHENTICATION ENDPOINTS =====
// Simple password-based authentication using D1 + KV
// Replaces Supabase with OpenAuth service

// Register new user
app.post("/api/auth/register", async (c) => {
  try {
    const { email, password, displayName, username } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const services = initializeServices(c.env);
    const authService = new OpenAuthService({ DB: c.env.DB, AUTH_STORAGE: c.env.AUTH_STORAGE });

    // Check if user already exists
    const existingUser = await authService.getUserByEmail(email);
    if (existingUser) {
      return c.json({ error: "User already exists" }, 409);
    }

    // Check if username is already taken (if provided)
    if (username) {
      const existingUsername = await authService.getUserByUsername(username);
      if (existingUsername) {
        return c.json({ error: "Username is already taken" }, 409);
      }
    }

    // Hash password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Generate username if not provided
    let finalUsername = username;
    if (!finalUsername) {
      finalUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();

      // Ensure uniqueness
      let attempts = 0;
      let uniqueUsername = finalUsername;
      while (attempts < 10) {
        const existing = await authService.getUserByUsername(uniqueUsername);
        if (!existing) break;
        // Use cryptographically secure random number
        const randomArray = new Uint32Array(1);
        crypto.getRandomValues(randomArray);
        const randomSuffix = randomArray[0] % 10000;
        uniqueUsername = `${finalUsername}${randomSuffix}`;
        attempts++;
      }
      finalUsername = uniqueUsername;
    }

    // Create user
    const userId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO users (
        id, email, username, display_name, role, status, email_verified,
        login_count, analytics_consent, preferences, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'creator', 'active', TRUE, 0, TRUE, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(userId, email, finalUsername, displayName || null).run();

    // Store password hash in KV
    await c.env.AUTH_STORAGE.put(`password:${email}`, passwordHash);

    // Get the created user
    const user = await authService.getUserById(userId);

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        role: user.role
      }
    }, 201);
  } catch (error: any) {
    console.error("[AUTH] Registration error:", error);
    return c.json({ error: "Registration failed" }, 500);
  }
});

// Login
app.post("/api/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const authService = new OpenAuthService({ DB: c.env.DB, AUTH_STORAGE: c.env.AUTH_STORAGE });

    // Get user
    const user = await authService.getUserByEmail(email);
    if (!user) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    // Verify password
    const storedHash = await c.env.AUTH_STORAGE.get(`password:${email}`);
    if (!storedHash) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (storedHash !== passwordHash) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    // Create session
    const sessionToken = await authService.createSession(user.id, {
      ip_address: c.req.header('CF-Connecting-IP'),
      user_agent: c.req.header('User-Agent'),
      device_type: 'web',
      browser: 'unknown',
      os: 'unknown'
    });

    return c.json({
      session: { access_token: sessionToken },
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error("[AUTH] Login error:", error);
    return c.json({ error: "Login failed" }, 500);
  }
});

// Get current session
app.get("/api/auth/session", async (c) => {
  try {
    // Try to get token from cookie first, then Authorization header
    const cookieHeader = c.req.header('cookie');
    let token = getCookie(cookieHeader, 'auth_token');

    if (!token) {
      const authHeader = c.req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ session: null, user: null });
      }
      token = authHeader.substring(7);
    }

    const authService = new OpenAuthService({ DB: c.env.DB, AUTH_STORAGE: c.env.AUTH_STORAGE });

    const session = await authService.validateSession(token);
    if (!session) {
      return c.json({ session: null, user: null });
    }

    return c.json({
      session: { access_token: token },
      user: {
        id: session.user_id || session.id,
        email: session.email,
        username: session.username,
        display_name: session.display_name,
        role: session.role
      }
    });
  } catch (error: any) {
    console.error("[AUTH] Session check error:", error);
    return c.json({ session: null, user: null });
  }
});

// Logout
app.post("/api/auth/logout", async (c) => {
  try {
    // Try to get token from cookie first, then Authorization header
    const cookieHeader = c.req.header('cookie');
    let token = getCookie(cookieHeader, 'auth_token');

    if (!token) {
      const authHeader = c.req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      const authService = new OpenAuthService({ DB: c.env.DB, AUTH_STORAGE: c.env.AUTH_STORAGE });
      await authService.revokeSession(token);
    }

    // Clear the cookie by setting it with Max-Age=0
    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'auth_token=; Domain=.hararemetro.co.zw; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
      }
    });
  } catch (error: any) {
    console.error("[AUTH] Logout error:", error);
    return c.json({ error: "Logout failed" }, 500);
  }
});

// Update user profile (including username during onboarding)
app.patch("/api/user/me/profile", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.substring(7);
    const { username, displayName, bio, avatarUrl } = await c.req.json();

    // Get user ID from session
    const sessionResult = await c.env.DB.prepare(`
      SELECT user_id FROM user_sessions WHERE token_hash = ? AND expires_at > datetime('now')
    `).bind(token).first() as any;

    if (!sessionResult) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    const userId = sessionResult.user_id;

    // If username is being updated, check uniqueness
    if (username) {
      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
      if (!usernameRegex.test(username)) {
        return c.json({
          error: 'Username must be 3-30 characters and contain only letters, numbers, and underscores'
        }, 400);
      }

      // Check if username is already taken by another user
      const existingUser = await c.env.DB.prepare(`
        SELECT id FROM users WHERE username = ? AND id != ?
      `).bind(username, userId).first() as any;

      if (existingUser) {
        return c.json({ error: 'Username is already taken' }, 409);
      }
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (username !== undefined) {
      updates.push('username = ?');
      values.push(username);
    }
    if (displayName !== undefined) {
      updates.push('display_name = ?');
      values.push(displayName);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio);
    }
    if (avatarUrl !== undefined) {
      updates.push('avatar_url = ?');
      values.push(avatarUrl);
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    await c.env.DB.prepare(`
      UPDATE users SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();

    // Get updated user
    const updatedUser = await c.env.DB.prepare(`
      SELECT id, email, username, display_name, bio, avatar_url, user_number, user_uid, role, status, created_at
      FROM users WHERE id = ?
    `).bind(userId).first() as any;

    return c.json({
      success: true,
      user: updatedUser,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[API] Error updating profile:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Check username availability
app.get("/api/auth/check-username", async (c) => {
  try {
    const username = c.req.query('username');

    if (!username) {
      return c.json({ error: 'Username parameter required' }, 400);
    }

    // Validate format
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return c.json({
        available: false,
        error: 'Invalid username format'
      });
    }

    // Check if taken
    const existingUser = await c.env.DB.prepare(`
      SELECT id FROM users WHERE username = ?
    `).bind(username).first() as any;

    return c.json({
      available: !existingUser,
      username
    });
  } catch (error: any) {
    console.error('[API] Error checking username:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ===== USER MANAGEMENT (ADMIN ONLY) =====

// Get all users (admin only)
app.get("/api/admin/users", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const token = authHeader.substring(7);
    const authService = new OpenAuthService({ DB: c.env.DB, AUTH_STORAGE: c.env.AUTH_STORAGE });
    const session = await authService.validateSession(token);

    if (!session || session.role !== 'admin') {
      return c.json({ error: "Admin access required" }, 403);
    }

    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");
    const search = c.req.query("search") || "";

    let query = `
      SELECT id, email, username, display_name, user_number, user_uid, role, status, email_verified,
             created_at, updated_at, last_login_at, login_count
      FROM users
    `;

    let params: any[] = [];

    if (search) {
      query += ` WHERE email LIKE ? OR display_name LIKE ? OR username LIKE ? OR user_number LIKE ? OR user_uid LIKE ?`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY user_number ASC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const users = await c.env.DB.prepare(query).bind(...params).all();
    const totalResult = await c.env.DB.prepare(
      search
        ? `SELECT COUNT(*) as total FROM users WHERE email LIKE ? OR display_name LIKE ? OR username LIKE ? OR user_number LIKE ? OR user_uid LIKE ?`
        : `SELECT COUNT(*) as total FROM users`
    ).bind(...(search ? [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`] : [])).first();

    return c.json({
      users: users.results,
      total: totalResult.total,
      limit,
      offset
    });
  } catch (error: any) {
    console.error("[ADMIN] List users error:", error);
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

// Get user stats (admin only)
app.get("/api/admin/user-stats", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const token = authHeader.substring(7);
    const authService = new OpenAuthService({ DB: c.env.DB, AUTH_STORAGE: c.env.AUTH_STORAGE });
    const session = await authService.validateSession(token);

    if (!session || session.role !== 'admin') {
      return c.json({ error: "Admin access required" }, 403);
    }

    const stats = await authService.getUserStats();

    return c.json(stats);
  } catch (error: any) {
    console.error("[ADMIN] User stats error:", error);
    return c.json({ error: "Failed to fetch user stats" }, 500);
  }
});

// Update user role (admin only)
app.put("/api/admin/users/:userId/role", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const token = authHeader.substring(7);
    const authService = new OpenAuthService({ DB: c.env.DB, AUTH_STORAGE: c.env.AUTH_STORAGE });
    const session = await authService.validateSession(token);

    if (!session || session.role !== 'admin') {
      return c.json({ error: "Admin access required" }, 403);
    }

    const userId = c.req.param("userId");
    const { role } = await c.req.json();

    if (!['creator', 'business-creator', 'moderator', 'admin'].includes(role)) {
      return c.json({ error: "Invalid role" }, 400);
    }

    await authService.updateUserRole(userId, role, session.user_id || session.id);

    return c.json({ message: "User role updated successfully" });
  } catch (error: any) {
    console.error("[ADMIN] Update user role error:", error);
    return c.json({ error: "Failed to update user role" }, 500);
  }
});

// Suspend/activate user (admin only)
app.put("/api/admin/users/:userId/status", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const token = authHeader.substring(7);
    const authService = new OpenAuthService({ DB: c.env.DB, AUTH_STORAGE: c.env.AUTH_STORAGE });
    const session = await authService.validateSession(token);

    if (!session || session.role !== 'admin') {
      return c.json({ error: "Admin access required" }, 403);
    }

    const userId = c.req.param("userId");
    const { status } = await c.req.json();

    if (!['active', 'suspended', 'deleted'].includes(status)) {
      return c.json({ error: "Invalid status" }, 400);
    }

    await c.env.DB.prepare(
      'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(status, userId).run();

    // If suspending or deleting, revoke all sessions
    if (status === 'suspended' || status === 'deleted') {
      await c.env.DB.prepare('DELETE FROM user_sessions WHERE user_id = ?').bind(userId).run();
    }

    return c.json({ message: `User ${status} successfully` });
  } catch (error: any) {
    console.error("[ADMIN] Update user status error:", error);
    return c.json({ error: "Failed to update user status" }, 500);
  }
});

// Delete user (admin only)
app.delete("/api/admin/users/:userId", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const token = authHeader.substring(7);
    const authService = new OpenAuthService({ DB: c.env.DB, AUTH_STORAGE: c.env.AUTH_STORAGE });
    const session = await authService.validateSession(token);

    if (!session || session.role !== 'admin') {
      return c.json({ error: "Admin access required" }, 403);
    }

    const userId = c.req.param("userId");

    // Soft delete - set status to 'deleted'
    await c.env.DB.prepare(
      'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind('deleted', userId).run();

    // Revoke all sessions
    await c.env.DB.prepare('DELETE FROM user_sessions WHERE user_id = ?').bind(userId).run();

    return c.json({ message: "User deleted successfully" });
  } catch (error: any) {
    console.error("[ADMIN] Delete user error:", error);
    return c.json({ error: "Failed to delete user" }, 500);
  }
});

// ===== PASSWORD RECOVERY =====

// Request password reset
app.post("/api/auth/forgot-password", async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    const authService = new OpenAuthService({ DB: c.env.DB, AUTH_STORAGE: c.env.AUTH_STORAGE });

    // Check if user exists
    const user = await authService.getUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists (security best practice)
      return c.json({ message: "If the email exists, a reset link has been sent" });
    }

    // Generate reset token (6-digit code)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store reset code in KV with 15-minute expiry
    await c.env.AUTH_STORAGE.put(`reset:${email}`, resetCode, { expirationTtl: 900 });

    // TODO: Send email with reset code
    // For now, log to console (development only)
    console.log(`[AUTH] Password reset code for ${email}: ${resetCode}`);

    return c.json({ message: "If the email exists, a reset link has been sent" });
  } catch (error: any) {
    console.error("[AUTH] Forgot password error:", error);
    return c.json({ error: "Failed to process request" }, 500);
  }
});

// Reset password with code
app.post("/api/auth/reset-password", async (c) => {
  try {
    const { email, code, newPassword } = await c.req.json();

    if (!email || !code || !newPassword) {
      return c.json({ error: "Email, code, and new password are required" }, 400);
    }

    // Verify reset code
    const storedCode = await c.env.AUTH_STORAGE.get(`reset:${email}`);
    if (!storedCode || storedCode !== code) {
      return c.json({ error: "Invalid or expired reset code" }, 400);
    }

    // Hash new password
    const encoder = new TextEncoder();
    const data = encoder.encode(newPassword);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Update password in KV
    await c.env.AUTH_STORAGE.put(`password:${email}`, passwordHash);

    // Delete reset code
    await c.env.AUTH_STORAGE.delete(`reset:${email}`);

    // Invalidate all existing sessions for this user
    const authService = new OpenAuthService({ DB: c.env.DB, AUTH_STORAGE: c.env.AUTH_STORAGE });
    const user = await authService.getUserByEmail(email);
    if (user) {
      await c.env.DB.prepare('DELETE FROM user_sessions WHERE user_id = ?').bind(user.id).run();
    }

    return c.json({ message: "Password reset successful" });
  } catch (error: any) {
    console.error("[AUTH] Reset password error:", error);
    return c.json({ error: "Failed to reset password" }, 500);
  }
});

// Change password (authenticated)
app.post("/api/auth/change-password", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const token = authHeader.substring(7);
    const authService = new OpenAuthService({ DB: c.env.DB, AUTH_STORAGE: c.env.AUTH_STORAGE });
    const session = await authService.validateSession(token);

    if (!session) {
      return c.json({ error: "Invalid session" }, 401);
    }

    const { currentPassword, newPassword } = await c.req.json();

    if (!currentPassword || !newPassword) {
      return c.json({ error: "Current and new passwords are required" }, 400);
    }

    // Verify current password
    const storedHash = await c.env.AUTH_STORAGE.get(`password:${session.email}`);
    const encoder = new TextEncoder();
    const data = encoder.encode(currentPassword);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const currentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (storedHash !== currentHash) {
      return c.json({ error: "Current password is incorrect" }, 400);
    }

    // Hash new password
    const newData = encoder.encode(newPassword);
    const newHashBuffer = await crypto.subtle.digest('SHA-256', newData);
    const newHashArray = Array.from(new Uint8Array(newHashBuffer));
    const newPasswordHash = newHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Update password
    await c.env.AUTH_STORAGE.put(`password:${session.email}`, newPasswordHash);

    return c.json({ message: "Password changed successfully" });
  } catch (error: any) {
    console.error("[AUTH] Change password error:", error);
    return c.json({ error: "Failed to change password" }, 500);
  }
});

// ===== USER PROFILE ENDPOINTS =====

// Get user profile by username
app.get("/api/user/:username", async (c) => {
  try {
    const username = c.req.param("username");
    const authService = new OpenAuthService({ DB: c.env.DB, AUTH_STORAGE: c.env.AUTH_STORAGE });

    const user = await authService.getUserByUsername(username);
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Public profile data only (no email, no sensitive data)
    return c.json({
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      bio: user.bio,
      role: user.role,
      created_at: user.created_at
    });
  } catch (error: any) {
    console.error("[USER] Get profile error:", error);
    return c.json({ error: "Failed to fetch user profile" }, 500);
  }
});

// Update username (authenticated)
app.put("/api/user/me/username", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const token = authHeader.substring(7);
    const authService = new OpenAuthService({ DB: c.env.DB, AUTH_STORAGE: c.env.AUTH_STORAGE });
    const session = await authService.validateSession(token);

    if (!session) {
      return c.json({ error: "Invalid session" }, 401);
    }

    const { username } = await c.req.json();

    if (!username) {
      return c.json({ error: "Username is required" }, 400);
    }

    const result = await authService.updateUsername(session.user_id || session.id, username);

    if (!result.success) {
      return c.json({ error: result.error || "Failed to update username" }, 400);
    }

    return c.json({ message: "Username updated successfully", username });
  } catch (error: any) {
    console.error("[USER] Update username error:", error);
    return c.json({ error: "Failed to update username" }, 500);
  }
});

// Update user profile (authenticated)
app.put("/api/user/me/profile", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const token = authHeader.substring(7);
    const authService = new OpenAuthService({ DB: c.env.DB, AUTH_STORAGE: c.env.AUTH_STORAGE });
    const session = await authService.validateSession(token);

    if (!session) {
      return c.json({ error: "Invalid session" }, 401);
    }

    const { display_name, bio, avatar_url } = await c.req.json();

    await c.env.DB.prepare(`
      UPDATE users
      SET display_name = ?, bio = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(display_name || null, bio || null, avatar_url || null, session.user_id || session.id).run();

    return c.json({ message: "Profile updated successfully" });
  } catch (error: any) {
    console.error("[USER] Update profile error:", error);
    return c.json({ error: "Failed to update profile" }, 500);
  }
});

// Get user's bookmarked articles
app.get("/api/user/:username/bookmarks", async (c) => {
  try {
    const username = c.req.param("username");
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = parseInt(c.req.query("offset") || "0");

    const authService = new OpenAuthService({ DB: c.env.DB, AUTH_STORAGE: c.env.AUTH_STORAGE });
    const user = await authService.getUserByUsername(username);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Check if requesting user has permission to view (own bookmarks only for now)
    const authHeader = c.req.header('Authorization');
    let canView = false;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const session = await authService.validateSession(token);
      canView = session && (session.user_id === user.id || session.id === user.id);
    }

    if (!canView) {
      return c.json({ error: "Access denied" }, 403);
    }

    const bookmarksResult = await c.env.DB.prepare(`
      SELECT a.id, a.title, a.slug, a.description, a.author, a.source,
             a.source_id, a.category_id, a.published_at, a.image_url,
             b.created_at as bookmarked_at, b.tags, b.notes
      FROM user_bookmarks b
      INNER JOIN articles a ON b.article_id = a.id
      WHERE b.user_id = ? AND a.status = 'published'
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(user.id, limit, offset).all();

    const totalResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM user_bookmarks WHERE user_id = ?'
    ).bind(user.id).first();

    return c.json({
      bookmarks: bookmarksResult.results || [],
      total: totalResult?.total || 0,
      limit,
      offset
    });
  } catch (error: any) {
    console.error("[USER] Get bookmarks error:", error);
    return c.json({ error: "Failed to fetch bookmarks" }, 500);
  }
});

// Get user's liked articles
app.get("/api/user/:username/likes", async (c) => {
  try {
    const username = c.req.param("username");
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = parseInt(c.req.query("offset") || "0");

    const authService = new OpenAuthService({ DB: c.env.DB, AUTH_STORAGE: c.env.AUTH_STORAGE });
    const user = await authService.getUserByUsername(username);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Check if requesting user has permission to view (own likes only for now)
    const authHeader = c.req.header('Authorization');
    let canView = false;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const session = await authService.validateSession(token);
      canView = session && (session.user_id === user.id || session.id === user.id);
    }

    if (!canView) {
      return c.json({ error: "Access denied" }, 403);
    }

    const likesResult = await c.env.DB.prepare(`
      SELECT a.id, a.title, a.slug, a.description, a.author, a.source,
             a.source_id, a.category_id, a.published_at, a.image_url,
             l.created_at as liked_at
      FROM user_likes l
      INNER JOIN articles a ON l.article_id = a.id
      WHERE l.user_id = ? AND a.status = 'published'
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(user.id, limit, offset).all();

    const totalResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM user_likes WHERE user_id = ?'
    ).bind(user.id).first();

    return c.json({
      likes: likesResult.results || [],
      total: totalResult?.total || 0,
      limit,
      offset
    });
  } catch (error: any) {
    console.error("[USER] Get likes error:", error);
    return c.json({ error: "Failed to fetch likes" }, 500);
  }
});

// Get user's reading history
app.get("/api/user/:username/history", async (c) => {
  try {
    const username = c.req.param("username");
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = parseInt(c.req.query("offset") || "0");

    const authService = new OpenAuthService({ DB: c.env.DB, AUTH_STORAGE: c.env.AUTH_STORAGE });
    const user = await authService.getUserByUsername(username);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Check if requesting user has permission to view (own history only)
    const authHeader = c.req.header('Authorization');
    let canView = false;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const session = await authService.validateSession(token);
      canView = session && (session.user_id === user.id || session.id === user.id);
    }

    if (!canView) {
      return c.json({ error: "Access denied" }, 403);
    }

    const historyResult = await c.env.DB.prepare(`
      SELECT a.id, a.title, a.slug, a.description, a.author, a.source,
             a.source_id, a.category_id, a.published_at, a.image_url,
             h.started_at, h.last_position_at, h.reading_time,
             h.scroll_depth, h.completion_percentage
      FROM user_reading_history h
      INNER JOIN articles a ON h.article_id = a.id
      WHERE h.user_id = ? AND a.status = 'published'
      ORDER BY h.last_position_at DESC
      LIMIT ? OFFSET ?
    `).bind(user.id, limit, offset).all();

    const totalResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM user_reading_history WHERE user_id = ?'
    ).bind(user.id).first();

    return c.json({
      history: historyResult.results || [],
      total: totalResult?.total || 0,
      limit,
      offset
    });
  } catch (error: any) {
    console.error("[USER] Get history error:", error);
    return c.json({ error: "Failed to fetch reading history" }, 500);
  }
});

// Get user's activity stats (for profile overview)
app.get("/api/user/:username/stats", async (c) => {
  try {
    const username = c.req.param("username");
    const authService = new OpenAuthService({ DB: c.env.DB, AUTH_STORAGE: c.env.AUTH_STORAGE });
    const user = await authService.getUserByUsername(username);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Get counts
    const bookmarksCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM user_bookmarks WHERE user_id = ?'
    ).bind(user.id).first();

    const likesCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM user_likes WHERE user_id = ?'
    ).bind(user.id).first();

    const historyCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM user_reading_history WHERE user_id = ?'
    ).bind(user.id).first();

    // Get total reading time
    const totalReadingTime = await c.env.DB.prepare(
      'SELECT SUM(reading_time) as total FROM user_reading_history WHERE user_id = ?'
    ).bind(user.id).first();

    return c.json({
      bookmarks: bookmarksCount?.count || 0,
      likes: likesCount?.count || 0,
      articles_read: historyCount?.count || 0,
      total_reading_time: totalReadingTime?.total || 0,
      member_since: user.created_at
    });
  } catch (error: any) {
    console.error("[USER] Get stats error:", error);
    return c.json({ error: "Failed to fetch user stats" }, 500);
  }
});

// ===== COMPREHENSIVE SEARCH =====

// Unified search across articles, keywords, categories, authors
app.get("/api/search", async (c) => {
  try {
    const query = c.req.query("q") || "";
    const type = c.req.query("type") || "all"; // all, articles, keywords, categories, authors
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = parseInt(c.req.query("offset") || "0");

    if (!query || query.length < 2) {
      return c.json({ error: "Search query must be at least 2 characters" }, 400);
    }

    const searchPattern = `%${query}%`;
    const results: any = {};

    // Search articles
    if (type === 'all' || type === 'articles') {
      const articlesResult = await c.env.DB.prepare(`
        SELECT a.id, a.title, a.slug, a.description, a.author, a.source,
               a.source_id, a.category_id, a.published_at, a.image_url
        FROM articles a
        WHERE a.status = 'published'
          AND (a.title LIKE ? OR a.description LIKE ? OR a.author LIKE ?)
        ORDER BY a.published_at DESC
        LIMIT ? OFFSET ?
      `).bind(searchPattern, searchPattern, searchPattern, limit, offset).all();

      results.articles = articlesResult.results || [];
    }

    // Search keywords
    if (type === 'all' || type === 'keywords') {
      const keywordsResult = await c.env.DB.prepare(`
        SELECT k.id, k.name, k.slug, COUNT(akl.article_id) as article_count
        FROM keywords k
        LEFT JOIN article_keyword_links akl ON k.id = akl.keyword_id
        WHERE k.name LIKE ?
        GROUP BY k.id
        ORDER BY article_count DESC
        LIMIT ?
      `).bind(searchPattern, limit).all();

      results.keywords = keywordsResult.results || [];
    }

    // Search categories
    if (type === 'all' || type === 'categories') {
      const categoriesResult = await c.env.DB.prepare(`
        SELECT id, name, emoji, color, description
        FROM categories
        WHERE enabled = TRUE AND (name LIKE ? OR description LIKE ?)
        ORDER BY name ASC
      `).bind(searchPattern, searchPattern).all();

      results.categories = categoriesResult.results || [];
    }

    // Search authors
    if (type === 'all' || type === 'authors') {
      const authorsResult = await c.env.DB.prepare(`
        SELECT DISTINCT author FROM articles
        WHERE author IS NOT NULL AND author != '' AND author LIKE ?
        ORDER BY author ASC
        LIMIT ?
      `).bind(searchPattern, limit).all();

      results.authors = authorsResult.results || [];
    }

    return c.json({
      query,
      type,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("[SEARCH] Search error:", error);
    return c.json({ error: "Search failed" }, 500);
  }
});

// Search articles by keyword
app.get("/api/search/by-keyword/:keyword", async (c) => {
  try {
    const keyword = c.req.param("keyword");
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = parseInt(c.req.query("offset") || "0");

    const articlesResult = await c.env.DB.prepare(`
      SELECT a.id, a.title, a.slug, a.description, a.author, a.source,
             a.source_id, a.category_id, a.published_at, a.image_url
      FROM articles a
      INNER JOIN article_keyword_links akl ON a.id = akl.article_id
      INNER JOIN keywords k ON akl.keyword_id = k.id
      WHERE a.status = 'published' AND k.slug = ?
      ORDER BY a.published_at DESC
      LIMIT ? OFFSET ?
    `).bind(keyword, limit, offset).all();

    const totalResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total
      FROM articles a
      INNER JOIN article_keyword_links akl ON a.id = akl.article_id
      INNER JOIN keywords k ON akl.keyword_id = k.id
      WHERE a.status = 'published' AND k.slug = ?
    `).bind(keyword).first();

    return c.json({
      keyword,
      articles: articlesResult.results || [],
      total: totalResult.total || 0,
      limit,
      offset
    });
  } catch (error: any) {
    console.error("[SEARCH] Keyword search error:", error);
    return c.json({ error: "Keyword search failed" }, 500);
  }
});

// Search articles by author
app.get("/api/search/by-author", async (c) => {
  try {
    const author = c.req.query("author") || "";
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = parseInt(c.req.query("offset") || "0");

    if (!author) {
      return c.json({ error: "Author parameter is required" }, 400);
    }

    const articlesResult = await c.env.DB.prepare(`
      SELECT id, title, slug, description, author, source, source_id,
             category_id, published_at, image_url
      FROM articles
      WHERE status = 'published' AND author = ?
      ORDER BY published_at DESC
      LIMIT ? OFFSET ?
    `).bind(author, limit, offset).all();

    const totalResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM articles
      WHERE status = 'published' AND author = ?
    `).bind(author).first();

    return c.json({
      author,
      articles: articlesResult.results || [],
      total: totalResult.total || 0,
      limit,
      offset
    });
  } catch (error: any) {
    console.error("[SEARCH] Author search error:", error);
    return c.json({ error: "Author search failed" }, 500);
  }
});

export default app;

// Export Durable Object classes for Cloudflare Workers (disabled for now)
// export {
//   ArticleInteractionsDO,
//   UserBehaviorDO,
//   RealtimeCountersDO,
//   RealtimeAnalyticsDO
// };
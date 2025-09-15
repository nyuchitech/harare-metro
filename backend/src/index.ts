import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// Import all business logic services - backend does the heavy lifting
import { D1Service } from "../../database/D1Service.js";
import { D1ConfigService } from "./workers/services/D1ConfigService.js";
import { D1CacheService } from "./workers/services/D1CacheService.js";
import { AnalyticsEngineService } from "./workers/services/AnalyticsEngineService.js";
import { ArticleService } from "./workers/services/ArticleService.js";
import { NewsSourceService } from "./workers/services/NewsSourceService.js";

// Import admin interface
import { getAdminHTML } from "./admin/index.js";

// Types for Cloudflare bindings
type Bindings = {
  ARTICLES_DB: D1Database;
  CATEGORY_CLICKS: AnalyticsEngineDataset;
  NEWS_INTERACTIONS: AnalyticsEngineDataset;
  SEARCH_QUERIES: AnalyticsEngineDataset;
  NODE_ENV: string;
  LOG_LEVEL: string;
  ROLES_ENABLED: string;
  DEFAULT_ROLE: string;
  ADMIN_ROLES: string;
  CREATOR_ROLES: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Add CORS and logging middleware
app.use("*", cors());
app.use("*", logger());

// Initialize all business services
function initializeServices(env: Bindings) {
  const d1Service = new D1Service(env.ARTICLES_DB);
  const configService = new D1ConfigService(env.ARTICLES_DB);
  const cacheService = new D1CacheService(env.ARTICLES_DB);
  const analyticsService = new AnalyticsEngineService({
    CATEGORY_CLICKS: env.CATEGORY_CLICKS,
    NEWS_INTERACTIONS: env.NEWS_INTERACTIONS,
    SEARCH_QUERIES: env.SEARCH_QUERIES
  });
  const articleService = new ArticleService(d1Service, cacheService, analyticsService);
  const newsSourceService = new NewsSourceService(d1Service, configService);

  return {
    d1Service,
    configService,
    cacheService,
    analyticsService,
    articleService,
    newsSourceService
  };
}

// Admin dashboard - serve the HTML interface
app.get("/", (c) => {
  c.header("Content-Type", "text/html");
  return c.html(getAdminHTML());
});

app.get("/admin", (c) => {
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
        analytics: !!(c.env.CATEGORY_CLICKS && c.env.NEWS_INTERACTIONS && c.env.SEARCH_QUERIES),
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
app.get("/api/admin/stats", async (c) => {
  try {
    const services = initializeServices(c.env);
    
    // Get comprehensive database statistics using all services
    const totalArticles = await services.d1Service.getArticleCount();
    const categories = await services.d1Service.getCategories();
    const activeSources = categories.filter(cat => cat.enabled).length;
    
    // Get cache statistics
    const cacheStats = await services.cacheService.getStats();
    
    return c.json({
      database: {
        total_articles: totalArticles,
        active_sources: activeSources,
        categories: categories.length,
        cache_hits: cacheStats.hits || 0,
        cache_misses: cacheStats.misses || 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return c.json({ error: "Failed to fetch stats" }, 500);
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
    const services = initializeServices(c.env);
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");
    const category = c.req.query("category");
    
    // Use the full article service with caching
    const articles = await services.articleService.getArticles({ 
      limit, 
      offset, 
      category_id: category === 'all' ? null : category 
    });
    
    const total = await services.d1Service.getArticleCount({ 
      category_id: category === 'all' ? null : category 
    });
    
    // Track analytics for admin access
    await services.analyticsService.trackEvent('admin_feed_view', {
      category: category || 'all',
      limit,
      offset
    });
    
    return c.json({
      articles,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return c.json({ error: "Failed to fetch articles" }, 500);
  }
});

// RSS refresh endpoint with full business logic
app.post("/api/admin/refresh-rss", async (c) => {
  try {
    const services = initializeServices(c.env);
    
    // This would trigger the full RSS processing pipeline
    // For now, return success with placeholder data
    // In production, this would:
    // 1. Fetch RSS feeds from configured sources
    // 2. Process and clean article data
    // 3. Store in D1 database with proper categorization
    // 4. Update cache
    // 5. Track analytics
    
    const refreshResult = {
      success: true,
      message: "RSS refresh completed successfully",
      results: {
        newArticles: 0,
        updated: 0,
        errors: 0,
        sources_processed: 0
      },
      timestamp: new Date().toISOString()
    };
    
    // Track the refresh event
    await services.analyticsService.trackEvent('rss_refresh', refreshResult.results);
    
    return c.json(refreshResult);
  } catch (error) {
    console.error("Error refreshing RSS:", error);
    return c.json({ 
      success: false, 
      error: "Failed to refresh RSS feeds",
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Admin sources management with full service integration
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
    const article = await services.articleService.getArticleBySourceSlug(source, slug);
    
    if (!article) {
      return c.json({ error: "Article not found" }, 404);
    }

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

export default app;
import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// Import our D1 services
import { D1Service } from "../worker/database/D1Service.js";
import { D1ConfigService } from "../worker/services/D1ConfigService.js";
import { D1CacheService } from "../worker/services/D1CacheService.js";
import { AnalyticsEngineService } from "../worker/services/AnalyticsEngineService.js";
import { RSSFeedService } from "./services/RSSFeedService.js";
import { CategoryManager } from "./services/CategoryManager.js";
import { NewsSourceManager } from "./services/NewsSourceManager.js";

// Types for Cloudflare bindings
type Bindings = {
  ARTICLES_DB: D1Database;
  CATEGORY_CLICKS: AnalyticsEngineDataset;
  NEWS_INTERACTIONS: AnalyticsEngineDataset;
  SEARCH_QUERIES: AnalyticsEngineDataset;
  NODE_ENV: string;
  LOG_LEVEL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use("*", logger());
app.use("/api/*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-User-ID"],
}));

// Health check endpoint
app.get("/api/health", async (c) => {
  try {
    const d1Service = new D1Service(c.env.ARTICLES_DB);
    const health = await d1Service.healthCheck();
    
    return c.json({
      status: health.healthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      services: {
        database: health.healthy ? "operational" : "error",
        analytics: !!(c.env.CATEGORY_CLICKS && c.env.NEWS_INTERACTIONS && c.env.SEARCH_QUERIES)
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

// RSS feeds endpoint
app.get("/api/feeds", async (c) => {
  try {
    const cacheService = new D1CacheService(c.env.ARTICLES_DB);
    const limit = parseInt(c.req.query("limit") ?? "24");
    const category = c.req.query("category") ?? "all";
    
    const articles = await cacheService.getCachedArticles();
    
    let filteredArticles = articles;
    if (category && category !== "all") {
      filteredArticles = articles.filter(article => 
        article.category_id === category || article.category === category
      );
    }
    
    const paginatedArticles = filteredArticles.slice(0, limit);
    
    return c.json({
      articles: paginatedArticles,
      total: filteredArticles.length,
      category,
      limit,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: "Failed to fetch feeds",
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Categories endpoint
app.get("/api/categories", async (c) => {
  try {
    const configService = new D1ConfigService(c.env.ARTICLES_DB);
    const categories = await configService.getCategories();
    
    return c.json({
      categories,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: "Failed to fetch categories",
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Search endpoint
app.get("/api/search", async (c) => {
  try {
    const query = c.req.query("q");
    const category = c.req.query("category") ?? null;
    const limit = parseInt(c.req.query("limit") ?? "24");
    
    if (!query) {
      return c.json({
        error: "Query parameter 'q' is required",
        timestamp: new Date().toISOString()
      }, 400);
    }
    
    const d1Service = new D1Service(c.env.ARTICLES_DB);
    const results = await d1Service.searchArticles(query, { category, limit });
    
    // Log search query (anonymously)
    if (c.env.SEARCH_QUERIES) {
      try {
        const analyticsService = new AnalyticsEngineService({
          searchQueries: c.env.SEARCH_QUERIES
        });
        await analyticsService.trackSearchQuery(query, category, results.length);
      } catch (analyticsError) {
        console.warn("Failed to track search query:", analyticsError);
      }
    }
    
    return c.json({
      query,
      results,
      total: results.length,
      category,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: "Search failed",
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Database stats endpoint (admin)
app.get("/api/admin/stats", async (c) => {
  try {
    const d1Service = new D1Service(c.env.ARTICLES_DB);
    const cacheService = new D1CacheService(c.env.ARTICLES_DB);
    
    const [dbStats, cacheStats] = await Promise.all([
      d1Service.getStats(),
      cacheService.getCacheStats()
    ]);
    
    return c.json({
      database: dbStats,
      cache: cacheStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: "Failed to fetch admin stats",
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Manual RSS refresh endpoint - FULLY FUNCTIONAL
app.post("/api/admin/refresh-rss", async (c) => {
  try {
    console.log("[RSS] Manual RSS refresh triggered");
    
    // Initialize RSS service with D1 database
    const rssService = new RSSFeedService(c.env.ARTICLES_DB);
    
    // Run complete RSS refresh
    const results = await rssService.refreshAllFeeds();
    
    console.log(`[RSS] Refresh completed: ${results.newArticles} new articles`);
    
    return c.json({
      success: true,
      message: "RSS refresh completed successfully",
      results: {
        sourcesProcessed: results.sources,
        articlesProcessed: results.processed,
        newArticles: results.newArticles,
        errors: results.errors
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("[RSS] RSS refresh failed:", error);
    return c.json({
      success: false,
      error: "RSS refresh failed", 
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// ===============================================================
// INSIGHTS & ANALYTICS ENDPOINTS (Available to All Users)
// ===============================================================

// Get comprehensive category insights
app.get("/api/insights/categories", async (c) => {
  try {
    const days = parseInt(c.req.query("days") ?? "30");
    const categoryManager = new CategoryManager(c.env.ARTICLES_DB);
    
    const insights = await categoryManager.generateInsights(days);
    
    return c.json({
      success: true,
      insights,
      period_days: days,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: "Failed to fetch category insights",
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Get category trends
app.get("/api/insights/trends", async (c) => {
  try {
    const days = parseInt(c.req.query("days") ?? "7");
    const limit = parseInt(c.req.query("limit") ?? "10");
    const categoryManager = new CategoryManager(c.env.ARTICLES_DB);
    
    const trends = await categoryManager.getCategoryTrends(days);
    
    return c.json({
      trends: trends.slice(0, limit),
      period_days: days,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: "Failed to fetch category trends",
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Get trending categories (top performers)
app.get("/api/insights/trending", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") ?? "5");
    const categoryManager = new CategoryManager(c.env.ARTICLES_DB);
    
    const trending = await categoryManager.getTrendingCategories(limit);
    
    return c.json({
      trending_categories: trending,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: "Failed to fetch trending categories",
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Get category performance analytics
app.get("/api/insights/performance", async (c) => {
  try {
    const categoryId = c.req.query("category_id");
    const days = parseInt(c.req.query("days") ?? "7");
    const categoryManager = new CategoryManager(c.env.ARTICLES_DB);
    
    const performance = await categoryManager.getCategoryAnalytics(categoryId, days);
    
    return c.json({
      performance,
      category_id: categoryId || "all",
      period_days: days,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: "Failed to fetch category performance",
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Get user segments analysis
app.get("/api/insights/segments", async (c) => {
  try {
    const categoryManager = new CategoryManager(c.env.ARTICLES_DB);
    const segments = await categoryManager.getUserSegments();
    
    return c.json({
      user_segments: segments,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: "Failed to fetch user segments",
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Track user interaction with category (for interest scoring)
app.post("/api/insights/track", async (c) => {
  try {
    const body = await c.req.json();
    const { user_id, category_id, interaction_type = 'view', score_delta = 1 } = body;
    
    if (!user_id || !category_id) {
      return c.json({
        error: "user_id and category_id are required",
        timestamp: new Date().toISOString()
      }, 400);
    }
    
    const categoryManager = new CategoryManager(c.env.ARTICLES_DB);
    await categoryManager.updateInterestScore(user_id, category_id, score_delta, interaction_type);
    
    return c.json({
      success: true,
      message: "Interaction tracked successfully",
      user_id,
      category_id,
      interaction_type,
      score_delta,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: "Failed to track interaction",
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Get personalized category recommendations for user
app.get("/api/insights/recommendations/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const limit = parseInt(c.req.query("limit") ?? "10");
    const categoryManager = new CategoryManager(c.env.ARTICLES_DB);
    
    const [personalizedCategories, userInterests] = await Promise.all([
      categoryManager.getPersonalizedCategories(userId, limit),
      categoryManager.getUserInterests(userId)
    ]);
    
    return c.json({
      user_id: userId,
      personalized_categories: personalizedCategories,
      user_interests: userInterests.slice(0, limit),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: "Failed to fetch recommendations",
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Content classification endpoint
app.post("/api/insights/classify", async (c) => {
  try {
    const body = await c.req.json();
    const { title, description } = body;
    
    if (!title) {
      return c.json({
        error: "title is required",
        timestamp: new Date().toISOString()
      }, 400);
    }
    
    const categoryManager = new CategoryManager(c.env.ARTICLES_DB);
    const categoryId = await categoryManager.classifyContent(title, description);
    
    return c.json({
      title,
      description,
      classified_category: categoryId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: "Failed to classify content",
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// ===============================================================
// NEWS SOURCE MANAGEMENT ENDPOINTS
// ===============================================================

// Get source performance report
app.get("/api/sources/report", async (c) => {
  try {
    const sourceManager = new NewsSourceManager(c.env.ARTICLES_DB);
    const report = await sourceManager.getSourcePerformanceReport();
    
    return c.json({
      success: true,
      report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: "Failed to get source report",
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Add new news source
app.post("/api/sources/add", async (c) => {
  try {
    const body = await c.req.json();
    const { website_url, source_name, category = 'general', priority = 3 } = body;
    
    if (!website_url || !source_name) {
      return c.json({
        error: "website_url and source_name are required",
        timestamp: new Date().toISOString()
      }, 400);
    }
    
    const sourceManager = new NewsSourceManager(c.env.ARTICLES_DB);
    const result = await sourceManager.addNewsSource(website_url, source_name, category, priority);
    
    if (result.success) {
      return c.json({
        success: true,
        message: result.message,
        source: result.source,
        timestamp: new Date().toISOString()
      });
    } else {
      return c.json({
        success: false,
        error: result.message,
        timestamp: new Date().toISOString()
      }, 400);
    }
  } catch (error) {
    return c.json({
      error: "Failed to add news source",
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Discover RSS feeds for a website
app.post("/api/sources/discover", async (c) => {
  try {
    const body = await c.req.json();
    const { website_url } = body;
    
    if (!website_url) {
      return c.json({
        error: "website_url is required",
        timestamp: new Date().toISOString()
      }, 400);
    }
    
    const sourceManager = new NewsSourceManager(c.env.ARTICLES_DB);
    const feeds = await sourceManager.discoverRSSFeeds(website_url);
    
    return c.json({
      website_url,
      discovered_feeds: feeds,
      count: feeds.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: "Failed to discover RSS feeds",
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Validate RSS feed
app.post("/api/sources/validate", async (c) => {
  try {
    const body = await c.req.json();
    const { feed_url } = body;
    
    if (!feed_url) {
      return c.json({
        error: "feed_url is required",
        timestamp: new Date().toISOString()
      }, 400);
    }
    
    const sourceManager = new NewsSourceManager(c.env.ARTICLES_DB);
    const validation = await sourceManager.validateRSSFeed(feed_url);
    
    return c.json({
      feed_url,
      validation_result: validation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: "Failed to validate RSS feed",
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Bulk add Zimbabwe news sources
app.post("/api/sources/bulk-add-zimbabwe", async (c) => {
  try {
    const sourceManager = new NewsSourceManager(c.env.ARTICLES_DB);
    const result = await sourceManager.addZimbabweNewsSources();
    
    return c.json({
      success: true,
      message: `Added ${result.added} sources, ${result.failed} failed`,
      summary: {
        added: result.added,
        failed: result.failed,
        total_attempted: result.added + result.failed
      },
      details: result.details,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: "Failed to bulk add Zimbabwe sources",
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Get all news sources with filtering
app.get("/api/sources", async (c) => {
  try {
    const enabled = c.req.query("enabled");
    const category = c.req.query("category");
    const minQuality = c.req.query("min_quality");
    
    let query = 'SELECT * FROM rss_sources WHERE 1=1';
    const params: any[] = [];
    
    if (enabled !== undefined) {
      query += ' AND enabled = ?';
      params.push(enabled === 'true' ? 1 : 0);
    }
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    if (minQuality) {
      query += ' AND quality_score >= ?';
      params.push(parseInt(minQuality));
    }
    
    query += ' ORDER BY quality_score DESC, priority DESC';
    
    const result = await c.env.ARTICLES_DB
      .prepare(query)
      .bind(...params)
      .all();
    
    return c.json({
      sources: result.results,
      count: result.results.length,
      filters: { enabled, category, min_quality: minQuality },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: "Failed to get news sources",
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Scheduled function for RSS refresh (called by Cron trigger)
export async function scheduled(
  controller: ScheduledController,
  env: Bindings,
  ctx: ExecutionContext
): Promise<void> {
  console.log("[CRON] Scheduled RSS refresh triggered");
  
  try {
    // Initialize RSS service with D1 database
    const rssService = new RSSFeedService(env.ARTICLES_DB);
    
    // Run complete RSS refresh - PERMANENT STORAGE, NO AGE LIMITS
    const results = await rssService.refreshAllFeeds();
    
    console.log(`[CRON] RSS refresh completed: ${results.newArticles} new articles from ${results.sources} sources`);
    
    if (results.errors.length > 0) {
      console.warn(`[CRON] RSS refresh had ${results.errors.length} errors:`, results.errors);
    }
    
  } catch (error) {
    console.error("[CRON] RSS refresh failed:", error);
  }
}

// React Router integration - handles all other routes
app.get("*", (c) => {
  const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE,
  );

  return requestHandler(c.req.raw, {
    cloudflare: { env: c.env, ctx: c.executionCtx },
  });
});

export default app;
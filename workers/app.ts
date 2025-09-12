import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// Import our D1 services
import { D1Service } from "../worker/database/D1Service.js";
import { D1ConfigService } from "../worker/services/D1ConfigService.js";
import { D1CacheService } from "../worker/services/D1CacheService.js";
import { AnalyticsEngineService } from "../worker/services/AnalyticsEngineService.js";

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

// Scheduled function for RSS refresh (called by Cron trigger)
export async function scheduled(
  controller: ScheduledController,
  env: Bindings,
  ctx: ExecutionContext
): Promise<void> {
  console.log("[CRON] Scheduled RSS refresh triggered");
  
  try {
    // For now, this is a placeholder - RSS refresh logic would go here
    // We'd need to port the RSS fetching logic from the old worker
    console.log("[CRON] RSS refresh completed (placeholder)");
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
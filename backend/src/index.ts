import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// Import services
import { D1Service } from "../worker/database/D1Service.js";
import { D1ConfigService } from "../worker/services/D1ConfigService.js";
import { D1CacheService } from "../worker/services/D1CacheService.js";
import { AnalyticsEngineService } from "../worker/services/AnalyticsEngineService.js";
import { RSSFeedService } from "../workers/services/RSSFeedService.js";
import { CategoryManager } from "../workers/services/CategoryManager.js";
import { NewsSourceManager } from "../workers/services/NewsSourceManager.js";

// Import admin interface
import { getAdminHTML } from "./admin/index.js";

// Import new services
import { CloudflareImagesService } from "./services/CloudflareImagesService.js";
import { AuthService } from "./services/AuthService.js";

// Types for Cloudflare bindings
type Bindings = {
  ARTICLES_DB: D1Database;
  CATEGORY_CLICKS: AnalyticsEngineDataset;
  NEWS_INTERACTIONS: AnalyticsEngineDataset;
  SEARCH_QUERIES: AnalyticsEngineDataset;
  IMAGES?: CloudflareImages;
  NODE_ENV: string;
  LOG_LEVEL: string;
  ADMIN_ROLES: string;
  // Secrets (configured via wrangler secret put)
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use("*", logger());

// Authentication middleware for admin routes
async function requireAdmin(c: any, next: any) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  const token = authHeader.substring(7);
  
  if (!c.env.SUPABASE_URL || !c.env.SUPABASE_SERVICE_KEY) {
    return c.json({ error: 'Supabase not configured' }, 500);
  }

  const authService = new AuthService(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_KEY,
    (c.env.ADMIN_ROLES || 'admin').split(',')
  );

  const user = await authService.verifyToken(token);
  
  if (!user || !authService.isAdmin(user)) {
    return c.json({ error: 'Admin access required' }, 403);
  }

  c.set('user', user);
  await next();
}

// CORS for frontend access
app.use("/api/*", cors({
  origin: ["https://www.hararemetro.co.zw", "http://localhost:5173"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-User-ID"],
}));

// ===============================================================
// USER MANAGEMENT ENDPOINTS (Admin Only)
// ===============================================================

// List users endpoint (admin only)
app.get("/api/admin/users", requireAdmin, async (c) => {
  try {
    if (!c.env.SUPABASE_URL || !c.env.SUPABASE_SERVICE_KEY) {
      return c.json({ error: 'Supabase not configured' }, 500);
    }

    const authService = new AuthService(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
      (c.env.ADMIN_ROLES || 'admin').split(',')
    );

    const users = await authService.listUsers();
    
    return c.json({
      users,
      total: users.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// Update user role endpoint (admin only)
app.patch("/api/admin/users/:userId/role", requireAdmin, async (c) => {
  try {
    const userId = c.req.param('userId');
    const { role } = await c.req.json();
    
    if (!role) {
      return c.json({ error: 'Role is required' }, 400);
    }

    if (!c.env.SUPABASE_URL || !c.env.SUPABASE_SERVICE_KEY) {
      return c.json({ error: 'Supabase not configured' }, 500);
    }

    const authService = new AuthService(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
      (c.env.ADMIN_ROLES || 'admin').split(',')
    );

    const result = await authService.updateUserRole(userId, role);
    
    if (result.success) {
      return c.json({
        success: true,
        user: result.user,
        message: 'User role updated successfully'
      });
    } else {
      return c.json({ error: result.error }, 400);
    }
  } catch (error) {
    return c.json({ error: 'Failed to update user role' }, 500);
  }
});

// ===============================================================
// ADMIN INTERFACE (Vanilla HTML/JS) - Protected
// ===============================================================

// Admin dashboard - redirect to login if not authenticated
app.get("/", (c) => {
  // Simple check for development - in production, implement proper auth check
  return c.html(getAdminHTML());
});

app.get("/admin", (c) => {
  return c.html(getAdminHTML());
});

app.get("/admin/*", (c) => {
  return c.html(getAdminHTML());
});

// ===============================================================
// PUBLIC API ENDPOINTS
// ===============================================================

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

// Enhanced image handling with Cloudflare Images
app.get("/api/image", async (c) => {
  try {
    const imageUrl = c.req.query("url");
    if (!imageUrl) {
      return c.json({ error: "URL parameter required" }, 400);
    }

    // Check if image is already from Cloudflare Images
    if (imageUrl.includes('imagedelivery.net')) {
      // Redirect to Cloudflare Images URL
      return c.redirect(imageUrl);
    }

    // For RSS images, try to use Cloudflare Images if available
    if (c.env.IMAGES && c.env.CLOUDFLARE_ACCOUNT_ID) {
      try {
        const imagesService = new CloudflareImagesService(
          c.env.IMAGES,
          c.env.CLOUDFLARE_ACCOUNT_ID
        );

        const optimizedUrl = await imagesService.processRssImage(imageUrl, 'proxy-request');
        
        if (optimizedUrl && optimizedUrl !== imageUrl) {
          return c.redirect(optimizedUrl);
        }
      } catch (error) {
        console.warn('Cloudflare Images processing failed, falling back to proxy:', error);
      }
    }

    // Fallback to image proxy
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Harare Metro News Bot/1.0',
        'Accept': 'image/*'
      }
    });

    if (!response.ok) {
      return c.json({ error: "Failed to fetch image" }, response.status);
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400', // 24 hours
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return c.json({ error: "Image handling failed" }, 500);
  }
});

// Upload image endpoint (admin only)
app.post("/api/admin/upload-image", requireAdmin, async (c) => {
  try {
    if (!c.env.IMAGES || !c.env.CLOUDFLARE_ACCOUNT_ID) {
      return c.json({ error: 'Cloudflare Images not configured' }, 500);
    }

    const { imageUrl, metadata } = await c.req.json();
    
    if (!imageUrl) {
      return c.json({ error: 'Image URL required' }, 400);
    }

    const imagesService = new CloudflareImagesService(
      c.env.IMAGES,
      c.env.CLOUDFLARE_ACCOUNT_ID
    );

    const result = await imagesService.uploadFromUrl(imageUrl, metadata);
    
    if (result.success) {
      const variants = imagesService.getImageVariants(result.result.id);
      return c.json({
        success: true,
        image: result.result,
        variants
      });
    } else {
      return c.json({ error: result.errors?.join(', ') || 'Upload failed' }, 400);
    }
  } catch (error) {
    return c.json({ error: 'Image upload failed' }, 500);
  }
});

// Manual RSS refresh endpoint (admin only)
app.post("/api/admin/refresh-rss", requireAdmin, async (c) => {
  try {
    console.log("[RSS] Manual RSS refresh triggered");
    
    // Create images service if available
    let imagesService;
    if (c.env.IMAGES && c.env.CLOUDFLARE_ACCOUNT_ID) {
      imagesService = new CloudflareImagesService(c.env.IMAGES, c.env.CLOUDFLARE_ACCOUNT_ID);
    }
    
    const rssService = new RSSFeedService(c.env.ARTICLES_DB, imagesService);
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

// Database stats endpoint (admin only)
app.get("/api/admin/stats", requireAdmin, async (c) => {
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

// ===============================================================
// SCHEDULED FUNCTION FOR RSS REFRESH
// ===============================================================

export async function scheduled(
  controller: ScheduledController,
  env: Bindings,
  ctx: ExecutionContext
): Promise<void> {
  console.log("[CRON] Scheduled RSS refresh triggered");
  
  try {
    // Create images service if available
    let imagesService;
    if (env.IMAGES && env.CLOUDFLARE_ACCOUNT_ID) {
      imagesService = new CloudflareImagesService(env.IMAGES, env.CLOUDFLARE_ACCOUNT_ID);
    }
    
    const rssService = new RSSFeedService(env.ARTICLES_DB, imagesService);
    const results = await rssService.refreshAllFeeds();
    
    console.log(`[CRON] RSS refresh completed: ${results.newArticles} new articles from ${results.sources} sources`);
    
    if (results.errors.length > 0) {
      console.warn(`[CRON] RSS refresh had ${results.errors.length} errors:`, results.errors);
    }
    
  } catch (error) {
    console.error("[CRON] RSS refresh failed:", error);
  }
}

export default app;
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// Import services
import { D1Service } from "../../database/D1Service.js";
import { D1ConfigService } from "../workers/services/D1ConfigService.js";
import { D1CacheService } from "../workers/services/D1CacheService.js";
import { AnalyticsEngineService } from "../workers/services/AnalyticsEngineService.js";
// import { RSSFeedService } from "../workers/services/RSSFeedService.js";
// import { NewsSourceService } from "../workers/services/NewsSourceService.js";

// Import admin interface
import { getAdminHTML } from "./admin/index.js";

// Import new services
import { CloudflareImagesService } from "./services/CloudflareImagesService.js";
import { AuthService } from "./services/AuthService.js";

// Types for Cloudflare bindings
interface CloudflareImages {
  upload: (file: any) => Promise<any>;
  delete: (id: string) => Promise<any>;
  list: () => Promise<any>;
}

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
      error: error instanceof Error ? error.message : "Unknown error",
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
      filteredArticles = articles.filter((article: any) => 
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
      message: error instanceof Error ? error.message : "Unknown error",
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
      message: error instanceof Error ? error.message : "Unknown error",
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
        await analyticsService.trackSearch(query, category);
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
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Article by source and slug endpoint
app.get("/api/article/by-source-slug", async (c) => {
  try {
    const source = c.req.query("source");
    const slug = c.req.query("slug");
    
    if (!source || !slug) {
      return c.json({
        error: "Both 'source' and 'slug' parameters are required",
        timestamp: new Date().toISOString()
      }, 400);
    }
    
    const d1Service = new D1Service(c.env.ARTICLES_DB);
    const article = await d1Service.getArticleBySourceSlug(source, slug);
    
    if (!article) {
      return c.json({
        error: "Article not found",
        timestamp: new Date().toISOString()
      }, 404);
    }
    
    return c.json({
      article,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: "Failed to fetch article",
      message: error instanceof Error ? error.message : "Unknown error",
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
      return c.json({ error: "Failed to fetch image" }, response.status as any);
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
      const variants = imagesService.getImageVariants(result.result?.id || "");
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
    
    const rssService = new RSSFeedService(c.env.ARTICLES_DB);
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
      message: error instanceof Error ? error.message : "Unknown error",
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
      message: error instanceof Error ? error.message : "Unknown error",
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
    
    const rssService = new RSSFeedService(env.ARTICLES_DB);
    const results = await rssService.refreshAllFeeds();
    
    console.log(`[CRON] RSS refresh completed: ${results.newArticles} new articles from ${results.sources} sources`);
    
    if (results.errors.length > 0) {
      console.warn(`[CRON] RSS refresh had ${results.errors.length} errors:`, results.errors);
    }
    
  } catch (error) {
    console.error("[CRON] RSS refresh failed:", error);
  }
}

// Dynamic PWA manifest endpoint
app.get("/api/manifest.json", async (c) => {
  try {
    const d1Service = new D1Service(c.env.ARTICLES_DB);
    const categories = await d1Service.getCategories();
    
    const shortcuts = categories
      .filter(cat => cat.id !== 'all' && cat.enabled)
      .slice(0, 4) // PWA spec recommends max 4 shortcuts
      .map(category => ({
        name: `${category.emoji || '📰'} ${category.name}`,
        url: `/?category=${category.id}`,
        description: `Browse ${category.name.toLowerCase()} news`
      }));

    const manifest = {
      name: "Harare Metro - Zimbabwe News",
      short_name: "Harare Metro",
      description: "Zimbabwe's premier news aggregation platform with real-time updates",
      start_url: "/",
      display: "standalone",
      background_color: "#00A651",
      theme_color: "#00A651",
      orientation: "portrait-primary",
      scope: "/",
      lang: "en",
      dir: "ltr",
      categories: ["news", "africa", "zimbabwe"],
      icons: [
        {
          src: "/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: "/android-chrome-512x512.png", 
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: "/apple-touch-icon.png",
          sizes: "180x180",
          type: "image/png",
          purpose: "any"
        },
        {
          src: "/favicon-32x32.png",
          sizes: "32x32", 
          type: "image/png",
          purpose: "any"
        },
        {
          src: "/favicon-16x16.png",
          sizes: "16x16",
          type: "image/png", 
          purpose: "any"
        }
      ],
      shortcuts,
      screenshots: [
        {
          src: "/og-image.png",
          sizes: "1200x630",
          type: "image/png",
          form_factor: "wide",
          label: "Harare Metro News Homepage"
        }
      ],
      related_applications: [],
      prefer_related_applications: false,
      edge_side_panel: {
        preferred_width: 400
      }
    };

    // Set proper cache headers
    c.header('Content-Type', 'application/manifest+json');
    c.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    return c.json(manifest);
  } catch (error) {
    return c.json({
      error: "Failed to generate manifest",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Dynamic categories endpoint for service worker
app.get("/api/categories", async (c) => {
  try {
    const d1Service = new D1Service(c.env.ARTICLES_DB);
    const categories = await d1Service.getCategories();
    
    // Set cache headers for service worker consumption
    c.header('Content-Type', 'application/json');
    c.header('Cache-Control', 'public, max-age=1800'); // Cache for 30 minutes
    
    return c.json({
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name, 
        emoji: cat.emoji || '📰',
        enabled: cat.enabled
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: "Failed to fetch categories",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, 500);
  }
});

export default app;
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createRequestHandler } from "react-router";

// Import only database service for basic SSR data needs
// @ts-ignore - D1Service is a JS file
import { D1Service } from "../database/D1Service.js";

// Types for Cloudflare bindings
type Bindings = {
  DB: D1Database;
  CATEGORY_CLICKS: AnalyticsEngineDataset;
  NEWS_INTERACTIONS: AnalyticsEngineDataset;
  SEARCH_QUERIES: AnalyticsEngineDataset;
  NODE_ENV: string;
  LOG_LEVEL: string;
  BACKEND_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Add CORS and logging middleware
app.use("*", cors());
app.use("*", logger());

// Simple health check
app.get("/api/health", async (c) => {
  try {
    const d1Service = new D1Service(c.env.DB);
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
  } catch (error: any) {
    return c.json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Simple feeds endpoint - just fetch from database, no complex services
app.get("/api/feeds", async (c) => {
  try {
    const d1Service = new D1Service(c.env.DB);
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = parseInt(c.req.query("offset") || "0");
    const category = c.req.query("category");
    const source = c.req.query("source");

    const articles = await d1Service.getArticles({ 
      limit, 
      offset, 
      category: category === 'all' ? null : category
    });
    
    // @ts-ignore - D1Service method signature
    const total = await d1Service.getArticleCount({
      category_id: category === 'all' ? null : category,
      source_id: source
    });

    return c.json({
      articles,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    });
  } catch (error: any) {
    console.error("Error fetching feeds:", error);
    return c.json({ error: "Failed to fetch feeds" }, 500);
  }
});

// Simple categories endpoint - just fetch from database
app.get("/api/categories", async (c) => {
  try {
    const d1Service = new D1Service(c.env.DB);
    const categories = await d1Service.getCategories();
    
    return c.json({
      categories: categories.filter((cat: any) => cat.enabled)
    });
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return c.json({ error: "Failed to fetch categories" }, 500);
  }
});

// Simple article by source/slug endpoint
app.get("/api/article/by-source-slug", async (c) => {
  const source = c.req.query("source");
  const slug = c.req.query("slug");
  
  if (!source || !slug) {
    return c.json({ error: "Source and slug are required" }, 400);
  }

  try {
    const d1Service = new D1Service(c.env.DB);
    const article = await d1Service.getArticleBySourceSlug(source, slug);
    
    if (!article) {
      return c.json({ error: "Article not found" }, 404);
    }

    return c.json({ article });
  } catch (error: any) {
    console.error("Error fetching article:", error);
    return c.json({ error: "Failed to fetch article" }, 500);
  }
});

// Dynamic PWA manifest endpoint
app.get("/api/manifest.json", async (c) => {
  try {
    const d1Service = new D1Service(c.env.DB);
    const categories = await d1Service.getCategories();
    
    const shortcuts = categories
      .filter((cat: any) => cat.id !== 'all' && cat.enabled)
      .slice(0, 4) // PWA spec recommends max 4 shortcuts
      .map((category: any) => ({
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
    return c.json(manifest);
  } catch (error: any) {
    console.error("Error generating manifest:", error);
    return c.json({ error: "Failed to generate manifest" }, 500);
  }
});

// React Router SSR handler - handle all other routes
app.get("*", async (c) => {
  try {
    const requestHandler = createRequestHandler(
      () => import("virtual:react-router/server-build"),
      import.meta.env.MODE || "production",
    );

    return await requestHandler(c.req.raw, {
      cloudflare: {
        env: c.env,
        ctx: c.executionCtx
      }
    });
  } catch (error: any) {
    console.error("React Router error:", error);
    return c.text("Internal Server Error", 500);
  }
});

// Export worker with both fetch and scheduled handlers
export default {
  fetch: app.fetch,

  // Scheduled handler for cron triggers (runs hourly)
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    const startTime = Date.now();
    const triggerTime = new Date().toISOString();
    let cronLogId: number | null = null;

    try {
      console.log('[CRON] Scheduled RSS refresh triggered at', triggerTime);
      console.log('[CRON] Cron schedule:', event.cron);

      // Log cron start to database
      try {
        const logResult = await env.DB.prepare(`
          INSERT INTO cron_logs (cron_type, status, trigger_time, metadata)
          VALUES (?, ?, ?, ?)
        `).bind(
          'rss_refresh',
          'started',
          triggerTime,
          JSON.stringify({ schedule: event.cron })
        ).run();
        cronLogId = logResult.meta.last_row_id;
      } catch (dbError) {
        console.warn('[CRON] Failed to log cron start to database:', dbError);
      }

      // Get backend URL from environment (defaults to production)
      const backendUrl = env.BACKEND_URL || 'https://admin.hararemetro.co.zw';
      const refreshEndpoint = `${backendUrl}/api/refresh-rss`;

      console.log('[CRON] Calling backend refresh endpoint:', refreshEndpoint);

      // Call backend RSS refresh endpoint
      const response = await fetch(refreshEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Harare-Metro-Cron/1.0'
        }
      });

      const duration = Date.now() - startTime;
      const completedAt = new Date().toISOString();

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[CRON] Backend refresh failed:', response.status, errorText);
        console.error('[CRON] Duration:', duration, 'ms');

        // Log cron failure to database
        if (cronLogId) {
          try {
            await env.DB.prepare(`
              UPDATE cron_logs
              SET status = ?, completed_at = ?, duration_ms = ?, error_message = ?
              WHERE id = ?
            `).bind('error', completedAt, duration, `HTTP ${response.status}: ${errorText}`, cronLogId).run();
          } catch (dbError) {
            console.warn('[CRON] Failed to update cron log:', dbError);
          }
        }
        return;
      }

      const result = await response.json() as {
        results?: {
          processed?: number;
          newArticles?: number;
          sources?: number;
          errors?: any[];
        };
      };

      console.log('[CRON] RSS refresh completed successfully');
      console.log('[CRON] Duration:', duration, 'ms');
      console.log('[CRON] Result:', JSON.stringify(result, null, 2));

      // Log cron success to database
      if (cronLogId) {
        try {
          await env.DB.prepare(`
            UPDATE cron_logs
            SET status = ?, completed_at = ?, duration_ms = ?,
                articles_processed = ?, articles_new = ?,
                sources_processed = ?, sources_failed = ?
            WHERE id = ?
          `).bind(
            'success',
            completedAt,
            duration,
            result.results?.processed || 0,
            result.results?.newArticles || 0,
            result.results?.sources || 0,
            result.results?.errors?.length || 0,
            cronLogId
          ).run();
        } catch (dbError) {
          console.warn('[CRON] Failed to update cron log:', dbError);
        }
      }

      // Track success in analytics if available
      if (env.NEWS_INTERACTIONS) {
        try {
          env.NEWS_INTERACTIONS.writeDataPoint({
            blobs: [
              'scheduled_rss_refresh',
              'success',
              event.cron
            ],
            doubles: [
              duration,
              result.results?.newArticles || 0
            ],
            indexes: [
              'cron_trigger'
            ]
          });
        } catch (analyticsError) {
          console.error('[CRON] Analytics tracking failed:', analyticsError);
        }
      }

    } catch (error: any) {
      const duration = Date.now() - startTime;
      const completedAt = new Date().toISOString();
      console.error('[CRON] Scheduled event handler failed:', error);
      console.error('[CRON] Error message:', error.message);
      console.error('[CRON] Duration:', duration, 'ms');

      // Log cron error to database
      if (cronLogId) {
        try {
          await env.DB.prepare(`
            UPDATE cron_logs
            SET status = ?, completed_at = ?, duration_ms = ?,
                error_message = ?, error_stack = ?
            WHERE id = ?
          `).bind(
            'error',
            completedAt,
            duration,
            error.message || 'Unknown error',
            error.stack || '',
            cronLogId
          ).run();
        } catch (dbError) {
          console.warn('[CRON] Failed to update cron log:', dbError);
        }
      }

      // Track failure in analytics if available
      if (env.NEWS_INTERACTIONS) {
        try {
          env.NEWS_INTERACTIONS.writeDataPoint({
            blobs: [
              'scheduled_rss_refresh',
              'error',
              error.message || 'unknown_error'
            ],
            doubles: [
              duration
            ],
            indexes: [
              'cron_trigger'
            ]
          });
        } catch (analyticsError) {
          console.error('[CRON] Analytics tracking failed:', analyticsError);
        }
      }
    }
  }
};

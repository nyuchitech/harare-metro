import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// Import the React Router build
import * as build from "../build/server/index.js";

// Import only database service for basic SSR data needs
import { D1Service } from "../database/D1Service.js";

// Types for Cloudflare bindings
type Bindings = {
  DB: D1Database;
  CATEGORY_CLICKS: AnalyticsEngineDataset;
  NEWS_INTERACTIONS: AnalyticsEngineDataset;
  SEARCH_QUERIES: AnalyticsEngineDataset;
  NODE_ENV: string;
  LOG_LEVEL: string;
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
  } catch (error) {
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
      category_id: category === 'all' ? null : category,
      source_id: source 
    });
    
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
  } catch (error) {
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
      categories: categories.filter(cat => cat.enabled)
    });
  } catch (error) {
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
    const d1Service = new D1Service(c.env.ARTICLES_DB);
    const article = await d1Service.getArticleBySourceSlug(source, slug);
    
    if (!article) {
      return c.json({ error: "Article not found" }, 404);
    }

    return c.json({ article });
  } catch (error) {
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
    return c.json(manifest);
  } catch (error) {
    console.error("Error generating manifest:", error);
    return c.json({ error: "Failed to generate manifest" }, 500);
  }
});

// React Router SSR handler - handle all other routes
app.use("*", createRequestHandler({
  getLoadContext: (c) => ({
    env: c.env,
    // Only pass essential context, not services
    d1: c.env.DB
  })
}));

export default app;
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// Import only essential services
import { D1Service } from "../../database/D1Service.js";

// Import admin interface
import { getAdminHTML } from "./admin/index.js";

// Types for Cloudflare bindings
type Bindings = {
  ARTICLES_DB: D1Database;
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

// Admin dashboard - serve the HTML interface
app.get("/", (c) => {
  c.header("Content-Type", "text/html");
  return c.html(getAdminHTML());
});

app.get("/admin", (c) => {
  c.header("Content-Type", "text/html");
  return c.html(getAdminHTML());
});

// Health check endpoint
app.get("/api/health", async (c) => {
  try {
    const d1Service = new D1Service(c.env.ARTICLES_DB);
    const health = await d1Service.healthCheck();
    
    return c.json({
      status: health.healthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      services: {
        database: health.healthy ? "operational" : "error"
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

// Admin stats endpoint
app.get("/api/admin/stats", async (c) => {
  try {
    const d1Service = new D1Service(c.env.ARTICLES_DB);
    
    // Get basic database statistics
    const totalArticles = await d1Service.getArticleCount();
    const categories = await d1Service.getCategories();
    const activeSources = categories.filter(cat => cat.enabled).length;
    
    return c.json({
      database: {
        total_articles: totalArticles,
        active_sources: activeSources,
        size: 0 // Placeholder - D1 doesn't expose size easily
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return c.json({ error: "Failed to fetch stats" }, 500);
  }
});

// Admin categories endpoint
app.get("/api/categories", async (c) => {
  try {
    const d1Service = new D1Service(c.env.ARTICLES_DB);
    const categories = await d1Service.getCategories();
    
    return c.json({
      categories: categories
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return c.json({ error: "Failed to fetch categories" }, 500);
  }
});

// Admin articles endpoint 
app.get("/api/feeds", async (c) => {
  try {
    const d1Service = new D1Service(c.env.ARTICLES_DB);
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");
    
    const articles = await d1Service.getArticles({ limit, offset });
    const total = await d1Service.getArticleCount();
    
    return c.json({
      articles,
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return c.json({ error: "Failed to fetch articles" }, 500);
  }
});

// Simple RSS refresh endpoint - placeholder
app.post("/api/admin/refresh-rss", async (c) => {
  // For now, just return a placeholder response
  // In the future, this could trigger the frontend worker's cron job or call external RSS services
  return c.json({
    success: true,
    message: "RSS refresh functionality to be implemented",
    results: {
      newArticles: 0,
      updated: 0,
      errors: 0
    }
  });
});

// Admin sources endpoint - placeholder  
app.get("/api/admin/sources", async (c) => {
  try {
    const d1Service = new D1Service(c.env.ARTICLES_DB);
    const categories = await d1Service.getCategories();
    
    // Transform categories into "sources" for admin display
    const sources = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      url: `RSS feed for ${cat.name}`,
      status: cat.enabled ? "active" : "inactive",
      last_fetch: new Date().toISOString(),
      articles: 0 // Placeholder
    }));
    
    return c.json({ sources });
  } catch (error) {
    console.error("Error fetching sources:", error);
    return c.json({ error: "Failed to fetch sources" }, 500);
  }
});

export default app;
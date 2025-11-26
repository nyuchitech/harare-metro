/**
 * Harare Metro - Single Worker Architecture
 * Mobile-First News Aggregation Platform
 *
 * Routes:
 * - /                    → React Router SSR (mobile-first public site)
 * - /admin/*             → Admin panel (desktop only, requires admin role)
 * - /api/auth/*          → Authentication endpoints
 * - /api/admin/*         → Admin API endpoints
 * - /api/*               → Public API endpoints
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createRequestHandler } from "react-router";

// Core services
import { D1Service } from "../database/D1Service.js";
import { PasswordHashingService } from "./services/PasswordHashingService.js";
import { RateLimitService } from "./services/RateLimitService.js";

// Admin UI
import { getAdminHTML, getLoginHTML } from "./admin/index.js";

const app = new Hono();

// ======================
// MIDDLEWARE
// ======================

// CORS - Allow mobile browsers
app.use("*", cors({
  origin: (origin) => {
    if (origin?.includes('localhost')) return origin;
    if (origin === 'https://www.hararemetro.co.zw') return origin;
    return 'https://www.hararemetro.co.zw';
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposeHeaders: ['Set-Cookie'],
}));

// Logging
app.use("*", logger());

// Security headers
app.use("*", async (c, next) => {
  await next();

  const isProduction = c.env.NODE_ENV === 'production';

  if (isProduction) {
    c.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
});

// ======================
// HELPER FUNCTIONS
// ======================

function getCookie(cookieHeader, name) {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : undefined;
}

function setAuthCookie(c, token) {
  const isProduction = c.env.NODE_ENV === 'production';
  const maxAge = 7 * 24 * 60 * 60; // 7 days

  const cookieOptions = [
    `auth_token=${token}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${maxAge}`,
  ];

  if (isProduction) {
    cookieOptions.push('Secure');
  }

  c.header('Set-Cookie', cookieOptions.join('; '));
}

function clearAuthCookie(c) {
  c.header('Set-Cookie', 'auth_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
}

async function logAuditEvent(db, eventType, resource, resourceId, userId, metadata = {}) {
  try {
    await db.prepare(`
      INSERT INTO audit_log (event_type, resource_type, resource_id, user_id, ip_address, user_agent, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      eventType,
      resource,
      resourceId,
      userId,
      metadata.ip || null,
      metadata.userAgent || null,
      JSON.stringify(metadata)
    ).run();
  } catch (error) {
    console.error('[AUDIT] Failed to log event:', error);
  }
}

// ======================
// AUTHENTICATION ROUTES
// ======================

// POST /api/auth/register - User registration
app.post("/api/auth/register", async (c) => {
  try {
    const { email, password, displayName, username } = await c.req.json();
    const clientIP = c.req.header('cf-connecting-ip') || 'unknown';

    // Validate required fields
    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    // Rate limiting - 3 registrations per hour per IP
    const rateLimitService = new RateLimitService(c.env.AUTH_STORAGE);
    const isRateLimited = await rateLimitService.checkRateLimit(`register:${clientIP}`, 3, 3600);

    if (isRateLimited) {
      await logAuditEvent(c.env.DB, 'registration_rate_limited', 'auth', email, null, { ip: clientIP });
      return c.json({ error: "Too many registration attempts. Please try again later." }, 429);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: "Invalid email format" }, 400);
    }

    // Validate password strength
    if (password.length < 8) {
      return c.json({ error: "Password must be at least 8 characters long" }, 400);
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return c.json({ error: "Password must contain at least one letter and one number" }, 400);
    }

    // Validate username if provided
    if (username) {
      if (username.length < 3 || username.length > 30) {
        return c.json({ error: "Username must be 3-30 characters" }, 400);
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return c.json({ error: "Username can only contain letters, numbers, underscores and hyphens" }, 400);
      }
    }

    // Check if email exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existingUser) {
      await logAuditEvent(c.env.DB, 'registration_failed', 'auth', email, null, {
        reason: 'email_exists',
        ip: clientIP
      });
      return c.json({ error: "Email already registered" }, 400);
    }

    // Check if username exists
    if (username) {
      const existingUsername = await c.env.DB.prepare(
        'SELECT id FROM users WHERE username = ?'
      ).bind(username).first();

      if (existingUsername) {
        await logAuditEvent(c.env.DB, 'registration_failed', 'auth', email, null, {
          reason: 'username_taken',
          ip: clientIP
        });
        return c.json({ error: "Username already taken" }, 400);
      }
    }

    // Hash password (uses SHA-256 with salt from PasswordHashingService)
    const passwordHash = await PasswordHashingService.hashPassword(password);

    // Generate username if not provided
    const finalUsername = username || email.split('@')[0] + Math.floor(Math.random() * 1000);

    // Create user in D1
    const result = await c.env.DB.prepare(`
      INSERT INTO users (email, username, display_name, password_hash, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      email,
      finalUsername,
      displayName || finalUsername,
      passwordHash,
      c.env.DEFAULT_ROLE || 'creator',
      'active'
    ).run();

    const userId = result.meta.last_row_id.toString();

    // Log successful registration
    await logAuditEvent(c.env.DB, 'registration_success', 'user', userId, userId, { ip: clientIP });

    // Return user data
    return c.json({
      user: {
        id: userId,
        email,
        username: finalUsername,
        displayName: displayName || finalUsername,
        role: c.env.DEFAULT_ROLE || 'creator'
      }
    }, 201);

  } catch (error) {
    console.error('[AUTH] Registration error:', error);
    return c.json({ error: "Registration failed" }, 500);
  }
});

// POST /api/auth/login - User login
app.post("/api/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    const clientIP = c.req.header('cf-connecting-ip') || 'unknown';

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    // Rate limiting - 5 login attempts per 15 minutes
    const rateLimitService = new RateLimitService(c.env.AUTH_STORAGE);
    const isRateLimited = await rateLimitService.checkRateLimit(`login:${clientIP}`, 5, 900);

    if (isRateLimited) {
      await logAuditEvent(c.env.DB, 'login_rate_limited', 'auth', email, null, { ip: clientIP });
      return c.json({ error: "Too many login attempts. Please try again later." }, 429);
    }

    // Get user from D1
    const user = await c.env.DB.prepare(
      'SELECT id, email, username, display_name, password_hash, role, status FROM users WHERE email = ?'
    ).bind(email).first();

    if (!user) {
      await logAuditEvent(c.env.DB, 'login_failed', 'auth', email, null, {
        reason: 'user_not_found',
        ip: clientIP
      });
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Check account status
    if (user.status !== 'active') {
      await logAuditEvent(c.env.DB, 'login_failed', 'auth', email, user.id, {
        reason: 'account_inactive',
        status: user.status,
        ip: clientIP
      });
      return c.json({ error: "Account is not active" }, 403);
    }

    // Verify password
    const isValid = await PasswordHashingService.verifyPassword(password, user.password_hash);

    if (!isValid) {
      await logAuditEvent(c.env.DB, 'login_failed', 'auth', email, user.id, {
        reason: 'invalid_password',
        ip: clientIP
      });
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Generate session token
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store session in KV
    const session = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      loginAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    await c.env.AUTH_STORAGE.put(
      `session:${sessionToken}`,
      JSON.stringify(session),
      { expirationTtl: 7 * 24 * 60 * 60 }
    );

    // Set auth cookie
    setAuthCookie(c, sessionToken);

    // Log successful login
    await logAuditEvent(c.env.DB, 'login_success', 'auth', email, user.id, { ip: clientIP });

    return c.json({
      session: { access_token: sessionToken },
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('[AUTH] Login error:', error);
    return c.json({ error: "Login failed" }, 500);
  }
});

// GET /api/auth/session - Check session validity
app.get("/api/auth/session", async (c) => {
  try {
    const authToken = getCookie(c.req.header('cookie'), 'auth_token') ||
                     c.req.header('authorization')?.replace('Bearer ', '');

    if (!authToken) {
      return c.json({ error: "No session" }, 401);
    }

    // Get session from KV
    const sessionData = await c.env.AUTH_STORAGE.get(`session:${authToken}`);

    if (!sessionData) {
      return c.json({ error: "Invalid session" }, 401);
    }

    const session = JSON.parse(sessionData);

    // Check expiry
    if (new Date(session.expiresAt) < new Date()) {
      await c.env.AUTH_STORAGE.delete(`session:${authToken}`);
      return c.json({ error: "Session expired" }, 401);
    }

    // Get fresh user data
    const user = await c.env.DB.prepare(
      'SELECT id, email, username, display_name, role, status FROM users WHERE id = ?'
    ).bind(session.userId).first();

    if (!user || user.status !== 'active') {
      return c.json({ error: "User not found or inactive" }, 401);
    }

    return c.json({
      session: { access_token: authToken },
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('[AUTH] Session check error:', error);
    return c.json({ error: "Session check failed" }, 500);
  }
});

// POST /api/auth/logout - Logout
app.post("/api/auth/logout", async (c) => {
  try {
    const authToken = getCookie(c.req.header('cookie'), 'auth_token');

    if (authToken) {
      await c.env.AUTH_STORAGE.delete(`session:${authToken}`);
    }

    clearAuthCookie(c);
    return c.json({ success: true });

  } catch (error) {
    console.error('[AUTH] Logout error:', error);
    return c.json({ error: "Logout failed" }, 500);
  }
});

// ======================
// AI ENDPOINTS
// ======================

// POST /api/pulse/generate - Generate Pulse AI summary for an article (admin only)
app.post("/api/pulse/generate", async (c) => {
  try {
    // Check authentication
    const authToken = getCookie(c.req.header('cookie'), 'auth_token');
    if (!authToken) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const sessionData = await c.env.AUTH_STORAGE.get(`session:${authToken}`);
    if (!sessionData) {
      return c.json({ error: "Invalid session" }, 401);
    }

    const session = JSON.parse(sessionData);

    // Check admin role
    const adminRoles = (c.env.ADMIN_ROLES || 'admin,super_admin,moderator').split(',');
    if (!adminRoles.includes(session.role)) {
      return c.json({ error: "Admin access required" }, 403);
    }

    const { articleId } = await c.req.json();
    if (!articleId) {
      return c.json({ error: "Article ID is required" }, 400);
    }

    // Get article from database
    const db = new D1Service(c.env.DB);
    const article = await db.get(`
      SELECT id, title, content, description
      FROM articles
      WHERE id = ?
    `, [articleId]);

    if (!article) {
      return c.json({ error: "Article not found" }, 404);
    }

    // Import DeepseekAIService
    const { DeepseekAIService } = await import('./services/DeepseekAIService.js');
    const deepseekService = new DeepseekAIService(c.env);

    // Generate Pulse summary
    const pulseSummary = await deepseekService.generatePulseSummary(article);

    if (!pulseSummary) {
      return c.json({ error: "Failed to generate Pulse summary" }, 500);
    }

    // Update article with Pulse summary
    await db.execute(`
      UPDATE articles
      SET pulse_summary = ?
      WHERE id = ?
    `, [pulseSummary, articleId]);

    return c.json({
      success: true,
      articleId,
      pulseSummary
    });

  } catch (error) {
    console.error('[PULSE] Error generating summary:', error);
    return c.json({ error: "Failed to generate Pulse summary" }, 500);
  }
});

// POST /api/pulse/batch - Generate Pulse summaries for multiple articles (admin only)
app.post("/api/pulse/batch", async (c) => {
  try {
    // Check authentication
    const authToken = getCookie(c.req.header('cookie'), 'auth_token');
    if (!authToken) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const sessionData = await c.env.AUTH_STORAGE.get(`session:${authToken}`);
    if (!sessionData) {
      return c.json({ error: "Invalid session" }, 401);
    }

    const session = JSON.parse(sessionData);

    // Check admin role
    const adminRoles = (c.env.ADMIN_ROLES || 'admin,super_admin,moderator').split(',');
    if (!adminRoles.includes(session.role)) {
      return c.json({ error: "Admin access required" }, 403);
    }

    const { limit = 50 } = await c.req.json();

    // Get articles without Pulse summaries
    const db = new D1Service(c.env.DB);
    const articles = await db.all(`
      SELECT id, title, content, description
      FROM articles
      WHERE pulse_summary IS NULL
      ORDER BY published_at DESC
      LIMIT ?
    `, [limit]);

    if (!articles || articles.length === 0) {
      return c.json({
        success: true,
        processed: 0,
        message: "No articles need Pulse summaries"
      });
    }

    // Import DeepseekAIService
    const { DeepseekAIService } = await import('./services/DeepseekAIService.js');
    const deepseekService = new DeepseekAIService(c.env);

    let processed = 0;
    let failed = 0;

    // Process articles sequentially to avoid rate limits
    for (const article of articles) {
      try {
        const pulseSummary = await deepseekService.generatePulseSummary(article);

        if (pulseSummary) {
          await db.execute(`
            UPDATE articles
            SET pulse_summary = ?
            WHERE id = ?
          `, [pulseSummary, article.id]);
          processed++;
        } else {
          failed++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`[PULSE] Error processing article ${article.id}:`, error);
        failed++;
      }
    }

    return c.json({
      success: true,
      processed,
      failed,
      total: articles.length
    });

  } catch (error) {
    console.error('[PULSE] Batch processing error:', error);
    return c.json({ error: "Failed to batch process Pulse summaries" }, 500);
  }
});

// ======================
// ADMIN MIDDLEWARE
// ======================

async function requireAdmin(c, next) {
  const authToken = getCookie(c.req.header('cookie'), 'auth_token');

  if (!authToken) {
    return c.redirect('/admin/login');
  }

  const sessionData = await c.env.AUTH_STORAGE.get(`session:${authToken}`);

  if (!sessionData) {
    return c.redirect('/admin/login');
  }

  const session = JSON.parse(sessionData);

  // Check expiry
  if (new Date(session.expiresAt) < new Date()) {
    await c.env.AUTH_STORAGE.delete(`session:${authToken}`);
    return c.redirect('/admin/login');
  }

  // Check admin role
  const adminRoles = (c.env.ADMIN_ROLES || 'admin,super_admin,moderator').split(',');
  if (!adminRoles.includes(session.role)) {
    return c.text('Forbidden: Admin access required', 403);
  }

  // Store user in context
  c.set('user', session);
  await next();
}

// ======================
// ADMIN ROUTES
// ======================

app.get("/admin/login", async (c) => {
  return c.html(getLoginHTML());
});

app.get("/admin", requireAdmin, async (c) => {
  const user = c.get('user');
  return c.html(getAdminHTML(user));
});

// ======================
// PUBLIC API ROUTES
// ======================

app.get("/api/health", async (c) => {
  try {
    const d1Service = new D1Service(c.env.DB);
    const health = await d1Service.healthCheck();

    return c.json({
      status: health.healthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      services: {
        database: health.healthy ? "operational" : "error",
        auth: !!c.env.AUTH_STORAGE,
        analytics: !!c.env.NEWS_INTERACTIONS
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

app.get("/api/feeds", async (c) => {
  try {
    const d1Service = new D1Service(c.env.DB);
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = parseInt(c.req.query("offset") || "0");
    const category = c.req.query("category");

    const articles = await d1Service.getArticles({
      limit,
      offset,
      category: category === 'all' ? null : category
    });

    const total = await d1Service.getArticleCount({
      category_id: category === 'all' ? null : category
    });

    const todayCount = await d1Service.getArticleCount({
      category_id: category === 'all' ? null : category,
      today: true
    });

    return c.json({
      articles,
      total,
      todayCount,
      limit,
      offset,
      hasMore: offset + limit < total
    });
  } catch (error) {
    console.error("Error fetching feeds:", error);
    return c.json({ error: "Failed to fetch feeds" }, 500);
  }
});

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
  } catch (error) {
    console.error("Error fetching article:", error);
    return c.json({ error: "Failed to fetch article" }, 500);
  }
});

app.get("/api/manifest.json", async (c) => {
  try {
    const d1Service = new D1Service(c.env.DB);
    const categories = await d1Service.getCategories();

    const shortcuts = categories
      .filter(cat => cat.id !== 'all' && cat.enabled)
      .slice(0, 4)
      .map(category => ({
        name: `${category.emoji || '📰'} ${category.name}`,
        url: `/?category=${category.id}`,
        description: `Browse ${category.name.toLowerCase()} news`
      }));

    const manifest = {
      name: "Harare Metro",
      short_name: "Harare Metro",
      description: "Zimbabwe's Premier News Aggregation Platform - Mobile First",
      start_url: "/",
      display: "standalone",
      background_color: "#000000",
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
    c.header("Cache-Control", "public, max-age=3600");
    return c.json(manifest);
  } catch (error) {
    console.error("Error generating manifest:", error);
    return c.json({ error: "Failed to generate manifest" }, 500);
  }
});

// ======================
// REACT ROUTER SSR
// Mobile-first rendering
// ======================

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
  } catch (error) {
    console.error("React Router error:", error);
    return c.text("Internal Server Error", 500);
  }
});

// ======================
// EXPORT WORKER
// ======================

export default {
  fetch: app.fetch,

  // Scheduled handler for RSS refresh (runs hourly)
  async scheduled(event, env, ctx) {
    console.log('[CRON] RSS refresh triggered');
    // TODO: Implement RSS refresh using services
  }
};

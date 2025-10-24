/**
 * Harare Metro - Account Worker
 *
 * Account management and authentication worker for Harare Metro.
 * Handles all user-related operations, authentication, and sessions.
 *
 * Routes:
 * - account.hararemetro.co.zw
 *
 * Database:
 * - USERS_DB: hararemetro_users_db (users, profiles, sessions, notifications)
 * - CONTENT_DB: hararemetro_db (read-only access for articles, categories)
 *
 * KV Storage:
 * - AUTH_SESSIONS: Session storage
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// Type definitions for Cloudflare bindings
type Bindings = {
  USERS_DB: D1Database;
  CONTENT_DB: D1Database;
  AUTH_SESSIONS: KVNamespace;
  NODE_ENV: string;
  LOG_LEVEL: string;
  JWT_SECRET: string;
  SESSION_TTL_DAYS: string;
  ADMIN_WORKER_URL: string;
  FRONTEND_WORKER_URL: string;
};

// Initialize Hono app
const app = new Hono<{ Bindings: Bindings }>();

// =============================================================================
// MIDDLEWARE
// =============================================================================

// CORS configuration
app.use("/*", cors({
  origin: [
    "https://www.hararemetro.co.zw",
    "https://admin.hararemetro.co.zw",
    "https://account.hararemetro.co.zw",
  ],
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// Logger middleware
app.use("*", logger());

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get("/api/health", async (c) => {
  try {
    // Check USERS_DB connection
    const usersDbCheck = await c.env.USERS_DB.prepare("SELECT 1").first();

    // Check CONTENT_DB connection
    const contentDbCheck = await c.env.CONTENT_DB.prepare("SELECT 1").first();

    // Check KV namespace
    const kvCheck = await c.env.AUTH_SESSIONS.get("health_check_test");

    return c.json({
      status: "healthy",
      worker: "account",
      timestamp: new Date().toISOString(),
      databases: {
        users_db: usersDbCheck ? "connected" : "error",
        content_db: contentDbCheck ? "connected" : "error",
      },
      kv: {
        auth_sessions: "connected",
      },
    });
  } catch (error: any) {
    console.error("[ACCOUNT] Health check failed:", error);
    return c.json(
      {
        status: "unhealthy",
        worker: "account",
        error: error.message,
      },
      500
    );
  }
});

// =============================================================================
// AUTHENTICATION ENDPOINTS
// =============================================================================

/**
 * POST /api/auth/register
 * Register a new user account
 */
app.post("/api/auth/register", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, display_name } = body;

    // Validation
    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    // TODO: Implement registration logic with AuthService
    return c.json({
      message: "Registration endpoint - implementation pending",
      email,
      display_name,
    });
  } catch (error: any) {
    console.error("[AUTH] Registration error:", error);
    return c.json({ error: "Registration failed" }, 500);
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
app.post("/api/auth/login", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    // TODO: Implement login logic with AuthService
    return c.json({
      message: "Login endpoint - implementation pending",
      email,
    });
  } catch (error: any) {
    console.error("[AUTH] Login error:", error);
    return c.json({ error: "Login failed" }, 500);
  }
});

/**
 * POST /api/auth/logout
 * Logout and invalidate session
 */
app.post("/api/auth/logout", async (c) => {
  try {
    // TODO: Implement logout logic with AuthService
    return c.json({
      message: "Logout endpoint - implementation pending",
    });
  } catch (error: any) {
    console.error("[AUTH] Logout error:", error);
    return c.json({ error: "Logout failed" }, 500);
  }
});

/**
 * GET /api/auth/session
 * Get current session information
 */
app.get("/api/auth/session", async (c) => {
  try {
    // TODO: Implement session validation with AuthService
    return c.json({
      message: "Session endpoint - implementation pending",
    });
  } catch (error: any) {
    console.error("[AUTH] Session check error:", error);
    return c.json({ error: "Session check failed" }, 500);
  }
});

// =============================================================================
// USER PROFILE ENDPOINTS
// =============================================================================

/**
 * GET /api/user/me/profile
 * Get current user's profile
 */
app.get("/api/user/me/profile", async (c) => {
  try {
    // TODO: Implement with UserService
    return c.json({
      message: "Get profile endpoint - implementation pending",
    });
  } catch (error: any) {
    console.error("[USER] Get profile error:", error);
    return c.json({ error: "Failed to get profile" }, 500);
  }
});

/**
 * PUT /api/user/me/profile
 * Update current user's profile
 */
app.put("/api/user/me/profile", async (c) => {
  try {
    const body = await c.req.json();

    // TODO: Implement with UserService
    return c.json({
      message: "Update profile endpoint - implementation pending",
      updates: body,
    });
  } catch (error: any) {
    console.error("[USER] Update profile error:", error);
    return c.json({ error: "Failed to update profile" }, 500);
  }
});

/**
 * GET /api/user/me/history
 * Get user's reading history
 */
app.get("/api/user/me/history", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");

    // TODO: Implement with UserService
    return c.json({
      message: "Get history endpoint - implementation pending",
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("[USER] Get history error:", error);
    return c.json({ error: "Failed to get history" }, 500);
  }
});

/**
 * GET /api/user/me/analytics
 * Get user's personal analytics
 */
app.get("/api/user/me/analytics", async (c) => {
  try {
    // TODO: Implement with UserService
    return c.json({
      message: "Get analytics endpoint - implementation pending",
    });
  } catch (error: any) {
    console.error("[USER] Get analytics error:", error);
    return c.json({ error: "Failed to get analytics" }, 500);
  }
});

/**
 * GET /api/user/me/feed
 * Get personalized feed for user
 */
app.get("/api/user/me/feed", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = parseInt(c.req.query("offset") || "0");

    // TODO: Implement with UserService (algorithm-based feed)
    return c.json({
      message: "Get personalized feed endpoint - implementation pending",
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("[USER] Get feed error:", error);
    return c.json({ error: "Failed to get feed" }, 500);
  }
});

/**
 * GET /api/user/me/notifications
 * Get user's notifications
 */
app.get("/api/user/me/notifications", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") || "20");
    const unread_only = c.req.query("unread_only") === "true";

    // TODO: Implement with NotificationService
    return c.json({
      message: "Get notifications endpoint - implementation pending",
      limit,
      unread_only,
    });
  } catch (error: any) {
    console.error("[USER] Get notifications error:", error);
    return c.json({ error: "Failed to get notifications" }, 500);
  }
});

/**
 * PUT /api/user/me/notifications/:id/read
 * Mark notification as read
 */
app.put("/api/user/me/notifications/:id/read", async (c) => {
  try {
    const notificationId = c.req.param("id");

    // TODO: Implement with NotificationService
    return c.json({
      message: "Mark notification as read endpoint - implementation pending",
      notification_id: notificationId,
    });
  } catch (error: any) {
    console.error("[USER] Mark notification read error:", error);
    return c.json({ error: "Failed to mark notification as read" }, 500);
  }
});

// =============================================================================
// HTML PAGES
// =============================================================================

/**
 * GET /login
 * Login page
 */
app.get("/login", async (c) => {
  // TODO: Serve login.html
  return c.html(`
    <html>
      <body>
        <h1>Login Page - Implementation Pending</h1>
        <p>This will serve the login.html page</p>
      </body>
    </html>
  `);
});

/**
 * GET /register
 * Registration page
 */
app.get("/register", async (c) => {
  // TODO: Serve register.html
  return c.html(`
    <html>
      <body>
        <h1>Register Page - Implementation Pending</h1>
        <p>This will serve the register.html page</p>
      </body>
    </html>
  `);
});

/**
 * GET /profile
 * User profile page
 */
app.get("/profile", async (c) => {
  // TODO: Serve profile.html
  return c.html(`
    <html>
      <body>
        <h1>Profile Page - Implementation Pending</h1>
        <p>This will serve the profile.html page</p>
      </body>
    </html>
  `);
});

/**
 * GET /
 * Account dashboard home
 */
app.get("/", async (c) => {
  return c.html(`
    <html>
      <head>
        <title>Harare Metro - Account</title>
      </head>
      <body>
        <h1>Harare Metro - Account Worker</h1>
        <p>Account management and authentication for Harare Metro</p>
        <ul>
          <li><a href="/login">Login</a></li>
          <li><a href="/register">Register</a></li>
          <li><a href="/profile">Profile</a></li>
        </ul>
      </body>
    </html>
  `);
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});

app.onError((err, c) => {
  console.error("[ACCOUNT] Error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

// =============================================================================
// EXPORT
// =============================================================================

export default app;

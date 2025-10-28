# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Workflow - CRITICAL

**ALWAYS follow these steps before making ANY changes:**

1. **Pull from main first**: `git checkout main && git pull origin main`
2. **Review documentation**: Read CLAUDE.md, PROJECT-STATUS.md, CODE-REVIEW.md, and any PHASE-*-PLAN.md files
3. **Code review**: Review the current state of the codebase on main branch
4. **Check project status**: Verify what phase we're in and what's complete
5. **Plan changes**: Understand what needs to be added or fixed
6. **Apply changes**: Make your changes on a feature branch
7. **Update documentation**: Keep CLAUDE.md and PROJECT-STATUS.md in sync with code changes

**Never skip these steps**. Always ensure you're working from the latest main branch and understand the full context before making changes.

## Development Commands

### Development Environment
- `npm run dev` - Start React Router dev server with Vite
- `npm run dev:backend` - Start backend worker dev server (in backend directory)
- `cd account && npm run dev` - Start account worker dev server
- `npm run preview` - Preview production build locally

### Build and Deployment
- `npm run build` - Build React Router frontend application
- `npm run deploy` - Deploy frontend worker to www.hararemetro.co.zw
- `npm run deploy:backend` - Deploy backend worker to admin.hararemetro.co.zw
- `cd account && npm run deploy` - Deploy account worker to account.hararemetro.co.zw
- `npm run deploy:all` - Deploy both frontend and backend workers (NOTE: account worker deployed separately)
- `npm run typecheck` - Run TypeScript type checking

### Testing and Utilities
- `npm run test` - Run build as test (no automated tests configured)
- `npm run cf-typegen` - Generate Cloudflare Worker types from wrangler.jsonc
- `npm run clean` - Clean build artifacts and caches
- `npm run validate` - Run typecheck and build

## Architecture Overview

### Core Platform
**Harare Metro** is a modern news aggregation platform built with a **3-worker architecture**:

- **Frontend Worker** (www.hararemetro.co.zw): React Router 7 SSR application with minimal API endpoints
- **Backend Worker** (admin.hararemetro.co.zw): Comprehensive admin panel and RSS processing engine
- **Account Worker** (account.hararemetro.co.zw): User authentication and account management (NEW in Phase 3a)
- **Databases**: Cloudflare D1 (two databases: content and users)
- **Analytics**: Cloudflare Analytics Engine for user interaction tracking
- **AI Processing**: Cloudflare Workers AI for content enhancement and author recognition
- **Deployment**: Three separate Cloudflare Workers on custom domains

### Key Technologies
- **Frontend Framework**: React 19 with React Router 7 (SSR-enabled)
- **Build Tool**: Vite with Cloudflare plugin
- **Backend Framework**: Hono (lightweight web framework for Cloudflare Workers)
- **UI Framework**: Tailwind CSS 4.x with custom Zimbabwe flag color palette
- **Icons**: Lucide React
- **RSS Processing**: fast-xml-parser for feed parsing
- **AI Services**: Cloudflare Workers AI for author extraction and content classification
- **Database**: Cloudflare D1 (SQLite-based edge database)
- **TypeScript**: Full type safety across both workers

### 3-Worker Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  www.hararemetro.co.zw                      │
│              Frontend Worker (workers/app.ts)                │
│  • React Router 7 SSR                                       │
│  • Basic API endpoints (/api/feeds, /api/categories)        │
│  • Static asset serving                                      │
│  • Scheduled cron handler (calls backend for RSS refresh)   │
│  • PWA manifest generation                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    Hourly Cron Trigger
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                admin.hararemetro.co.zw                      │
│              Backend Worker (backend/index.ts)               │
│  • Admin dashboard UI (admin only)                          │
│  • RSS feed processing with AI pipeline                     │
│  • Author recognition and profile generation                │
│  • Content quality scoring                                   │
│  • News source management                                    │
│  • Analytics and insights                                    │
│  • Category and keyword management                           │
│  • User engagement APIs (likes, saves, comments, follows)   │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    Two D1 Databases
                              ↓
┌─────────────────────────────────────────────────────────────┐
│          Cloudflare D1 Database (hararemetro_db)            │
│                  Content Database                            │
│  • Articles, categories, news sources                        │
│  • Authors, keywords, article relationships                  │
│  • System configuration                                      │
│  • Analytics and processing logs                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│       Cloudflare D1 Database (hararemetro_users_db)         │
│                    Users Database                            │
│  • Users, authentication, sessions                           │
│  • User profiles and preferences                             │
│  • Reading history and bookmarks                             │
│  • Notifications                                             │
│  • User follows (sources, authors, categories)               │
└─────────────────────────────────────────────────────────────┘
                              ↑
                              │
┌─────────────────────────────────────────────────────────────┐
│              account.hararemetro.co.zw                      │
│              Account Worker (account/index.ts)               │
│  • User authentication (JWT-based)                          │
│  • Registration and login                                    │
│  • User profile management                                   │
│  • Reading history tracking                                  │
│  • Personal analytics (reading streaks, favorites)           │
│  • Personalized feed algorithm                               │
│  • Notifications system                                      │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
/harare-metro                    # Monorepo root (frontend)
├── workers/
│   ├── app.ts                   # ✅ Frontend worker entry point (Hono + React Router SSR)
│   ├── app-old.ts              # Legacy worker (not used)
│   ├── index.js                # Legacy worker (not used)
│   ├── index-d1.js             # Legacy worker (not used)
│   ├── api.js                  # Legacy API file (not used)
│   └── utils/
│       └── logger.js           # Shared logging utility
│
├── app/                        # React Router 7 application
│   ├── root.tsx                # Root layout
│   ├── routes/                 # Route components
│   └── components/             # React components
│
├── database/
│   ├── D1Service.js            # D1 database service (shared)
│   └── schema.sql              # Database schema
│
├── backend/                    # ✅ Backend worker (separate deployment)
│   ├── index.ts                # Backend worker entry point (Hono app)
│   ├── wrangler.jsonc          # Backend worker configuration
│   ├── package.json            # Backend dependencies
│   ├── admin/
│   │   └── index.js            # Admin dashboard HTML
│   ├── services/               # ✅ All business logic services
│   │   ├── RSSFeedService.ts            # RSS feed fetching and parsing
│   │   ├── ArticleService.ts            # Article CRUD operations
│   │   ├── ArticleAIService.ts          # AI content processing
│   │   ├── AuthorProfileService.ts      # Author recognition and profiles
│   │   ├── NewsSourceManager.ts         # News source management
│   │   ├── ContentProcessingPipeline.ts # AI processing pipeline
│   │   ├── D1ConfigService.ts           # Configuration management
│   │   ├── D1CacheService.ts            # D1-based caching
│   │   ├── AnalyticsEngineService.ts    # Analytics tracking
│   │   ├── CategoryManager.ts           # Category management
│   │   ├── AuthService.ts               # Authentication
│   │   └── ObservabilityService.ts      # Logging and monitoring
│   └── durable-objects/         # Durable Objects (disabled for now)
│       ├── ArticleInteractionsDO.ts
│       ├── UserBehaviorDO.ts
│       └── RealtimeAnalyticsDO.ts
│
├── account/                    # ✅ Account worker (NEW - separate deployment)
│   ├── index.ts                # Account worker entry point (Hono app)
│   ├── wrangler.jsonc          # Account worker configuration
│   ├── package.json            # Account dependencies
│   ├── tsconfig.json           # TypeScript configuration
│   ├── services/               # ✅ Account services
│   │   ├── AuthService.ts      # JWT authentication (Web Crypto API)
│   │   ├── UserService.ts      # Profile, history, analytics, personalized feed
│   │   └── NotificationService.ts  # User notifications
│   └── pages/                  # HTML pages
│       ├── login.html          # Login page
│       ├── register.html       # Registration page
│       └── profile.html        # User profile dashboard
│
├── wrangler.jsonc              # ✅ Frontend worker configuration
├── package.json                # Frontend dependencies
└── guides/                     # Documentation
```

### Data Flow Architecture

**RSS Feed Processing Flow:**

```
1. Cron Trigger (Every hour: 0 * * * *)
   ↓
2. Frontend Worker (workers/app.ts)
   - scheduled() handler triggered
   ↓
3. HTTP POST to Backend
   - https://admin.hararemetro.co.zw/api/refresh-rss
   ↓
4. Backend Worker (backend/index.ts)
   - Calls RSSFeedService.initialBulkPull()
   ↓
5. RSS Processing Pipeline
   - Fetch feeds from Zimbabwe news sources
   - Parse XML with fast-xml-parser
   ↓
6. AI Processing Pipeline (ContentProcessingPipeline)
   - Author extraction and recognition
   - Content cleaning (remove image URLs, noise)
   - Keyword classification (256-keyword taxonomy)
   - Quality scoring
   - Category assignment
   ↓
7. D1 Database Storage
   - Insert/update articles
   - Link authors to articles
   - Update statistics
   ↓
8. Response to Frontend Worker
   - Success/failure status
   - Article counts
   - Processing time
   ↓
9. Analytics Tracking
   - Log cron execution in Analytics Engine
```

**User Request Flow:**

```
1. User visits www.hararemetro.co.zw
   ↓
2. Frontend Worker (workers/app.ts)
   - React Router SSR renders HTML
   - Hydrates React application
   ↓
3. Client-side data fetching
   - GET /api/feeds (from frontend worker)
   ↓
4. Frontend Worker reads from D1
   - Direct database query
   - Returns articles JSON
   ↓
5. React hydrates and displays articles
```

**Admin Dashboard Flow:**

```
1. Admin visits admin.hararemetro.co.zw
   ↓
2. Backend Worker (backend/index.ts)
   - Serves admin dashboard HTML
   ↓
3. Admin actions (manual refresh, source management, etc.)
   - POST /api/refresh-rss
   - GET /api/admin/stats
   - PUT /api/admin/rss-source/:id
   ↓
4. Backend services process requests
   - RSSFeedService, NewsSourceManager, etc.
   ↓
5. D1 database operations
   ↓
6. Analytics tracking
```

### Database Architecture

**Single D1 Database (hararemetro_db):**

Binding name: `DB` (used by both workers)

Key tables:
- `articles` - News articles with full content
- `categories` - Article categories (politics, business, sports, etc.)
- `news_sources` - Zimbabwe news outlets (RSS feed URLs)
- `authors` - Journalist profiles (auto-extracted)
- `keywords` - Content classification keywords
- `article_authors` - Many-to-many article-author relationships
- `article_keywords` - Many-to-many article-keyword relationships
- `system_config` - Platform configuration
- `users` - User accounts and authentication
- `user_preferences` - User settings
- `daily_source_stats` - RSS fetch statistics
- `ai_processing_log` - AI pipeline execution logs

**No KV Storage** - All caching and storage uses D1 database.

**No Supabase** - All authentication and user data in D1.

### Cloudflare Configuration

**Frontend Worker (wrangler.jsonc):**
```jsonc
{
  "name": "harare-metro-frontend",
  "main": "./workers/app.ts",
  "routes": ["www.hararemetro.co.zw/*"],
  "d1_databases": [
    { "binding": "DB", "database_name": "hararemetro_db" }
  ],
  "analytics_engine_datasets": [
    { "binding": "CATEGORY_CLICKS", "dataset": "category_clicks" },
    { "binding": "NEWS_INTERACTIONS", "dataset": "news_interactions" },
    { "binding": "SEARCH_QUERIES", "dataset": "search_queries" }
  ],
  "triggers": {
    "crons": ["0 * * * *"]  // Hourly RSS refresh
  }
}
```

**Backend Worker (backend/wrangler.jsonc):**
```jsonc
{
  "name": "harare-metro-backend",
  "main": "./index.ts",
  "routes": ["admin.hararemetro.co.zw/*"],
  "d1_databases": [
    { "binding": "DB", "database_name": "hararemetro_db" }
  ],
  "analytics_engine_datasets": [
    { "binding": "NEWS_ANALYTICS", "dataset": "news_analytics" },
    { "binding": "SEARCH_ANALYTICS", "dataset": "search_analytics" },
    { "binding": "CATEGORY_ANALYTICS", "dataset": "category_analytics" },
    { "binding": "USER_ANALYTICS", "dataset": "user_analytics" },
    { "binding": "PERFORMANCE_ANALYTICS", "dataset": "performance_analytics" }
  ],
  "ai": { "binding": "AI" },
  "vectorize": [
    { "binding": "VECTORIZE_INDEX", "index_name": "harare-metro-articles" }
  ],
  "kv_namespaces": [
    { "binding": "AUTH_STORAGE", "id": "..." }
  ]
}
```

**Environment Variables:**
- `NODE_ENV`: "production"
- `BACKEND_URL`: "https://admin.hararemetro.co.zw"
- `LOG_LEVEL`: "info"
- `ROLES_ENABLED`: "true"
- `DEFAULT_ROLE`: "creator"

### Cron Job Implementation

**Frontend Worker Scheduled Handler (workers/app.ts:200-287):**

```typescript
export default {
  fetch: app.fetch,

  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    // Calls backend RSS refresh endpoint
    const backendUrl = env.BACKEND_URL || 'https://admin.hararemetro.co.zw';
    const response = await fetch(`${backendUrl}/api/refresh-rss`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    // Logs results and tracks analytics
  }
};
```

**Trigger:** Every hour at minute 0 (0 * * * *)

**Flow:**
1. Cloudflare triggers scheduled event on frontend worker
2. Frontend worker's scheduled() handler executes
3. Makes HTTP POST to backend worker's refresh endpoint
4. Backend worker processes RSS feeds through AI pipeline
5. Results tracked in Analytics Engine

## Design System & Branding

### Typography System
**IMPORTANT**: The application uses a dual-font system for optimal readability and brand consistency:

- **Headings** (h1-h6): Georgia serif font (matches logo aesthetic)
  ```css
  font-family: Georgia, 'Times New Roman', serif;
  ```
- **Body Text** (p, span, div, buttons, inputs): Inter sans-serif for maximum readability
  ```css
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  ```

### Zimbabwe Flag Color Palette
**CRITICAL**: All UI elements must use Zimbabwe flag colors consistently:

```css
:root {
  --zw-green: 140 100% 32%;   /* #00A651 - Growth, prosperity, agriculture */
  --zw-yellow: 48 98% 54%;    /* #FDD116 - Mineral wealth, sunshine */
  --zw-red: 354 85% 57%;      /* #EF3340 - Heritage, struggle, passion */
  --zw-black: 0 0% 0%;        /* #000000 - African heritage, strength */
  --zw-white: 0 0% 100%;      /* #FFFFFF - Peace, unity, progress */
}
```

### Color Usage Guidelines
- **Green (#00A651)**: Primary buttons, success states, growth metrics, positive indicators
- **Yellow (#FDD116)**: Warnings, highlights, featured content, accent elements
- **Red (#EF3340)**: Error states, urgent actions, critical information, destructive actions
- **Black (#000000)**: Primary backgrounds (dark mode), strong contrast text
- **White (#FFFFFF)**: Primary text on dark backgrounds, button text, highlights

### Brand Element: Zimbabwe Flag Strip
**ALWAYS PRESENT**: The Zimbabwe flag strip is a core brand element:

```css
.zimbabwe-flag-strip {
  position: fixed;
  top: 0;
  left: 0;
  width: 8px;
  height: 100vh;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  background: linear-gradient(to bottom,
    hsl(var(--zw-green)) 0% 20%,
    hsl(var(--zw-yellow)) 20% 40%,
    hsl(var(--zw-red)) 40% 60%,
    hsl(var(--zw-black)) 60% 80%,
    hsl(var(--zw-white)) 80% 100%
  );
}
```

### Mobile-First Design Patterns

**TikTok-like Experience**: The UI is designed for modern mobile users with:

1. **Full-screen modals** with backdrop blur
2. **Touch-friendly elements** (minimum 44px touch targets)
3. **Rounded corners everywhere** (typically `rounded-2xl` or `rounded-full`)
4. **Clean card designs** with subtle shadows and borders
5. **Smooth animations** and transitions
6. **Bottom navigation** for primary actions
7. **Pull-to-refresh** patterns where applicable

## Development Guidelines

### Frontend Worker Development (workers/app.ts)

**Purpose:** Minimal SSR worker with basic API endpoints

**Responsibilities:**
- Serve React Router SSR application
- Provide basic API endpoints (`/api/feeds`, `/api/categories`, `/api/health`)
- Handle cron triggers (call backend for RSS refresh)
- Generate PWA manifest

**DO NOT:**
- Add complex business logic
- Add RSS processing code
- Add AI processing
- Query database excessively

**Database Access:**
- Use `D1Service` for simple queries only
- Keep queries fast and efficient
- Prefer reading cached data

### Backend Worker Development (backend/index.ts)

**Purpose:** Comprehensive admin panel and RSS processing engine

**Responsibilities:**
- Admin dashboard serving
- RSS feed fetching and processing
- AI content enhancement pipeline
- Author recognition and profile generation
- News source management
- Analytics and insights
- Bulk operations

**Services Architecture:**
All business logic should be in `backend/services/`:

- `RSSFeedService.ts` - RSS fetching and parsing
- `ArticleService.ts` - Article CRUD
- `ArticleAIService.ts` - AI processing (Workers AI)
- `ContentProcessingPipeline.ts` - Full AI pipeline orchestration
- `AuthorProfileService.ts` - Author recognition
- `NewsSourceManager.ts` - Source management
- `D1ConfigService.ts` - Configuration
- `D1CacheService.ts` - Caching layer
- `AnalyticsEngineService.ts` - Analytics tracking

### Code Conventions

**TypeScript:**
- All new code should use TypeScript
- Use proper types from `worker-configuration.d.ts`
- Avoid `any` types where possible
- Use `@ts-ignore` only when absolutely necessary (with comments)

**Imports:**
```typescript
// External packages first
import { Hono } from "hono";
import { cors } from "hono/cors";

// Internal services
import { D1Service } from "../database/D1Service.js";
import { RSSFeedService } from "./services/RSSFeedService.js";

// Types
type Bindings = { ... };
```

**Error Handling:**
```typescript
try {
  // Operation
} catch (error: any) {
  console.error('[CONTEXT] Error message:', error);
  return c.json({ error: "User-friendly message" }, 500);
}
```

**Logging Conventions:**
- Use `[CRON]` prefix for cron-related logs
- Use `[API]` prefix for API endpoint logs
- Use `[SERVICE]` prefix for service-level logs
- Use `[ERROR]` prefix for errors
- Use `[WORKER]` prefix for worker initialization

### Design System Usage

**Component Patterns:**
- Always use `font-serif` class for headings
- Use `bg-zw-green`, `bg-zw-yellow`, etc. for colored elements
- Implement proper loading and error states
- Include proper accessibility attributes
- Follow mobile-first responsive design

**Font System:**
1. **Headings**: Always use `font-serif` class
2. **Body text**: Always use `font-sans` class
3. **Never** introduce additional fonts

**Branding:**
1. **Primary actions**: Use `bg-zw-green` class
2. **Warning states**: Use `bg-zw-yellow` class
3. **Error states**: Use `bg-zw-red` class
4. **Always** include the Zimbabwe flag strip in full-page layouts

## API Endpoints Reference

### Frontend Worker (www.hararemetro.co.zw)

**Public Endpoints:**
- `GET /api/health` - Health check
- `GET /api/feeds?limit=20&offset=0&category=politics` - Get articles
- `GET /api/categories` - Get all categories
- `GET /api/article/by-source-slug?source=herald&slug=article-slug` - Get single article
- `GET /api/manifest.json` - PWA manifest

### Backend Worker (admin.hararemetro.co.zw)

**Admin Endpoints:**
- `GET /` or `/admin` - Admin dashboard
- `GET /api/health` - Health check with full service status
- `GET /api/admin/stats` - Platform statistics
- `POST /api/refresh-rss` - Manual RSS refresh (also called by cron)
- `POST /api/admin/bulk-pull` - Initial bulk article fetch
- `POST /api/admin/add-zimbabwe-sources` - Add Zimbabwe news sources
- `GET /api/admin/rss-config` - RSS configuration and source limits
- `PUT /api/admin/rss-source/:sourceId` - Update source configuration
- `GET /api/admin/sources` - Get all news sources with stats
- `GET /api/admin/ai-pipeline-status` - AI processing statistics
- `GET /api/admin/authors` - Get author profiles
- `GET /api/admin/authors/detailed` - Detailed authors with cross-outlet tracking
- `GET /api/admin/content-quality` - Content quality insights
- `GET /api/admin/categories/with-authors` - Categories with author expertise

**Public Endpoints:**
- `GET /api/feeds` - Get articles (enhanced with caching)
- `GET /api/categories` - Get categories
- `GET /api/author/:slug` - Author profile page
- `POST /api/author/:authorId/follow` - Follow/unfollow author
- `GET /api/featured-authors` - Featured journalists
- `GET /api/trending-authors` - Trending authors
- `GET /api/search/authors?q=query` - Search authors across outlets

**User Engagement Endpoints (Phase 2):**
- `POST /api/articles/:id/like` - Like/unlike article
- `POST /api/articles/:id/save` - Bookmark article
- `POST /api/articles/:id/view` - Track article view
- `POST /api/articles/:id/comment` - Add comment to article
- `GET /api/articles/:id/comments` - Get article comments
- `GET /api/user/me/preferences` - Get user preferences
- `POST /api/user/me/preferences` - Update user preferences
- `POST /api/user/me/follows` - Follow source/journalist
- `DELETE /api/user/me/follows/:type/:id` - Unfollow

### Account Worker (account.hararemetro.co.zw) - NEW Phase 3a

**Authentication Endpoints:**
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout and invalidate session
- `GET /api/auth/session` - Get current session information

**User Management Endpoints:**
- `GET /api/user/me/profile` - Get current user's profile
- `PUT /api/user/me/profile` - Update user profile
- `GET /api/user/me/history` - Get reading history
- `GET /api/user/me/analytics` - Get personal analytics (reading streaks, favorites)
- `GET /api/user/me/feed` - Get personalized feed (algorithm-based)
- `GET /api/user/me/notifications` - Get user notifications
- `PUT /api/user/me/notifications/:id/read` - Mark notification as read

**HTML Pages:**
- `GET /login` - Login page
- `GET /register` - Registration page
- `GET /profile` - User profile dashboard
- `GET /` - Account dashboard home

## Important Reminders

1. **3-Worker Architecture**: Frontend, backend, and account are separate workers
2. **Two Databases**:
   - `hararemetro_db` (content): articles, categories, sources, authors
   - `hararemetro_users_db` (users): authentication, profiles, preferences, notifications
3. **Database Bindings**:
   - Frontend: `DB` (content only)
   - Backend: `DB` (content only)
   - Account: `USERS_DB` (users) + `CONTENT_DB` (read-only content access)
4. **Services Location**:
   - Content/admin logic: `backend/services/`
   - User/auth logic: `account/services/`
5. **Cron Implementation**: Frontend calls backend via HTTP POST for RSS refresh
6. **Authentication**: JWT-based auth in account worker, KV for session storage
7. **No Supabase**: All user data in D1 (hararemetro_users_db)
8. **Typography**: Georgia for headings, Inter for body - NO EXCEPTIONS
9. **Colors**: Zimbabwe flag palette only - maintain consistency
10. **Mobile**: Mobile-first design with TikTok-like experience
11. **Branding**: Zimbabwe flag strip must be present on all full-page views
12. **TypeScript**: Use TypeScript for all new code
13. **Logging**: Use proper log prefixes for debugging
14. **Error Handling**: Consistent error boundaries and user feedback
15. **Testing**: Manual testing required - no automated tests currently configured
16. **AI Features**: Content cleaning, author extraction, keyword classification, quality scoring
17. **Author Recognition**: Celebrate Zimbabwe journalism through author profiles
18. **Personalization**: Algorithm-based feed in account worker based on user behavior

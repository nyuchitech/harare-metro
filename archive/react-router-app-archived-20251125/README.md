# React Router 7 App - Archived November 25, 2025

## Why Archived

This React Router 7 frontend application was archived as part of the migration to **Mukoko News** brand and the consolidation to a single **Expo + React Native** application that supports both mobile and web platforms.

## What Was Archived

- `app/` - React Router 7 application directory
  - Routes: home, search, bytes (NewsBytes), auth (login, register, forgot-password), onboarding, settings, user profiles
  - Components: UI components built with React + Tailwind CSS 4
  - Lib: Authentication, API clients, utilities
- `workers/` - Cloudflare Workers entry points
  - app.ts - Main worker with Hono + React Router SSR
  - Legacy workers (app-old.ts, index.js, index-d1.js, api.js)
- `wrangler.jsonc` - Root worker configuration (Harare Metro frontend)
- `vite.config.ts` - Vite build configuration
- `package.json` - Root dependencies (React Router, Material UI, etc.)
- `package-lock.json` - Lock file
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration

## New Architecture

**Mukoko News** now uses a simplified 2-worker architecture:

1. **Frontend (Vercel)**: Expo + React Native app supporting mobile (iOS, Android) and web
   - Domain: news.mukoko.com
   - Technology: React Native 0.81.5 + Expo SDK 54 + React 19
   - Deployment: Vercel (static export)

2. **Backend (Cloudflare Workers)**: Hono API server with simple documentation UI
   - Domain: news-worker.mukoko.com
   - Technology: Hono + TypeScript
   - Services: RSS processing, AI content enhancement, authentication, user engagement

## Features That Need Migration

The React Router app had several features that may need to be migrated to the Expo app:

### Authentication & User Management
- ✅ Login screen (basic version exists in mobile/screens/AuthScreen.js)
- ❌ Registration flow (needs migration)
- ❌ Forgot password (needs migration)
- ❌ Onboarding flow (needs migration)
- ❌ Settings/Profile management (needs migration)

### Content Features
- ✅ Home feed (exists in mobile/screens/HomeScreen.js)
- ✅ Article detail (exists in mobile/screens/ArticleDetailScreen.js)
- ✅ NewsBytes/Shorts (exists in mobile/screens/NewsBytesScreen.js)
- ✅ Search (exists in mobile/screens/SearchScreen.js)
- ✅ Discover/Explore (exists in mobile/screens/DiscoverScreen.js)

### User Profiles
- ❌ Public user profiles (@username pages)
- ❌ User activity feeds
- ❌ Following system

### Admin Dashboard
- ❌ Admin panel (will be built in Expo app, optimized for tablets+)

## Reference

This archived version can be used as a reference for:
- UI/UX patterns to migrate to Expo
- Authentication flows
- Component designs with Tailwind CSS + Zimbabwe flag colors
- API integration patterns
- SSR patterns (if needed for future SEO optimization)

## Database

The app was using the old **hararemetro_articles** D1 database. The new architecture uses the fresh **mukoko_news_db** database with consolidated schema.

## Restoration

If you need to restore this application:

1. Copy files back to root directory
2. Restore root package.json and install dependencies
3. Update wrangler.jsonc with current Cloudflare Worker configuration
4. Run `npm run dev` to start React Router dev server
5. Update API endpoints in app/lib/auth.client.ts to point to current backend

## Related Archives

- **Account Worker**: `archive/account-worker-phase3a-archived-YYYYMMDD/` (for future Phase 3+ user management)
- **Old Database**: hararemetro_articles D1 database (still exists, not deleted)

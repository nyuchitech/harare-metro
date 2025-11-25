# Mukoko News Migration Summary

## Overview

Successfully migrated from **Harare Metro** brand to **Mukoko News** brand with a fresh database and updated configuration.

**Date**: November 25, 2025
**Status**: ✅ Complete - Ready for testing

---

## What Was Done

### 1. Database Migration ✅

#### Created New D1 Database
- **Old Database**: `hararemetro_articles` (ID: 70d94fe9-4a78-4926-927b-e88e37141a54)
  - Status: **Kept as archive** - Old data preserved
- **New Database**: `mukoko_news_db` (ID: 375087ac-8a7d-41c9-8730-2ef8b028a597)
  - Status: **Active** - Clean fresh start

#### Deployed Consolidated Schema
- **Tables Created**: 35 tables
- **Queries Executed**: 138 SQL statements
- **Rows Written**: 197 rows
- **Initial Data Seeded**: 293 rows (categories, news sources, keywords)
- **Execution Time**: 33ms
- **Database Size**: 0.62 MB

#### Schema Features
- Full user authentication with Scrypt password hashing
- Account lockout and rate limiting
- Articles with full-text search
- User engagement (likes, bookmarks, comments, follows)
- AI processing pipeline support
- Analytics and audit logging
- Zimbabwe-specific categories and news sources

### 2. Configuration Updates ✅

#### Root wrangler.jsonc
**Changed:**
- Worker name: `harare-metro` → `mukoko-news`
- Domain: `www.hararemetro.co.zw/*` → `news.mukoko.com/*`
- Database: `hararemetro_articles` → `mukoko_news_db`
- Vectorize index: `harare-metro-articles` → `mukoko-news-articles`

#### backend/wrangler.jsonc
**Changed:**
- Worker name: `harare-metro-backend` → `mukoko-news-backend`
- Domain: `admin.hararemetro.co.zw/*` → `news.mukoko.com/api/*` + `news.mukoko.com/admin/*`
- Database: `hararemetro_articles` → `mukoko_news_db`
- Vectorize index: `harare-metro-articles` → `mukoko-news-articles`
- Durable Objects script names: `harare-metro-backend` → `mukoko-news-backend`

#### Mobile App (mobile/api/client.js)
**Already configured correctly:**
- Production URL: `https://news.mukoko.com` ✅
- Dev URL: `http://localhost:3000` ✅

### 3. Verified Data ✅

#### Categories Seeded
```
📰 All News
🏛️ Politics
💰 Economy
💻 Technology
⚽ Sports
🏥 Health
📚 Education
🎬 Entertainment
🌍 International
📰 General
```

---

## Current Architecture

### Single Domain Strategy
**Domain**: `news.mukoko.com`

**Routes:**
- `/` - Home (mobile app via Expo Web)
- `/api/*` - Backend API (Cloudflare Worker)
- `/admin/*` - Admin panel (web-only, landscape tablet+)

### Technology Stack
- **Mobile**: React Native 0.81.5 + Expo SDK 54
- **Web**: Expo Web (React Native Web)
- **Backend**: Cloudflare Workers (Hono framework)
- **Database**: Cloudflare D1 (`mukoko_news_db`)
- **Auth**: KV storage (`AUTH_STORAGE` namespace)
- **AI**: Cloudflare Workers AI + Vectorize

---

## Next Steps

### 1. Test Local Development with New Database

```bash
# Test backend locally with remote D1
cd backend
npx wrangler dev --remote

# Expected: Should connect to mukoko_news_db (no articles yet)
curl http://localhost:3000/api/health
```

### 2. Seed Initial Articles (Optional)

If you want to test with real Zimbabwe news data:

```bash
# Start backend locally
cd backend
npx wrangler dev --remote

# Trigger RSS refresh
curl -X POST http://localhost:3000/api/refresh-rss

# This will:
# - Fetch RSS feeds from Zimbabwe news sources
# - Process articles through AI pipeline
# - Store in mukoko_news_db
```

### 3. Test Mobile App

```bash
# Start mobile app
cd mobile
npx expo start

# Options:
# - Press 'i' for iOS simulator
# - Press 'a' for Android emulator
# - Press 'w' for web browser
# - Scan QR code with Expo Go app
```

### 4. Test Expo Web

```bash
cd mobile
npx expo start --web

# Browser should open to http://localhost:19006
# Test:
# - Home feed (should be empty until articles are fetched)
# - Categories (should show Zimbabwe categories)
# - Login/Register (should work with new database)
```

### 5. Deploy to Production

When ready to deploy:

```bash
# Deploy backend worker
cd backend
npm run deploy

# Deploy frontend/mobile web worker
cd ..
npm run deploy

# Configure DNS
# - Ensure news.mukoko.com points to Cloudflare Workers
# - Backend routes: news.mukoko.com/api/*, news.mukoko.com/admin/*
# - Frontend routes: news.mukoko.com/* (Expo Web)
```

---

## Migration Checklist

- [x] Create new D1 database (`mukoko_news_db`)
- [x] Deploy consolidated schema (40 tables)
- [x] Seed initial data (categories, sources, keywords)
- [x] Update root wrangler.jsonc
- [x] Update backend/wrangler.jsonc
- [x] Verify mobile API client configuration
- [ ] Test backend locally with new database
- [ ] Test mobile app with new database
- [ ] Test Expo Web
- [ ] Seed initial articles from RSS
- [ ] Create super admin user
- [ ] Deploy to production
- [ ] Archive Harare Metro code

---

## Database Access

### Local D1 Testing

```bash
# Query categories
npx wrangler d1 execute mukoko_news_db --local --command="SELECT * FROM categories LIMIT 5;"

# Query articles (will be empty until seeded)
npx wrangler d1 execute mukoko_news_db --local --command="SELECT COUNT(*) as count FROM articles;"

# Query users
npx wrangler d1 execute mukoko_news_db --local --command="SELECT email, role FROM users;"
```

### Remote D1 (Production)

```bash
# Query categories
npx wrangler d1 execute mukoko_news_db --remote --command="SELECT * FROM categories LIMIT 5;"

# Check table counts
npx wrangler d1 execute mukoko_news_db --remote --command="
  SELECT 'articles' as table_name, COUNT(*) as count FROM articles
  UNION ALL SELECT 'users', COUNT(*) FROM users
  UNION ALL SELECT 'categories', COUNT(*) FROM categories;
"
```

---

## Admin User Setup

After testing locally, create the super admin user:

```bash
npx wrangler d1 execute mukoko_news_db --remote --command="
INSERT INTO users (
  id, email, username, display_name, role, status,
  email_verified, login_count, analytics_consent,
  preferences, created_at, updated_at
)
VALUES (
  'admin-001',
  'bryan@nyuchi.com',
  'bryanceo',
  'Bryan Fawcett',
  'super_admin',
  'active',
  1,
  0,
  1,
  '{}',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT(email) DO UPDATE SET role='super_admin';
"

# Set password on first login or use backend/services/PasswordHashService.ts
```

---

## Key Files Changed

1. [wrangler.jsonc](wrangler.jsonc) - Root worker config
2. [backend/wrangler.jsonc](backend/wrangler.jsonc) - Backend worker config
3. [database/consolidated_schema.sql](database/consolidated_schema.sql) - Complete schema
4. [database/migrations/migrate_to_consolidated.sql](database/migrations/migrate_to_consolidated.sql) - Migration script (not used for fresh DB)

---

## Rollback Plan (If Needed)

If issues arise, rollback is simple:

```bash
# 1. Revert wrangler.jsonc files
git checkout HEAD -- wrangler.jsonc backend/wrangler.jsonc

# 2. Database automatically rolls back to hararemetro_articles
# No data loss - old database is intact

# 3. Redeploy workers
npm run deploy
cd backend && npm run deploy
```

---

## Support & Documentation

- **Database Schema**: [database/CONSOLIDATED_SCHEMA_README.md](database/CONSOLIDATED_SCHEMA_README.md)
- **Deployment Guide**: [database/DEPLOY_TO_D1.md](database/DEPLOY_TO_D1.md)
- **Development Guide**: [CLAUDE.md](CLAUDE.md)
- **Project Status**: [PROJECT-STATUS.md](PROJECT-STATUS.md)

---

## Questions?

- Database issues? Check [database/DEPLOY_TO_D1.md](database/DEPLOY_TO_D1.md)
- Schema questions? Read [database/CONSOLIDATED_SCHEMA_README.md](database/CONSOLIDATED_SCHEMA_README.md)
- Development help? See [CLAUDE.md](CLAUDE.md)

---

**Migration completed successfully! 🎉**

The Mukoko News platform is ready for testing with a fresh, clean database and updated branding.

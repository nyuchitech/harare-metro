# Consolidated Database Schema

## Overview

This document describes the **single consolidated schema** for the Harare Metro platform. All previous migration scripts have been combined into `consolidated_schema.sql` for clarity, maintainability, and performance.

## Database Information

- **Database Name**: `hararemetro_articles`
- **Database Type**: Cloudflare D1 (SQLite-based edge database)
- **Shared By**: Frontend worker (www.hararemetro.co.zw) and Backend worker (admin.hararemetro.co.zw)
- **Mobile App**: Mukoko News (news.mukoko.com) - connects to same backend

## Schema Structure

### 1. Users & Authentication (8 tables)
- `users` - User accounts with roles (creator, business-creator, moderator, admin, super_admin)
- `user_sessions` - Session tracking (backed by KV storage)
- `user_preferences` - User settings and preferences

**Key Features:**
- Scrypt password hashing (replaces SHA-256)
- Account lockout after failed login attempts
- Role-based access control
- TikTok-style usernames (@username)
- Session management with metadata

### 2. News Sources & RSS (4 tables)
- `news_sources` - Zimbabwe news outlets with RSS feeds
- `rss_sources` - Legacy alias table for backward compatibility
- `daily_source_stats` - RSS fetch statistics per source/day
- `feed_status` - RSS processing status tracking

**Key Features:**
- RSS feed configuration per source
- Scraping capabilities for content extraction
- Quality and credibility scoring
- Fetch frequency and error tracking

### 3. Categories & Keywords (2 tables)
- `categories` - News categories (Politics, Business, Sports, etc.)
- `keywords` - 256-keyword taxonomy for content classification

**Key Features:**
- Dynamic categories with emojis and colors
- Zimbabwe flag color palette integration
- Keyword-based content classification

### 4. Articles & Content (5 tables)
- `articles` - Core content storage with full-text search
- `article_keywords` - Many-to-many keyword relationships
- `authors` - Journalist profiles and bylines
- `article_authors` - Many-to-many author-article relationships
- `article_classifications` - AI-based content classification

**Key Features:**
- Full-text search (title + description + content + tags)
- Reading time and word count auto-calculation
- Trending score algorithm
- AI-enhanced content processing
- Author recognition and attribution

### 5. User Engagement (6 tables)
- `user_bookmarks` - Saved articles with tags and notes
- `user_likes` - Article likes
- `user_reading_history` - Reading engagement metrics
- `article_comments` - Comments with threading support
- `comment_likes` - Comment likes
- `user_follows` - Follow sources, authors, or categories

**Key Features:**
- Optimistic UI updates
- Comment threading and moderation
- Reading time and scroll depth tracking
- Notification preferences per follow

### 6. Analytics & Tracking (3 tables)
- `analytics_events` - Comprehensive event tracking
- `search_logs` - Search analytics
- `content_extraction_log` - Content extraction tracking

**Key Features:**
- User behavior tracking
- Performance metrics (page load time, time on page)
- Search query analysis
- Geographic and device tracking

### 7. AI Processing & Pipeline (5 tables)
- `ai_processing_log` - AI model execution logs
- `pipeline_stages` - Content processing pipeline tracking
- `quality_factors` - Content quality scoring
- `article_classifications` - Content type classification
- `content_extraction_log` - Extraction performance tracking

**Key Features:**
- Multi-stage content processing pipeline
- Author extraction with confidence scores
- Quality scoring (grammar, readability, factual accuracy)
- Content type classification (news, opinion, analysis, etc.)

### 8. System & Observability (7 tables)
- `system_config` - Platform configuration
- `cache_metadata` - Caching layer
- `trusted_domains` - Allowed domains for images/content
- `system_logs` - Comprehensive logging
- `system_metrics` - Performance monitoring
- `audit_log` - Security and compliance audit trail
- `cron_execution_log` - Scheduled job tracking

**Key Features:**
- Configuration management
- D1-based caching
- Security audit trail
- Performance monitoring
- Cron job tracking

## Total Tables: 40 tables

## Indexes: 89 indexes

All tables have optimized indexes for:
- Primary key lookups
- Foreign key relationships
- Common query patterns (published_at DESC, category, source, status)
- Full-text search operations
- Analytics aggregations

## Triggers: 29 triggers

Automated triggers for:
- Timestamp updates on all tables
- Article search content maintenance
- Reading time calculation
- Like/bookmark/comment count updates
- Author statistics updates
- Follower count tracking
- Pipeline completion detection
- Username validation

## Key Database Fields for Mobile App

### Articles (Mobile Feed)
```sql
SELECT
  id,
  title,
  slug,
  description,
  image_url,
  source,
  source_id,
  category,
  published_at,
  like_count,
  comment_count,
  bookmark_count,
  reading_time
FROM articles
WHERE status = 'published'
ORDER BY published_at DESC
```

### User Engagement (Mobile Actions)
```sql
-- Like article
INSERT INTO user_likes (user_id, article_id) VALUES (?, ?);

-- Bookmark article
INSERT INTO user_bookmarks (user_id, article_id) VALUES (?, ?);

-- Track reading
INSERT INTO user_reading_history (user_id, article_id, reading_time, scroll_depth)
VALUES (?, ?, ?, ?);

-- Add comment
INSERT INTO article_comments (article_id, user_id, content)
VALUES (?, ?, ?);
```

### Search (Mobile Search)
```sql
SELECT *
FROM articles
WHERE content_search LIKE '%' || ? || '%'
  AND status = 'published'
ORDER BY published_at DESC
LIMIT 50;
```

## API Endpoints Alignment

### Frontend Worker (www.hararemetro.co.zw)
**Minimal API endpoints - SSR focused:**
- `GET /api/feeds` - Get articles with pagination
- `GET /api/categories` - Get all categories
- `GET /api/article/by-source-slug` - Get single article
- `GET /api/health` - Health check
- `GET /api/manifest.json` - PWA manifest

### Backend Worker (admin.hararemetro.co.zw)
**Comprehensive APIs - Admin & mobile app:**
- All frontend APIs (enhanced with caching)
- `POST /api/refresh-rss` - RSS feed refresh (called by cron)
- `GET /api/admin/*` - Admin dashboard APIs
- `POST /api/articles/:id/like` - Like/unlike article
- `POST /api/articles/:id/save` - Bookmark article
- `POST /api/articles/:id/comment` - Add comment
- `GET /api/articles/:id/comments` - Get comments
- `POST /api/user/me/follows` - Follow source/author
- `GET /api/search/articles` - Full-text search

### Mobile App (news.mukoko.com)
**Connects to Backend Worker:**
- Uses ALL backend APIs
- No duplicate API implementations
- Consistent data structure
- Optimistic UI updates on client side

## Schema Migration Strategy

### For New Deployments:
1. Run `consolidated_schema.sql` directly
2. Populate initial data (categories, news sources)
3. Create super admin user
4. Configure RSS sources

### For Existing Databases:
This consolidated schema is **comprehensive and complete**. If you already have a database:
1. Backup existing database
2. Compare existing schema with consolidated schema
3. Run any missing CREATE TABLE statements
4. Run any missing ALTER TABLE statements
5. Verify all indexes and triggers are present

## Data Requirements for Mobile App

### Essential Tables for Mobile App Functionality:
1. `articles` - News content
2. `categories` - Category filters
3. `news_sources` - Source information
4. `users` - Authentication
5. `user_likes` - Like functionality
6. `user_bookmarks` - Save functionality
7. `article_comments` - Comments
8. `user_reading_history` - Reading tracking
9. `user_follows` - Follow functionality

### Optional Tables (Enhanced Features):
1. `authors` - Author profiles and pages
2. `article_authors` - Author attribution
3. `analytics_events` - User behavior tracking
4. `ai_processing_log` - Content enhancement logs
5. `quality_factors` - Content quality metrics

## Performance Considerations

### Database Size Estimates:
- **Articles**: ~100KB per article (avg)
- **Users**: ~2KB per user
- **Comments**: ~1KB per comment
- **Analytics Events**: ~500B per event
- **Total for 10K articles, 1K users**: ~1.5GB

### Query Performance:
- All frequently queried fields have indexes
- Pagination should use `LIMIT` and `OFFSET`
- Full-text search uses `content_search` field (indexed)
- Article counts use COUNT(*) with WHERE clauses

### Caching Strategy:
- Frontend: Cache articles for 5 minutes
- Backend: Cache categories indefinitely (rarely change)
- Mobile: Cache feeds for 2 minutes, infinite scroll

## Security Considerations

### Password Security:
- Scrypt hashing (N=16384, r=8, p=1)
- Salt stored with hash (format: `salt:hash`)
- Legacy SHA-256 passwords auto-upgraded on login

### Account Lockout:
- 5 failed attempts → 15 min lockout
- 10 failed attempts → 1 hour lockout
- 15 failed attempts → 24 hour lockout
- 20 failed attempts → permanent lockout (admin unlock required)

### Session Management:
- Sessions stored in KV (AUTH_STORAGE namespace)
- 7-day expiry
- Validated on every request
- Audit logged

### API Security:
- CORS configured per environment
- Rate limiting on auth endpoints (5 attempts per 15 min)
- HSTS headers in production
- CSP headers for XSS protection

## Zimbabwe-Specific Features

### News Sources:
- The Herald (herald.co.zw)
- NewsDay (newsday.co.zw)
- The Chronicle (chronicle.co.zw)
- The Standard (thestandard.co.zw)
- Daily News (dailynews.co.zw)
- Zimbabwe Independent
- More sources in `database/migrations/002_seed_initial_data.sql`

### Categories:
- Politics 🏛️
- Business 💼
- Sports ⚽
- Health 🏥
- Education 🎓
- Technology 💻
- Entertainment 🎭
- Lifestyle ✨
- Opinion 💭

### Author Recognition:
- Zimbabwe journalists seeded in database
- Cross-outlet author tracking
- Author profiles with article counts
- Expertise categorization

## Migration Notes

### Breaking Changes from Previous Schema:
None - this is a superset of all previous migrations.

### New Fields Added:
- `users.username` - TikTok-style usernames
- `users.password_hash` - Replaces Supabase auth
- `users.failed_login_attempts` - Account lockout tracking
- `articles.ai_processed` - AI processing flag
- `articles.processed_content` - Cleaned content
- `authors.slug` - URL-friendly author pages

### Deprecated Fields (Still Present for Compatibility):
- `articles.author` - Use `article_authors` table instead
- `articles.category` - Use `category_id` instead
- `rss_sources` table - Use `news_sources` instead

## Support

For questions or issues with the database schema:
1. Check CLAUDE.md for development guidelines
2. Review PROJECT-STATUS.md for current implementation status
3. Check CHANGELOG.md for recent changes
4. Refer to backend/services/ for database query examples

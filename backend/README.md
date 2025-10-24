# Harare Metro Backend Worker

**Admin Interface & AI-Powered RSS Processing Engine**

The backend worker for Harare Metro, providing comprehensive admin tools, RSS processing with AI enhancement, and advanced analytics for Zimbabwe's premier news aggregation platform.

## 🌍 Deployment

**Live**: [admin.hararemetro.co.zw](https://admin.hararemetro.co.zw)

## ✨ Features

### Admin Dashboard
- **Web-Based Interface**: Modern, responsive admin panel
- **Real-Time Statistics**: Article counts, source status, database metrics
- **RSS Source Management**: Configure feed URLs, limits, and priorities
- **Author Profiles**: View and manage journalist recognition data
- **Content Quality Insights**: AI-powered quality scoring and analytics
- **Manual RSS Refresh**: Trigger immediate feed updates

### AI-Powered Content Processing
- **Author Recognition**: Automatic extraction and deduplication across outlets
- **Content Cleaning**: Remove image URLs, random characters, and noise
- **Keyword Classification**: 256-keyword taxonomy across 32 categories
- **Quality Scoring**: AI-assessed readability and content quality
- **Category Assignment**: Intelligent categorization of articles

### RSS Processing
- **Zimbabwe News Sources**: Herald, NewsDay, Chronicle, ZimLive, The Standard, and more
- **Hourly Refresh**: Triggered by frontend worker cron job
- **Bulk Pull**: Initial large-scale article import
- **Source Limits**: Configurable daily limits per source
- **Error Handling**: Comprehensive logging and retry logic

### Analytics & Insights
- **User Interaction Tracking**: Cloudflare Analytics Engine integration
- **Performance Metrics**: Processing times, article counts, success rates
- **Author Metrics**: Article counts, quality scores, engagement
- **Content Quality Distribution**: Excellent, Good, Fair, Needs Improvement

## 🏗️ Architecture

### Technology Stack

**Framework**: Hono (lightweight web framework for Cloudflare Workers)

**AI & Data**:
- Cloudflare Workers AI (author extraction, content classification)
- Cloudflare D1 Database (SQLite at the edge)
- Cloudflare Analytics Engine (interaction tracking)
- Cloudflare Vectorize (semantic search - optional)

**Content Processing**:
- fast-xml-parser (RSS parsing)
- TypeScript (type safety)

### Services Architecture

All business logic is modular in `services/`:

```
backend/services/
├── RSSFeedService.ts              # RSS fetching and parsing
├── ArticleService.ts              # Article CRUD operations
├── ArticleAIService.ts            # AI content processing
├── AuthorProfileService.ts        # Author recognition and profiles
├── NewsSourceManager.ts           # News source management
├── ContentProcessingPipeline.ts   # Full AI pipeline orchestration
├── D1ConfigService.ts             # Configuration management
├── D1CacheService.ts              # D1-based caching layer
├── AnalyticsEngineService.ts      # Analytics tracking
├── CategoryManager.ts             # Category management
├── AuthService.ts                 # Authentication
├── ObservabilityService.ts        # Logging and monitoring
└── CloudflareImagesService.ts     # Image optimization
```

### Data Flow

**RSS Processing Flow** (Triggered by Frontend Cron):

```
1. Frontend worker cron trigger (hourly)
   ↓
2. HTTP POST to /api/admin/refresh-rss
   ↓
3. RSSFeedService.initialBulkPull()
   ↓
4. Fetch RSS feeds from Zimbabwe sources
   ↓
5. ContentProcessingPipeline.processContentSource()
   ↓
6. AI Enhancement:
   - Author extraction (Workers AI)
   - Content cleaning
   - Keyword classification
   - Quality scoring
   - Category assignment
   ↓
7. D1 Database storage
   ↓
8. Return success response with metrics
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Cloudflare account
- Access to `hararemetro_db` D1 database

### Development Setup

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Access admin dashboard at http://localhost:8787
```

### Database Operations

```bash
# Run database migrations
npm run db:migrate

# Test with local D1
npm run db:local
```

### Deployment

```bash
# Deploy to production
npm run deploy

# Or deploy from monorepo root
npm run deploy:backend
```

## 📚 API Endpoints

### Admin Endpoints (Require Admin Access)

```
GET  /                            # Admin dashboard
GET  /admin                       # Admin dashboard (alternate)

# System
GET  /api/health                  # Health check with service status
GET  /api/admin/stats             # Platform statistics

# RSS Management
POST /api/admin/refresh-rss       # Manual RSS refresh (also called by cron)
POST /api/admin/bulk-pull         # Initial bulk article import
GET  /api/admin/rss-config        # RSS configuration and limits
PUT  /api/admin/rss-source/:id    # Update source configuration

# Source Management
POST /api/admin/add-zimbabwe-sources  # Add Zimbabwe news sources
GET  /api/admin/sources           # Get all sources with stats

# Author Management
GET  /api/admin/authors           # Author profiles
GET  /api/admin/authors/detailed  # Detailed authors with cross-outlet tracking

# AI Pipeline
GET  /api/admin/ai-pipeline-status   # AI processing statistics
GET  /api/admin/content-quality      # Content quality insights

# Categories
GET  /api/admin/categories/with-authors  # Categories with author expertise

# Analytics
GET  /api/admin/analytics         # Platform analytics
```

### Public Endpoints

```
GET  /api/feeds                   # Get articles (paginated, filterable)
GET  /api/categories              # Get all categories
GET  /api/article/by-source-slug  # Get single article
GET  /api/manifest.json           # PWA manifest

# Author Features
GET  /api/author/:slug            # Author profile page
POST /api/author/:id/follow       # Follow/unfollow author
GET  /api/featured-authors        # Featured journalists
GET  /api/trending-authors        # Trending authors
GET  /api/search/authors?q=query  # Search authors
```

## 🔧 Configuration

### Cloudflare Bindings (wrangler.jsonc)

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

### Environment Variables

```env
NODE_ENV=production
LOG_LEVEL=info
ROLES_ENABLED=true
DEFAULT_ROLE=creator
ADMIN_ROLES=admin,super_admin,moderator
CREATOR_ROLES=creator,business-creator,author
```

### Database Schema

**Core Tables**:
- `articles` - News articles with full content
- `categories` - Article categories
- `news_sources` - RSS feed URLs and configuration
- `authors` - Journalist profiles (auto-extracted)
- `keywords` - Classification keywords

**Author Features**:
- `author_outlets` - Cross-outlet tracking
- `article_authors` - Article-author relationships (many-to-many)
- `author_category_expertise` - Author expertise by category
- `category_managers` - Category editorial management

**System**:
- `system_config` - Platform configuration
- `users` - User accounts
- `daily_source_stats` - RSS fetch statistics
- `ai_processing_log` - AI pipeline execution logs

## 🤖 AI Processing Pipeline

### Content Processing Pipeline

The `ContentProcessingPipeline` service orchestrates:

1. **Content Fetching**: RSS feed parsing
2. **Content Cleaning**: Remove noise, image URLs, random characters
3. **Author Detection**: Extract bylines using Workers AI
4. **Author Deduplication**: Match across outlets
5. **Keyword Extraction**: 256-keyword taxonomy classification
6. **Quality Assessment**: Grammar, readability, headline quality
7. **Category Assignment**: Intelligent categorization
8. **Database Storage**: Insert articles with relationships

### Author Recognition

**Cross-Outlet Tracking**:
- Automatic name normalization
- Fuzzy matching across news sources
- Professional profile generation
- Article count tracking
- Quality score aggregation

**Profile Features**:
- Auto-generated author pages
- Cross-outlet article tracking
- Follower counts
- Engagement metrics
- Verification status

## 📊 Zimbabwe News Sources

Configured RSS sources:

- **Herald** - herald.co.zw
- **NewsDay** - newsday.co.zw
- **Chronicle** - chronicle.co.zw
- **ZimLive** - zimlive.com
- **The Standard** - thestandard.co.zw
- **Techzim** - techzim.co.zw
- **Zimbabwe Independent** - theindependent.co.zw
- **Business Weekly** - businessweekly.co.zw
- **ZBC News** - zbc.co.zw
- **New Zimbabwe** - newzimbabwe.com

Each source has configurable:
- Daily article limits
- Articles per fetch
- Max bulk articles
- Priority level
- Quality/reliability scores

## 🔐 Security

- **CORS**: Configured for www.hararemetro.co.zw
- **D1 Prepared Statements**: SQL injection prevention
- **Input Validation**: All user inputs validated
- **Error Handling**: No sensitive data in error messages
- **Rate Limiting**: Configurable per-source limits

## 📈 Monitoring & Observability

### Admin Dashboard Metrics

- Total articles in database
- Active news sources count
- Categories count
- Database size
- Recent RSS fetch status

### AI Pipeline Monitoring

- Processing type counts
- Success/failure rates
- Average processing times
- Author extraction stats
- Keyword extraction stats
- Quality scoring distribution

### Analytics Tracking

All operations tracked in Analytics Engine:
- RSS refresh events
- Article processing
- Admin actions
- API endpoint usage
- Error rates

## 🎨 Zimbabwe Branding

The admin dashboard features:

- **Zimbabwe Flag Colors**: Green, Yellow, Red, Black, White
- **Cultural Pride**: Celebrating Zimbabwe journalism
- **Local Focus**: Zimbabwe news sources prioritized
- **Author Recognition**: Honoring local journalists

## 🔄 Integration with Frontend

The frontend worker (www.hararemetro.co.zw) integrates via:

1. **Cron Trigger**: Frontend calls `/api/admin/refresh-rss` hourly
2. **API Consumption**: Frontend reads articles via backend `/api/feeds`
3. **Shared Database**: Both workers access same D1 database
4. **Analytics**: User interactions tracked via backend Analytics Engine

## 🛠️ Development Guidelines

### Adding New Services

1. Create service file in `backend/services/`
2. Import and initialize in `backend/index.ts`
3. Add to service initialization function
4. Use TypeScript for type safety

### Adding New Endpoints

1. Add route handler in `backend/index.ts`
2. Use Hono's routing system
3. Call appropriate services
4. Return consistent JSON responses
5. Add error handling

### Database Queries

- Always use `D1Service` or specialized services
- Use prepared statements for security
- Handle errors gracefully
- Log query performance

## 📝 Logging Conventions

Use consistent log prefixes:

- `[WORKER]` - Worker initialization
- `[API]` - API endpoint logs
- `[SERVICE]` - Service-level logs
- `[ERROR]` - Error messages
- `[AI]` - AI processing logs

## 🤝 Contributing

When modifying the backend:

1. Keep services modular in `services/` directory
2. Use TypeScript types
3. Add comprehensive error handling
4. Log important operations
5. Update this README for API changes

## 📞 Support

- **Main Documentation**: [../CLAUDE.md](../CLAUDE.md)
- **Issues**: GitHub Issues
- **Admin Dashboard**: [admin.hararemetro.co.zw](https://admin.hararemetro.co.zw)

---

**Harare Metro Backend** - Powering Zimbabwe's news with AI and edge computing. 🇿🇼

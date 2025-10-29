# Changelog

All notable changes to Harare Metro will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Phase 2 - User Engagement Features
- Frontend UI components (in progress)
- Authentication flow testing
- User profile pages
- Integration testing

---

## [0.6.0] - 2025-10-29

### Added
- **Real-time log streaming** for both frontend and backend workers via wrangler tail
- **Observability configuration** enabled in both wrangler.jsonc files
- **Preview URL support** for testing deployments
- **LOGGING-AND-MONITORING.md** - Comprehensive logging guide
- **Backend deployment** with OpenAuthService enabled

### Changed
- **OpenAuthService** import re-enabled in backend/index.ts
- **Backend deployed** to production (version 780525e1-9b4d-45ea-9c1d-65d91202fff8)
- **Phase 2 status** updated from 40% to 60% complete

### Fixed
- **OpenAuthService dependencies** installed (@openauthjs/openauth + valibot)
- **Backend build** now passes with authentication enabled

### Verified
- ✅ Health endpoint operational (148ms response time)
- ✅ Log streaming working with real-time data
- ✅ All backend services healthy

---

## [0.5.0] - 2025-10-28

### Added
- **Migration 007** applied to production database (manually)
  - `article_comments` table with moderation support
  - `comment_likes` table for comment engagement
  - `user_follows` table for following sources/authors/categories
  - Full indexes and triggers for performance
- **Phase 2 backend endpoints** (9 APIs):
  - POST /api/articles/:id/like
  - POST /api/articles/:id/save
  - POST /api/articles/:id/view
  - POST /api/articles/:id/comment
  - GET /api/articles/:id/comments
  - GET /api/user/me/preferences
  - POST /api/user/me/preferences
  - POST /api/user/me/follows
  - DELETE /api/user/me/follows/:type/:id
- **PROJECT-STATUS.md** - Honest phase tracking document
- **PHASE-2-COMPLETION-PLAN.md** - Detailed 3-week roadmap
- **Documentation cleanup** - Consolidated and updated all docs

### Changed
- **Database name fixed** in all wrangler.jsonc files
  - Old: `hararemetro_db`
  - New: `hararemetro_articles`
- **Architecture simplified** from 3-worker to 2-worker system
- **Account worker archived** to `archive/account-worker-phase3a-archived-20251028/`
- **Phase status corrected**:
  - Phase 1: 95% → 100% ✅
  - Phase 2: 100% → 40% (honest assessment)
  - Phase 3a: 90% → 0% (deferred)
- **CLAUDE.md** updated with 2-worker architecture
- **README.md** updated with correct database schema

### Fixed
- **Database configuration** - All configs now reference correct database name
- **Documentation alignment** - All docs now reflect actual implementation
- **Phase tracking** - Removed false "complete" status from Phase 2

### Removed
- Account worker from main codebase (archived for future use)
- 3-worker architecture references

---

## [0.4.0] - 2025-10-24 to 2025-10-26

### Added
- **Cron logging system** (migration 006)
  - `cron_logs` table for tracking RSS refresh execution
  - D1-based logging instead of Analytics Engine
- **Phase 2 user engagement planning**
  - Database migration 007 created
  - Backend endpoints written (not yet enabled)
- **Admin dashboard redesign**
  - Black/white theme with Lucide icons
  - Tab-based navigation
  - Source management interface

### Changed
- **Category classification fixed** - JSON keyword parsing corrected
- **RSS feed processing** - Better error handling

---

## [0.3.0] - 2025-10-11 to 2025-10-23

### Added
- **Phase 1 completion** - Core platform features
  - RSS feed aggregation from Zimbabwe news sources
  - Hourly cron job (frontend → backend)
  - AI content pipeline (author extraction, keywords, quality scoring)
  - Author recognition across multiple outlets
  - Category classification system (256-keyword taxonomy)
- **Public API endpoints**:
  - GET /api/feeds - Paginated articles
  - GET /api/categories - All categories
  - GET /api/article/by-source-slug - Single article
  - GET /api/health - Health check
  - GET /api/news-bytes - Articles with images only
  - GET /api/search - Full-text search
  - GET /api/authors - Journalist discovery
  - GET /api/sources - News sources listing
  - GET /api/refresh - User-triggered refresh (rate-limited)
- **Admin dashboard** - Source management, statistics, AI pipeline status
- **Frontend** - React Router 7 SSR application with Zimbabwe flag branding

### Technical
- **2-worker architecture**:
  - www.hararemetro.co.zw (frontend)
  - admin.hararemetro.co.zw (backend)
- **Cloudflare D1 database** - Single database (hararemetro_articles)
- **Cloudflare Workers AI** - Content processing pipeline
- **Cloudflare Analytics Engine** - User interaction tracking
- **Cloudflare Vectorize** - Semantic search (configured, not active)

---

## [0.2.0] - 2025-09-20 to 2025-10-10

### Added
- **Database schema** design and initial migrations
- **RSS feed service** with XML parsing
- **News source management** system
- **Article AI service** with Cloudflare Workers AI
- **Author profile service** with deduplication
- **Content processing pipeline** - AI orchestration

### Technical
- TypeScript codebase
- Hono web framework for backend
- React Router 7 for frontend
- Tailwind CSS 4.x with Zimbabwe flag colors

---

## [0.1.0] - 2025-08-21 to 2025-09-19

### Added
- **Initial project setup**
- **Cloudflare Workers** infrastructure
- **D1 database** creation
- **Basic frontend** structure
- **Project documentation** (README, CLAUDE.md)

### Technical
- Monorepo structure
- Separate frontend and backend workers
- GitHub Actions CI/CD

---

## Version History Summary

| Version | Date | Phase | Completion | Key Features |
|---------|------|-------|------------|--------------|
| 0.6.0 | 2025-10-29 | Phase 2 | 60% | Logging, backend deployed |
| 0.5.0 | 2025-10-28 | Phase 2 | 40% | Migration 007, docs cleanup |
| 0.4.0 | 2025-10-26 | Phase 2 | 30% | Cron logging, planning |
| 0.3.0 | 2025-10-23 | Phase 1 | 100% | Core platform complete |
| 0.2.0 | 2025-10-10 | Phase 1 | 70% | RSS + AI processing |
| 0.1.0 | 2025-09-19 | Phase 1 | 30% | Initial setup |

---

## Upcoming Releases

### [0.7.0] - Planned
**Phase 2 Frontend Integration**
- Like/save buttons on articles
- Comment system UI
- Follow buttons for sources/authors
- User profile pages
- Authentication flow tested
- Integration testing complete

### [0.8.0] - Planned
**Phase 2 Complete**
- All Phase 2 features deployed
- User engagement functional
- Performance optimized
- Production ready

### [1.0.0] - Planned
**Phase 3 - Advanced Features**
- Personalized feed algorithm
- Notifications system
- Reading analytics
- User dashboards
- Mobile app considerations

---

## Links

- **Repository**: https://github.com/nyuchitech/harare-metro
- **Live Site**: https://www.hararemetro.co.zw
- **Admin Panel**: https://admin.hararemetro.co.zw
- **Documentation**: [CLAUDE.md](CLAUDE.md)
- **Status**: [PROJECT-STATUS.md](PROJECT-STATUS.md)
- **Plan**: [PHASE-2-COMPLETION-PLAN.md](PHASE-2-COMPLETION-PLAN.md)

---

## Contributors

- **Owner**: Bryan Fawcett
- **Development**: Claude Code (AI Assistant)
- **Stack**: Cloudflare Workers, D1, React Router 7, TypeScript

---

**Note**: This changelog was created on 2025-10-29 to consolidate project history.
Previous changes were retroactively documented from git commits and documentation.

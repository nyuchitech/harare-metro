# Harare Metro - Product Roadmap

**Last Updated:** October 31, 2025
**Current Phase:** Phase 2 - User Profiles & Authentication
**Production Status:** ✅ LIVE at www.hararemetro.co.zw

---

## 🎯 Vision

Harare Metro is Zimbabwe's premier news aggregation platform, providing real-time news from trusted sources with intelligent categorization, user engagement features, and a modern TikTok-inspired mobile experience.

---

## ✅ Completed Phases

### Phase 1: Core RSS Aggregation (COMPLETE)

**Status:** ✅ Deployed & Operational

**Achievements:**
- RSS feed aggregation from 4 Zimbabwe news sources
- Keyword extraction (130+ Zimbabwe-specific patterns)
- Image extraction and optimization
- Mobile-first UI with Zimbabwe flag branding
- Basic search functionality
- Category system (9 categories)
- Hourly cron job for automated refreshes

**Metrics:**
- 157+ articles aggregated
- 17+ articles with images (11% coverage)
- 4 active news sources
- 130+ keyword patterns

---

## 🚧 Current Phase: Phase 2 - User Profiles & Authentication

**Status:** 🔄 IN PROGRESS (95% Complete)

**Timeline:** October 28 - November 15, 2025

### Completed Features ✅

1. **Authentication System**
   - OpenAuth implementation (D1 + KV)
   - User registration and login
   - Password recovery (6-digit codes)
   - Session management
   - Role-based access control

2. **User Profiles**
   - TikTok-like usernames (@username)
   - User profile data structure
   - Backend API endpoints for profiles
   - Bookmarks, likes, reading history tracking
   - ✅ **Profile pages at /@username** (October 31)
   - ✅ **Profile edit functionality** (October 31)
   - ✅ **User activity displays** (October 31)

3. **Standalone Auth Pages** ✅ (October 31)
   - ✅ Login page at `/auth/login`
   - ✅ Registration page at `/auth/register`
   - ✅ Forgot password flow at `/auth/forgot-password`
   - ✅ Profile settings page at `/settings/profile`
   - ✅ Enhanced 404 error page with branding

4. **Search Enhancement**
   - Unified search API (articles, keywords, categories, authors)
   - Keyword-based search
   - Author-based search
   - Pagination support

5. **Admin Features**
   - User management endpoints
   - Role management
   - User suspension/activation
   - Admin dashboard backend

6. **Platform Improvements** ✅ (October 31)
   - ✅ Today's article count display (55 today vs 352 total)
   - ✅ PWA icons and manifest configuration
   - ✅ Favicon support for frontend and backend
   - ✅ All routes properly configured

### In Progress 🔄

1. **Author System**
   - Auto-generate author profiles from RSS feeds
   - Author profile pages
   - Cross-outlet author tracking
   - Author following system

### Remaining Tasks 📋

**Priority 1 (This Week):**
- [ ] Complete author profile auto-generation
- [ ] Add author following system
- [ ] Migrate frontend auth from Supabase to OpenAuth
- [ ] Full integration testing of auth flow

**Priority 2 (Next Week):**
- [ ] Author profile pages
- [ ] Enhanced search UI
- [ ] User dashboard
- [ ] Profile settings page
- [ ] Email verification system

---

## 📅 Phase 3: Enhanced Content & Engagement

**Timeline:** November 16 - December 15, 2025

### Goals

1. **Content Enhancements**
   - AI-powered article summaries
   - Related articles algorithm
   - Trending articles system
   - Article recommendations based on reading history

2. **User Engagement**
   - Comments system
   - Article sharing (social media integration)
   - User notifications
   - Reading streaks and achievements
   - Personalized feed algorithm

3. **Author Features**
   - Author verification system
   - Author analytics dashboard
   - Cross-outlet author tracking
   - Author profiles with bio and social links
   - "Follow author" functionality

4. **Mobile App Features**
   - Push notifications
   - Offline reading
   - Article saving for offline
   - Reading mode improvements

### Technical Improvements

- Implement Cloudflare Images optimization
- Add Cloudflare Analytics Engine integration
- Set up Vectorize for semantic search
- Implement rate limiting
- Add request caching

---

## 🚀 Phase 4: Business Features & Monetization

**Timeline:** December 16, 2025 - January 31, 2026

### Goals

1. **Business-Creator Accounts**
   - Business profile pages
   - Analytics dashboard for businesses
   - Sponsored content system
   - Business verification

2. **Content Submission**
   - Submit news tips/stories
   - Community contributor system
   - Editorial review workflow
   - Content moderation tools

3. **Analytics & Insights**
   - Platform-wide analytics dashboard
   - User engagement metrics
   - Content performance analytics
   - Source performance tracking

4. **Monetization**
   - Display advertising (Google AdSense)
   - Sponsored content
   - Premium subscriptions (ad-free, early access)
   - Business accounts (analytics, promoted content)

---

## 🌟 Phase 5: Advanced Features

**Timeline:** February - March 2026

### Goals

1. **AI-Powered Features**
   - Automated fact-checking
   - Content quality scoring
   - Duplicate detection
   - Sentiment analysis
   - Auto-generated tags and categories

2. **Multi-Language Support**
   - Shona language support
   - Ndebele language support
   - Auto-translation
   - Language preference settings

3. **Advanced Search**
   - Semantic search with Vectorize
   - Voice search
   - Image search
   - Advanced filters (date range, source, author, category)

4. **Community Features**
   - User-generated content
   - Discussion forums
   - User polls and surveys
   - Community moderation

---

## 📊 Success Metrics

### Phase 2 Goals

- [x] 100% auth functionality (login, register, sessions)
- [ ] User profile pages live
- [ ] 50+ registered users
- [ ] Author profiles auto-generated
- [ ] Search functionality enhanced

### Phase 3 Goals

- [ ] 500+ registered users
- [ ] 10% daily active user rate
- [ ] Comments system with 100+ comments/day
- [ ] Personalized feeds for all users
- [ ] 50+ verified authors

### Phase 4 Goals

- [ ] 1,000+ registered users
- [ ] 10+ business accounts
- [ ] Revenue generation started
- [ ] 20% user engagement rate

### Phase 5 Goals

- [ ] 5,000+ registered users
- [ ] Multi-language support live
- [ ] AI features operational
- [ ] Community-generated content active

---

## 🛠️ Technical Debt & Improvements

### Priority 1 (Immediate)

- [ ] Fix deployment worker name mismatch issue
- [ ] Remove all Supabase dependencies
- [ ] Improve error handling across all endpoints
- [ ] Add comprehensive logging
- [ ] Set up monitoring and alerts

### Priority 2 (This Month)

- [ ] Optimize database queries
- [ ] Implement caching strategy
- [ ] Add automated testing
- [ ] Improve TypeScript coverage
- [ ] Refactor large service files

### Priority 3 (Next Month)

- [ ] Code documentation improvements
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Accessibility improvements

---

## 📝 Notes

### Architecture Decisions

1. **2-Worker Architecture**: Maintaining separate frontend and backend workers for clean separation of concerns
2. **No Account Worker**: Consolidated auth into backend worker for simplicity
3. **D1 + KV Auth**: Custom OpenAuth instead of Supabase for full control and cost efficiency
4. **Mobile-First**: TikTok-inspired design for Zimbabwe's mobile-first market

### Key Principles

- **Simplicity**: Keep architecture simple and maintainable
- **Performance**: Fast load times critical for mobile users
- **Cost-Effective**: Leverage Cloudflare's free tier
- **Zimbabwe-First**: Design for Zimbabwe's infrastructure and user needs
- **Mobile-Optimized**: Mobile experience is the primary experience

---

## 🔄 Review Schedule

- **Weekly**: Review progress on current phase
- **Bi-weekly**: Update roadmap based on user feedback
- **Monthly**: Major roadmap review and planning session
- **Quarterly**: Strategic review and vision alignment

---

**Generated with [Claude Code](https://claude.com/claude-code)**
**Next Review:** November 7, 2025

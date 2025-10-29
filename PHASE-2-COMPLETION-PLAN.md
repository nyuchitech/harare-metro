# Phase 2 Completion Plan - User Engagement APIs

**Date Created**: 2025-10-28
**Status**: IN PROGRESS (40% Complete)
**Estimated Time**: 1-2 weeks
**Architecture**: 2-Worker System (www + admin)

---

## 🎯 Objective

Enable users to interact with content through likes, saves, comments, and follows. All user engagement features will be implemented in the backend worker with frontend UI integration.

---

## ✅ What's Already Done

### 1. Database Migration 007 ✅
- **File**: `database/migrations/007_user_engagement_complete.sql`
- **Status**: ✅ Applied to local database
- **⚠️ TODO**: Apply to remote production database
- **Tables Created**:
  - `article_comments` - Comments with moderation support
  - `comment_likes` - Like comments
  - `user_follows` - Follow sources, authors, categories
- **Features**: Indexes, triggers, cascading deletes

### 2. Backend API Endpoints ✅
- **File**: `backend/index.ts`
- **Status**: ✅ Code written (lines 972-1400+)
- **Endpoints**:
  - `POST /api/articles/:id/like` - Like/unlike article
  - `POST /api/articles/:id/save` - Bookmark article
  - `POST /api/articles/:id/view` - Track article view
  - `POST /api/articles/:id/comment` - Add comment
  - `GET /api/articles/:id/comments` - Get comments
  - `GET /api/user/me/preferences` - Get user preferences
  - `POST /api/user/me/preferences` - Update preferences
  - `POST /api/user/me/follows` - Follow source/author
  - `DELETE /api/user/me/follows/:type/:id` - Unfollow

---

## 🚧 Blocking Issues (CRITICAL)

### Issue 1: Authentication Not Working ⛔

**Problem**: OpenAuthService import is commented out

**Root Cause**: Package `@openauthjs/openauth` not installed in node_modules
```typescript
// backend/index.ts:18-19
// TODO: Fix OpenAuthService - currently has import errors
// import { OpenAuthService } from "./services/OpenAuthService.js";
```

**Solution**:
```bash
cd backend
npm install @openauthjs/openauth valibot
npm run build  # Verify no import errors
```

**Files Affected**:
- `backend/services/OpenAuthService.ts` - Auth implementation
- `backend/index.ts` - Auth middleware disabled

**Impact**: All Phase 2 endpoints require authentication - cannot be enabled until this is fixed.

---

### Issue 2: Migration Not Applied to Production ⏳

**Problem**: Migration 007 applied to local DB only, remote failed

**Error**: Network fetch failed during remote execution

**Solution**:
```bash
# Retry remote migration (may need better network)
npx wrangler d1 execute hararemetro_articles --remote --file=database/migrations/007_user_engagement_complete.sql

# Verify tables created
npx wrangler d1 execute hararemetro_articles --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'article_comments';"
```

**Status**: ⏳ Needs retry when network is stable

---

### Issue 3: Database Name Fixed ✅

**Problem**: All wrangler configs referenced wrong database name

**Solution**: ✅ FIXED (2025-10-28)
- Updated [wrangler.jsonc](wrangler.jsonc#L40)
- Updated [backend/wrangler.jsonc](backend/wrangler.jsonc#L40)
- Updated all documentation

**New Name**: `hararemetro_articles` (UUID: 70d94fe9-4a78-4926-927b-e88e37141a54)

---

## 📋 Step-by-Step Completion Plan

### Week 1: Fix Blockers & Enable Backend

#### Day 1: Fix Authentication
**Goal**: Get OpenAuthService working

**Tasks**:
1. ✅ Install missing dependencies:
   ```bash
   cd backend
   npm install @openauthjs/openauth@^0.4.3 valibot@^1.1.0
   ```

2. Test import:
   ```bash
   npm run build
   ```

3. If build succeeds, uncomment in `backend/index.ts`:
   ```typescript
   import { OpenAuthService } from "./services/OpenAuthService.js";
   ```

4. Test authentication flow:
   - Create test user
   - Generate token
   - Verify token validation works

**Success Criteria**:
- ✅ No import errors
- ✅ Build passes
- ✅ Auth middleware can be enabled

---

#### Day 2: Apply Remote Migration
**Goal**: Create Phase 2 tables in production database

**Tasks**:
1. Retry remote migration:
   ```bash
   npx wrangler d1 execute hararemetro_articles --remote --file=database/migrations/007_user_engagement_complete.sql
   ```

2. Verify tables exist:
   ```bash
   npx wrangler d1 execute hararemetro_articles --remote --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
   ```

3. Verify table structure:
   ```bash
   npx wrangler d1 execute hararemetro_articles --remote --command="PRAGMA table_info(article_comments);"
   ```

**Success Criteria**:
- ✅ Migration executes without errors
- ✅ Tables `article_comments`, `comment_likes`, `user_follows` exist
- ✅ Indexes and triggers created

---

#### Day 3: Enable & Test Backend Endpoints
**Goal**: Verify all Phase 2 endpoints work with authentication

**Tasks**:
1. Enable authentication middleware in `backend/index.ts`

2. Deploy backend:
   ```bash
   npm run deploy:backend
   ```

3. Test each endpoint with curl/Postman:
   - Test like endpoint
   - Test save endpoint
   - Test comment endpoint
   - Test follow endpoint
   - Verify analytics tracking

4. Test error cases:
   - Invalid token
   - Missing required fields
   - Duplicate operations (like twice)

**Success Criteria**:
- ✅ All endpoints return 200 on success
- ✅ Auth validation works (401 for invalid tokens)
- ✅ Database writes succeed
- ✅ Analytics events logged

---

#### Day 4-5: Frontend Components - Article Engagement
**Goal**: Build UI for liking and saving articles

**Tasks**:
1. Create engagement components:
   - `app/components/ArticleLikeButton.tsx`
   - `app/components/ArticleSaveButton.tsx`
   - `app/components/ArticleViewTracker.tsx`

2. Add to article display:
   - Show like count
   - Show save status
   - Track views on mount

3. Add user feedback:
   - Toast notifications for actions
   - Optimistic UI updates
   - Error handling

4. Style with Zimbabwe flag colors:
   - Like button: red (#EF3340)
   - Save button: yellow (#FDD116)
   - Follow button: green (#00A651)

**Files to Create**:
- `app/components/ArticleLikeButton.tsx`
- `app/components/ArticleSaveButton.tsx`
- `app/hooks/useArticleEngagement.ts`

**Success Criteria**:
- ✅ Like button functional
- ✅ Save button functional
- ✅ View tracking automatic
- ✅ UI updates immediately
- ✅ Errors shown to user

---

### Week 2: Comments & Follows

#### Day 1-2: Comments System
**Goal**: Full comment functionality with replies

**Tasks**:
1. Create comment components:
   - `app/components/CommentForm.tsx`
   - `app/components/CommentList.tsx`
   - `app/components/CommentThread.tsx`
   - `app/components/CommentItem.tsx`

2. Features:
   - Add comment form below articles
   - Display comment threads
   - Reply to comments (nested)
   - Like comments
   - Moderation indicators

3. Real-time updates (optional):
   - Poll for new comments every 30s
   - Show "new comments" indicator

**Files to Create**:
- `app/components/comments/CommentForm.tsx`
- `app/components/comments/CommentList.tsx`
- `app/components/comments/CommentThread.tsx`
- `app/components/comments/CommentItem.tsx`
- `app/hooks/useComments.ts`

**Success Criteria**:
- ✅ Post comments
- ✅ Reply to comments
- ✅ Like comments
- ✅ Threaded display
- ✅ Character limit enforced

---

#### Day 3: Follow System
**Goal**: Allow users to follow sources and authors

**Tasks**:
1. Create follow components:
   - `app/components/FollowButton.tsx`
   - `app/components/FollowingList.tsx`

2. Add follow buttons to:
   - News source pages
   - Author profile pages
   - Category pages

3. Create "Following" page:
   - List followed sources
   - List followed authors
   - List followed categories
   - Unfollow actions

**Files to Create**:
- `app/components/FollowButton.tsx`
- `app/components/FollowingList.tsx`
- `app/routes/following.tsx` (new page)
- `app/hooks/useFollow.ts`

**Success Criteria**:
- ✅ Follow sources
- ✅ Follow authors
- ✅ Follow categories
- ✅ View following list
- ✅ Unfollow actions

---

#### Day 4: User Profile & Preferences
**Goal**: User account page with preferences

**Tasks**:
1. Create profile page:
   - `app/routes/profile.tsx`
   - Display user info
   - Edit preferences
   - View engagement history

2. Preferences to manage:
   - Email notifications
   - Comment moderation settings
   - Privacy settings
   - Display preferences

3. Show user statistics:
   - Articles liked
   - Articles saved
   - Comments posted
   - Sources followed

**Files to Create**:
- `app/routes/profile.tsx`
- `app/components/UserPreferences.tsx`
- `app/components/UserStats.tsx`
- `app/hooks/useUserProfile.ts`

**Success Criteria**:
- ✅ View profile
- ✅ Edit preferences
- ✅ See engagement stats
- ✅ Settings persist

---

#### Day 5: Integration Testing
**Goal**: Verify everything works together

**Tasks**:
1. Test complete user flows:
   - Register → Login → Like article → Comment → Follow author
   - View followed sources' articles
   - Update preferences

2. Test edge cases:
   - Like article twice (should unlike)
   - Comment with long text
   - Follow same source twice

3. Performance testing:
   - Page load times
   - API response times
   - Database query performance

4. Cross-browser testing:
   - Chrome
   - Safari
   - Firefox
   - Mobile browsers

**Success Criteria**:
- ✅ All flows work end-to-end
- ✅ No console errors
- ✅ Performance acceptable
- ✅ Mobile responsive

---

### Week 3: Polish & Deployment

#### Day 1: UI Polish
**Goal**: Refine user experience

**Tasks**:
1. Add loading states
2. Improve error messages
3. Add empty states
4. Optimize animations
5. Accessibility audit

---

#### Day 2: Documentation
**Goal**: Update all documentation

**Tasks**:
1. Update [CLAUDE.md](CLAUDE.md):
   - Document Phase 2 endpoints
   - Update API reference
   - Add authentication guide

2. Update [PROJECT-STATUS.md](PROJECT-STATUS.md):
   - Mark Phase 2 as 100% complete
   - Update feature matrix

3. Create user guide:
   - How to use engagement features
   - How to manage profile
   - Privacy and moderation

**Files to Update**:
- [CLAUDE.md](CLAUDE.md)
- [PROJECT-STATUS.md](PROJECT-STATUS.md)
- [README.md](README.md)
- Create `USER-GUIDE.md`

---

#### Day 3: Deployment
**Goal**: Deploy Phase 2 to production

**Tasks**:
1. Final testing on staging (local)

2. Deploy backend:
   ```bash
   npm run deploy:backend
   ```

3. Deploy frontend:
   ```bash
   npm run deploy
   ```

4. Verify production:
   - Check health endpoints
   - Test authentication
   - Test engagement features
   - Monitor error logs

5. Smoke testing on production

**Success Criteria**:
- ✅ Backend deployed successfully
- ✅ Frontend deployed successfully
- ✅ All features working on production
- ✅ No critical errors in logs

---

#### Day 4-5: Monitoring & Bug Fixes
**Goal**: Ensure stable production

**Tasks**:
1. Monitor Cloudflare Analytics:
   - API endpoint usage
   - Error rates
   - Response times

2. Monitor D1 database:
   - Query performance
   - Database size
   - Table growth

3. Collect user feedback

4. Fix any critical bugs discovered

5. Performance optimizations if needed

**Success Criteria**:
- ✅ Error rate < 1%
- ✅ API response time < 500ms avg
- ✅ No database issues
- ✅ Positive user feedback

---

## 📊 Success Metrics

### Phase 2 Complete When:

1. **Authentication** ✅
   - OpenAuthService working
   - Users can register/login
   - Tokens validated correctly
   - Sessions persisted

2. **Database** ✅
   - Migration 007 applied to production
   - All Phase 2 tables exist
   - Indexes and triggers working

3. **Backend APIs** ✅
   - All 9 endpoints deployed
   - All endpoints authenticated
   - Analytics tracking working
   - Error handling robust

4. **Frontend UI** ✅
   - Like/save buttons on articles
   - Comment system functional
   - Follow buttons on sources/authors
   - User profile page
   - Preferences management

5. **Documentation** ✅
   - CLAUDE.md updated
   - PROJECT-STATUS.md updated
   - API documentation complete
   - User guide created

6. **Production** ✅
   - Both workers deployed
   - All features working
   - Error rate acceptable
   - Performance acceptable

---

## 🔄 Next Phase: Phase 3

After Phase 2 is complete and stable (2-4 weeks of production use), we can consider Phase 3:

**Phase 3 Features**:
- Personalized feed algorithm
- User notifications system
- Reading analytics dashboard
- Advanced user preferences
- Reading streak tracking

**Note**: Phase 3 may revisit 3-worker architecture if user feature complexity requires separation of concerns.

---

## 🚨 Risk Management

### Risk 1: Authentication Complexity
**Mitigation**: Use proven OpenAuth library, start simple

### Risk 2: Performance Issues
**Mitigation**: Add indexes, implement caching, monitor analytics

### Risk 3: Moderation at Scale
**Mitigation**: Start with basic moderation, add ML filtering in Phase 4

### Risk 4: Database Growth
**Mitigation**: Monitor D1 size, implement data retention policies

---

## 📞 Support

**Issues**: Track in [GitHub Issues](https://github.com/your-repo/harare-metro/issues)
**Documentation**: [CLAUDE.md](CLAUDE.md)
**Status**: [PROJECT-STATUS.md](PROJECT-STATUS.md)

---

**Created**: 2025-10-28
**Last Updated**: 2025-10-28
**Owner**: Bryan Fawcett
**Development**: Claude Code

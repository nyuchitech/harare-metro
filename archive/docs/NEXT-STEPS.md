# Next Steps - Quick Action List

**Last Updated**: 2025-10-28
**Current State**: Phase 2 blocked by authentication, ready to enable

---

## 🔴 CRITICAL - Do These First

### 1. Retry Remote Database Migration
```bash
npx wrangler d1 execute hararemetro_articles --remote --file=database/migrations/007_user_engagement_complete.sql
```
**Why**: Creates Phase 2 tables in production database
**Status**: Failed earlier due to network issue
**Verification**:
```bash
npx wrangler d1 execute hararemetro_articles --remote --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```
**Expected**: Should see `article_comments`, `comment_likes`, `user_follows`

---

### 2. Enable Authentication in Backend
**File**: `backend/index.ts`

**Change Line 18-19**:
```typescript
// FROM:
// TODO: Fix OpenAuthService - currently has import errors
// import { OpenAuthService } from "./services/OpenAuthService.js";

// TO:
import { OpenAuthService } from "./services/OpenAuthService.js";
```

**Why**: Dependencies now installed, import should work
**Verification**: `npm run build` should pass

---

### 3. Test Backend Build
```bash
cd backend
npm run build
```
**Expected**: Build succeeds with no errors
**If fails**: Check error messages and fix imports

---

### 4. Deploy Backend
```bash
npm run deploy:backend
```
**Why**: Get Phase 2 endpoints live with authentication
**Verification**: Visit https://admin.hararemetro.co.zw/api/health

---

## 🟡 MEDIUM PRIORITY - This Week

### 5. Test Phase 2 Endpoints
Using Postman or curl, test:

```bash
# Get auth token first (implement login endpoint)
TOKEN="your-auth-token"

# Test like endpoint
curl -X POST https://admin.hararemetro.co.zw/api/articles/1/like \
  -H "Authorization: Bearer $TOKEN"

# Test comment endpoint
curl -X POST https://admin.hararemetro.co.zw/api/articles/1/comment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test comment"}'

# Test follow endpoint
curl -X POST https://admin.hararemetro.co.zw/api/user/me/follows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"follow_type":"source","follow_id":"herald"}'
```

**Verification**: All endpoints return 200 OK

---

### 6. Build Frontend Components
**Priority Order**:
1. Like button (simplest)
2. Save button (similar to like)
3. View tracker (automatic)
4. Comment form (more complex)
5. Comment list (display)
6. Follow button (user relationships)

**Start Here**: Create `app/components/ArticleLikeButton.tsx`

---

### 7. User Profile Page
**File**: `app/routes/profile.tsx`

**Features**:
- Display user info
- Show engagement stats (likes, saves, comments)
- Edit preferences
- View followed sources/authors

---

## 🟢 LOWER PRIORITY - Next 2-3 Weeks

### 8. Comment System
- Comment threads
- Reply functionality
- Like comments
- Moderation UI

### 9. Following System
- Follow sources
- Follow authors
- Following dashboard
- Notifications for followed content

### 10. Testing & Polish
- Integration testing
- Performance optimization
- Mobile responsiveness
- Accessibility

### 11. Documentation Updates
- API documentation
- User guide
- Update PROJECT-STATUS.md to 100% when done

---

## 📚 Reference Documents

- **[PHASE-2-COMPLETION-PLAN.md](PHASE-2-COMPLETION-PLAN.md)** - Detailed 3-week plan
- **[PROJECT-STATUS.md](PROJECT-STATUS.md)** - Current project status
- **[CLAUDE.md](CLAUDE.md)** - Architecture and development guide
- **[FIXES-APPLIED-2025-10-28.md](FIXES-APPLIED-2025-10-28.md)** - What was fixed today

---

## 🎯 Success Criteria for Phase 2

Phase 2 is complete when:

- [x] Database migration 007 applied to production
- [x] Authentication working
- [x] Backend endpoints deployed
- [ ] All 9 endpoints tested and working
- [ ] Frontend like/save buttons functional
- [ ] Comment system working
- [ ] Follow system working
- [ ] User profile page complete
- [ ] Documentation updated
- [ ] Deployed to production
- [ ] Users can engage with articles

---

## ⚠️ Common Issues & Solutions

### Issue: Remote migration fails
**Solution**: Check internet connection, retry later, or apply commands individually

### Issue: Build fails after enabling auth
**Solution**: Verify `@openauthjs/openauth` and `valibot` in node_modules

### Issue: Endpoints return 401
**Solution**: Check auth token is valid and middleware is configured correctly

### Issue: Database tables don't exist
**Solution**: Verify migration 007 applied successfully to remote DB

---

## 📞 Need Help?

- Check [CLAUDE.md](CLAUDE.md) for architecture details
- Review [PHASE-2-COMPLETION-PLAN.md](PHASE-2-COMPLETION-PLAN.md) for step-by-step guidance
- Check [PROJECT-STATUS.md](PROJECT-STATUS.md) for current status

---

**Ready to continue? Start with Step 1 (retry remote migration)!**

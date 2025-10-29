# Phase 3 - REVISED PLAN
## Major Architectural Change Approval

**Date**: 2025-10-24
**Change Type**: Architecture - Add Third Worker & Separate Database

---

## 🏗️ NEW Architecture (3-Worker System)

### Current (2 Workers):
```
1. www.hararemetro.co.zw - Frontend (React Router 7)
2. admin.hararemetro.co.zw - Admin Panel + Backend APIs
```

### **REVISED (3 Workers)**:
```
1. www.hararemetro.co.zw - Frontend (React Router 7)
2. admin.hararemetro.co.zw - Admin Panel ONLY
3. account.hararemetro.co.zw - User Management & Auth (NEW)
```

---

## 🗄️ Database Architecture Change

### Current: Single Database
- `hararemetro_db` - Everything (articles, users, analytics)

### **REVISED: Two Databases**
- `hararemetro_db` - Content (articles, categories, sources, authors)
- `hararemetro_users_db` - Users (auth, profiles, preferences, notifications) **NEW**

---

## 📋 REVISED Phase 3 Breakdown

### **Phase 3a: Account Worker Setup** (NEW)
**Objective**: Create account.hararemetro.co.zw worker with separate user database

**Tasks**:
1. Create `/account` directory structure
2. Create `account/wrangler.jsonc` configuration
3. Create `account/index.ts` entry point
4. Create separate D1 database: `hararemetro_users_db`
5. Migrate user tables to new database (migration 008)
6. Set up authentication (OpenAuth)
7. Create account management UI

**New Database Tables** (`hararemetro_users_db`):
- `users` (moved from main DB)
- `user_sessions` (moved)
- `user_preferences` (moved)
- `user_bookmarks` (moved)
- `user_likes` (moved)
- `user_reading_history` (moved)
- `user_follows` (moved)
- `notifications` (NEW)
- `keywords` (NEW - like categories)

---

### **Phase 3b: User Features APIs** (UPDATED)
**Objective**: Implement 6 user-facing endpoints in account worker

**Endpoints** (on account.hararemetro.co.zw):
1. `GET /api/user/me/profile`
2. `PUT /api/user/me/profile`
3. `GET /api/user/me/history`
4. `GET /api/user/me/analytics`
5. `GET /api/user/me/feed`
6. `GET /api/user/me/notifications`

**Plus Auth Endpoints**:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`

---

## 📁 New Directory Structure

```
/harare-metro
├── workers/              # Frontend worker
│   └── app.ts           # www.hararemetro.co.zw
│
├── backend/             # Backend worker (admin only)
│   ├── index.ts         # admin.hararemetro.co.zw
│   ├── wrangler.jsonc
│   ├── admin/
│   └── services/
│
├── account/             # NEW - Account worker
│   ├── index.ts         # account.hararemetro.co.zw (entry point)
│   ├── wrangler.jsonc   # Account worker config
│   ├── package.json     # Account dependencies
│   ├── pages/           # Auth UI (login, register, profile)
│   │   ├── login.html
│   │   ├── register.html
│   │   └── profile.html
│   └── services/
│       ├── AuthService.ts
│       ├── UserService.ts
│       └── NotificationService.ts
│
├── database/
│   ├── content/         # NEW - Content DB migrations
│   │   └── schema.sql   # hararemetro_db
│   └── users/           # NEW - Users DB migrations
│       └── schema.sql   # hararemetro_users_db
```

---

## 🔄 Cross-Worker Communication

### How Workers Interact:

**Frontend → Account Worker**:
- User login/register → account.hararemetro.co.zw
- Profile updates → account.hararemetro.co.zw
- Reading history → account.hararemetro.co.zw

**Frontend → Backend Worker**:
- Fetch articles → admin.hararemetro.co.zw/api/feeds
- Search → admin.hararemetro.co.zw/api/search

**Backend → Account Worker** (for user validation):
- Verify user ID when posting comments
- Check user preferences for personalization

**Account → Backend** (for content):
- Fetch articles for personalized feed
- Get article data for reading history

---

## 🔐 Authentication Flow (Revised)

```
1. User visits www.hararemetro.co.zw
2. Clicks "Login" → Redirects to account.hararemetro.co.zw/login
3. User logs in → Session created in hararemetro_users_db
4. Redirect back to www.hararemetro.co.zw with auth cookie
5. Frontend includes auth token in API calls
6. Account worker validates token
```

---

## 📊 Database Migration Strategy

### Step 1: Create New Database
```bash
npx wrangler d1 create hararemetro_users_db
```

### Step 2: Move User Tables
Create migration to:
1. Create user tables in `hararemetro_users_db`
2. Copy existing user data (if any)
3. Drop user tables from `hararemetro_db`

### Step 3: Update Bindings
- Frontend: No user DB access
- Backend: Read-only access to user DB (for verification)
- Account: Full access to user DB

---

## 🚀 Deployment Strategy

### New Deployment Commands:
```json
{
  "scripts": {
    "deploy:frontend": "npx wrangler deploy",
    "deploy:backend": "cd backend && npx wrangler deploy",
    "deploy:account": "cd account && npx wrangler deploy",
    "deploy:all": "npm run deploy:frontend && npm run deploy:backend && npm run deploy:account"
  }
}
```

### GitHub Actions Update:
Add account worker deployment to `.github/workflows/deploy.yml`

---

## 📝 Keywords Table (NEW Requirement)

**Purpose**: Like categories but for content tagging/filtering

```sql
CREATE TABLE IF NOT EXISTS keywords (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category_id TEXT REFERENCES categories(id),
  usage_count INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Relationship**:
- Keywords belong to categories
- Articles can have multiple keywords (via `article_keywords` table)
- Users can follow keywords (via `user_follows` where follow_type='keyword')

---

## ⚙️ wrangler.jsonc Configurations

### account/wrangler.jsonc (NEW):
```jsonc
{
  "name": "harare-metro-account",
  "main": "./index.ts",
  "compatibility_date": "2024-01-01",
  "routes": [
    { "pattern": "account.hararemetro.co.zw/*", "zone_name": "hararemetro.co.zw" }
  ],
  "d1_databases": [
    {
      "binding": "USERS_DB",
      "database_name": "hararemetro_users_db",
      "database_id": "TBD"
    },
    {
      "binding": "CONTENT_DB",
      "database_name": "hararemetro_db",
      "database_id": "TBD"
    }
  ],
  "kv_namespaces": [
    {
      "binding": "AUTH_SESSIONS",
      "id": "TBD"
    }
  ],
  "vars": {
    "NODE_ENV": "production",
    "BACKEND_URL": "https://admin.hararemetro.co.zw",
    "FRONTEND_URL": "https://www.hararemetro.co.zw"
  }
}
```

---

## 🎯 Phase 3 Revised Timeline

### Phase 3a: Account Worker (Week 1)
- [ ] Create account worker directory structure
- [ ] Set up wrangler config for account.hararemetro.co.zw
- [ ] Create hararemetro_users_db database
- [ ] Migrate user tables from main DB
- [ ] Implement authentication (OpenAuth)
- [ ] Create login/register UI pages
- [ ] Test auth flow

### Phase 3b: User Features (Week 2)
- [ ] Implement 6 user endpoints
- [ ] Create keywords table
- [ ] Implement notifications system
- [ ] Test cross-worker communication
- [ ] Update documentation

---

## 🔍 Questions Before Implementation:

1. **Database Migration**: Should we migrate existing user data or start fresh?
2. **Authentication Method**: OpenAuth or custom JWT implementation?
3. **Session Storage**: KV namespace or D1 database for sessions?
4. **Admin Access**: Should admin.hararemetro.co.zw also use account worker for auth?
5. **API Keys**: Should backend-to-account communication use API keys?
6. **Keywords Scope**: Should keywords be in user DB or content DB?

---

## 📈 Impact Assessment

### Complexity: **HIGH**
- New worker setup
- Database separation
- Cross-worker auth
- Data migration

### Benefits: **VERY HIGH**
- Clear separation of concerns
- Scalable architecture
- Independent scaling per domain
- Better security (user data isolated)

### Timeline: **2-3 weeks** (instead of 1 week)

---

**Awaiting Approval to Proceed with Phase 3a (Account Worker Setup)**

Should I:
1. Start with Phase 3a (create account worker)?
2. Answer the 6 questions above first?
3. Create a detailed implementation spec for review?

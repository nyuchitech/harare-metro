# Deploy Consolidated Schema to Cloudflare D1

## Prerequisites

1. **Cloudflare Account**: Access to Harare Metro account
2. **Wrangler CLI**: Installed and authenticated
   ```bash
   npm install -g wrangler
   wrangler login
   ```
3. **D1 Database**: Existing database `hararemetro_articles` (ID: 70d94fe9-4a78-4926-927b-e88e37141a54)

## Database Information

- **Database Name**: `hararemetro_articles`
- **Database ID**: `70d94fe9-4a78-4926-927b-e88e37141a54`
- **Account ID**: `125a2dfbc21f76a25c980609609e8218`
- **Binding**: `DB` (used in workers)

## Step 1: Apply Consolidated Schema to Production

### Option A: Apply Full Schema (Recommended for New DB)
```bash
# Navigate to project root
cd /Users/bfawcett/Github/harare-metro

# Apply consolidated schema to production D1
npx wrangler d1 execute hararemetro_articles --file=./database/consolidated_schema.sql --remote

# Verify schema was applied
npx wrangler d1 execute hararemetro_articles --remote --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

### Option B: Apply to Local D1 First (Recommended for Testing)
```bash
# Create local D1 database for testing
npx wrangler d1 execute hararemetro_articles --file=./database/consolidated_schema.sql --local

# Test queries locally
npx wrangler d1 execute hararemetro_articles --local --command="SELECT COUNT(*) as table_count FROM sqlite_master WHERE type='table';"

# If everything works, apply to remote
npx wrangler d1 execute hararemetro_articles --file=./database/consolidated_schema.sql --remote
```

## Step 2: Seed Initial Data

After applying the schema, seed with initial categories and news sources:

```bash
# Apply seed data (categories, news sources, trusted domains)
npx wrangler d1 execute hararemetro_articles --file=./database/migrations/002_seed_initial_data.sql --remote
```

## Step 3: Create Super Admin User

Create the super admin account for backend access:

```bash
# Run super admin creation script
npx wrangler d1 execute hararemetro_articles --remote --command="
INSERT INTO users (id, email, username, display_name, role, status, email_verified, login_count, analytics_consent, preferences, created_at, updated_at)
VALUES ('admin-001', 'bryan@nyuchi.com', 'bryanceo', 'Bryan Fawcett', 'super_admin', 'active', 1, 0, 1, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(email) DO UPDATE SET role='super_admin';
"
```

### Set Super Admin Password

The password will be set on first login, or you can pre-hash it:

```javascript
// Use backend/services/PasswordHashService.ts to generate hash
import { hashPassword } from './backend/services/PasswordHashService';

const password = 'your-secure-password';
const hash = await hashPassword(password);
// Returns format: "salt:hash"
```

Then update the user:
```bash
npx wrangler d1 execute hararemetro_articles --remote --command="
UPDATE users SET password_hash='<generated-hash>' WHERE email='bryan@nyuchi.com';
"
```

## Step 4: Test Local Development with Remote D1

### Configure Local Dev to Use Remote D1

Update `.dev.vars` (create if doesn't exist):
```env
# .dev.vars (NOT committed to git)
NODE_ENV=development
LOG_LEVEL=debug
```

### Run Backend Worker Locally Against Remote D1
```bash
cd backend
npx wrangler dev --remote
```

This will:
- Run backend worker locally
- Connect to **remote** D1 database (production data)
- Allow testing with real data locally

### Query Remote D1 Directly
```bash
# Count articles
npx wrangler d1 execute hararemetro_articles --remote --command="SELECT COUNT(*) as count FROM articles;"

# Get recent articles
npx wrangler d1 execute hararemetro_articles --remote --command="SELECT id, title, source, published_at FROM articles ORDER BY published_at DESC LIMIT 10;"

# Check categories
npx wrangler d1 execute hararemetro_articles --remote --command="SELECT * FROM categories ORDER BY sort_order;"

# Check news sources
npx wrangler d1 execute hararemetro_articles --remote --command="SELECT id, name, enabled, last_fetched_at FROM news_sources WHERE enabled=1;"
```

## Step 5: Test Mobile App with D1 Data

### Run Backend Worker Locally
```bash
# Terminal 1: Start backend worker
cd backend
npx wrangler dev --remote --port 3000

# This exposes backend at http://localhost:3000
```

### Update Mobile App API Configuration
In `mobile/api/client.js`, ensure BASE_URL points to local backend:
```javascript
const BASE_URL = __DEV__
  ? 'http://localhost:3000'  // Local backend with remote D1
  : 'https://news.mukoko.com';  // Production
```

### Run Mobile App
```bash
# Terminal 2: Start mobile app
cd mobile
npx expo start --clear
```

The mobile app will now:
- Connect to local backend (http://localhost:3000)
- Backend connects to remote D1 (production data)
- Test real data without affecting production workers

## Step 6: Verify Data Migration

### Check Table Counts
```bash
npx wrangler d1 execute hararemetro_articles --remote --command="
SELECT 'articles' as table_name, COUNT(*) as count FROM articles
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'news_sources', COUNT(*) FROM news_sources
UNION ALL
SELECT 'authors', COUNT(*) FROM authors
UNION ALL
SELECT 'article_comments', COUNT(*) FROM article_comments
UNION ALL
SELECT 'user_bookmarks', COUNT(*) FROM user_bookmarks
UNION ALL
SELECT 'user_likes', COUNT(*) FROM user_likes;
"
```

### Verify Indexes
```bash
npx wrangler d1 execute hararemetro_articles --remote --command="
SELECT name, tbl_name FROM sqlite_master WHERE type='index' ORDER BY tbl_name, name;
"
```

### Verify Triggers
```bash
npx wrangler d1 execute hararemetro_articles --remote --command="
SELECT name, tbl_name FROM sqlite_master WHERE type='trigger' ORDER BY tbl_name, name;
"
```

## Step 7: Production Deployment

Once everything is tested locally:

### Deploy Frontend Worker
```bash
cd /Users/bfawcett/Github/harare-metro
npm run deploy
```

### Deploy Backend Worker
```bash
cd backend
npm run deploy
```

Both workers will now use the updated D1 schema.

## Troubleshooting

### Issue: Schema Already Exists
If you get "table already exists" errors:

**Option 1: Drop and Recreate (⚠️ Destroys Data)**
```bash
# List all tables
npx wrangler d1 execute hararemetro_articles --remote --command="SELECT name FROM sqlite_master WHERE type='table';"

# Drop specific table
npx wrangler d1 execute hararemetro_articles --remote --command="DROP TABLE IF EXISTS table_name;"

# Then reapply schema
npx wrangler d1 execute hararemetro_articles --file=./database/consolidated_schema.sql --remote
```

**Option 2: Add Missing Tables Only**
Extract CREATE TABLE statements for missing tables from `consolidated_schema.sql` and run them individually.

### Issue: Cannot Connect to D1 Locally
Make sure you're using `--remote` flag:
```bash
npx wrangler dev --remote
```

Without `--remote`, wrangler uses a local SQLite file which won't have your data.

### Issue: Mobile App Shows Network Errors
1. Check backend is running: `curl http://localhost:3000/api/health`
2. Check mobile BASE_URL matches backend port
3. Verify backend can connect to D1: Check backend logs

### Issue: Authentication Not Working
1. Verify `AUTH_STORAGE` KV namespace exists
2. Check password hash format (should be `salt:hash`)
3. Verify user role is `admin` or `super_admin` for backend access

## Useful D1 Commands

### List All Tables
```bash
npx wrangler d1 execute hararemetro_articles --remote --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

### Describe Table Schema
```bash
npx wrangler d1 execute hararemetro_articles --remote --command="PRAGMA table_info(articles);"
```

### Export Data (Backup)
```bash
npx wrangler d1 export hararemetro_articles --remote --output=./backup-$(date +%Y%m%d).sql
```

### Import Data (Restore)
```bash
npx wrangler d1 execute hararemetro_articles --remote --file=./backup-20250425.sql
```

## Next Steps

After successful deployment:

1. **Trigger RSS Refresh**: Visit admin panel or call `/api/refresh-rss`
2. **Test Mobile App**: Open Mukoko News mobile app
3. **Verify Feed**: Check articles load in mobile feed
4. **Test Engagement**: Try like, bookmark, comment features
5. **Monitor Logs**: Check Cloudflare Workers dashboard for errors

## Security Checklist

- [ ] Super admin password set and secure
- [ ] AUTH_STORAGE KV namespace configured
- [ ] CORS configured correctly in backend
- [ ] Rate limiting enabled on auth endpoints
- [ ] Security headers configured (HSTS, CSP, etc.)
- [ ] Audit log tracking enabled
- [ ] Session expiry set to 7 days

## Performance Checklist

- [ ] All indexes created (89 indexes)
- [ ] All triggers enabled (29 triggers)
- [ ] Caching configured in frontend
- [ ] Analytics Engine configured
- [ ] Vectorize index configured (optional)

## Database Metrics

Expected performance with consolidated schema:
- **Articles Query**: <50ms for 20 articles with pagination
- **Search Query**: <100ms full-text search on 10K articles
- **User Auth**: <30ms session validation
- **Like/Bookmark**: <20ms optimistic update

## Support

For issues or questions:
1. Check `CONSOLIDATED_SCHEMA_README.md` for schema documentation
2. Review `CLAUDE.md` for development guidelines
3. Check Cloudflare Workers logs for errors
4. Verify D1 database status in Cloudflare dashboard

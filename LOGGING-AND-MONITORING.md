# Logging and Monitoring Guide

**Last Updated**: 2025-10-29
**Workers**: Frontend (www) + Backend (admin)

---

## ✅ Configuration Applied

Both workers now have observability and logging enabled:
- ✅ Real-time log streaming enabled
- ✅ Observability enabled
- ✅ Source maps uploaded for debugging
- ✅ Preview URLs enabled for testing

---

## 🔍 View Logs in Cloudflare Dashboard

### Method 1: Cloudflare Dashboard (Web UI)

#### Frontend Worker (www.hararemetro.co.zw)
1. Go to: https://dash.cloudflare.com/
2. Select your account: **Nyuchi Web Services**
3. Click **Workers & Pages** in left sidebar
4. Click **harare-metro-frontend**
5. Click **Logs** tab
6. View real-time logs

**Or direct link**:
```
https://dash.cloudflare.com/[account-id]/workers/services/view/harare-metro-frontend/production/logs
```

#### Backend Worker (admin.hararemetro.co.zw)
1. Go to: https://dash.cloudflare.com/
2. Select your account: **Nyuchi Web Services**
3. Click **Workers & Pages**
4. Click **harare-metro-backend**
5. Click **Logs** tab
6. View real-time logs

**Or direct link**:
```
https://dash.cloudflare.com/[account-id]/workers/services/view/harare-metro-backend/production/logs
```

### Features in Dashboard:
- **Real-time streaming** - See logs as they happen
- **Filtering** - Filter by log level (info, warn, error)
- **Search** - Search log messages
- **Time range** - View logs from specific time periods
- **Export** - Download logs for analysis

---

## 🖥️ View Logs via Wrangler CLI

### Method 2: Command Line (Real-time Tail)

#### Frontend Worker Logs
```bash
npx wrangler tail harare-metro-frontend
```

**With filters**:
```bash
# Only show errors
npx wrangler tail harare-metro-frontend --status error

# Only show specific methods
npx wrangler tail harare-metro-frontend --method POST

# Filter by header (e.g., specific user)
npx wrangler tail harare-metro-frontend --header "X-User-ID: 123"

# Filter by sampling rate (10% of requests)
npx wrangler tail harare-metro-frontend --sampling-rate 0.1

# Pretty print JSON
npx wrangler tail harare-metro-frontend --format pretty
```

#### Backend Worker Logs
```bash
npx wrangler tail harare-metro-backend
```

**With filters**:
```bash
# Only show errors
npx wrangler tail harare-metro-backend --status error

# Only show slow requests (>1000ms)
npx wrangler tail harare-metro-backend --status ok --ip 0.0.0.0

# Combine filters
npx wrangler tail harare-metro-backend --status error --method POST
```

### Log Output Format

```
GET https://www.hararemetro.co.zw/ - Ok @ 11/29/2025, 7:00:00 AM
├ [INFO] Request received: GET /
├ [INFO] Fetching articles from D1
├ [INFO] Found 50 articles
└ [INFO] Response time: 145ms
```

---

## 📊 Log Levels

### Frontend Worker Logs

**Common Log Prefixes**:
- `[CRON]` - Scheduled RSS refresh triggers
- `[API]` - API endpoint calls
- `[SSR]` - Server-side rendering
- `[ERROR]` - Errors and exceptions
- `[WORKER]` - Worker initialization

**Example Logs**:
```javascript
// In workers/app.ts
console.log('[CRON] RSS refresh triggered at', new Date());
console.log('[API] Fetching feeds with limit:', limit);
console.error('[ERROR] Database query failed:', error);
```

### Backend Worker Logs

**Common Log Prefixes**:
- `[API]` - API endpoint requests
- `[RSS]` - RSS feed processing
- `[AI]` - AI content processing
- `[AUTH]` - Authentication operations
- `[DB]` - Database operations
- `[ERROR]` - Errors and exceptions

**Example Logs**:
```javascript
// In backend/index.ts
console.log('[API] POST /api/refresh-rss started');
console.log('[RSS] Processing 15 news sources');
console.log('[AI] Extracting authors from article');
console.error('[ERROR] OpenAuth token validation failed:', error);
```

---

## 🚀 Preview URLs for Testing

### What are Preview URLs?

Preview URLs let you test changes before deploying to production:
- Temporary URLs for each deployment
- Test new features safely
- Share with team for review
- No impact on production

### How to Deploy with Preview

#### Option 1: Deploy to Preview
```bash
# Frontend
npx wrangler deploy --env preview

# Backend
cd backend && npx wrangler deploy --env preview
```

#### Option 2: Use Wrangler Dev (Local Preview)
```bash
# Frontend (opens on localhost:8787)
npm run dev

# Backend (opens on localhost:8788)
npm run dev:backend
```

### Preview URLs Configuration

Preview URLs are automatically generated when you:
1. Deploy without `--env production` flag
2. Push to GitHub (if CI/CD configured)
3. Use `wrangler dev` for local testing

**Preview URL Format**:
```
Frontend: https://harare-metro-frontend.[hash].workers.dev
Backend:  https://harare-metro-backend.[hash].workers.dev
```

---

## 🔍 Monitoring Best Practices

### 1. Watch for Errors
```bash
# Monitor backend for errors
npx wrangler tail harare-metro-backend --status error
```

**Common Errors to Watch**:
- Database connection failures
- Authentication failures
- RSS feed parsing errors
- AI processing timeouts
- Rate limit exceeded

### 2. Monitor Performance
```bash
# Watch for slow requests
npx wrangler tail harare-metro-backend --status ok
```

**Performance Metrics**:
- Response time (should be < 500ms avg)
- Database query time (should be < 100ms)
- AI processing time (varies, 1-5s acceptable)
- Memory usage (check dashboard)

### 3. Track User Engagement
Look for Phase 2 endpoint usage:
```bash
# Monitor like/save/comment endpoints
npx wrangler tail harare-metro-backend --method POST | grep "/api/articles"
```

### 4. Monitor Cron Jobs
```bash
# Watch RSS refresh execution
npx wrangler tail harare-metro-frontend | grep "\[CRON\]"
```

**Expected**: Runs every hour (0 * * * *)

---

## 📈 Analytics in Cloudflare Dashboard

### Worker Analytics

1. Go to Cloudflare Dashboard
2. Click **Workers & Pages**
3. Select worker
4. Click **Analytics** tab

**Available Metrics**:
- Requests per second
- Errors per second
- CPU time
- Duration (p50, p75, p99)
- Status codes distribution

### Analytics Engine Data

Your workers send custom analytics:

**Frontend Analytics**:
- Category clicks
- News interactions
- Search queries

**Backend Analytics**:
- News analytics
- Search analytics
- Category analytics
- User analytics
- Performance analytics

**Query Analytics**:
```bash
# View analytics in dashboard or via SQL
# https://dash.cloudflare.com/[account]/analytics-engine
```

---

## 🚨 Setting Up Alerts

### Email Alerts for Errors

1. Go to Cloudflare Dashboard
2. Click **Notifications** in left sidebar
3. Click **Add**
4. Choose **Workers** category
5. Select **Script exceptions**
6. Configure:
   - Worker: harare-metro-backend
   - Threshold: >10 errors/minute
   - Email: your-email@example.com

### Slack/Discord Webhooks

Create custom alerts using Workers KV and webhooks:

```typescript
// In backend/index.ts
async function notifyError(error: Error) {
  if (env.NODE_ENV === 'production') {
    // Send to Slack
    await fetch(env.SLACK_WEBHOOK, {
      method: 'POST',
      body: JSON.stringify({
        text: `❌ Error in backend: ${error.message}`,
        attachments: [{
          color: 'danger',
          text: error.stack
        }]
      })
    });
  }
}
```

---

## 🔧 Debugging Tips

### 1. Enable Verbose Logging Locally

```bash
# Set LOG_LEVEL=debug in .dev.vars
echo "LOG_LEVEL=debug" >> .dev.vars

# Run with debug logs
npm run dev
```

### 2. Add Console Logs

```typescript
// In any worker file
console.log('[DEBUG] Variable value:', someVar);
console.log('[DEBUG] Request headers:', Object.fromEntries(request.headers));
console.log('[DEBUG] Database result:', dbResult);
```

### 3. Use wrangler tail with JSON output

```bash
# Save logs to file
npx wrangler tail harare-metro-backend --format json > logs.json

# Analyze with jq
cat logs.json | jq '.outcome'
cat logs.json | jq 'select(.outcome == "exception")'
```

### 4. Test Locally Before Deploying

```bash
# Always test locally first
npm run dev        # Frontend
npm run dev:backend  # Backend

# Then deploy to preview
npx wrangler deploy --env preview

# Finally deploy to production
npm run deploy
```

---

## 📋 Common Log Patterns

### Successful Request
```
[INFO] Request received: POST /api/articles/1/like
[INFO] User authenticated: user-123
[INFO] Database write successful
[INFO] Analytics tracked
[INFO] Response: 200 OK (145ms)
```

### Failed Request
```
[INFO] Request received: POST /api/articles/1/like
[ERROR] Authentication failed: Invalid token
[ERROR] Response: 401 Unauthorized (12ms)
```

### RSS Refresh
```
[CRON] RSS refresh triggered
[INFO] Calling backend: https://admin.hararemetro.co.zw/api/refresh-rss
[INFO] Backend response: 200 OK
[INFO] Articles processed: 50
[INFO] Duration: 12.5s
```

### AI Processing
```
[AI] Processing article: "Zimbabwe Economy Update"
[AI] Extracting authors...
[AI] Found author: John Smith (Herald)
[AI] Classifying keywords...
[AI] Assigned categories: politics, economy
[AI] Quality score: 0.85
[AI] Processing complete (3.2s)
```

---

## 🎯 Quick Reference

### View Logs
```bash
# Real-time frontend logs
npx wrangler tail harare-metro-frontend

# Real-time backend logs
npx wrangler tail harare-metro-backend

# Only errors
npx wrangler tail harare-metro-backend --status error

# Pretty format
npx wrangler tail harare-metro-backend --format pretty
```

### Preview Deployments
```bash
# Deploy to preview
npx wrangler deploy --env preview

# Local development
npm run dev
npm run dev:backend
```

### Dashboard Links
- **Frontend Logs**: https://dash.cloudflare.com → Workers → harare-metro-frontend → Logs
- **Backend Logs**: https://dash.cloudflare.com → Workers → harare-metro-backend → Logs
- **Analytics**: https://dash.cloudflare.com → Analytics Engine

---

## 📞 Troubleshooting

### Issue: No logs appearing
**Solution**:
- Check observability is enabled in wrangler.jsonc ✅
- Verify worker is deployed
- Check Cloudflare account access

### Issue: Too many logs
**Solution**: Use filters
```bash
npx wrangler tail --status error  # Only errors
npx wrangler tail --sampling-rate 0.1  # 10% sampling
```

### Issue: Can't find specific log
**Solution**:
- Add unique log prefixes (e.g., `[AUTH]`, `[RSS]`)
- Use grep: `npx wrangler tail | grep "[AUTH]"`
- Search in dashboard UI

---

**Status**: ✅ Logging enabled for both workers
**Access**: Cloudflare Dashboard or `wrangler tail`
**Documentation**: This file

---

**Updated**: 2025-10-29
**By**: Claude Code

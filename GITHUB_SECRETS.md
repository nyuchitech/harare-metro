# GitHub Secrets Configuration

## All Secrets Must Be Stored in GitHub

**IMPORTANT**: Since deployment happens via GitHub Actions, ALL secrets must be configured in GitHub repository settings. Local `wrangler secret` commands are NOT used in production.

## Required GitHub Secrets

Configure these secrets in your GitHub repository settings:
**Settings → Secrets and variables → Actions → Repository secrets**

### Required Secrets

1. **`CLOUDFLARE_API_TOKEN`**
   - Cloudflare API token with Workers deployment permissions
   - Get from: Cloudflare Dashboard → My Profile → API Tokens
   - Permissions needed: Zone:Read, Zone:Edit, Account:Read, Workers:Edit

2. **`SUPABASE_URL`**
   - Must match frontend configuration exactly
   - Value: `https://oybatvdffsbaxwuxfetz.supabase.co`
   - Used by: GitHub Actions workflow for both projects

3. **`SUPABASE_SERVICE_KEY`**
   - Supabase service key for backend admin operations
   - Get from: Supabase Dashboard → Project Settings → API
   - Used by: GitHub Actions workflow for backend deployment
   - **WARNING**: This is different from `VITE_SUPABASE_ANON_KEY` used in frontend

### Optional Secrets

4. **`CLOUDFLARE_ACCOUNT_ID`** (Optional)
   - Required for Cloudflare Images integration
   - Get from: Cloudflare Dashboard → Right sidebar
   - Used by: GitHub Actions workflow for backend deployment

## Configuration Consistency

### Frontend (.env.local)
```bash
VITE_SUPABASE_URL=https://oybatvdffsbaxwuxfetz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Backend (GitHub Actions handles this automatically)

The GitHub Actions workflow automatically sets these backend secrets during deployment:

```bash
# These are run automatically by GitHub Actions - NOT manually
echo "${{ secrets.SUPABASE_URL }}" | wrangler secret put SUPABASE_URL
echo "${{ secrets.SUPABASE_SERVICE_KEY }}" | wrangler secret put SUPABASE_SERVICE_KEY  
echo "${{ secrets.CLOUDFLARE_ACCOUNT_ID }}" | wrangler secret put CLOUDFLARE_ACCOUNT_ID
```

### GitHub Actions Workflow

- GitHub Actions automatically sets backend secrets during deployment
- Frontend environment variables are bundled at build time from `.env.local`
- Both projects use the **same Supabase instance** with different access levels
- **No manual `wrangler secret` commands needed** - GitHub handles everything

## Key Points

1. **Same Supabase Instance**: Frontend and backend use the same Supabase project
2. **Different Keys**: Frontend uses anon key, backend uses service key
3. **Secret Management**: GitHub secrets are used for production deployment
4. **Consistency**: SUPABASE_URL must match between frontend .env.local and GitHub secret

## Verification

After setting secrets, verify deployment works by:
1. Push to main branch
2. Check GitHub Actions logs
3. Test endpoints:
   - Backend health: `https://admin.hararemetro.co.zw/api/health`
   - Frontend: `https://www.hararemetro.co.zw`
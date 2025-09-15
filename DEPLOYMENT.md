# Harare Metro - Deployment Guide

This guide covers deploying both the frontend and backend components of Harare Metro.

## Architecture Overview

**Monorepo Structure**: Both frontend and backend are in the same repository
- **Frontend**: `www.hararemetro.co.zw` (React Router SPA) - Root directory
- **Backend**: `admin.hararemetro.co.zw` (Hono API + Admin Interface) - `/backend` directory

## Prerequisites

1. **Cloudflare Account** with Workers enabled
2. **Supabase Project** set up for authentication
3. **GitHub Repository** with secrets configured
4. **Node.js 20+** installed locally

## Quick Deployment

### Using the Deploy Script (Recommended)

```bash
# Deploy both frontend and backend
npm run deploy:all

# Deploy just backend
npm run deploy:backend

# Deploy just frontend  
npm run deploy:frontend

# Test deployments
npm run deploy:test
```

### Manual Deployment

#### Backend Deployment

```bash
# From repository root:
cd backend

# Install dependencies
npm install

# Test build
npm run test

# Deploy to admin.hararemetro.co.zw
npm run deploy
```

#### Frontend Deployment

```bash
# Install dependencies
npm install

# Test build
npm run test

# Deploy to www.hararemetro.co.zw
npm run deploy
```

## Environment Configuration

### Frontend Environment Variables

The frontend uses these environment variables (in `.env.local`):

```bash
VITE_SUPABASE_URL=https://oybatvdffsbaxwuxfetz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Backend Secrets (GitHub Actions Only)

**IMPORTANT**: The backend uses the **same Supabase instance** as the frontend but with different access levels. All secrets are managed through GitHub Actions - NO manual `wrangler secret` commands needed.

The deployment pipeline automatically configures these secrets:

```bash
# GitHub Actions automatically runs these during deployment:
echo "${{ secrets.SUPABASE_URL }}" | wrangler secret put SUPABASE_URL
echo "${{ secrets.SUPABASE_SERVICE_KEY }}" | wrangler secret put SUPABASE_SERVICE_KEY  
echo "${{ secrets.CLOUDFLARE_ACCOUNT_ID }}" | wrangler secret put CLOUDFLARE_ACCOUNT_ID
```

**Key Point**: Frontend uses `VITE_SUPABASE_ANON_KEY` for user operations, backend uses `SUPABASE_SERVICE_KEY` for admin operations on the same Supabase project. All secrets come from GitHub repository settings.

### GitHub Actions Secrets

Set these in your GitHub repository settings:

- `CLOUDFLARE_API_TOKEN`: Cloudflare API token with Workers deployment permissions
- `SUPABASE_URL`: Must match frontend (https://oybatvdffsbaxwuxfetz.supabase.co)  
- `SUPABASE_SERVICE_KEY`: Supabase service key for backend admin operations
- `CLOUDFLARE_ACCOUNT_ID`: (Optional) For Cloudflare Images integration

## Project Scripts

### Frontend (`harare-metro`)

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Test build (without typecheck)
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run clean` - Clean caches and build artifacts
- `npm run deploy:all` - Deploy both frontend and backend

### Backend (`harare-metro-backend`)

- `npm run dev` - Start development server  
- `npm run build` - Build for production (dry run)
- `npm run test` - Test build
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run clean` - Clean caches and build artifacts

## CI/CD Pipeline

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that:

1. **Tests** both projects on every push/PR
2. **Deploys backend** first (on main branch)
3. **Deploys frontend** after backend succeeds
4. **Tests deployments** with health checks

### Workflow Triggers

- **Push to main**: Full deployment
- **Pull requests**: Testing only
- **Manual**: Can be triggered from GitHub Actions tab

## Database Setup

### D1 Database Migration

```bash
# Deploy schema to production
cd ../harare-metro-backend
npm run db:migrate

# For local development
npm run db:local
```

### Supabase Setup

The backend integrates with Supabase for user authentication:

1. Create tables for `profiles` with role-based access
2. Configure RLS (Row Level Security) policies
3. Set up authentication providers (email, OAuth)

## Monitoring and Health Checks

### Health Endpoints

- **Backend**: `https://admin.hararemetro.co.zw/api/health`
- **Frontend**: `https://www.hararemetro.co.zw`

### Admin Interface

Access the admin dashboard at: `https://admin.hararemetro.co.zw/admin`

**Note**: Requires admin role in Supabase profiles table.

## Image Storage

The system supports Cloudflare Images for optimized image storage:

1. **Automatic Processing**: RSS images are uploaded to Cloudflare Images
2. **Fallback System**: Uses image proxy if Cloudflare Images unavailable
3. **Multiple Variants**: Thumbnail, hero, and public sizes available

## Troubleshooting

### Common Issues

**Build Failures**: 
- Check TypeScript errors with `npm run typecheck`
- Ensure all dependencies are installed

**Deployment Failures**:
- Verify Cloudflare API token permissions
- Check wrangler.toml configuration
- Ensure secrets are properly set

**CORS Issues**:
- Verify backend allows frontend domain
- Check environment-specific API URLs

### Development Tips

```bash
# Clean install both projects
npm run install:clean
cd ../harare-metro-backend && npm run install:clean

# Build both projects
npm run test
cd ../harare-metro-backend && npm run test

# Run development servers
npm run dev  # Frontend on :5173
cd ../harare-metro-backend && npm run dev  # Backend on :8787
```

## Production Checklist

- [ ] Supabase secrets configured
- [ ] Cloudflare Images enabled (optional)
- [ ] GitHub Actions secrets set
- [ ] D1 database schema deployed
- [ ] RSS sources configured
- [ ] Admin users created in Supabase
- [ ] DNS records pointing to Cloudflare
- [ ] SSL certificates active

## Support

For deployment issues:

1. Check GitHub Actions logs
2. Verify Cloudflare Workers logs
3. Test API endpoints manually
4. Review Supabase authentication logs

---

🇿🇼 **Built for Zimbabwe's news community with Cloudflare Workers and Supabase**
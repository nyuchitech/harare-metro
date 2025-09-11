# Harare Metro Deployment Guide

This guide covers the complete deployment process for Harare Metro, including domain configuration, Supabase setup, and Cloudflare Workers deployment.

## 🚀 Prerequisites

Before deploying, ensure you have:

- [ ] Cloudflare account with Workers enabled
- [ ] Supabase account and project created
- [ ] Domain names registered (hararemetro.co.zw)
- [ ] Node.js 18+ and npm installed
- [ ] Wrangler CLI installed: `npm install -g wrangler`

## 📋 Step-by-Step Deployment

### 1. Supabase Setup

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new account
2. Create a new project
3. Note your project URL and anon key

#### Configure Authentication
1. Go to Authentication > Settings
2. Configure your site URL: `https://www.hararemetro.co.zw`
3. Add redirect URLs:
   - `https://www.hararemetro.co.zw/auth/callback`
   - `http://localhost:5173/auth/callback` (for development)

#### Set up OAuth Providers (Optional)
1. Go to Authentication > Providers
2. Configure Google OAuth:
   - Enable Google provider
   - Add your Google OAuth credentials
3. Configure GitHub OAuth:
   - Enable GitHub provider
   - Add your GitHub OAuth credentials

#### Create Database Tables
Run the SQL commands from the README in your Supabase SQL editor to create all necessary tables and policies.

### 2. Environment Configuration

#### Create Environment Files
Create `.env.local` for development:
```env
VITE_SUPABASE_URL=https://oybatvdffsbaxwuxfetz.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Update Wrangler Configuration
Update `wrangler.toml` with your specific values:
```toml
name = "harare-metro"
compatibility_date = "2025-05-01"

# Production Environment Variables
[vars]
NODE_ENV = "production"
SUPABASE_URL = "https://oybatvdffsbaxwuxfetz.supabase.co"
SUPABASE_ANON_KEY = "your_supabase_anon_key"
ADMIN_KEY = "your-secure-admin-key"

# Production Routes
[[routes]]
pattern = "www.hararemetro.co.zw/*"
zone_name = "hararemetro.co.zw"
```

### 3. Cloudflare Configuration

#### Create KV Namespaces
```bash
# Create production KV namespaces
wrangler kv:namespace create "NEWS_STORAGE"
wrangler kv:namespace create "CACHE_STORAGE"
wrangler kv:namespace create "USER_STORAGE"
wrangler kv:namespace create "CONFIG_STORAGE"

# Create preview KV namespaces
wrangler kv:namespace create "NEWS_STORAGE" --preview
wrangler kv:namespace create "CACHE_STORAGE" --preview
wrangler kv:namespace create "USER_STORAGE" --preview
wrangler kv:namespace create "CONFIG_STORAGE" --preview
```

#### Create D1 Database
```bash
# Create production database
wrangler d1 create harare-metro-db

# Create preview database
wrangler d1 create harare-metro-db --preview
```

#### Create Analytics Engine Datasets
```bash
# Create analytics datasets
wrangler analytics-engine create category_clicks
wrangler analytics-engine create news_interactions
wrangler analytics-engine create search_queries
```

### 4. Domain Configuration

#### DNS Setup
1. Go to your domain registrar (where you purchased hararemetro.co.zw)
2. Update nameservers to Cloudflare:
   ```
   ns1.cloudflare.com
   ns2.cloudflare.com
   ```

#### Cloudflare DNS Configuration
1. Add DNS records in Cloudflare:
   ```
   Type: A
   Name: @
   Content: 192.0.2.1 (or your preferred IP)
   Proxy: Enabled
   
   Type: A
   Name: www
   Content: 192.0.2.1 (or your preferred IP)
   Proxy: Enabled
   
   Type: A
   Name: app
   Content: 192.0.2.1 (or your preferred IP)
   Proxy: Enabled
   ```

#### SSL/TLS Configuration
1. Go to SSL/TLS settings in Cloudflare
2. Set SSL/TLS encryption mode to "Full (strict)"
3. Enable "Always Use HTTPS"

### 5. Build and Deploy

#### Install Dependencies
```bash
npm install
```

#### Build the Application
```bash
npm run build
```

#### Deploy to Cloudflare Workers
```bash
# Login to Wrangler
wrangler login

# Deploy to production
npm run deploy

# Deploy to preview environment
npm run deploy:preview
```

### 6. Post-Deployment Verification

#### Test Core Functionality
1. Visit `https://www.hararemetro.co.zw`
2. Test user registration and login
3. Verify news aggregation is working
4. Test bookmarks and likes functionality
5. Check analytics tracking

#### Monitor Logs
```bash
# View production logs
wrangler tail

# View preview logs
wrangler tail --env preview
```

#### Health Check
```bash
curl https://www.hararemetro.co.zw/api/health
```

## 🔧 Configuration Management

### Environment-Specific Configs

#### Development
```bash
# Use preview environment
npm run dev:preview
```

#### Staging
```bash
# Deploy to preview
npm run deploy:preview
```

#### Production
```bash
# Deploy to production
npm run deploy
```

### Secrets Management
```bash
# Set production secrets
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put ADMIN_KEY

# Set preview secrets
wrangler secret put SUPABASE_URL --env preview
wrangler secret put SUPABASE_ANON_KEY --env preview
wrangler secret put ADMIN_KEY --env preview
```

## 📊 Monitoring and Analytics

### Cloudflare Analytics
1. Enable Cloudflare Analytics in your dashboard
2. Monitor traffic patterns and performance
3. Set up alerts for errors and downtime

### Supabase Monitoring
1. Monitor database performance in Supabase dashboard
2. Check authentication logs
3. Monitor real-time subscriptions

### Application Monitoring
1. Set up error tracking (e.g., Sentry)
2. Monitor API response times
3. Track user engagement metrics

## 🔒 Security Considerations

### Environment Variables
- Never commit sensitive data to version control
- Use Wrangler secrets for production credentials
- Rotate keys regularly

### CORS Configuration
- Configure CORS properly for your domains
- Limit allowed origins to your production domains

### Rate Limiting
- Implement rate limiting for API endpoints
- Monitor for abuse and implement protection

### Data Protection
- Ensure GDPR compliance for user data
- Implement data retention policies
- Provide data export capabilities

## 🚨 Troubleshooting

### Common Issues

#### Deployment Failures
```bash
# Check Wrangler configuration
wrangler whoami
wrangler kv:namespace list

# Verify environment variables
wrangler secret list
```

#### Domain Issues
1. Check DNS propagation
2. Verify SSL certificate status
3. Check Cloudflare proxy settings

#### Database Connection Issues
1. Verify Supabase credentials
2. Check network connectivity
3. Verify RLS policies

#### Authentication Issues
1. Check OAuth provider configuration
2. Verify redirect URLs
3. Check Supabase auth settings

### Debug Commands
```bash
# Test local development
npm run dev

# Test preview deployment
npm run dev:preview

# Check build output
npm run build

# View detailed logs
wrangler tail --format pretty
```

## 📈 Scaling Considerations

### Performance Optimization
1. Implement caching strategies
2. Optimize database queries
3. Use CDN for static assets

### Load Balancing
1. Configure multiple regions
2. Implement failover strategies
3. Monitor performance metrics

### Cost Optimization
1. Monitor Cloudflare Workers usage
2. Optimize Supabase query patterns
3. Implement efficient caching

## 🔄 Continuous Deployment

### GitHub Actions Setup
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
```

### Environment Secrets
Set up GitHub repository secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## 📞 Support and Maintenance

### Regular Maintenance
1. Update dependencies monthly
2. Monitor security advisories
3. Review and rotate credentials
4. Backup database regularly

### Support Channels
- GitHub Issues for bug reports
- Documentation updates
- Community forum (if applicable)

### Performance Monitoring
1. Set up uptime monitoring
2. Monitor response times
3. Track error rates
4. Monitor resource usage

---

This deployment guide ensures a robust, scalable, and secure deployment of Harare Metro. Follow each step carefully and test thoroughly before going live.
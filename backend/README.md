# Harare Metro Backend

**Admin Interface & API Worker for Zimbabwe's Premier News Platform**

## Overview

This is the backend worker for Harare Metro, providing:

- **Admin Interface** (`admin.hararemetro.co.zw`) - Web-based admin dashboard
- **Public API** (`admin.hararemetro.co.zw/api/*`) - REST endpoints for the frontend
- **RSS Processing** - Automated news feed processing from Zimbabwe sources
- **Analytics Engine** - User interaction tracking and insights
- **Image Proxying** - Secure image handling and optimization

## Architecture

### Admin Interface (Vanilla HTML/JS)
- Dashboard with real-time statistics
- RSS source management
- Article management and cleanup
- Analytics and insights
- System health monitoring

### API Endpoints
- `/api/health` - System health check
- `/api/feeds` - Article feeds with filtering
- `/api/categories` - Content categories
- `/api/search` - Article search
- `/api/image` - Image proxy for security
- `/api/admin/*` - Admin-only endpoints

### Background Services
- **RSS Feed Service** - Processes Zimbabwe news sources hourly
- **Category Manager** - Auto-categorizes content
- **Analytics Engine** - Tracks user interactions
- **D1 Database** - Stores articles, categories, and configuration

## Development

### Setup
```bash
npm install
```

### Local Development
```bash
npm run dev
# Access admin interface at http://localhost:8787
```

### Database Operations
```bash
# Deploy schema to production
npm run db:migrate

# Deploy to local D1
npm run db:local
```

### Deployment
```bash
npm run deploy
```

## Configuration

The worker is configured via `wrangler.jsonc`:

- **Domain**: `admin.hararemetro.co.zw`
- **D1 Database**: `hararemetro_articles`
- **Analytics Datasets**: Category clicks, news interactions, search queries
- **Cron Triggers**: Hourly RSS refresh (`0 * * * *`)

## RSS Sources

Configured Zimbabwe news sources:
- Herald Zimbabwe
- NewsDay Zimbabwe  
- Chronicle Zimbabwe
- Techzim
- ZBC News
- Business Weekly
- The Standard
- ZimLive
- New Zimbabwe

## Security Features

- **CORS Configuration** - Allows frontend access from `www.hararemetro.co.zw`
- **Image Proxying** - Prevents mixed content and XSS
- **D1 Database** - Secure data storage with prepared statements
- **Analytics** - Anonymous user tracking with privacy compliance

## Monitoring

The admin interface provides:
- Real-time database statistics
- RSS feed status monitoring
- System health checks
- Error tracking and logging
- Performance metrics

## Frontend Integration

The frontend (`www.hararemetro.co.zw`) fetches data from this backend via:
- Cross-origin API calls to `/api/*` endpoints
- Image proxying through `/api/image`
- Real-time updates via RSS refresh triggers

## Zimbabwe Brand Integration

- Zimbabwe flag color palette throughout admin interface
- Cultural pride and African heritage celebration
- Local news source prioritization
- Community-focused analytics and insights
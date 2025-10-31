# Harare Metro

**Zimbabwe's Premier News Aggregation Platform**

A modern, AI-powered news aggregation platform built on Cloudflare's edge infrastructure, bringing together news from across Zimbabwe's media landscape with intelligent author recognition, content classification, and quality scoring.

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![React Router](https://img.shields.io/badge/React_Router-7-CA4245?logo=react-router&logoColor=white)](https://reactrouter.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

## 🌍 Live Deployment

- **Frontend**: [www.hararemetro.co.zw](https://www.hararemetro.co.zw)
- **Admin Panel**: [admin.hararemetro.co.zw](https://admin.hararemetro.co.zw)

## 🆕 What's New (October 31, 2025)

### Today's Article Count
The homepage now displays **daily article count** instead of total database count, showing users fresh content published today. Currently showing 55 articles published today out of 352 total.

### Complete Auth System
- ✅ Login, Register, and Forgot Password pages now live at `/auth/*`
- ✅ User profile pages at `/@/:username`
- ✅ Settings pages at `/settings/profile`
- ✅ Enhanced 404 error page with Zimbabwe flag branding

### PWA & Favicon Improvements
- ✅ Proper favicon support across frontend and backend
- ✅ PWA icons configured for mobile installation
- ✅ Manifest shortcuts with correct icon references

### Live Metrics
- **352 articles** in database from Zimbabwe news sources
- **55 articles** published today
- **9 active routes** including auth and profile pages
- **Sub-100ms** response times globally

## ✨ Features

### Platform Features
- 📰 **Automated RSS Feed Aggregation** - Hourly refresh from Zimbabwe news sources
- 🤖 **AI-Powered Content Processing** - Author recognition, keyword extraction, quality scoring
- 👨‍💼 **Journalist Recognition** - Auto-generated author profiles across multiple outlets
- 🎯 **Smart Categorization** - 256-keyword taxonomy across 32 categories
- 📊 **Analytics Dashboard** - Comprehensive insights and content quality metrics
- 📱 **Mobile-First Design** - TikTok-like modern UI with Zimbabwe flag branding
- ⚡ **Edge-Deployed** - Sub-100ms response times globally via Cloudflare

### Technical Features
- 🚀 **2-Worker Architecture** - Separate frontend and backend workers
- 💾 **Cloudflare D1 Database** - Serverless SQLite at the edge
- 🧠 **Cloudflare Workers AI** - On-demand AI processing
- 📈 **Analytics Engine** - Real-time user interaction tracking
- 🎨 **Zimbabwe Flag Color Palette** - Brand-consistent design system
- 📱 **Progressive Web App (PWA)** - Install on mobile devices
- 🔄 **Server-Side Rendering (SSR)** - React Router 7 with Vite

## 🏗️ Architecture

### 2-Worker Design

```
┌──────────────────────────────────────┐
│   www.hararemetro.co.zw              │
│   Frontend Worker (React Router SSR) │
│   • User-facing application          │
│   • Basic API endpoints              │
│   • Cron trigger handler             │
└──────────────────────────────────────┘
                 ↓
        Hourly Cron Trigger
                 ↓
┌──────────────────────────────────────┐
│   admin.hararemetro.co.zw            │
│   Backend Worker (Admin + APIs)      │
│   • Admin dashboard                  │
│   • RSS processing with AI           │
│   • Author recognition               │
│   • Content quality scoring          │
│   • User engagement APIs             │
│   • Authentication                   │
└──────────────────────────────────────┘
                 ↓
     Single D1 Database
     (hararemetro_articles)
```

### Technology Stack

**Frontend:**
- React 19 with React Router 7 (SSR)
- Tailwind CSS 4.x
- Vite build system
- TypeScript
- Lucide React icons

**Backend:**
- Hono web framework
- Cloudflare Workers AI
- fast-xml-parser for RSS
- TypeScript

**Data & Infrastructure:**
- Cloudflare D1 (SQLite edge database)
- Cloudflare Analytics Engine
- Cloudflare Workers (both workers)
- Cloudflare Vectorize (semantic search)

## 📁 Project Structure

```
/harare-metro/                  # Monorepo root (frontend)
├── workers/
│   └── app.ts                  # ✅ Frontend worker (SSR + cron handler)
├── app/                        # React Router application
│   ├── root.tsx
│   ├── routes/
│   └── components/
├── database/
│   ├── D1Service.js            # Shared database service
│   └── schema.sql
├── backend/                    # ✅ Backend worker (separate deployment)
│   ├── index.ts                # Backend entry point
│   ├── services/               # All business logic
│   │   ├── RSSFeedService.ts
│   │   ├── ArticleAIService.ts
│   │   ├── AuthorProfileService.ts
│   │   └── ...
│   └── admin/                  # Admin dashboard
├── wrangler.jsonc              # Frontend worker config
└── backend/wrangler.jsonc      # Backend worker config
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Cloudflare account (for deployment)

### Local Development

```bash
# Install dependencies
npm install

# Start frontend development server
npm run dev

# In another terminal, start backend worker
npm run dev:backend

# Generate TypeScript types
npm run cf-typegen

# Type check
npm run typecheck
```

### Build

```bash
# Build frontend
npm run build

# Build and validate
npm run validate
```

### Deployment

```bash
# Deploy frontend worker
npm run deploy

# Deploy backend worker
npm run deploy:backend

# Deploy both workers
npm run deploy:all
```

## 📚 Documentation

Comprehensive documentation is available in:

- **[CLAUDE.md](./CLAUDE.md)** - Complete architecture guide, API reference, and development guidelines
- **[guides/](./guides/)** - Feature-specific documentation
  - [Deployment Guide](./guides/DEPLOYMENT_GUIDE.md)
  - [Analytics Guide](./guides/ANALYTICS_GUIDE.md)
  - [Role System](./guides/ROLE_SYSTEM.md)
  - [Security](./guides/SECURITY.md)

## 🎨 Design System

### Zimbabwe Flag Color Palette

The platform uses Zimbabwe's national flag colors throughout:

- **Green (#00A651)**: Primary actions, success states
- **Yellow (#FDD116)**: Warnings, highlights
- **Red (#EF3340)**: Errors, urgent actions
- **Black (#000000)**: Dark mode backgrounds
- **White (#FFFFFF)**: Text on dark backgrounds

### Typography

- **Headings**: Georgia serif (brand identity)
- **Body Text**: Inter sans-serif (readability)

### Brand Element

All pages feature the Zimbabwe flag strip (8px vertical gradient) on the left edge.

## 🔧 Key Features

### RSS Feed Processing

- **Hourly Automated Refresh**: Cron trigger at the top of every hour
- **Zimbabwe News Sources**: Herald, NewsDay, Chronicle, ZimLive, The Standard, and more
- **AI Content Pipeline**:
  - Author extraction and deduplication
  - Content cleaning (remove noise, image URLs)
  - Keyword classification (256-keyword taxonomy)
  - Quality scoring
  - Category assignment

### Author Recognition

- **Cross-Outlet Tracking**: Authors tracked across multiple news sources
- **Auto-Generated Profiles**: Professional profiles for Zimbabwe journalists
- **Engagement Metrics**: Article counts, quality scores, follower counts
- **Deduplication**: Smart name matching across outlets

### Admin Dashboard

Access at [admin.hararemetro.co.zw](https://admin.hararemetro.co.zw)

Features:
- Manual RSS refresh
- Source management
- Author profiles
- Content quality insights
- Analytics dashboard
- System configuration

## 🌐 API Endpoints

### Frontend Worker (`www.hararemetro.co.zw`)

```
GET  /api/health              # Health check
GET  /api/feeds               # Get articles (paginated)
GET  /api/categories          # Get all categories
GET  /api/article/by-source-slug  # Get single article
GET  /api/manifest.json       # PWA manifest
```

### Backend Worker (`admin.hararemetro.co.zw`)

```
GET  /                        # Admin dashboard
POST /api/admin/refresh-rss   # Manual RSS refresh
GET  /api/admin/stats         # Platform statistics
GET  /api/admin/authors       # Author profiles
GET  /api/admin/ai-pipeline-status  # AI processing stats
# ... and more (see CLAUDE.md for full API reference)
```

## 🔐 Environment Variables

### Frontend Worker

```env
NODE_ENV=production
BACKEND_URL=https://admin.hararemetro.co.zw
LOG_LEVEL=info
ROLES_ENABLED=true
DEFAULT_ROLE=creator
```

### Backend Worker

```env
NODE_ENV=production
LOG_LEVEL=info
ROLES_ENABLED=true
DEFAULT_ROLE=creator
ADMIN_ROLES=admin,super_admin,moderator
CREATOR_ROLES=creator,business-creator,author
```

## 📊 Database Schema

Single D1 database (`hararemetro_articles`) shared across both workers:

**Core Tables:**
- `articles` - News articles
- `categories` - Article categories
- `news_sources` - RSS feed sources
- `authors` - Journalist profiles
- `keywords` - Classification keywords

**Relationships:**
- `article_authors` - Many-to-many
- `article_keywords` - Many-to-many

**User Engagement** (Phase 2):
- `article_comments` - User comments
- `comment_likes` - Comment likes
- `user_follows` - Following sources/authors

**System:**
- `system_config` - Platform configuration
- `users` - User accounts
- `user_preferences` - User settings
- `daily_source_stats` - RSS statistics
- `ai_processing_log` - AI pipeline logs
- `cron_logs` - Cron execution history

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure TypeScript compilation passes: `npm run typecheck`
5. Submit a pull request

## 📝 License

Copyright © 2025 Harare Metro. All rights reserved.

## 🙏 Acknowledgments

- Built on Cloudflare Workers platform
- Powered by Cloudflare Workers AI
- Celebrating Zimbabwe journalism through author recognition
- Zimbabwe flag colors represent national pride and heritage

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/nyuchitech/harare-metro/issues)
- **Documentation**: [CLAUDE.md](./CLAUDE.md)
- **Admin Dashboard**: [admin.hararemetro.co.zw](https://admin.hararemetro.co.zw)

---

**Harare Metro** - Bringing Zimbabwe news to the world, one article at a time. 🇿🇼

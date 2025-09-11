# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Development Environment
- `npm run dev` - Start Cloudflare Worker dev server (port 8787)
- `npm run dev:local` - Start Vite dev server (port 5173) 
- `npm run dev:full` - Start both servers concurrently
- `./scripts/dev-local.sh` - Helper script to start development with port cleanup

### Build and Deployment
- `npm run build` - Build both frontend and worker
- `npm run build:frontend` - Build React app using Vite
- `npm run build:worker` - Prepare worker files
- `npm run preview` - Preview production build locally

### Testing and Linting
- No specific test commands are configured yet
- Use `eslint` for linting (ESLint 9+ with React plugins)
- `npm run analyze:bundle` - Analyze bundle size with Vite

### Worker Management
- `npm run worker:refresh-config` - Refresh worker configuration
- `npm run worker:clear-cache` - Clear worker cache
- `npm run worker:health` - Check worker health

## Architecture Overview

### Core Platform
**Harare Metro** is a modern news aggregation platform built as a hybrid React SPA + Cloudflare Worker application:

- **Frontend**: React 18 SPA with Tailwind CSS and shadcn/ui components
- **Backend**: Cloudflare Worker serving both static assets and API endpoints
- **Database**: Supabase for authentication and user data storage
- **Caching**: Cloudflare KV for RSS feed caching and configuration
- **Deployment**: Single Cloudflare Worker at www.hararemetro.co.zw

### Key Technologies
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: React with Tailwind CSS and Radix UI primitives
- **Authentication**: Supabase Auth with OAuth support (Google, GitHub)
- **Data Fetching**: Custom hooks with React Query patterns
- **Icons**: Lucide React and Heroicons
- **RSS Processing**: fast-xml-parser for feed parsing

### Project Structure

```
src/
├── components/           # React components
│   ├── auth/            # Authentication components (AuthModal, UserProfile)
│   ├── ui/              # shadcn/ui components and custom UI utilities
│   └── *.jsx           # Feature components (HeaderNavigation, ArticleCard, etc.)
├── contexts/           # React contexts (AuthContext)
├── hooks/              # Custom React hooks (useAuth, useFeeds, useAnalytics)
│   ├── useDirectFeeds.js      # Direct feed fetching (bypass worker)
│   ├── useOptimizedFeeds.js   # Optimized feed management
│   └── useUserData.js         # User data management
├── lib/                # Utilities (supabase.js, utils.js, userService.js)
├── services/           # Client-side services
│   ├── CloudflareDirectClient.js    # Direct Cloudflare API access
│   ├── DirectDataService.js         # Direct data service
│   └── MultiTierCacheManager.js     # Multi-tier caching
└── App.jsx             # Main application component

worker/
├── index.js            # Cloudflare Worker entry point
├── api.js              # API endpoints
└── services/           # Worker services
    ├── ArticleService.js           # Article processing service
    ├── AnalyticsEngineService.js   # Analytics tracking
    ├── CacheService.js             # KV caching layer
    ├── ConfigService.js            # Configuration management
    ├── RSSFeedService.js           # RSS processing
    └── D1UserService.js            # Database user operations

scripts/
├── dev-local.sh        # Development helper script
├── build.sh            # Build script
└── deploy.sh           # Deployment script
```

### Data Flow Architecture

**RSS Feed Processing**:
1. Cloudflare Worker fetches RSS feeds from Zimbabwe news sources
2. Feeds are processed and cached in KV storage with HM- prefixed namespaces
3. Cron triggers refresh feeds every hour
4. React frontend can access feeds via worker API or direct client access
5. Multi-tier caching ensures optimal performance

**User Data Flow**:
1. Supabase handles authentication and user profiles
2. User interactions (bookmarks, likes, reading history) stored in Supabase
3. Analytics events tracked via Cloudflare Analytics Engine
4. Real-time state management through custom React hooks

**Content Architecture**:
- **Articles**: RSS feed items with standardized schema
- **Categories**: Auto-extracted from RSS feeds (politics, business, sports, etc.)
- **Sources**: Zimbabwe news outlets (Herald, NewsDay, Chronicle, etc.)
- **User Content**: Bookmarks, likes, reading history, preferences

### Authentication System
- **Provider**: Supabase Auth with email/password and OAuth
- **User Roles**: Role-based access control (admin, creator, user)
- **Profile Management**: Complete user profiles with preferences
- **Session Handling**: Automatic token refresh and secure logout

### Caching Strategy
- **RSS Feeds**: Cached in Cloudflare KV with 1-hour TTL
- **Static Assets**: Served via Cloudflare CDN
- **API Responses**: Conditional caching based on content type
- **Client-side**: Multi-tier cache manager with localStorage and memory caching
- **Worker Cache**: Service worker caching for offline support

## Design System & Branding

### Typography System
**IMPORTANT**: The application uses a dual-font system for optimal readability and brand consistency:

- **Headings** (h1-h6): Georgia serif font (matches logo aesthetic)
  ```css
  font-family: Georgia, 'Times New Roman', serif;
  ```
- **Body Text** (p, span, div, buttons, inputs): Inter sans-serif for maximum readability
  ```css
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  ```

### Zimbabwe Flag Color Palette
**CRITICAL**: All UI elements must use Zimbabwe flag colors consistently:

```css
:root {
  --zw-green: 140 100% 32%;   /* #00A651 - Growth, prosperity, agriculture */
  --zw-yellow: 48 98% 54%;    /* #FDD116 - Mineral wealth, sunshine */
  --zw-red: 354 85% 57%;      /* #EF3340 - Heritage, struggle, passion */
  --zw-black: 0 0% 0%;        /* #000000 - African heritage, strength */
  --zw-white: 0 0% 100%;      /* #FFFFFF - Peace, unity, progress */
}
```

### Color Usage Guidelines
- **Green (#00A651)**: Primary buttons, success states, growth metrics, positive indicators
- **Yellow (#FDD116)**: Warnings, highlights, featured content, accent elements
- **Red (#EF3340)**: Error states, urgent actions, critical information, destructive actions
- **Black (#000000)**: Primary backgrounds (dark mode), strong contrast text
- **White (#FFFFFF)**: Primary text on dark backgrounds, button text, highlights

### Brand Element: Zimbabwe Flag Strip
**ALWAYS PRESENT**: The Zimbabwe flag strip is a core brand element:

```css
.zimbabwe-flag-strip {
  position: fixed;
  top: 0;
  left: 0;
  width: 8px;
  height: 100vh;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  background: linear-gradient(to bottom,
    hsl(var(--zw-green)) 0% 20%,
    hsl(var(--zw-yellow)) 20% 40%, 
    hsl(var(--zw-red)) 40% 60%,
    hsl(var(--zw-black)) 60% 80%,
    hsl(var(--zw-white)) 80% 100%
  );
}
```

**Purpose**: 
- Brand recognition and immediate Zimbabwe connection
- Cultural pride and African heritage celebration
- Consistent presence across all pages and views
- Visual anchor point for users

### Mobile-First Design Patterns

**TikTok-like Experience**: The UI is designed for modern mobile users with:

1. **Full-screen modals** with backdrop blur
2. **Touch-friendly elements** (minimum 44px touch targets)
3. **Rounded corners everywhere** (typically `rounded-2xl` or `rounded-full`)
4. **Clean card designs** with subtle shadows and borders
5. **Smooth animations** and transitions
6. **Bottom navigation** for primary actions
7. **Pull-to-refresh** patterns where applicable

### Component Design Guidelines

**AuthModal** (`src/components/auth/AuthModal.jsx`):
- Full-screen overlay with Zimbabwe flag strip
- Tabbed interface (Sign In/Sign Up/Reset)
- Large rounded inputs (h-14, rounded-2xl)
- Touch-friendly buttons with loading states
- Backdrop blur effects for modern feel
- Success states with Zimbabwe green accent

**ProfilePage** (`src/components/ProfilePage.jsx`):
- Mobile-first design (max-width constrained)
- Instagram-like stats grid (Read, Liked, Saved, Streak)
- Achievement cards using Zimbabwe colors
- Clean navigation between Profile/Edit/Settings views
- Avatar with gradient background using flag colors
- Touch-friendly action buttons

**General Component Patterns**:
- Always use `font-serif` class for headings
- Use `bg-zw-green`, `bg-zw-yellow`, etc. for colored elements
- Implement proper loading and error states
- Include proper accessibility attributes
- Follow mobile-first responsive design

## Environment Configuration

### Required Environment Variables (.env.local)
```
VITE_SUPABASE_URL=https://oybatvdffsbaxwuxfetz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95YmF0dmRmZnNiYXh3dXhmZXR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTA2MjgsImV4cCI6MjA3MzE2NjYyOH0.tLr6-BXM9LvrpmR99ZPcDP_8I0p5EfNvnpX0QAl6plo
```

### Cloudflare Configuration (wrangler.toml)
- **KV Namespaces**: All prefixed with HM- (HM-CONFIG-STORAGE-PROD, HM-CACHE-STORAGE-PROD, etc.)
- **D1 Database**: hararemetro_users for user data
- **Analytics Engine**: Three datasets for tracking user interactions  
- **Cron Triggers**: Hourly RSS feed refresh
- **Domain**: www.hararemetro.co.zw

### Database Schema (Supabase)
Key tables: profiles, bookmarks, likes, reading_history, analytics_events
All tables have Row Level Security (RLS) enabled with user-specific policies.

## Development Guidelines

### Component Architecture
- Use functional components with hooks
- Follow existing patterns for new components (check AuthModal.jsx, ProfilePage.jsx)
- Leverage shadcn/ui components from `src/components/ui/`
- **ALWAYS** maintain Zimbabwe flag color consistency
- **ALWAYS** use the dual-font system (Georgia for headings, Inter for body)

### State Management
- **Global State**: React Context for authentication (AuthContext)
- **Server State**: Custom hooks with React Query patterns (useFeeds, useAnalytics, useDirectFeeds, useOptimizedFeeds)
- **Local State**: useState for component-specific state
- **Persistent State**: localStorage with harare-metro_ prefixed keys for user preferences
- **User Data**: Centralized through useUserData hook

### API Integration
- Worker API endpoints follow REST conventions
- Public endpoints: `/api/feeds`, `/api/health`
- Authenticated endpoints: `/api/user/*`, `/api/analytics/track`
- Direct Cloudflare access via CloudflareDirectClient
- Error handling with consistent response formats
- Multi-tier caching for optimal performance

### Code Conventions
- Use JSX for React components
- Follow existing import ordering and file structure
- Implement proper error boundaries and loading states
- Use TypeScript-style prop validation where applicable
- **NEVER** use custom fonts other than Georgia (headings) and Inter (body)
- **ALWAYS** include Zimbabwe flag strip in full-page components
- **ALWAYS** use Zimbabwe flag colors for theming

### Performance Considerations
- Infinite scrolling for article feeds
- Image optimization via Cloudflare Images (when enabled)
- Bundle optimization with Vite
- Efficient re-renders with proper dependency arrays in hooks
- Multi-tier caching strategy
- Service worker for offline functionality
- Lazy loading of non-critical components

### Mobile Optimization
- **Touch Targets**: Minimum 44px for interactive elements
- **Input Fields**: Large height (h-12 to h-14) with rounded corners
- **Buttons**: Full-width where appropriate, touch-friendly sizing
- **Navigation**: Bottom-mounted mobile navigation
- **Modals**: Full-screen on mobile with proper header controls
- **Cards**: Rounded corners with proper spacing and shadows
- **Typography**: Optimized sizes for mobile readability

## Critical Implementation Notes

### Font System Implementation
When implementing new components or modifying existing ones:

1. **Headings**: Always use `font-serif` class or `Georgia, 'Times New Roman', serif`
2. **Body text**: Always use `font-sans` class or `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`
3. **Never** introduce additional fonts without updating this documentation

### Zimbabwe Branding Implementation
When creating or modifying UI elements:

1. **Primary actions**: Use `bg-zw-green` class
2. **Warning states**: Use `bg-zw-yellow` class  
3. **Error states**: Use `bg-zw-red` class
4. **Text colors**: Use `text-zw-green`, `text-zw-yellow`, `text-zw-red` as appropriate
5. **Always** include the Zimbabwe flag strip in full-page layouts
6. **Never** use arbitrary colors without justification

### Authentication Flow
- AuthModal handles all authentication states
- Supabase integration through useAuth hook
- Role-based access control implemented
- Profile management integrated with user preferences

### Data Management
- RSS feeds processed through worker services
- User data managed via Supabase with RLS
- Analytics tracked via Cloudflare Analytics Engine
- Multi-tier caching for optimal performance
- Direct client access for enhanced reliability

## Important Reminders

1. **Typography**: Georgia for headings, Inter for body - NO EXCEPTIONS
2. **Colors**: Zimbabwe flag palette only - maintain consistency
3. **Mobile**: Mobile-first design with TikTok-like experience
4. **Branding**: Zimbabwe flag strip must be present on all full-page views
5. **Performance**: Multi-tier caching and optimization strategies implemented
6. **Authentication**: Supabase-based with role management
7. **Analytics**: Cloudflare Analytics Engine for user tracking
8. **Accessibility**: Proper ARIA labels and touch targets
9. **Error Handling**: Consistent error boundaries and user feedback
10. **Testing**: Manual testing required - no automated tests currently configured
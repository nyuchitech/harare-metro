# Harare Metro - News Aggregation Platform

A modern news aggregation platform built with React and Cloudflare Workers. Harare Metro provides a clean, fast interface for staying informed with the latest news from trusted sources.

## 🌟 Features

### Core Features
- **Clean, Modern UI**: Beautiful, responsive design that works on all devices
- **Dark/Light Theme**: Toggle between dark and light themes
- **Fast Loading**: Built on Cloudflare Workers for global edge deployment
- **Mobile Optimized**: Seamless experience on mobile devices
- **Progressive Web App**: Install as a native app on your device

### Coming Soon
- **Real-time News Aggregation**: Fetch latest articles from multiple sources
- **User Authentication**: Secure login with OAuth providers
- **Smart Search**: Find exactly what you're looking for
- **Personalized Recommendations**: AI-powered content suggestions
- **Offline Reading**: Read articles even without internet connection

## 🌟 Features

### Core Features
- **Real-time News Aggregation**: Fetches latest articles from multiple news sources
- **Advanced Authentication**: Supabase-powered auth with OAuth support (Google, GitHub)
- **User Profiles**: Complete user profile management with preferences
- **Smart Categorization**: AI-powered article categorization and filtering
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Fast Loading**: Built on Cloudflare Workers for global edge deployment
- **RSS Feed Processing**: Intelligent RSS/XML parsing with error handling
- **Caching**: Automatic feed caching with scheduled updates every hour

### Enterprise Features
- **Real-time Analytics**: Live user interaction tracking and insights
- **Advanced Search**: Full-text search with filters and saved searches
- **Bookmarks & Likes**: User content curation and social features
- **Reading History**: Track and analyze reading patterns
- **Personal Insights**: AI-powered reading recommendations
- **Export Capabilities**: Export bookmarks and reading history
- **API Access**: RESTful API for enterprise integrations

## 🏗️ Architecture

- **Frontend**: React SPA with Tailwind CSS and shadcn/ui
- **Backend**: Cloudflare Worker with KV storage and D1 database
- **Build Tool**: Vite for fast development and optimized builds
- **Deployment**: Single Cloudflare Worker serving both frontend and API
- **Domain**: www.hararemetro.co.zw

## 📰 News Sources

- Herald Zimbabwe
- NewsDay Zimbabwe  
- Chronicle Zimbabwe
- ZBC News
- Business Weekly
- Techzim
- The Standard
- ZimLive
- *And more configurable sources*

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account with Workers enabled
- Supabase account and project
- Wrangler CLI installed globally: `npm install -g wrangler`

### Installation

1. **Clone and setup the repository**:
   ```bash
   git clone https://github.com/nyuchitech/harare-metro.git
   cd harare-metro
   npm install
   ```

2. **Configure Supabase**:
   ```bash
   # Create a new Supabase project at https://supabase.com
   # Copy your project URL and anon key
   ```

3. **Set up environment variables**:
   ```bash
   # Create .env.local file
   VITE_SUPABASE_URL=https://oybatvdffsbaxwuxfetz.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Configure Cloudflare KV**:
   ```bash
   # Create KV namespaces
   wrangler kv:namespace create "NEWS_STORAGE"
   wrangler kv:namespace create "NEWS_STORAGE" --preview
   
   # Update wrangler.toml with the returned namespace IDs
   ```

5. **Set up Supabase Database**:
   ```sql
   -- Run these SQL commands in your Supabase SQL editor
   
   -- Create profiles table
   CREATE TABLE profiles (
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     email TEXT,
     full_name TEXT,
     avatar_url TEXT,
     preferences JSONB DEFAULT '{"theme": "dark", "notifications": true, "email_updates": false}',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create bookmarks table
   CREATE TABLE bookmarks (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     article_id TEXT NOT NULL,
     article_title TEXT,
     article_url TEXT,
     source TEXT,
     category TEXT,
     saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(user_id, article_id)
   );

   -- Create likes table
   CREATE TABLE likes (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     article_id TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(user_id, article_id)
   );

   -- Create reading_history table
   CREATE TABLE reading_history (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     article_id TEXT NOT NULL,
     article_title TEXT,
     article_url TEXT,
     source TEXT,
     category TEXT,
     viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     reading_time INTEGER
   );

   -- Create analytics_events table
   CREATE TABLE analytics_events (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     event_type TEXT NOT NULL,
     event_data JSONB,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Enable Row Level Security
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
   ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
   ALTER TABLE reading_history ENABLE ROW LEVEL SECURITY;
   ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

   -- Create RLS policies
   CREATE POLICY "Users can view own profile" ON profiles
     FOR SELECT USING (auth.uid() = id);

   CREATE POLICY "Users can update own profile" ON profiles
     FOR UPDATE USING (auth.uid() = id);

   CREATE POLICY "Users can insert own profile" ON profiles
     FOR INSERT WITH CHECK (auth.uid() = id);

   CREATE POLICY "Users can view own bookmarks" ON bookmarks
     FOR SELECT USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert own bookmarks" ON bookmarks
     FOR INSERT WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can delete own bookmarks" ON bookmarks
     FOR DELETE USING (auth.uid() = user_id);

   CREATE POLICY "Users can view own likes" ON likes
     FOR SELECT USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert own likes" ON likes
     FOR INSERT WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can delete own likes" ON likes
     FOR DELETE USING (auth.uid() = user_id);

   CREATE POLICY "Users can view own reading history" ON reading_history
     FOR SELECT USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert own reading history" ON reading_history
     FOR INSERT WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can view own analytics" ON analytics_events
     FOR SELECT USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert own analytics" ON analytics_events
     FOR INSERT WITH CHECK (auth.uid() = user_id);

   -- Create indexes for better performance
   CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
   CREATE INDEX idx_likes_user_id ON likes(user_id);
   CREATE INDEX idx_reading_history_user_id ON reading_history(user_id);
   CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
   CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
   ```

6. **Start development**:
   ```bash
   # Option 1: Use helper script
   ./scripts/dev-start.sh
   
   # Option 2: Manual (two terminals)
   npm run dev          # Terminal 1: React dev server
   npm run dev:worker   # Terminal 2: Worker dev server
   ```

7. **Open your browser**:
   - React App: http://localhost:5173
   - Worker API: http://localhost:8787

### Deployment

1. **Login to Wrangler**:
   ```bash
   wrangler login
   ```

2. **Deploy**:
   ```bash
   npm run deploy
   ```

3. **Configure domains**:
   - App: `www.hararemetro.co.zw`
   - Landing page: `www.hararemetro.co.zw`

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start Vite dev server
- `npm run dev:worker` - Start Wrangler dev server  
- `npm run dev:both` - Start both servers (uses helper script)
- `npm run build` - Build for production
- `npm run deploy` - Build and deploy to Cloudflare
- `npm run test` - Run tests
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   │   ├── AuthModal.jsx
│   │   └── UserProfile.jsx
│   ├── HeaderNavigation.jsx
│   ├── NewsCard.jsx
│   ├── CategoryFilter.jsx
│   └── LoadingSpinner.jsx
├── contexts/           # React contexts
│   └── AuthContext.jsx
├── hooks/              # Custom React hooks
│   ├── useFeeds.js
│   ├── useAnalytics.js
│   └── useAuth.js
├── lib/                # Utility libraries
│   ├── supabase.js
│   └── utils.js
├── App.jsx             # Main app component
├── main.jsx           # React entry point
└── index.css          # Global styles

worker/
├── index.js           # Cloudflare Worker code
├── api.js             # API endpoints
└── services/          # Worker services

scripts/
├── dev-local.sh       # Development helper
├── build.sh          # Build script
└── deploy.sh         # Deployment script
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```env
VITE_SUPABASE_URL=https://oybatvdffsbaxwuxfetz.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Update `wrangler.toml` with your KV namespace IDs:

```toml
[[kv_namespaces]]
binding = "NEWS_STORAGE"
id = "your-production-kv-id"
preview_id = "your-preview-kv-id"
```

### Adding News Sources

Edit the `RSS_SOURCES` array in `worker/index.js`:

```javascript
const RSS_SOURCES = [
  {
    name: 'Your News Source',
    url: 'https://example.com/feed/',
    category: 'general',
    enabled: true
  }
]
```

## 📡 API Endpoints

### Public Endpoints
- `GET /api/feeds` - Get all latest news feeds
- `GET /api/feeds/sources` - Get list of RSS sources
- `GET /api/feeds/cached` - Get cached feeds with metadata
- `GET /api/health` - Health check endpoint

### Authenticated Endpoints
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/bookmarks` - Get user bookmarks
- `POST /api/user/bookmarks` - Add bookmark
- `DELETE /api/user/bookmarks/:id` - Remove bookmark
- `GET /api/user/likes` - Get user likes
- `POST /api/user/likes` - Add like
- `DELETE /api/user/likes/:id` - Remove like
- `GET /api/user/history` - Get reading history
- `POST /api/analytics/track` - Track analytics event

## 🔄 Scheduled Updates

Feeds are automatically updated every hour using Cloudflare Cron Triggers. You can modify the schedule in `wrangler.toml`:

```toml
[triggers]
crons = ["0 * * * *"]  # Every hour
```

## 🏢 Enterprise Features

### Authentication & User Management
- **Supabase Auth**: Secure authentication with email/password and OAuth
- **User Profiles**: Complete profile management with preferences
- **Role-based Access**: Support for different user roles and permissions
- **Session Management**: Secure session handling with automatic refresh

### Analytics & Insights
- **Real-time Analytics**: Track user interactions and content engagement
- **Personal Insights**: AI-powered reading recommendations
- **Reading Patterns**: Analyze user reading behavior and preferences
- **Export Capabilities**: Export user data and analytics

### Content Management
- **Advanced Search**: Full-text search with filters and saved searches
- **Content Curation**: Bookmarks, likes, and reading lists
- **Reading History**: Track and analyze reading patterns
- **Content Recommendations**: Personalized content suggestions

### API & Integrations
- **RESTful API**: Complete API for enterprise integrations
- **Webhooks**: Real-time notifications for content updates
- **Data Export**: Export capabilities for analytics and user data
- **Third-party Integrations**: Support for external tools and services

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**: Run `./scripts/dev-start.sh` which automatically handles port cleanup
2. **KV namespace errors**: Ensure you've created KV namespaces and updated `wrangler.toml`
3. **Supabase connection errors**: Check your environment variables and Supabase project settings
4. **Build failures**: Check Node.js version (requires 18+)
5. **CORS issues**: API includes proper CORS headers for development

### Development Tips

- Use browser dev tools to monitor API calls
- Check Wrangler terminal for Worker logs
- RSS feeds may occasionally be unavailable - this is handled gracefully
- Use `npm run build:check` to test builds without deployment
- Check Supabase dashboard for database queries and auth logs

## � Documentation

For detailed guides and documentation, visit the **[guides/](guides/)** folder:

- **[Local Development Setup](guides/LOCAL_DEVELOPMENT.md)** - Complete development environment setup
- **[User Roles & Authentication](guides/ROLE_SYSTEM.md)** - Role-based access control system  
- **[Analytics Implementation](guides/ANALYTICS_GUIDE.md)** - Analytics tracking and reporting
- **[Deployment Guide](guides/DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[Migration Guide](guides/MIGRATION_SUMMARY.md)** - Recent changes and migration notes
- **[Icon Components](guides/ICON_COMPONENTS_GUIDE.md)** - Using icon components
- **[Security Guide](guides/SECURITY.md)** - Security best practices

Browse all available documentation: **[guides/README.md](guides/README.md)**

## �📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section above
- Review Cloudflare Workers documentation
- Review Supabase documentation
- Open an issue on GitHub

## 🚀 Roadmap

### Phase 1: Core Platform ✅
- [x] News aggregation engine
- [x] User authentication with Supabase
- [x] Basic user profiles and preferences
- [x] Bookmarks and likes system
- [x] Reading history tracking

### Phase 2: Enterprise Features 🚧
- [ ] Advanced analytics dashboard
- [ ] Content recommendation engine
- [ ] API rate limiting and quotas
- [ ] Multi-tenant support
- [ ] Advanced search with filters

### Phase 3: Advanced Features 📋
- [ ] Real-time notifications
- [ ] Content export and sharing
- [ ] Advanced user roles and permissions
- [ ] Integration marketplace
- [ ] Mobile app development

---

Built with ❤️ for modern news consumption

# 🚀 Local Development Guide for Harare Metro

This guide will help you set up and test the Harare Metro application locally without deploying to Cloudflare.

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git repository cloned locally

## 🔧 Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and update it with your Supabase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase project details:
```env
VITE_SUPABASE_URL=https://oybatvdffsbaxwuxfetz.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set up Supabase (Optional for Testing)

If you want to test the authentication features:

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your project URL and anon key
4. Update `.env.local` with these values

## 🏃‍♂️ Running the Application

### Option 1: Full Stack Development (Recommended)
```bash
npm run dev:full
```
This runs both the React frontend and the Cloudflare Worker locally.

### Option 2: Frontend Only
```bash
npm run dev:local
```
This runs only the React frontend on `http://localhost:5173`

### Option 3: Worker Only
```bash
npm run dev:worker
```
This runs only the Cloudflare Worker on `http://localhost:8787`

## 🌐 Access Points

- **Frontend**: http://localhost:5173
- **Worker API**: http://localhost:8787
- **API Endpoints**: http://localhost:5173/api/* (proxied to worker)

## 🧪 Testing Features

### Authentication Testing
1. Open http://localhost:5173
2. Click "Sign In" in the header
3. Test email/password sign up and sign in
4. Test OAuth providers (if configured)

### News Aggregation Testing
1. Navigate to the main feed
2. Test category filtering
3. Test search functionality
4. Test article interactions (like, bookmark)

### User Profile Testing
1. Sign in to access profile features
2. Test profile editing
3. Test preferences management
4. Test reading history

## 🔧 Development Scripts

```bash
# Development
npm run dev:full          # Full stack development
npm run dev:local         # Frontend only
npm run dev:worker        # Worker only

# Building
npm run build             # Build for production
npm run build:frontend    # Build frontend only
npm run preview           # Preview built frontend

# Worker Management
npm run worker:health     # Check worker health
npm run worker:refresh-config  # Refresh worker config
npm run worker:clear-cache     # Clear worker cache
```

## 🚫 Disabled Features

The following features are disabled for local testing:

- **Cloudflare Analytics**: Disabled in preview environment
- **Cloudflare Images**: Disabled for local development
- **Production Deployments**: Deploy commands are disabled
- **Cron Jobs**: Disabled in local environment

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill processes on ports 5173 or 8787
   lsof -ti:5173 | xargs kill -9
   lsof -ti:8787 | xargs kill -9
   ```

2. **Environment Variables Not Loading**
   - Ensure `.env.local` exists and has correct values
   - Restart the development server

3. **Supabase Connection Issues**
   - Verify your Supabase URL and anon key
   - Check if your Supabase project is active
   - Ensure CORS is configured for localhost

4. **Worker Not Starting**
   ```bash
   # Clear wrangler cache
   rm -rf .wrangler
   npm run dev:worker
   ```

### Debug Mode

Enable debug mode by setting in `.env.local`:
```env
VITE_ENABLE_DEBUG=true
VITE_LOG_LEVEL=debug
```

## 📁 Project Structure

```
harare-metro/
├── src/
│   ├── components/          # React components
│   │   ├── auth/           # Authentication components
│   │   └── ui/             # UI components
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utility libraries
│   └── App.jsx             # Main app component
├── worker/                 # Cloudflare Worker code
├── .env.local             # Local environment variables
├── wrangler.toml          # Worker configuration
└── vite.config.js         # Vite configuration
```

## 🔄 Next Steps

Once you're satisfied with local testing:

1. **Enable Deployments**: Update package.json scripts
2. **Configure Production**: Update wrangler.toml
3. **Set up CI/CD**: Configure GitHub Actions
4. **Deploy to Cloudflare**: Use `npm run deploy`

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review the console for error messages
3. Check the network tab for API issues
4. Verify environment variables are loaded correctly
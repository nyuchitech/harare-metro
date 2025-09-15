# Supabase Database Setup

To configure your Supabase database for Harare Metro:

## 1. Open Supabase Dashboard
Go to [app.supabase.com](https://app.supabase.com) and navigate to your project.

## 2. Run SQL Setup Script
1. Navigate to the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `supabase-setup.sql` from the project root
3. Click "Run" to execute the script

## 3. Verify Setup
The script will create:
- **profiles** table for user data
- **bookmarks** table for saved articles
- **likes** table for liked articles  
- **reading_history** table for tracking reading behavior
- **user_preferences** table for user settings
- **analytics_events** table for app analytics

## 4. Row Level Security (RLS)
All tables have RLS policies that ensure:
- Users can only access their own data
- Admins can access analytics data
- Public profiles are viewable by everyone

## 5. Test Connection
Once the script runs successfully, your app will automatically connect using the credentials in `.env.local`:

```
VITE_SUPABASE_URL=https://oybatvdffsbaxwuxfetz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 6. Features Enabled
After setup, your app will have:
- ✅ User authentication (email/password + OAuth)
- ✅ User profiles with role-based access
- ✅ Bookmark and like functionality with Supabase sync
- ✅ Reading history tracking
- ✅ User preferences management
- ✅ Analytics event tracking
- ✅ Real-time data synchronization

The app gracefully falls back to localStorage when Supabase is unavailable.
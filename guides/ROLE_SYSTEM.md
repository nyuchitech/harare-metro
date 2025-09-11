# User Roles and Authentication System

## Overview
The Harare Metro social news app now implements a comprehensive role-based authentication system using Supabase. Authentication is only required for specific protected pages and features.

## User Roles

### Public/Creator Roles
- **Creator** (default): Individual content creator with basic social features
  - Create posts, like articles, save articles, basic profile

- **Business Creator**: Business content creator with enhanced features  
  - All Creator features + business profile, analytics access, promotional content

- **Author**: Professional writer with publishing capabilities
  - All Creator features + article publishing, verified badge, reader insights

### Internal Business Roles  
- **Admin**: Full administrative access to platform
  - All features + user management, content moderation, analytics dashboard

- **Super Admin**: Complete system control and configuration
  - All Admin features + system configuration, database access, API management

- **Moderator**: Content moderation and community management
  - Content moderation, user management, comment management, report handling

- **Analyst**: Analytics and reporting access  
  - Analytics dashboard, report generation, data export, performance insights

- **Content Manager**: Editorial and content management
  - Content management, editorial tools, publication control, SEO optimization

## Authentication Flow

### Unauthenticated Users
- Can browse all articles and content
- Can use search functionality  
- Can view news bytes
- Cannot access profile or insights pages

### Authentication Required Pages
- **Profile Page** (`/profile`): Personal user dashboard and settings
- **Analytics/Insights Page** (`/insights`): Personal reading analytics (requires Creator+ role)
- **Admin Pages**: System administration (requires Admin+ role)

## Technical Implementation

### Environment Variables
```toml
# Role-based access configuration
ROLES_ENABLED = "true" 
DEFAULT_ROLE = "creator"
ADMIN_ROLES = "admin,super_admin,moderator"
CREATOR_ROLES = "creator,business-creator,author"
```

### Supabase Configuration
- Authentication handled via Supabase Auth
- User profiles stored in `profiles` table with role field
- Role-based access control implemented in AuthContext

### Components
- **AuthContext**: Central authentication state management with role functions
- **RoleManager**: Component for displaying user roles and permissions
- **ProfilePage**: Enhanced with role-based information and permissions display

### Navigation Changes
- Auth modal only appears when accessing protected pages
- Profile and insights buttons trigger authentication if needed
- Public browsing does not require authentication

## Usage

### For Users
1. Browse content freely without authentication
2. Click profile or insights to be prompted for authentication
3. Sign up/in with email or OAuth providers
4. Default role assigned as "creator"
5. Role-specific features unlock based on assigned role

### For Admins  
1. Admin users can access additional system features
2. Role management and user administration capabilities
3. Enhanced analytics and content moderation tools
4. System configuration access for Super Admins

## Database Schema
```sql
-- Profiles table (to be created in Supabase)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'creator' CHECK (role IN ('creator', 'business-creator', 'author', 'admin', 'super_admin', 'moderator', 'analyst', 'content_manager')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

## Security Considerations
- Role validation performed both client-side and server-side
- Admin functions protected with additional security checks
- User roles stored securely in Supabase database
- Environment variables used for role configuration

-- Harare Metro Supabase Database Setup
-- Run this script in your Supabase SQL editor

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- User profiles table
create table if not exists public.profiles (
  id uuid references auth.users(id) primary key,
  email text unique not null,
  username text unique,
  full_name text,
  bio text,
  avatar_url text,
  website text,
  role text default 'creator' check (role in ('creator', 'business-creator', 'author', 'admin', 'super_admin', 'moderator', 'analyst', 'content_manager')),
  is_verified boolean default false,
  preferences jsonb default '{}',
  metadata jsonb default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- User bookmarks table
create table if not exists public.bookmarks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  article_id text not null, -- This will be the article slug or ID from your content
  article_title text,
  article_url text,
  article_source text,
  article_category text,
  article_image_url text,
  article_published_at timestamp with time zone,
  article_data jsonb, -- Store full article data
  created_at timestamp with time zone default now()
);

-- User likes table  
create table if not exists public.likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  article_id text not null,
  created_at timestamp with time zone default now(),
  unique(user_id, article_id)
);

-- Reading history table
create table if not exists public.reading_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  article_id text not null,
  article_title text,
  article_url text,
  reading_time_seconds integer default 0,
  scroll_percentage integer default 0,
  viewed_at timestamp with time zone default now()
);

-- User preferences table (if not using JSONB in profiles)
create table if not exists public.user_preferences (
  user_id uuid references public.profiles(id) primary key,
  theme text default 'system' check (theme in ('light', 'dark', 'system')),
  language text default 'en',
  categories text[] default array[]::text[], -- Preferred categories
  notifications jsonb default '{}',
  privacy jsonb default '{}',
  updated_at timestamp with time zone default now()
);

-- Analytics events table
create table if not exists public.analytics_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  session_id text,
  event_type text not null, -- 'page_view', 'article_click', 'like', 'bookmark', 'share', etc.
  event_data jsonb default '{}',
  article_id text,
  category text,
  source text,
  user_agent text,
  ip_address inet,
  referrer text,
  created_at timestamp with time zone default now()
);

-- Indexes for performance
create index if not exists profiles_username_idx on public.profiles(username);
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists bookmarks_user_id_idx on public.bookmarks(user_id);
create index if not exists bookmarks_created_at_idx on public.bookmarks(created_at desc);
create index if not exists likes_user_id_idx on public.likes(user_id);
create index if not exists likes_article_id_idx on public.likes(article_id);
create index if not exists reading_history_user_id_idx on public.reading_history(user_id);
create index if not exists reading_history_viewed_at_idx on public.reading_history(viewed_at desc);
create index if not exists analytics_events_user_id_idx on public.analytics_events(user_id);
create index if not exists analytics_events_event_type_idx on public.analytics_events(event_type);
create index if not exists analytics_events_created_at_idx on public.analytics_events(created_at desc);

-- Row Level Security (RLS) policies
alter table public.profiles enable row level security;
alter table public.bookmarks enable row level security;
alter table public.likes enable row level security;
alter table public.reading_history enable row level security;
alter table public.user_preferences enable row level security;
alter table public.analytics_events enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone" 
  on public.profiles for select using (true);

create policy "Users can update own profile" 
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile" 
  on public.profiles for insert with check (auth.uid() = id);

-- Bookmarks policies
create policy "Users can view own bookmarks" 
  on public.bookmarks for select using (auth.uid() = user_id);

create policy "Users can insert own bookmarks" 
  on public.bookmarks for insert with check (auth.uid() = user_id);

create policy "Users can update own bookmarks" 
  on public.bookmarks for update using (auth.uid() = user_id);

create policy "Users can delete own bookmarks" 
  on public.bookmarks for delete using (auth.uid() = user_id);

-- Likes policies
create policy "Users can view own likes" 
  on public.likes for select using (auth.uid() = user_id);

create policy "Users can insert own likes" 
  on public.likes for insert with check (auth.uid() = user_id);

create policy "Users can delete own likes" 
  on public.likes for delete using (auth.uid() = user_id);

-- Reading history policies
create policy "Users can view own reading history" 
  on public.reading_history for select using (auth.uid() = user_id);

create policy "Users can insert own reading history" 
  on public.reading_history for insert with check (auth.uid() = user_id);

-- User preferences policies
create policy "Users can view own preferences" 
  on public.user_preferences for select using (auth.uid() = user_id);

create policy "Users can insert own preferences" 
  on public.user_preferences for insert with check (auth.uid() = user_id);

create policy "Users can update own preferences" 
  on public.user_preferences for update using (auth.uid() = user_id);

-- Analytics policies  
create policy "Users can view own analytics" 
  on public.analytics_events for select using (auth.uid() = user_id);

create policy "Users can insert own analytics" 
  on public.analytics_events for insert with check (auth.uid() = user_id);

-- Admins can view all analytics (optional)
create policy "Admins can view all analytics" 
  on public.analytics_events for select using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and role in ('admin', 'super_admin', 'analyst')
    )
  );

-- Triggers for updated_at timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_profiles_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_preferences_updated_at before update on public.user_preferences
  for each row execute procedure public.handle_updated_at();

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username, full_name, avatar_url)
  values (
    new.id,
    new.email,
    public.generate_username(new.email),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  
  -- Create default preferences
  insert into public.user_preferences (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to generate usernames
create or replace function public.generate_username(email text)
returns text as $$
declare
  base_username text;
  final_username text;
  counter integer := 0;
begin
  -- Extract username from email
  base_username := split_part(email, '@', 1);
  base_username := regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g');
  base_username := lower(base_username);
  
  -- Ensure minimum length
  if length(base_username) < 3 then
    base_username := base_username || 'user';
  end if;
  
  final_username := base_username;
  
  -- Check for uniqueness and increment if needed
  while exists (select 1 from public.profiles where username = final_username) loop
    counter := counter + 1;
    final_username := base_username || counter::text;
  end loop;
  
  return final_username;
end;
$$ language plpgsql;

-- Update profiles to add username for existing users without one
update public.profiles 
set username = public.generate_username(email)
where username is null;

-- Make username required going forward
alter table public.profiles alter column username set not null;
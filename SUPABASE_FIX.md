# Supabase Database Fix for User Creation

If you're experiencing "Database error saving new user", you need to update your Supabase database schema.

## The Issue

The original database setup had a problem where:
1. The `username` field was made required (NOT NULL)
2. But the trigger function didn't set usernames for new users
3. This caused new user creation to fail

## The Fix

Run this SQL in your Supabase SQL Editor to fix the issue:

```sql
-- Fix the handle_new_user function to include username generation
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
```

## Alternative: Re-run Complete Setup

If you haven't created many users yet, you can also:

1. Drop the existing tables (this will delete all user data!)
2. Re-run the complete `supabase-setup.sql` script

The updated script now correctly handles username generation for new users.

## Verification

After applying the fix:

1. Try creating a new user account
2. The user should be created successfully
3. Check the `profiles` table - new users should have auto-generated usernames
4. Username-based profile URLs like `/@username` should work

## What Changed

- ✅ `handle_new_user()` function now generates usernames automatically
- ✅ Frontend no longer tries to manually create profiles (trigger handles it)
- ✅ All profile objects include username fields for consistency
- ✅ New users get unique usernames based on their email

The system now works seamlessly for both new user registration and existing user login.
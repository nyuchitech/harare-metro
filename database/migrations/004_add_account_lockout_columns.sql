-- Migration: Add account lockout columns to users table
-- Supports escalating lockout policy (15 min → 1 hour → 24 hours → permanent)

-- Add lockout tracking columns
ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN account_locked_until TEXT DEFAULT NULL;
ALTER TABLE users ADD COLUMN account_locked_permanently INTEGER DEFAULT 0; -- SQLite boolean

-- Create index for lockout queries
CREATE INDEX IF NOT EXISTS idx_users_lockout ON users(account_locked_permanently, account_locked_until);

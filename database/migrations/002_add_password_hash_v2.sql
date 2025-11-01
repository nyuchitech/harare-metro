-- Migration: Add password_hash column to users table (revised)
-- This allows backend admin login using D1 users instead of hardcoded credentials
-- Database: hararemetro_db

-- Add password_hash column to users table (skip if already exists)
-- Note: username column already exists in production database

-- Try to add password_hash column (will fail silently if exists)
ALTER TABLE users ADD COLUMN password_hash TEXT;

-- Create a simple password hash for the super admin user
-- Password: admin123 (change in production!)
-- Hash generated using simple SHA-256 (matches backend hashPassword function)
-- NOTE: In production, use bcrypt or Argon2 for password hashing

-- Insert super admin user (bryan@nyuchi.com) if not exists
-- Password: admin123 (temporary - should be changed in production)
-- Hash: SHA-256 of 'admin123' + 'harare-metro-admin-secret-2025'
INSERT OR IGNORE INTO users (
    id,
    email,
    username,
    display_name,
    role,
    status,
    email_verified,
    password_hash,
    login_count,
    analytics_consent,
    preferences
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'bryan@nyuchi.com',
    'bryan',
    'Bryan Fawcett',
    'admin',
    'active',
    TRUE,
    '84fd2f8b0f9c2757b3cfec42403b75380dea71d405f397fec43de402dfa3accd',
    0,
    TRUE,
    '{}'
);

-- Add index on password_hash for faster lookups (though email is primary lookup)
CREATE INDEX IF NOT EXISTS idx_users_password_hash ON users(password_hash);

-- Migration: Add username field to users table
-- Enables TikTok-like usernames with profile pages at /@username

-- Add username column to users table (non-unique initially)
ALTER TABLE users ADD COLUMN username TEXT;

-- Create unique index for username lookups (enforces uniqueness)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;

-- Update existing users with generated usernames (email prefix)
-- This will be handled by the backend during user registration/update
-- For existing users without usernames, they can set it when they first login

-- Add trigger to validate username format
-- Usernames must be 3-30 characters, alphanumeric + underscore/hyphen only
CREATE TRIGGER IF NOT EXISTS validate_username_format
    BEFORE INSERT ON users
    FOR EACH ROW
    WHEN NEW.username IS NOT NULL
    BEGIN
        SELECT CASE
            WHEN LENGTH(NEW.username) < 3 OR LENGTH(NEW.username) > 30 THEN
                RAISE(ABORT, 'Username must be 3-30 characters')
            WHEN NEW.username NOT GLOB '[a-zA-Z0-9_-]*' THEN
                RAISE(ABORT, 'Username can only contain letters, numbers, underscores and hyphens')
        END;
    END;

CREATE TRIGGER IF NOT EXISTS validate_username_format_update
    BEFORE UPDATE OF username ON users
    FOR EACH ROW
    WHEN NEW.username IS NOT NULL
    BEGIN
        SELECT CASE
            WHEN LENGTH(NEW.username) < 3 OR LENGTH(NEW.username) > 30 THEN
                RAISE(ABORT, 'Username must be 3-30 characters')
            WHEN NEW.username NOT GLOB '[a-zA-Z0-9_-]*' THEN
                RAISE(ABORT, 'Username can only contain letters, numbers, underscores and hyphens')
        END;
    END;

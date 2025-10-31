-- Migration 012: User Number and UID System
-- Adds unique user numbers (starting at 00000001) and ensures unique UIDs

-- =============================================================================
-- ADD USER NUMBER AND UID COLUMNS
-- =============================================================================

-- Add user_number column (format: 00000001, 00000002, etc.)
-- Note: UNIQUE constraint will be added via index below (SQLite limitation)
ALTER TABLE users ADD COLUMN user_number TEXT;

-- Add user_uid column (unique identifier separate from id)
-- Note: UNIQUE constraint will be added via index below (SQLite limitation)
ALTER TABLE users ADD COLUMN user_uid TEXT;

-- =============================================================================
-- CREATE SEQUENCE TABLE FOR USER NUMBERS
-- =============================================================================

-- Table to track the next user number
CREATE TABLE IF NOT EXISTS user_number_sequence (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    next_number INTEGER NOT NULL DEFAULT 1
);

-- Initialize sequence
INSERT OR IGNORE INTO user_number_sequence (id, next_number) VALUES (1, 1);

-- =============================================================================
-- BACKFILL EXISTING USERS
-- =============================================================================

-- Generate user numbers for existing users (if any)
-- This will be done via a separate script or trigger

-- =============================================================================
-- CREATE TRIGGER FOR AUTO-GENERATING USER NUMBER
-- =============================================================================

-- Trigger to auto-generate user_number on insert
CREATE TRIGGER IF NOT EXISTS generate_user_number
AFTER INSERT ON users
FOR EACH ROW
WHEN NEW.user_number IS NULL
BEGIN
    -- Get the next number and increment it
    UPDATE user_number_sequence SET next_number = next_number + 1 WHERE id = 1;

    -- Format as 8-digit string with leading zeros
    UPDATE users
    SET user_number = printf('%08d', (SELECT next_number - 1 FROM user_number_sequence WHERE id = 1)),
        user_uid = lower(hex(randomblob(16)))
    WHERE id = NEW.id AND user_number IS NULL;
END;

-- =============================================================================
-- CREATE INDEXES
-- =============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_user_number ON users(user_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_user_uid ON users(user_uid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email);

-- =============================================================================
-- BACKFILL SCRIPT FOR EXISTING USERS
-- =============================================================================

-- Update existing users without user_number
UPDATE users
SET
    user_number = (
        SELECT printf('%08d', ROW_NUMBER() OVER (ORDER BY created_at))
        FROM users AS u2
        WHERE u2.id = users.id
    ),
    user_uid = lower(hex(randomblob(16)))
WHERE user_number IS NULL;

-- Update the sequence to reflect the current max
UPDATE user_number_sequence
SET next_number = (
    SELECT COALESCE(MAX(CAST(user_number AS INTEGER)), 0) + 1
    FROM users
)
WHERE id = 1;

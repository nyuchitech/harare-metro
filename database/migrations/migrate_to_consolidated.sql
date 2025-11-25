-- Migration: Upgrade existing production D1 to consolidated schema
-- This adds missing columns, tables, indexes, and triggers to existing database

-- ============================================================================
-- Add missing columns to articles table
-- ============================================================================

-- Add byline column (new in consolidated schema)
ALTER TABLE articles ADD COLUMN byline TEXT DEFAULT NULL;

-- Add comment_count column if not exists
ALTER TABLE articles ADD COLUMN comment_count INTEGER DEFAULT 0;

-- Add search_vector column for full-text search
ALTER TABLE articles ADD COLUMN content_search TEXT DEFAULT NULL;

-- Add reading_time column
ALTER TABLE articles ADD COLUMN reading_time INTEGER DEFAULT 5;

-- Add word_count column
ALTER TABLE articles ADD COLUMN word_count INTEGER DEFAULT 0;

-- Add trending_score column
ALTER TABLE articles ADD COLUMN trending_score REAL DEFAULT 0.0;

-- Add processed_content column for AI processing
ALTER TABLE articles ADD COLUMN processed_content TEXT DEFAULT NULL;

-- Add ai_processed flag
ALTER TABLE articles ADD COLUMN ai_processed INTEGER DEFAULT 0;

-- Add excerpt column
ALTER TABLE articles ADD COLUMN excerpt TEXT DEFAULT NULL;

-- ============================================================================
-- Add missing columns to users table (if exists)
-- ============================================================================

-- Check if users table exists, if not it will be created later
-- These are safe to run even if columns exist

-- Add username column (TikTok-style @username)
-- Note: This might already exist from migration 002
-- ALTER TABLE users ADD COLUMN username TEXT DEFAULT NULL;

-- Add password_hash for auth
-- ALTER TABLE users ADD COLUMN password_hash TEXT DEFAULT NULL;

-- Add failed_login_attempts for account lockout
-- ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;

-- Add account_locked_until
-- ALTER TABLE users ADD COLUMN account_locked_until TEXT DEFAULT NULL;

-- Add account_locked_permanently
-- ALTER TABLE users ADD COLUMN account_locked_permanently INTEGER DEFAULT 0;

-- ============================================================================
-- Create article_comments table if not exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS article_comments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    article_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    parent_id TEXT DEFAULT NULL, -- For threaded comments
    content TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'hidden', 'flagged', 'deleted')),
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES article_comments(id) ON DELETE CASCADE
);

-- ============================================================================
-- Create indexes for articles table
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_articles_byline ON articles(byline);
CREATE INDEX IF NOT EXISTS idx_articles_reading_time ON articles(reading_time);
CREATE INDEX IF NOT EXISTS idx_articles_trending_score ON articles(trending_score);
CREATE INDEX IF NOT EXISTS idx_articles_ai_processed ON articles(ai_processed);
CREATE INDEX IF NOT EXISTS idx_articles_content_search ON articles(content_search);

-- ============================================================================
-- Create indexes for article_comments
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_comments_article ON article_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON article_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON article_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON article_comments(created_at DESC);

-- ============================================================================
-- Create user engagement indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_likes_article ON user_likes(article_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON user_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_article ON user_bookmarks(article_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON user_bookmarks(user_id);

-- ============================================================================
-- Create triggers for automatic updates
-- ============================================================================

-- Update updated_at timestamp on articles
CREATE TRIGGER IF NOT EXISTS update_articles_timestamp
AFTER UPDATE ON articles
BEGIN
    UPDATE articles SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = NEW.id;
END;

-- Update comment_count when comment added
CREATE TRIGGER IF NOT EXISTS increment_comment_count
AFTER INSERT ON article_comments
WHEN NEW.status = 'active'
BEGIN
    UPDATE articles SET comment_count = comment_count + 1 WHERE id = NEW.article_id;
END;

-- Update comment_count when comment deleted
CREATE TRIGGER IF NOT EXISTS decrement_comment_count
AFTER UPDATE ON article_comments
WHEN OLD.status = 'active' AND NEW.status != 'active'
BEGIN
    UPDATE articles SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = NEW.article_id;
END;

-- Update content_search on article insert/update for full-text search
CREATE TRIGGER IF NOT EXISTS update_article_search_content
AFTER INSERT ON articles
BEGIN
    UPDATE articles
    SET content_search =
        COALESCE(NEW.title, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.content, '') || ' ' ||
        COALESCE(NEW.tags, '')
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_article_search_content_on_update
AFTER UPDATE ON articles
BEGIN
    UPDATE articles
    SET content_search =
        COALESCE(NEW.title, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.content, '') || ' ' ||
        COALESCE(NEW.tags, '')
    WHERE id = NEW.id;
END;

-- Calculate reading time on insert/update
CREATE TRIGGER IF NOT EXISTS calculate_reading_time_insert
AFTER INSERT ON articles
BEGIN
    UPDATE articles
    SET reading_time = CAST(ROUND(LENGTH(COALESCE(NEW.content, '')) * 1.0 / 1000) AS INTEGER)
    WHERE id = NEW.id AND reading_time = 5; -- Only if not manually set
END;

CREATE TRIGGER IF NOT EXISTS calculate_reading_time_update
AFTER UPDATE ON articles
WHEN NEW.content != OLD.content
BEGIN
    UPDATE articles
    SET reading_time = CAST(ROUND(LENGTH(COALESCE(NEW.content, '')) * 1.0 / 1000) AS INTEGER)
    WHERE id = NEW.id;
END;

-- ============================================================================
-- Backfill data for existing articles
-- ============================================================================

-- Populate content_search for existing articles
UPDATE articles
SET content_search =
    COALESCE(title, '') || ' ' ||
    COALESCE(description, '') || ' ' ||
    COALESCE(content, '') || ' ' ||
    COALESCE(tags, '')
WHERE content_search IS NULL;

-- Calculate reading_time for existing articles
UPDATE articles
SET reading_time = CAST(ROUND(LENGTH(COALESCE(content, '')) * 1.0 / 1000) AS INTEGER)
WHERE reading_time = 5 OR reading_time IS NULL;

-- Calculate word_count for existing articles
UPDATE articles
SET word_count = LENGTH(content) - LENGTH(REPLACE(content, ' ', '')) + 1
WHERE word_count = 0 OR word_count IS NULL;

-- Copy author to byline for existing articles
UPDATE articles
SET byline = author
WHERE byline IS NULL AND author IS NOT NULL;

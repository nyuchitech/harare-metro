-- Migration 007: Complete User Engagement (Comments & Follows)
-- Adds remaining tables needed for Phase 2: User Engagement APIs

-- =============================================================================
-- ARTICLE COMMENTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS article_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id INTEGER REFERENCES article_comments(id) ON DELETE CASCADE,

    -- Comment content
    content TEXT NOT NULL,

    -- Engagement
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,

    -- Moderation
    status TEXT DEFAULT 'published' CHECK (status IN ('published', 'pending', 'flagged', 'deleted')),
    flagged_reason TEXT,
    moderated_by TEXT REFERENCES users(id),
    moderated_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Comment likes (for liking comments)
CREATE TABLE IF NOT EXISTS comment_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comment_id INTEGER NOT NULL REFERENCES article_comments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(comment_id, user_id)
);

-- =============================================================================
-- USER FOLLOWS
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- What is being followed
    follow_type TEXT NOT NULL CHECK (follow_type IN ('source', 'author', 'category')),
    follow_id TEXT NOT NULL, -- source_id, author_id, or category_id

    -- Notification preferences for this follow
    notify_on_new BOOLEAN DEFAULT TRUE,
    notify_on_trending BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, follow_type, follow_id)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_article_comments_article_id ON article_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_user_id ON article_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_parent_id ON article_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_created_at ON article_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_comments_status ON article_comments(status);

-- Comment likes indexes
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

-- Follows indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_user_id ON user_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_type ON user_follows(follow_type);
CREATE INDEX IF NOT EXISTS idx_user_follows_follow_id ON user_follows(follow_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_composite ON user_follows(user_id, follow_type);

-- =============================================================================
-- TRIGGERS FOR ENGAGEMENT TRACKING
-- =============================================================================

-- Update article comment_count when comment added
CREATE TRIGGER IF NOT EXISTS update_article_comment_count_insert
AFTER INSERT ON article_comments
FOR EACH ROW
WHEN NEW.status = 'published'
BEGIN
    UPDATE articles
    SET comment_count = comment_count + 1
    WHERE id = NEW.article_id;
END;

-- Update article comment_count when comment deleted
CREATE TRIGGER IF NOT EXISTS update_article_comment_count_delete
AFTER UPDATE ON article_comments
FOR EACH ROW
WHEN NEW.status = 'deleted' AND OLD.status = 'published'
BEGIN
    UPDATE articles
    SET comment_count = comment_count - 1
    WHERE id = NEW.article_id;
END;

-- Update parent comment reply_count
CREATE TRIGGER IF NOT EXISTS update_comment_reply_count_insert
AFTER INSERT ON article_comments
FOR EACH ROW
WHEN NEW.parent_comment_id IS NOT NULL AND NEW.status = 'published'
BEGIN
    UPDATE article_comments
    SET reply_count = reply_count + 1
    WHERE id = NEW.parent_comment_id;
END;

-- Update comment like_count
CREATE TRIGGER IF NOT EXISTS update_comment_like_count_insert
AFTER INSERT ON comment_likes
FOR EACH ROW
BEGIN
    UPDATE article_comments
    SET like_count = like_count + 1
    WHERE id = NEW.comment_id;
END;

-- Update comment like_count on unlike
CREATE TRIGGER IF NOT EXISTS update_comment_like_count_delete
AFTER DELETE ON comment_likes
FOR EACH ROW
BEGIN
    UPDATE article_comments
    SET like_count = like_count - 1
    WHERE id = OLD.comment_id;
END;

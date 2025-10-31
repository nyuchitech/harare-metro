-- Migration 011: Category Manager Enhancement Tables
-- Adds tables required by CategoryManager service for advanced category analytics

-- =============================================================================
-- USER CATEGORY INTERESTS
-- =============================================================================

-- Tracks user interest and engagement per category
CREATE TABLE IF NOT EXISTS user_category_interests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,

    -- Interest scoring
    interest_score REAL DEFAULT 0.0,  -- Calculated interest score (0-100)
    view_count INTEGER DEFAULT 0,     -- Number of articles viewed in this category
    engagement_count INTEGER DEFAULT 0, -- Number of engagements (likes, comments, shares)

    -- Timestamps
    last_interaction_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, category_id)
);

-- =============================================================================
-- CATEGORY PERFORMANCE METRICS
-- =============================================================================

-- Daily performance metrics per category
CREATE TABLE IF NOT EXISTS category_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    date DATE NOT NULL,  -- YYYY-MM-DD format

    -- Content metrics
    article_count INTEGER DEFAULT 0,  -- Articles published in this category today

    -- Engagement metrics
    total_views INTEGER DEFAULT 0,
    total_engagements INTEGER DEFAULT 0,  -- Likes + comments + shares
    unique_readers INTEGER DEFAULT 0,

    -- Quality metrics
    avg_read_time REAL DEFAULT 0.0,  -- Average reading time in seconds
    bounce_rate REAL DEFAULT 0.0,     -- Percentage (0-1) of single-page sessions

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(category_id, date)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- User interests indexes
CREATE INDEX IF NOT EXISTS idx_user_category_interests_user_id
    ON user_category_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_category_interests_category_id
    ON user_category_interests(category_id);
CREATE INDEX IF NOT EXISTS idx_user_category_interests_score
    ON user_category_interests(interest_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_category_interests_last_interaction
    ON user_category_interests(last_interaction_at DESC);

-- Category performance indexes
CREATE INDEX IF NOT EXISTS idx_category_performance_category_id
    ON category_performance(category_id);
CREATE INDEX IF NOT EXISTS idx_category_performance_date
    ON category_performance(date DESC);
CREATE INDEX IF NOT EXISTS idx_category_performance_engagements
    ON category_performance(total_engagements DESC);

-- =============================================================================
-- TRIGGERS FOR AUTOMATION
-- =============================================================================

-- Update timestamp on user category interests changes
CREATE TRIGGER IF NOT EXISTS update_user_category_interests_timestamp
    AFTER UPDATE ON user_category_interests
    FOR EACH ROW
    BEGIN
        UPDATE user_category_interests
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.id;
    END;

-- Update timestamp on category performance changes
CREATE TRIGGER IF NOT EXISTS update_category_performance_timestamp
    AFTER UPDATE ON category_performance
    FOR EACH ROW
    BEGIN
        UPDATE category_performance
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.id;
    END;

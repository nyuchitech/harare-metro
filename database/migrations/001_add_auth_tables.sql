-- Migration: Add Authentication and User Management Tables
-- Replaces Supabase with Cloudflare OpenAuth implementation
-- Database: hararemetro_db

-- ===== AUTHENTICATION TABLES =====

-- Users table (replaces Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Profile information
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    
    -- Role management
    role TEXT NOT NULL DEFAULT 'creator' CHECK (role IN ('creator', 'business-creator', 'moderator', 'admin')),
    
    -- Account status
    email_verified BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    
    -- Activity tracking
    last_login_at TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    
    -- Preferences
    preferences JSON DEFAULT '{}',
    
    -- Analytics opt-in
    analytics_consent BOOLEAN DEFAULT TRUE
);

-- User sessions table (for OpenAuth session management)
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Session metadata
    ip_address TEXT,
    user_agent TEXT,
    device_type TEXT, -- mobile, desktop, tablet
    browser TEXT,
    os TEXT,
    location TEXT -- city/country from IP
);

-- ===== USER INTERACTION TABLES =====

-- User bookmarks (replaces Supabase bookmarks)
CREATE TABLE IF NOT EXISTS user_bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tags TEXT, -- User-defined tags for organizing bookmarks
    notes TEXT, -- Personal notes on the bookmark
    
    UNIQUE(user_id, article_id)
);

-- User likes (replaces Supabase likes)
CREATE TABLE IF NOT EXISTS user_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, article_id)
);

-- Reading history (replaces Supabase reading_history)
CREATE TABLE IF NOT EXISTS user_reading_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    
    -- Reading engagement metrics
    reading_time INTEGER DEFAULT 0, -- Time spent reading in seconds
    scroll_depth INTEGER DEFAULT 0, -- Percentage of article scrolled (0-100)
    completion_percentage INTEGER DEFAULT 0, -- Estimated completion percentage
    
    -- Timestamps
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_position_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Reading context
    device_type TEXT,
    referrer TEXT,
    
    UNIQUE(user_id, article_id)
);

-- User preferences and settings
CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preference_key TEXT NOT NULL,
    preference_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, preference_key)
);

-- ===== CATEGORIES AND SOURCES MANAGEMENT =====

-- News categories (dynamic from D1, not hardcoded)
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    emoji TEXT,
    color TEXT, -- Hex color code for UI
    enabled BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- News sources management
CREATE TABLE IF NOT EXISTS news_sources (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    website_url TEXT,
    rss_feed_url TEXT NOT NULL,
    logo_url TEXT,
    description TEXT,
    country TEXT DEFAULT 'Zimbabwe',
    language TEXT DEFAULT 'en',
    category_id TEXT REFERENCES categories(id),
    
    -- Source status
    enabled BOOLEAN DEFAULT TRUE,
    verified BOOLEAN DEFAULT FALSE,
    
    -- Fetching configuration
    fetch_frequency INTEGER DEFAULT 60, -- Minutes between fetches
    last_fetched_at TIMESTAMP,
    last_successful_fetch_at TIMESTAMP,
    fetch_error_count INTEGER DEFAULT 0,
    last_fetch_error TEXT,
    
    -- Source metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== SYSTEM OBSERVABILITY TABLES =====

-- System logs for comprehensive logging
CREATE TABLE IF NOT EXISTS system_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
    message TEXT NOT NULL,
    metadata JSON DEFAULT '{}',
    request_id TEXT,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    duration INTEGER, -- Request duration in milliseconds
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System metrics for performance monitoring
CREATE TABLE IF NOT EXISTS system_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    value REAL NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('counter', 'gauge', 'histogram', 'timer')),
    tags JSON DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== ANALYTICS AND OBSERVABILITY =====

-- Enhanced analytics events (replaces Analytics Engine for detailed tracking)
CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL, -- page_view, article_view, search, bookmark, like, share, etc.
    event_data JSON, -- Flexible event data storage
    
    -- User context
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    session_id TEXT,
    
    -- Content context
    article_id INTEGER REFERENCES articles(id) ON DELETE SET NULL,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Technical context
    ip_address TEXT, -- Hashed for privacy
    user_agent TEXT,
    referer TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    screen_resolution TEXT,
    
    -- Location context (from IP)
    country TEXT,
    city TEXT,
    timezone TEXT,
    
    -- Performance metrics
    page_load_time INTEGER, -- In milliseconds
    time_on_page INTEGER, -- In seconds
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System audit log for observability
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL, -- user_created, article_published, login, etc.
    resource_type TEXT NOT NULL, -- user, article, category, etc.
    resource_id TEXT,
    
    -- Actor information
    actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    actor_ip TEXT,
    
    -- Change details
    old_values JSON,
    new_values JSON,
    
    -- Metadata
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    request_id TEXT, -- For tracing requests across services
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== INDEXES FOR PERFORMANCE =====

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Session indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Interaction indexes
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_article_id ON user_bookmarks(article_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_user_id ON user_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_article_id ON user_likes(article_id);
CREATE INDEX IF NOT EXISTS idx_user_reading_history_user_id ON user_reading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reading_history_article_id ON user_reading_history(article_id);

-- Content indexes
CREATE INDEX IF NOT EXISTS idx_categories_enabled ON categories(enabled);
CREATE INDEX IF NOT EXISTS idx_news_sources_enabled ON news_sources(enabled);
CREATE INDEX IF NOT EXISTS idx_news_sources_category_id ON news_sources(category_id);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_article_id ON analytics_events(article_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Audit indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_resource_type ON audit_log(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_user_id ON audit_log(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- ===== TRIGGERS FOR AUTOMATION =====

-- Update timestamps on user changes
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
    AFTER UPDATE ON users
    FOR EACH ROW
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;

-- Update categories timestamp
CREATE TRIGGER IF NOT EXISTS update_categories_timestamp 
    AFTER UPDATE ON categories
    FOR EACH ROW
    BEGIN
        UPDATE categories SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;

-- Update news sources timestamp
CREATE TRIGGER IF NOT EXISTS update_news_sources_timestamp 
    AFTER UPDATE ON news_sources
    FOR EACH ROW
    BEGIN
        UPDATE news_sources SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;

-- Update user preferences timestamp
CREATE TRIGGER IF NOT EXISTS update_user_preferences_timestamp 
    AFTER UPDATE ON user_preferences
    FOR EACH ROW
    BEGIN
        UPDATE user_preferences SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;

-- Auto-increment login count on new session
CREATE TRIGGER IF NOT EXISTS increment_login_count
    AFTER INSERT ON user_sessions
    FOR EACH ROW
    BEGIN
        UPDATE users 
        SET login_count = login_count + 1,
            last_login_at = CURRENT_TIMESTAMP
        WHERE id = NEW.user_id;
    END;

-- ===== INITIAL DATA =====

-- Default categories for Zimbabwe news
INSERT OR IGNORE INTO categories (id, name, description, emoji, color, sort_order) VALUES
('politics', 'Politics', 'Government, elections, policy news', '🏛️', '#EF3340', 1),
('business', 'Business', 'Economy, finance, markets, business news', '💼', '#00A651', 2),
('sports', 'Sports', 'Local and international sports coverage', '⚽', '#FDD116', 3),
('health', 'Health', 'Healthcare, medical news, wellness', '🏥', '#00A651', 4),
('education', 'Education', 'Schools, universities, educational policy', '🎓', '#FDD116', 5),
('technology', 'Technology', 'Tech innovations, digital transformation', '💻', '#000000', 6),
('entertainment', 'Entertainment', 'Arts, culture, music, movies', '🎭', '#EF3340', 7),
('lifestyle', 'Lifestyle', 'Fashion, food, travel, general interest', '✨', '#FDD116', 8),
('opinion', 'Opinion', 'Editorial content, opinion pieces', '💭', '#000000', 9);

-- Default Zimbabwe news sources
INSERT OR IGNORE INTO news_sources (id, name, website_url, rss_feed_url, category_id, description) VALUES
('herald', 'The Herald', 'https://www.herald.co.zw', 'https://www.herald.co.zw/feed/', 'politics', 'Zimbabwe national newspaper'),
('newsday', 'NewsDay', 'https://www.newsday.co.zw', 'https://www.newsday.co.zw/feed/', 'politics', 'Independent daily newspaper'),
('chronicle', 'The Chronicle', 'https://www.chronicle.co.zw', 'https://www.chronicle.co.zw/feed/', 'politics', 'Bulawayo-based newspaper'),
('standard', 'The Standard', 'https://www.thestandard.co.zw', 'https://www.thestandard.co.zw/feed/', 'politics', 'Weekly newspaper'),
('dailynews', 'Daily News', 'https://www.dailynews.co.zw', 'https://www.dailynews.co.zw/feed/', 'politics', 'Daily newspaper');
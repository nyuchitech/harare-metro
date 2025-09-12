-- Harare Metro D1 Database Schema
-- Migrating from KV storage to D1 for better scalability and consistency

-- =============================================================================
-- CONFIGURATION TABLES (replaces HM_CONFIGURATIONS KV)
-- =============================================================================

-- System configuration settings
CREATE TABLE IF NOT EXISTS system_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL, -- JSON stored as TEXT
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- RSS feed sources configuration
CREATE TABLE IF NOT EXISTS rss_sources (
    id TEXT PRIMARY KEY, -- e.g., 'herald-zimbabwe'
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    enabled INTEGER DEFAULT 1, -- 0 or 1 (boolean)
    priority INTEGER DEFAULT 3,
    metadata TEXT, -- JSON stored as TEXT (e.g., parsing settings)
    last_fetched_at DATETIME,
    fetch_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Content categories
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY, -- e.g., 'politics', 'sports'
    name TEXT NOT NULL,
    emoji TEXT,
    color TEXT, -- hex color code
    description TEXT,
    keywords TEXT, -- JSON array of keywords stored as TEXT
    enabled INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Trusted image domains for security
CREATE TABLE IF NOT EXISTS trusted_domains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT NOT NULL UNIQUE,
    type TEXT DEFAULT 'image', -- 'image', 'content', 'api'
    enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- ARTICLES & CONTENT TABLES (replaces HM_NEWS_STORAGE & HM_CACHE_STORAGE KV)
-- =============================================================================

-- Main articles table
CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE, -- URL-friendly version of title
    description TEXT,
    content TEXT, -- Full article content
    content_snippet TEXT, -- Short preview
    author TEXT,
    source TEXT NOT NULL, -- RSS source name
    source_id TEXT, -- Foreign key to rss_sources.id
    source_url TEXT, -- Original RSS feed URL
    category_id TEXT, -- Foreign key to categories.id
    tags TEXT, -- JSON array stored as TEXT
    published_at DATETIME NOT NULL,
    image_url TEXT,
    optimized_image_url TEXT,
    original_url TEXT NOT NULL, -- Link to original article
    rss_guid TEXT, -- Original RSS GUID for deduplication
    status TEXT DEFAULT 'published', -- 'draft', 'published', 'archived'
    priority INTEGER DEFAULT 0, -- Higher numbers = higher priority
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES rss_sources(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Article keywords for better searching
CREATE TABLE IF NOT EXISTS article_keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    keyword TEXT NOT NULL,
    weight INTEGER DEFAULT 1, -- Relevance weight
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

-- Cache management metadata
CREATE TABLE IF NOT EXISTS cache_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_key TEXT NOT NULL UNIQUE,
    cache_type TEXT NOT NULL, -- 'articles', 'search', 'rss_metadata', etc.
    data TEXT, -- JSON stored as TEXT
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- RSS feed processing locks and status
CREATE TABLE IF NOT EXISTS feed_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id TEXT NOT NULL,
    status TEXT NOT NULL, -- 'idle', 'processing', 'error', 'locked'
    last_run_at DATETIME,
    next_run_at DATETIME,
    run_count INTEGER DEFAULT 0,
    error_message TEXT,
    processing_duration INTEGER, -- milliseconds
    articles_fetched INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES rss_sources(id)
);

-- =============================================================================
-- NOTE: USER DATA REMAINS IN SUPABASE
-- =============================================================================
-- User bookmarks, likes, reading history, and preferences stay in Supabase
-- This D1 database focuses on:
-- - Configuration data (RSS sources, categories, system settings)
-- - Article content and metadata
-- - Caching and RSS processing status
-- - Anonymous analytics data

-- =============================================================================
-- ANALYTICS TABLES (complementing Analytics Engine)
-- =============================================================================

-- Search queries for internal analytics (anonymous data only)
CREATE TABLE IF NOT EXISTS search_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query TEXT NOT NULL,
    category_filter TEXT,
    results_count INTEGER DEFAULT 0,
    clicked_result_id INTEGER, -- Which article was clicked
    session_id TEXT, -- Anonymous session identifier
    ip_hash TEXT, -- Hashed IP for privacy
    user_agent_hash TEXT, -- Hashed user agent for privacy
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clicked_result_id) REFERENCES articles(id)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Articles indexes
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_priority ON articles(priority DESC);
CREATE INDEX IF NOT EXISTS idx_articles_rss_guid ON articles(rss_guid);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);

-- Search and keywords indexes
CREATE INDEX IF NOT EXISTS idx_article_keywords_keyword ON article_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_article_keywords_article_id ON article_keywords(article_id);

-- Note: User data indexes are handled by Supabase

-- Cache indexes
CREATE INDEX IF NOT EXISTS idx_cache_metadata_key ON cache_metadata(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_metadata_type ON cache_metadata(cache_type);
CREATE INDEX IF NOT EXISTS idx_cache_metadata_expires ON cache_metadata(expires_at);

-- RSS and sources indexes
CREATE INDEX IF NOT EXISTS idx_feed_status_source_id ON feed_status(source_id);
CREATE INDEX IF NOT EXISTS idx_rss_sources_enabled ON rss_sources(enabled);

-- Search logs indexes
CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs(query);
CREATE INDEX IF NOT EXISTS idx_search_logs_session_id ON search_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs(created_at);

-- =============================================================================
-- INITIAL DATA POPULATION
-- =============================================================================

-- Insert default system configuration
INSERT OR IGNORE INTO system_config (key, value, description) VALUES
('site_name', '"Harare Metro"', 'Site name'),
('max_articles_per_source', '500', 'Maximum articles to cache per RSS source'),
('max_total_articles', '40000', 'Maximum total articles to cache'),
('article_content_limit', '1000000', 'Maximum character limit per article'),
('refresh_interval_minutes', '60', 'How often to refresh RSS feeds'),
('pagination_initial_load', '24', 'Articles to load on initial page load'),
('pagination_page_size', '12', 'Articles per page for subsequent loads'),
('enable_analytics', 'true', 'Enable analytics tracking'),
('enable_cloudflare_images', 'true', 'Enable Cloudflare Images optimization'),
('admin_key', '"hararemetro-admin-2025-secure-key"', 'Admin authentication key');

-- Insert default categories
INSERT OR IGNORE INTO categories (id, name, emoji, color, description, keywords, sort_order) VALUES
('all', 'All News', '📰', '#6B7280', 'All news articles from all sources', '[]', 0),
('politics', 'Politics', '🏛️', '#DC2626', 'Political news and government affairs', '["politics", "government", "election", "parliament", "minister", "president", "zanu-pf", "mdc", "mnangagwa", "chamisa"]', 1),
('economy', 'Economy', '💰', '#059669', 'Economic news, business, and finance', '["economy", "business", "finance", "banking", "investment", "market", "currency", "inflation", "trade", "mining", "agriculture"]', 2),
('technology', 'Technology', '💻', '#2563EB', 'Technology, innovation, and digital news', '["technology", "tech", "digital", "innovation", "startup", "mobile", "app", "software", "fintech", "ecocash"]', 3),
('sports', 'Sports', '⚽', '#DC2626', 'Sports news and events', '["sports", "football", "soccer", "cricket", "rugby", "tennis", "warriors", "dynamos", "caps united", "highlanders"]', 4),
('health', 'Health', '🏥', '#059669', 'Health, medical, and wellness news', '["health", "medical", "hospital", "doctor", "covid", "vaccine", "healthcare", "wellness"]', 5),
('education', 'Education', '📚', '#7C3AED', 'Education news and academic affairs', '["education", "school", "university", "student", "teacher", "zimsec", "uz", "msu", "nust"]', 6),
('entertainment', 'Entertainment', '🎬', '#EC4899', 'Entertainment, arts, and culture', '["entertainment", "music", "movie", "celebrity", "culture", "arts", "winky d", "jah prayzah"]', 7),
('international', 'International', '🌍', '#0891B2', 'International and world news', '["international", "world", "global", "africa", "sadc", "usa", "uk", "china"]', 8);

-- Insert default RSS sources
INSERT OR IGNORE INTO rss_sources (id, name, url, category, enabled, priority) VALUES
('herald-zimbabwe', 'Herald Zimbabwe', 'https://www.herald.co.zw/feed/', 'general', 1, 5),
('newsday-zimbabwe', 'NewsDay Zimbabwe', 'https://www.newsday.co.zw/feed/', 'general', 1, 5),
('chronicle-zimbabwe', 'Chronicle Zimbabwe', 'https://www.chronicle.co.zw/feed/', 'general', 1, 5),
('zbc-news', 'ZBC News', 'https://www.zbc.co.zw/feed/', 'news', 1, 4),
('business-weekly', 'Business Weekly', 'https://businessweekly.co.zw/feed/', 'business', 1, 4),
('techzim', 'Techzim', 'https://www.techzim.co.zw/feed/', 'technology', 1, 4),
('the-standard', 'The Standard', 'https://www.thestandard.co.zw/feed/', 'general', 1, 4),
('zimlive', 'ZimLive', 'https://www.zimlive.com/feed/', 'general', 1, 4),
('new-zimbabwe', 'New Zimbabwe', 'https://www.newzimbabwe.com/feed/', 'general', 1, 4),
('the-independent', 'The Independent', 'https://www.theindependent.co.zw/feed/', 'general', 1, 4);

-- Insert trusted image domains
INSERT OR IGNORE INTO trusted_domains (domain, type) VALUES
-- Zimbabwe news sites
('herald.co.zw', 'image'),
('newsday.co.zw', 'image'),
('chronicle.co.zw', 'image'),
('techzim.co.zw', 'image'),
('zbc.co.zw', 'image'),
-- CDN and hosting services
('wordpress.com', 'image'),
('cloudinary.com', 'image'),
('imgur.com', 'image'),
('amazonaws.com', 'image'),
('googleusercontent.com', 'image');
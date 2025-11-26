-- ============================================================================
-- HARARE METRO - CONSOLIDATED DATABASE SCHEMA
-- ============================================================================
-- Single D1 Database: hararemetro_articles
-- Complete schema for news platform with authentication, content, and analytics
-- Consolidates all migrations into one comprehensive schema
--
-- Purpose: Replace Supabase with full Cloudflare D1 stack
-- Platform: Harare Metro (www.hararemetro.co.zw + admin.hararemetro.co.zw)
-- Mobile App: Mukoko News (news.mukoko.com)
-- ============================================================================

-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================

-- Users table (replaces Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(16)))),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE, -- TikTok-style usernames (@username)
    password_hash TEXT, -- Scrypt hash (format: salt:hash)

    -- Profile information
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,

    -- Role management
    role TEXT NOT NULL DEFAULT 'creator' CHECK (role IN ('creator', 'business-creator', 'moderator', 'admin', 'super_admin')),

    -- Account status
    email_verified BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),

    -- Account lockout (security)
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TEXT DEFAULT NULL,
    account_locked_permanently INTEGER DEFAULT 0, -- SQLite boolean

    -- Activity tracking
    last_login_at TIMESTAMP,
    login_count INTEGER DEFAULT 0,

    -- Preferences
    preferences JSON DEFAULT '{}',

    -- Analytics opt-in
    analytics_consent BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table (KV-backed sessions reference)
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

-- ============================================================================
-- NEWS SOURCES & RSS CONFIGURATION
-- ============================================================================

-- News sources management with RSS configuration
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

    -- Enhanced processing
    scraping_enabled BOOLEAN DEFAULT false,
    scraping_selectors TEXT, -- JSON config for content selectors
    author_selectors TEXT, -- JSON config for author extraction
    last_scrape_attempt TIMESTAMP,
    scrape_success_rate REAL DEFAULT 0.0,
    content_freshness_hours INTEGER DEFAULT 24,

    -- Quality metrics
    quality_rating REAL DEFAULT 1.0, -- Editorial quality rating
    credibility_score REAL DEFAULT 1.0, -- Source credibility
    source_quality_score REAL DEFAULT 0.0, -- Overall quality score

    -- RSS configuration (legacy compatibility)
    url TEXT, -- Alias for rss_feed_url
    category TEXT, -- Fallback category
    priority INTEGER DEFAULT 3,
    metadata TEXT, -- JSON metadata
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    fetch_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RSS sources (legacy alias table for backwards compatibility)
CREATE TABLE IF NOT EXISTS rss_sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    enabled INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 3,
    metadata TEXT,
    last_fetched_at DATETIME,
    fetch_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Daily source statistics
CREATE TABLE IF NOT EXISTS daily_source_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id TEXT NOT NULL REFERENCES news_sources(id),
    date TEXT NOT NULL, -- YYYY-MM-DD format
    articles_fetched INTEGER DEFAULT 0,
    fetch_attempts INTEGER DEFAULT 0,
    fetch_errors INTEGER DEFAULT 0,
    avg_fetch_duration INTEGER DEFAULT 0, -- milliseconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(source_id, date)
);

-- Feed status tracking
CREATE TABLE IF NOT EXISTS feed_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id TEXT NOT NULL,
    status TEXT NOT NULL,
    last_run_at DATETIME,
    next_run_at DATETIME,
    run_count INTEGER DEFAULT 0,
    error_message TEXT,
    processing_duration INTEGER,
    articles_fetched INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES rss_sources(id)
);

-- ============================================================================
-- CATEGORIES & KEYWORDS
-- ============================================================================

-- News categories (dynamic from D1)
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    emoji TEXT,
    color TEXT, -- Hex color code for UI
    keywords TEXT, -- Comma-separated keywords for classification
    enabled BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Keywords for content classification (256-keyword taxonomy)
CREATE TABLE IF NOT EXISTS keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL UNIQUE,
    category_id TEXT REFERENCES categories(id),
    priority INTEGER DEFAULT 1, -- 1=high, 2=medium, 3=low
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ARTICLES & CONTENT
-- ============================================================================

-- Articles table - core content storage
CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Core content fields
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT, -- Short description/excerpt
    content TEXT, -- Full article content (from RSS)
    content_snippet TEXT, -- Truncated content preview
    excerpt TEXT, -- AI-generated summary

    -- Author information
    author TEXT, -- Legacy single author field
    byline TEXT, -- Original byline text from RSS

    -- Source information
    source TEXT NOT NULL, -- Display name
    source_id TEXT REFERENCES news_sources(id),
    source_url TEXT, -- Original RSS feed URL

    -- Categorization
    category TEXT, -- Legacy category field
    category_id TEXT REFERENCES categories(id),
    tags TEXT, -- Comma-separated tags/keywords
    content_type TEXT DEFAULT 'article', -- article, opinion, editorial, news, sports, business

    -- Publishing metadata
    published_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_viewed_at DATETIME,
    last_content_update TIMESTAMP,

    -- Article metrics
    word_count INTEGER DEFAULT 0,
    reading_time INTEGER DEFAULT 0, -- Estimated reading time in minutes
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    social_shares INTEGER DEFAULT 0,

    -- Images and media
    image_url TEXT, -- Featured image URL
    optimized_image_url TEXT, -- Cloudflare Images optimized URL

    -- SEO and sharing
    original_url TEXT NOT NULL, -- Original article URL
    rss_guid TEXT, -- RSS GUID for deduplication

    -- Article status and priority
    status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
    priority INTEGER DEFAULT 0, -- Higher priority articles appear first

    -- Quality and trending
    source_quality_score REAL DEFAULT 0.0,
    trending_score REAL DEFAULT 0.0,

    -- AI processing
    ai_processed BOOLEAN DEFAULT FALSE,
    ai_processed_at TIMESTAMP,
    ai_summary TEXT, -- AI-generated summary
    processed_content TEXT, -- Cleaned content (no image URLs)

    -- Full-text search (maintained by trigger)
    content_search TEXT
);

-- Article keywords (many-to-many relationship)
CREATE TABLE IF NOT EXISTS article_keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    weight INTEGER DEFAULT 1,

    UNIQUE(article_id, keyword)
);

-- ============================================================================
-- AUTHORS & BYLINES
-- ============================================================================

-- Authors table - recognize journalism and bylines
CREATE TABLE IF NOT EXISTS authors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL UNIQUE, -- Normalized for deduplication
    slug TEXT UNIQUE, -- URL-friendly slug for author pages

    -- Profile information
    bio TEXT,
    title TEXT, -- Job title (Journalist, Editor, Correspondent, etc.)
    outlet TEXT, -- Primary news outlet
    email TEXT,
    twitter_handle TEXT,
    linkedin_url TEXT,
    profile_image_url TEXT,
    expertise_categories TEXT, -- JSON array of categories

    -- Author statistics
    article_count INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    follower_count INTEGER DEFAULT 0,
    avg_quality_score REAL DEFAULT 0.0,

    -- Verification
    verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'unverified', 'flagged')),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Author-article relationships (many-to-many for co-authored articles)
CREATE TABLE IF NOT EXISTS article_authors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    contribution_type TEXT DEFAULT 'primary' CHECK (contribution_type IN ('primary', 'contributor', 'editor')),
    byline_order INTEGER DEFAULT 1, -- Order in byline for multi-author articles
    confidence_score REAL DEFAULT 1.0, -- AI confidence in attribution
    extraction_method TEXT DEFAULT 'ai' CHECK (extraction_method IN ('rss', 'ai', 'manual')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(article_id, author_id)
);

-- ============================================================================
-- USER ENGAGEMENT (Likes, Bookmarks, Comments, Follows)
-- ============================================================================

-- User bookmarks (saved articles)
CREATE TABLE IF NOT EXISTS user_bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tags TEXT, -- User-defined tags for organizing bookmarks
    notes TEXT, -- Personal notes on the bookmark

    UNIQUE(user_id, article_id)
);

-- User likes (article likes)
CREATE TABLE IF NOT EXISTS user_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, article_id)
);

-- Reading history (user engagement tracking)
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

-- Article comments
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

-- User follows (sources, authors, categories)
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

-- ============================================================================
-- ANALYTICS & TRACKING
-- ============================================================================

-- Analytics events (replaces Analytics Engine for detailed tracking)
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

-- Search logs for analytics
CREATE TABLE IF NOT EXISTS search_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query TEXT NOT NULL,
    category_filter TEXT,
    results_count INTEGER DEFAULT 0,
    clicked_result_id INTEGER REFERENCES articles(id),
    session_id TEXT,
    ip_hash TEXT,
    user_agent_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- AI PROCESSING & CONTENT PIPELINE
-- ============================================================================

-- AI processing log
CREATE TABLE IF NOT EXISTS ai_processing_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,

    -- Processing stage
    stage TEXT NOT NULL, -- 'author_extraction', 'classification', 'summary', 'quality_scoring'
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed')),

    -- AI model information
    model TEXT, -- AI model used (e.g., '@cf/meta/llama-3-8b-instruct')
    prompt_tokens INTEGER,
    response_tokens INTEGER,

    -- Processing results
    input_data TEXT, -- JSON
    output_data TEXT, -- JSON
    error_message TEXT,
    confidence_score REAL,

    -- Timing
    processing_time INTEGER, -- milliseconds
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content extraction log
CREATE TABLE IF NOT EXISTS content_extraction_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    source_id TEXT REFERENCES news_sources(id),
    extraction_type TEXT NOT NULL CHECK (extraction_type IN ('rss', 'scrape', 'manual')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed')),

    -- Content extraction results
    extracted_title TEXT,
    extracted_content TEXT,
    extracted_author TEXT,
    extracted_image_urls TEXT, -- JSON array
    extracted_publish_date TIMESTAMP,

    -- Quality metrics
    content_length INTEGER,
    image_count INTEGER,
    link_count INTEGER,
    readability_score REAL,

    -- Processing metadata
    processing_time INTEGER, -- milliseconds
    error_message TEXT,
    ai_model_used TEXT,
    extraction_confidence REAL DEFAULT 0.0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Pipeline stages tracking
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,

    -- Pipeline stage tracking
    stage_name TEXT NOT NULL, -- 'extraction', 'cleaning', 'author_detection', 'classification', 'quality_scoring'
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),

    -- Stage processing details
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    processing_time INTEGER, -- milliseconds
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Stage-specific data
    input_data TEXT, -- JSON
    output_data TEXT, -- JSON
    quality_metrics TEXT, -- JSON

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(article_id, stage_name)
);

-- Content quality scoring factors
CREATE TABLE IF NOT EXISTS quality_factors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,

    -- Content quality factors
    has_author BOOLEAN DEFAULT false,
    has_publication_date BOOLEAN DEFAULT false,
    has_featured_image BOOLEAN DEFAULT false,
    content_completeness REAL DEFAULT 0.0, -- 0-1 score
    grammar_score REAL DEFAULT 0.0,
    readability_score REAL DEFAULT 0.0,
    factual_accuracy_score REAL DEFAULT 0.0,
    source_citations INTEGER DEFAULT 0,

    -- Engagement prediction factors
    headline_quality REAL DEFAULT 0.0,
    topic_relevance REAL DEFAULT 0.0,
    timeliness_score REAL DEFAULT 0.0,
    controversy_score REAL DEFAULT 0.0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Article classifications
CREATE TABLE IF NOT EXISTS article_classifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,

    -- Content type classification
    content_type TEXT NOT NULL, -- 'news', 'opinion', 'analysis', 'feature', 'sports', 'business'
    content_subtype TEXT, -- 'breaking', 'investigative', 'profile', 'review'
    urgency_level TEXT DEFAULT 'standard' CHECK (urgency_level IN ('breaking', 'urgent', 'standard', 'archive')),

    -- Geographic relevance
    geographic_scope TEXT DEFAULT 'national' CHECK (geographic_scope IN ('local', 'national', 'regional', 'international')),
    locations TEXT, -- JSON array of mentioned locations

    -- Audience targeting
    target_audience TEXT DEFAULT 'general', -- 'general', 'business', 'youth', 'academic'
    reading_level TEXT DEFAULT 'standard' CHECK (reading_level IN ('basic', 'standard', 'advanced')),

    -- AI confidence scores
    classification_confidence REAL DEFAULT 0.0,
    ai_model_version TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SYSTEM CONFIGURATION & CACHING
-- ============================================================================

-- System configuration
CREATE TABLE IF NOT EXISTS system_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cache metadata
CREATE TABLE IF NOT EXISTS cache_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_key TEXT NOT NULL UNIQUE,
    cache_type TEXT NOT NULL,
    data TEXT,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Trusted domains for images/content
CREATE TABLE IF NOT EXISTS trusted_domains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT NOT NULL UNIQUE,
    type TEXT DEFAULT 'image' CHECK (type IN ('image', 'content', 'analytics')),
    enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SYSTEM OBSERVABILITY & AUDIT
-- ============================================================================

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

-- Audit log for security and compliance
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL, -- login_success, login_failed, user_created, article_published, etc.
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

-- Cron execution log
CREATE TABLE IF NOT EXISTS cron_execution_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cron_type TEXT NOT NULL, -- 'rss_refresh', 'analytics_aggregate', etc.
    status TEXT NOT NULL CHECK (status IN ('started', 'success', 'failed')),
    articles_fetched INTEGER DEFAULT 0,
    articles_processed INTEGER DEFAULT 0,
    errors_encountered INTEGER DEFAULT 0,
    execution_time INTEGER, -- milliseconds
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_lockout ON users(account_locked_permanently, account_locked_until);

-- Session indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Articles indexes
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_priority ON articles(priority DESC);
CREATE INDEX IF NOT EXISTS idx_articles_rss_guid ON articles(rss_guid);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_byline ON articles(byline);
CREATE INDEX IF NOT EXISTS idx_articles_content_type ON articles(content_type);
CREATE INDEX IF NOT EXISTS idx_articles_trending_score ON articles(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_articles_reading_time ON articles(reading_time);

-- Author indexes
CREATE INDEX IF NOT EXISTS idx_authors_normalized_name ON authors(normalized_name);
CREATE INDEX IF NOT EXISTS idx_authors_slug ON authors(slug);
CREATE INDEX IF NOT EXISTS idx_authors_outlet ON authors(outlet);
CREATE INDEX IF NOT EXISTS idx_authors_verification ON authors(verification_status);
CREATE INDEX IF NOT EXISTS idx_authors_article_count ON authors(article_count DESC);

-- Article-author relationship indexes
CREATE INDEX IF NOT EXISTS idx_article_authors_article ON article_authors(article_id);
CREATE INDEX IF NOT EXISTS idx_article_authors_author ON article_authors(author_id);
CREATE INDEX IF NOT EXISTS idx_article_authors_contribution ON article_authors(contribution_type);

-- User engagement indexes
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_article_id ON user_bookmarks(article_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_user_id ON user_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_article_id ON user_likes(article_id);
CREATE INDEX IF NOT EXISTS idx_user_reading_history_user_id ON user_reading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reading_history_article_id ON user_reading_history(article_id);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_article_comments_article_id ON article_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_user_id ON article_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_parent_id ON article_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_created_at ON article_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_article_comments_status ON article_comments(status);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

-- Follows indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_user_id ON user_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_type ON user_follows(follow_type);
CREATE INDEX IF NOT EXISTS idx_user_follows_follow_id ON user_follows(follow_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_composite ON user_follows(user_id, follow_type);

-- Categories and sources indexes
CREATE INDEX IF NOT EXISTS idx_categories_enabled ON categories(enabled);
CREATE INDEX IF NOT EXISTS idx_news_sources_enabled ON news_sources(enabled);
CREATE INDEX IF NOT EXISTS idx_news_sources_category_id ON news_sources(category_id);
CREATE INDEX IF NOT EXISTS idx_rss_sources_enabled ON rss_sources(enabled);

-- Keywords indexes
CREATE INDEX IF NOT EXISTS idx_keywords_keyword ON keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_keywords_category ON keywords(category_id);
CREATE INDEX IF NOT EXISTS idx_article_keywords_keyword ON article_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_article_keywords_article_id ON article_keywords(article_id);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_article_id ON analytics_events(article_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs(query);
CREATE INDEX IF NOT EXISTS idx_search_logs_session_id ON search_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs(created_at);

-- AI processing indexes
CREATE INDEX IF NOT EXISTS idx_ai_processing_log_article ON ai_processing_log(article_id);
CREATE INDEX IF NOT EXISTS idx_ai_processing_log_stage ON ai_processing_log(stage);
CREATE INDEX IF NOT EXISTS idx_ai_processing_log_status ON ai_processing_log(status);
CREATE INDEX IF NOT EXISTS idx_extraction_log_article ON content_extraction_log(article_id);
CREATE INDEX IF NOT EXISTS idx_extraction_log_status ON content_extraction_log(status);
CREATE INDEX IF NOT EXISTS idx_extraction_log_type ON content_extraction_log(extraction_type);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_article ON pipeline_stages(article_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_status ON pipeline_stages(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_name ON pipeline_stages(stage_name);
CREATE INDEX IF NOT EXISTS idx_quality_factors_article ON quality_factors(article_id);
CREATE INDEX IF NOT EXISTS idx_article_classifications_article ON article_classifications(article_id);
CREATE INDEX IF NOT EXISTS idx_article_classifications_type ON article_classifications(content_type);

-- System indexes
CREATE INDEX IF NOT EXISTS idx_cache_metadata_key ON cache_metadata(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_metadata_type ON cache_metadata(cache_type);
CREATE INDEX IF NOT EXISTS idx_cache_metadata_expires ON cache_metadata(expires_at);
CREATE INDEX IF NOT EXISTS idx_feed_status_source_id ON feed_status(source_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource_type ON audit_log(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_user_id ON audit_log(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_cron_execution_log_type ON cron_execution_log(cron_type);
CREATE INDEX IF NOT EXISTS idx_cron_execution_log_status ON cron_execution_log(status);

-- ============================================================================
-- TRIGGERS FOR AUTOMATION
-- ============================================================================

-- Update timestamps on user changes
CREATE TRIGGER IF NOT EXISTS update_users_timestamp
    AFTER UPDATE ON users
    FOR EACH ROW
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;

-- Update articles timestamp
CREATE TRIGGER IF NOT EXISTS update_articles_timestamp
    AFTER UPDATE ON articles
    FOR EACH ROW
    BEGIN
        UPDATE articles SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;

-- Maintain article search content
CREATE TRIGGER IF NOT EXISTS update_content_search
    AFTER INSERT ON articles
    FOR EACH ROW
    BEGIN
        UPDATE articles
        SET content_search = (COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.description, '') || ' ' || COALESCE(NEW.content, '') || ' ' || COALESCE(NEW.tags, ''))
        WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_content_search_on_update
    AFTER UPDATE ON articles
    FOR EACH ROW
    BEGIN
        UPDATE articles
        SET content_search = (COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.description, '') || ' ' || COALESCE(NEW.content, '') || ' ' || COALESCE(NEW.tags, ''))
        WHERE id = NEW.id;
    END;

-- Auto-calculate reading time when article content is updated
CREATE TRIGGER IF NOT EXISTS calculate_reading_time
    AFTER UPDATE OF content, processed_content ON articles
    FOR EACH ROW
    WHEN NEW.content IS NOT NULL
    BEGIN
        UPDATE articles
        SET reading_time = CAST((LENGTH(COALESCE(NEW.processed_content, NEW.content)) / 250.0) AS INTEGER),
            word_count = (LENGTH(COALESCE(NEW.processed_content, NEW.content)) - LENGTH(REPLACE(COALESCE(NEW.processed_content, NEW.content), ' ', '')) + 1)
        WHERE id = NEW.id;
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

-- Update authors timestamp
CREATE TRIGGER IF NOT EXISTS update_authors_timestamp
    AFTER UPDATE ON authors
    FOR EACH ROW
    BEGIN
        UPDATE authors SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
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

-- Update author statistics when article-author relationship is added
CREATE TRIGGER IF NOT EXISTS update_author_stats_on_article
    AFTER INSERT ON article_authors
    FOR EACH ROW
    BEGIN
        UPDATE authors
        SET article_count = article_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.author_id;
    END;

-- Update author statistics when article-author relationship is removed
CREATE TRIGGER IF NOT EXISTS update_author_stats_on_article_removal
    AFTER DELETE ON article_authors
    FOR EACH ROW
    BEGIN
        UPDATE authors
        SET article_count = article_count - 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.author_id;
    END;

-- Update article like_count when user likes article
CREATE TRIGGER IF NOT EXISTS update_article_like_count_insert
    AFTER INSERT ON user_likes
    FOR EACH ROW
    BEGIN
        UPDATE articles SET like_count = like_count + 1 WHERE id = NEW.article_id;
    END;

CREATE TRIGGER IF NOT EXISTS update_article_like_count_delete
    AFTER DELETE ON user_likes
    FOR EACH ROW
    BEGIN
        UPDATE articles SET like_count = like_count - 1 WHERE id = OLD.article_id;
    END;

-- Update article bookmark_count when user bookmarks article
CREATE TRIGGER IF NOT EXISTS update_article_bookmark_count_insert
    AFTER INSERT ON user_bookmarks
    FOR EACH ROW
    BEGIN
        UPDATE articles SET bookmark_count = bookmark_count + 1 WHERE id = NEW.article_id;
    END;

CREATE TRIGGER IF NOT EXISTS update_article_bookmark_count_delete
    AFTER DELETE ON user_bookmarks
    FOR EACH ROW
    BEGIN
        UPDATE articles SET bookmark_count = bookmark_count - 1 WHERE id = OLD.article_id;
    END;

-- Update article comment_count when comment added
CREATE TRIGGER IF NOT EXISTS update_article_comment_count_insert
    AFTER INSERT ON article_comments
    FOR EACH ROW
    WHEN NEW.status = 'published'
    BEGIN
        UPDATE articles SET comment_count = comment_count + 1 WHERE id = NEW.article_id;
    END;

-- Update article comment_count when comment deleted
CREATE TRIGGER IF NOT EXISTS update_article_comment_count_delete
    AFTER UPDATE ON article_comments
    FOR EACH ROW
    WHEN NEW.status = 'deleted' AND OLD.status = 'published'
    BEGIN
        UPDATE articles SET comment_count = comment_count - 1 WHERE id = NEW.article_id;
    END;

-- Update parent comment reply_count
CREATE TRIGGER IF NOT EXISTS update_comment_reply_count_insert
    AFTER INSERT ON article_comments
    FOR EACH ROW
    WHEN NEW.parent_comment_id IS NOT NULL AND NEW.status = 'published'
    BEGIN
        UPDATE article_comments SET reply_count = reply_count + 1 WHERE id = NEW.parent_comment_id;
    END;

-- Update comment like_count
CREATE TRIGGER IF NOT EXISTS update_comment_like_count_insert
    AFTER INSERT ON comment_likes
    FOR EACH ROW
    BEGIN
        UPDATE article_comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
    END;

CREATE TRIGGER IF NOT EXISTS update_comment_like_count_delete
    AFTER DELETE ON comment_likes
    FOR EACH ROW
    BEGIN
        UPDATE article_comments SET like_count = like_count - 1 WHERE id = OLD.comment_id;
    END;

-- Update author follower_count
CREATE TRIGGER IF NOT EXISTS update_author_follower_count_insert
    AFTER INSERT ON user_follows
    FOR EACH ROW
    WHEN NEW.follow_type = 'author'
    BEGIN
        UPDATE authors SET follower_count = follower_count + 1 WHERE id = CAST(NEW.follow_id AS INTEGER);
    END;

CREATE TRIGGER IF NOT EXISTS update_author_follower_count_delete
    AFTER DELETE ON user_follows
    FOR EACH ROW
    WHEN OLD.follow_type = 'author'
    BEGIN
        UPDATE authors SET follower_count = follower_count - 1 WHERE id = CAST(OLD.follow_id AS INTEGER);
    END;

-- Pipeline stage automation - mark article as processed when all stages complete
CREATE TRIGGER IF NOT EXISTS check_pipeline_completion
    AFTER UPDATE ON pipeline_stages
    FOR EACH ROW
    WHEN NEW.status = 'completed'
    BEGIN
        UPDATE articles
        SET ai_processed_at = CURRENT_TIMESTAMP,
            last_content_update = CURRENT_TIMESTAMP
        WHERE id = NEW.article_id
        AND NOT EXISTS (
            SELECT 1 FROM pipeline_stages
            WHERE article_id = NEW.article_id
            AND status NOT IN ('completed', 'skipped')
        );
    END;

-- Username validation triggers
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

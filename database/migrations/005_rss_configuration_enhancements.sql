-- Migration: RSS Configuration Enhancements
-- Adds daily limits, bulk pull settings, and advanced configuration to RSS sources

-- ===== ENHANCE RSS_SOURCES TABLE =====

-- Add daily limits and configuration fields
ALTER TABLE rss_sources ADD COLUMN daily_limit INTEGER DEFAULT 100;
ALTER TABLE rss_sources ADD COLUMN articles_per_fetch INTEGER DEFAULT 50;
ALTER TABLE rss_sources ADD COLUMN max_bulk_articles INTEGER DEFAULT 200;
ALTER TABLE rss_sources ADD COLUMN include_older_articles BOOLEAN DEFAULT true;

-- Add performance and configuration tracking
ALTER TABLE rss_sources ADD COLUMN quality_score INTEGER DEFAULT 50;
ALTER TABLE rss_sources ADD COLUMN reliability_score INTEGER DEFAULT 50;
ALTER TABLE rss_sources ADD COLUMN freshness_score INTEGER DEFAULT 50;
ALTER TABLE rss_sources ADD COLUMN validation_status TEXT DEFAULT 'pending';

-- Add RSS-specific metadata
ALTER TABLE rss_sources ADD COLUMN rss_url TEXT; -- Actual RSS feed URL (may differ from website URL)
ALTER TABLE rss_sources ADD COLUMN base_domain TEXT;
ALTER TABLE rss_sources ADD COLUMN country TEXT DEFAULT 'ZW';
ALTER TABLE rss_sources ADD COLUMN language TEXT DEFAULT 'en';

-- Add timestamps for better tracking
ALTER TABLE rss_sources ADD COLUMN last_validated_at TIMESTAMP;
ALTER TABLE rss_sources ADD COLUMN last_successful_fetch TIMESTAMP;
ALTER TABLE rss_sources ADD COLUMN success_count INTEGER DEFAULT 0;

-- ===== SYSTEM CONFIGURATION TABLE =====

-- Global system configuration
CREATE TABLE IF NOT EXISTS system_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key TEXT UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    config_type TEXT DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    description TEXT,
    category TEXT DEFAULT 'general',
    is_public BOOLEAN DEFAULT false, -- Whether this config can be exposed to frontend
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default RSS configuration
INSERT OR REPLACE INTO system_config (config_key, config_value, config_type, description, category, is_public) VALUES
('rss.default_daily_limit', '100', 'number', 'Default daily article limit per RSS source', 'rss', false),
('rss.default_articles_per_fetch', '50', 'number', 'Default number of articles to fetch per RSS request', 'rss', false),
('rss.max_bulk_articles', '200', 'number', 'Maximum articles to fetch during bulk pull per source', 'rss', false),
('rss.bulk_pull_enabled', 'true', 'boolean', 'Whether bulk pull functionality is enabled', 'rss', false),
('rss.refresh_interval_hours', '1', 'number', 'Hours between automatic RSS refreshes', 'rss', false),
('rss.timeout_seconds', '30', 'number', 'Timeout for RSS feed requests in seconds', 'rss', false),
('rss.max_article_age_days', '30', 'number', 'Maximum age of articles to process during initial bulk pull', 'rss', false),
('platform.max_articles_storage', '40000', 'number', 'Maximum total articles to store in database', 'platform', false),
('platform.article_cache_ttl_hours', '336', 'number', 'Article cache TTL in hours (14 days)', 'platform', false);

-- ===== RSS SOURCE CATEGORIES ENHANCEMENT =====

-- Add category-specific RSS limits
CREATE TABLE IF NOT EXISTS category_rss_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    daily_limit INTEGER DEFAULT 100,
    priority_boost INTEGER DEFAULT 0, -- Extra priority for this category
    quality_threshold INTEGER DEFAULT 30, -- Minimum quality score for sources in this category
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(category_id)
);

-- Insert category-specific RSS configurations
INSERT OR REPLACE INTO category_rss_config (category_id, daily_limit, priority_boost, quality_threshold) VALUES
('general', 120, 0, 40),
('politics_govt', 150, 10, 60),
('business_economy', 130, 5, 50),
('tech_gadgets', 100, 8, 45),
('sports_athletics', 110, 3, 35),
('entertainment', 90, 0, 30),
('finance_investing', 120, 7, 55),
('education', 80, 5, 40),
('health_medical', 85, 6, 50),
('science', 70, 8, 60),
('environment', 60, 7, 45),
('travel_tourism', 75, 2, 35),
('food_drinks', 65, 1, 30),
('lifestyle', 70, 0, 25),
('local_news', 100, 12, 45);

-- ===== DAILY TRACKING TABLE =====

-- Track daily article counts per source
CREATE TABLE IF NOT EXISTS daily_source_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id TEXT NOT NULL REFERENCES rss_sources(id) ON DELETE CASCADE,
    date_tracked DATE NOT NULL,
    articles_fetched INTEGER DEFAULT 0,
    articles_stored INTEGER DEFAULT 0,
    fetch_attempts INTEGER DEFAULT 0,
    successful_fetches INTEGER DEFAULT 0,
    last_fetch_time TIMESTAMP,
    
    UNIQUE(source_id, date_tracked)
);

-- ===== UPDATE EXISTING RSS SOURCES =====

-- Update existing sources with default configuration based on their priority
UPDATE rss_sources SET
    daily_limit = CASE 
        WHEN priority >= 5 THEN 150
        WHEN priority >= 4 THEN 120
        WHEN priority >= 3 THEN 100
        ELSE 80
    END,
    articles_per_fetch = CASE
        WHEN priority >= 5 THEN 60
        WHEN priority >= 4 THEN 50
        ELSE 40
    END,
    max_bulk_articles = CASE
        WHEN priority >= 5 THEN 250
        WHEN priority >= 4 THEN 200
        ELSE 150
    END,
    country = 'ZW',
    language = 'en',
    validation_status = 'needs_review',
    base_domain = CASE
        WHEN url LIKE '%herald.co.zw%' THEN 'herald.co.zw'
        WHEN url LIKE '%newsday.co.zw%' THEN 'newsday.co.zw' 
        WHEN url LIKE '%chronicle.co.zw%' THEN 'chronicle.co.zw'
        WHEN url LIKE '%zimlive.com%' THEN 'zimlive.com'
        WHEN url LIKE '%newzimbabwe.com%' THEN 'newzimbabwe.com'
        WHEN url LIKE '%techzim.co.zw%' THEN 'techzim.co.zw'
        ELSE SUBSTR(url, INSTR(url, '//') + 2, 
                    CASE WHEN INSTR(SUBSTR(url, INSTR(url, '//') + 2), '/') > 0 
                         THEN INSTR(SUBSTR(url, INSTR(url, '//') + 2), '/') - 1
                         ELSE LENGTH(SUBSTR(url, INSTR(url, '//') + 2)) END)
    END;

-- Set RSS URLs for known sources (these should be discovered automatically)
UPDATE rss_sources SET rss_url = url || '/feed/' WHERE rss_url IS NULL;

-- ===== INDEXES FOR PERFORMANCE =====

CREATE INDEX IF NOT EXISTS idx_rss_sources_daily_limit ON rss_sources(daily_limit);
CREATE INDEX IF NOT EXISTS idx_rss_sources_quality_score ON rss_sources(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_rss_sources_validation_status ON rss_sources(validation_status);
CREATE INDEX IF NOT EXISTS idx_rss_sources_base_domain ON rss_sources(base_domain);

CREATE INDEX IF NOT EXISTS idx_daily_source_stats_date ON daily_source_stats(date_tracked DESC);
CREATE INDEX IF NOT EXISTS idx_daily_source_stats_source_date ON daily_source_stats(source_id, date_tracked);

CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key);
CREATE INDEX IF NOT EXISTS idx_system_config_category ON system_config(category);

-- ===== TRIGGERS FOR AUTOMATION =====

-- Update daily stats when articles are inserted
CREATE TRIGGER IF NOT EXISTS update_daily_source_stats_on_article_insert
    AFTER INSERT ON articles
    FOR EACH ROW
    BEGIN
        INSERT OR REPLACE INTO daily_source_stats (
            source_id, 
            date_tracked, 
            articles_fetched,
            articles_stored,
            last_fetch_time
        ) VALUES (
            NEW.source_id,
            DATE(NEW.created_at),
            COALESCE((SELECT articles_fetched FROM daily_source_stats 
                     WHERE source_id = NEW.source_id AND date_tracked = DATE(NEW.created_at)), 0) + 1,
            COALESCE((SELECT articles_stored FROM daily_source_stats 
                     WHERE source_id = NEW.source_id AND date_tracked = DATE(NEW.created_at)), 0) + 1,
            NEW.created_at
        );
    END;

-- Update system_config updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_system_config_timestamp
    AFTER UPDATE ON system_config
    FOR EACH ROW
    BEGIN
        UPDATE system_config SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
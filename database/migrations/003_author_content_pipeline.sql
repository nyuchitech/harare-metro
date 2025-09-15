-- Migration: Author Recognition & Content Processing Pipeline
-- Adds comprehensive author tracking and enhanced content processing

-- ===== AUTHORS SYSTEM =====

-- Authors table - recognize journalism and bylines
CREATE TABLE IF NOT EXISTS authors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL UNIQUE, -- Normalized for deduplication
    bio TEXT, -- Author biography
    title TEXT, -- Job title (Journalist, Editor, Correspondent, etc.)
    outlet TEXT, -- Primary news outlet
    email TEXT,
    twitter_handle TEXT,
    linkedin_url TEXT,
    profile_image_url TEXT,
    expertise_categories TEXT, -- JSON array of categories they write about
    article_count INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    avg_quality_score REAL DEFAULT 0.0,
    verification_status TEXT DEFAULT 'unverified', -- 'verified', 'unverified', 'flagged'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Author-article relationships (many-to-many for co-authored articles)
CREATE TABLE IF NOT EXISTS article_authors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    contribution_type TEXT DEFAULT 'primary', -- 'primary', 'contributor', 'editor'
    byline_order INTEGER DEFAULT 1, -- Order in byline for multi-author articles
    confidence_score REAL DEFAULT 1.0, -- AI confidence in attribution
    extraction_method TEXT DEFAULT 'ai', -- 'rss', 'ai', 'manual'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(article_id, author_id)
);

-- ===== ENHANCE ARTICLES TABLE FOR PIPELINE =====

-- Add author and content pipeline fields to articles
ALTER TABLE articles ADD COLUMN byline TEXT; -- Original byline text from RSS/scraping
ALTER TABLE articles ADD COLUMN excerpt TEXT; -- AI-generated excerpt/summary
ALTER TABLE articles ADD COLUMN reading_time INTEGER DEFAULT 0; -- Estimated reading time in minutes
ALTER TABLE articles ADD COLUMN word_count INTEGER DEFAULT 0; -- Article word count
ALTER TABLE articles ADD COLUMN content_type TEXT DEFAULT 'article'; -- 'article', 'opinion', 'editorial', 'news', 'sports', 'business'
ALTER TABLE articles ADD COLUMN source_quality_score REAL DEFAULT 0.0; -- Source reliability score
ALTER TABLE articles ADD COLUMN trending_score REAL DEFAULT 0.0; -- Trending algorithm score
ALTER TABLE articles ADD COLUMN social_shares INTEGER DEFAULT 0; -- External social shares count
ALTER TABLE articles ADD COLUMN last_content_update TIMESTAMP; -- When content was last refreshed

-- ===== CONTENT SOURCES & SCRAPING =====

-- Enhanced news sources with scraping capabilities
ALTER TABLE news_sources ADD COLUMN scraping_enabled BOOLEAN DEFAULT false;
ALTER TABLE news_sources ADD COLUMN scraping_selectors TEXT; -- JSON config for content selectors
ALTER TABLE news_sources ADD COLUMN author_selectors TEXT; -- JSON config for author extraction
ALTER TABLE news_sources ADD COLUMN last_scrape_attempt TIMESTAMP;
ALTER TABLE news_sources ADD COLUMN scrape_success_rate REAL DEFAULT 0.0;
ALTER TABLE news_sources ADD COLUMN content_freshness_hours INTEGER DEFAULT 24; -- How often to check for updates
ALTER TABLE news_sources ADD COLUMN quality_rating REAL DEFAULT 1.0; -- Editorial quality rating
ALTER TABLE news_sources ADD COLUMN credibility_score REAL DEFAULT 1.0; -- Source credibility (fact-checking, etc.)

-- Content extraction log for tracking scraping/processing performance
CREATE TABLE IF NOT EXISTS content_extraction_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    source_id TEXT REFERENCES news_sources(id),
    extraction_type TEXT NOT NULL, -- 'rss', 'scrape', 'manual'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'success', 'failed'
    
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

-- ===== CONTENT QUALITY & CLASSIFICATION =====

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

-- Article classification and tags
CREATE TABLE IF NOT EXISTS article_classifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    
    -- Content type classification
    content_type TEXT NOT NULL, -- 'news', 'opinion', 'analysis', 'feature', 'sports', 'business'
    content_subtype TEXT, -- 'breaking', 'investigative', 'profile', 'review', etc.
    urgency_level TEXT DEFAULT 'standard', -- 'breaking', 'urgent', 'standard', 'archive'
    
    -- Geographic relevance
    geographic_scope TEXT DEFAULT 'national', -- 'local', 'national', 'regional', 'international'
    locations TEXT, -- JSON array of mentioned locations
    
    -- Audience targeting
    target_audience TEXT DEFAULT 'general', -- 'general', 'business', 'youth', 'academic'
    reading_level TEXT DEFAULT 'standard', -- 'basic', 'standard', 'advanced'
    
    -- AI confidence scores
    classification_confidence REAL DEFAULT 0.0,
    ai_model_version TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== CONTENT PROCESSING PIPELINE TRACKING =====

-- Pipeline stages and their completion status
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    
    -- Pipeline stage tracking
    stage_name TEXT NOT NULL, -- 'extraction', 'cleaning', 'author_detection', 'classification', 'quality_scoring', 'image_processing', 'embedding', 'publication'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'skipped'
    
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

-- ===== ZIMBABWE JOURNALISM FOCUS =====

-- Zimbabwe-specific author profiles and recognition
INSERT OR IGNORE INTO authors (name, normalized_name, outlet, title, expertise_categories, verification_status) VALUES
-- The Herald
('Innocent Mujeri', 'innocent_mujeri', 'The Herald', 'Chief Reporter', '["politics", "government"]', 'verified'),
('Farirai Machivenyika', 'farirai_machivenyika', 'The Herald', 'Senior Reporter', '["politics", "parliament"]', 'verified'),
('Freeman Razemba', 'freeman_razemba', 'The Herald', 'Senior Reporter', '["crime", "security"]', 'verified'),
('Business Reporter', 'business_reporter_herald', 'The Herald', 'Business Reporter', '["business", "economy"]', 'verified'),

-- NewsDay
('Richard Muponde', 'richard_muponde', 'NewsDay', 'Political Reporter', '["politics", "government"]', 'verified'),
('Staff Reporter', 'staff_reporter_newsday', 'NewsDay', 'Staff Reporter', '["general"]', 'verified'),
('Business Reporter', 'business_reporter_newsday', 'NewsDay', 'Business Reporter', '["business", "economy"]', 'verified'),

-- The Chronicle
('Mashudu Netsianda', 'mashudu_netsianda', 'The Chronicle', 'Senior Reporter', '["politics", "local_government"]', 'verified'),
('Leonard Ncube', 'leonard_ncube', 'The Chronicle', 'Reporter', '["general", "regional"]', 'verified'),

-- Zimbabwe Independent
('Privilege Gumbodete', 'privilege_gumbodete', 'Zimbabwe Independent', 'Political Editor', '["politics", "analysis"]', 'verified'),
('Charles Rukuni', 'charles_rukuni', 'Zimbabwe Independent', 'Business Editor', '["business", "analysis"]', 'verified'),

-- The Standard
('Miriam Mangwaya', 'miriam_mangwaya', 'The Standard', 'Political Reporter', '["politics", "governance"]', 'verified'),
('Business Reporter', 'business_reporter_standard', 'The Standard', 'Business Reporter', '["business", "finance"]', 'verified');

-- ===== INDEXES FOR PERFORMANCE =====

-- Author indexes
CREATE INDEX IF NOT EXISTS idx_authors_normalized_name ON authors(normalized_name);
CREATE INDEX IF NOT EXISTS idx_authors_outlet ON authors(outlet);
CREATE INDEX IF NOT EXISTS idx_authors_verification ON authors(verification_status);
CREATE INDEX IF NOT EXISTS idx_authors_article_count ON authors(article_count DESC);

-- Article-author relationship indexes
CREATE INDEX IF NOT EXISTS idx_article_authors_article ON article_authors(article_id);
CREATE INDEX IF NOT EXISTS idx_article_authors_author ON article_authors(author_id);
CREATE INDEX IF NOT EXISTS idx_article_authors_contribution ON article_authors(contribution_type);

-- Content processing indexes
CREATE INDEX IF NOT EXISTS idx_extraction_log_article ON content_extraction_log(article_id);
CREATE INDEX IF NOT EXISTS idx_extraction_log_status ON content_extraction_log(status);
CREATE INDEX IF NOT EXISTS idx_extraction_log_type ON content_extraction_log(extraction_type);

-- Pipeline tracking indexes
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_article ON pipeline_stages(article_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_status ON pipeline_stages(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_name ON pipeline_stages(stage_name);

-- Quality and classification indexes
CREATE INDEX IF NOT EXISTS idx_quality_factors_article ON quality_factors(article_id);
CREATE INDEX IF NOT EXISTS idx_article_classifications_article ON article_classifications(article_id);
CREATE INDEX IF NOT EXISTS idx_article_classifications_type ON article_classifications(content_type);

-- Enhanced article indexes
CREATE INDEX IF NOT EXISTS idx_articles_byline ON articles(byline);
CREATE INDEX IF NOT EXISTS idx_articles_content_type ON articles(content_type);
CREATE INDEX IF NOT EXISTS idx_articles_trending_score ON articles(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_articles_reading_time ON articles(reading_time);

-- ===== TRIGGERS FOR AUTOMATION =====

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

-- Update authors timestamp on changes
CREATE TRIGGER IF NOT EXISTS update_authors_timestamp 
    AFTER UPDATE ON authors
    FOR EACH ROW
    BEGIN
        UPDATE authors SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
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
-- Migration: Add AI Enhancement Fields and Keywords System
-- Adds AI-powered content analysis and keyword management

-- ===== ENHANCE ARTICLES TABLE FOR AI =====

-- Add AI-generated fields to articles table
ALTER TABLE articles ADD COLUMN ai_keywords TEXT; -- JSON array of extracted keywords
ALTER TABLE articles ADD COLUMN quality_score REAL DEFAULT 0.0; -- AI content quality score (0-1)
ALTER TABLE articles ADD COLUMN embedding_id TEXT; -- Vectorize embedding ID
ALTER TABLE articles ADD COLUMN content_hash TEXT; -- For duplicate detection
ALTER TABLE articles ADD COLUMN processed_content TEXT; -- AI-cleaned content without images/noise
ALTER TABLE articles ADD COLUMN extracted_images TEXT; -- JSON array of image URLs found in content
ALTER TABLE articles ADD COLUMN ai_processed_at TIMESTAMP; -- When AI processing completed

-- ===== KEYWORDS SYSTEM =====

-- Master keywords table (256 keywords across 32 categories)
CREATE TABLE IF NOT EXISTS keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL UNIQUE,
    category_id TEXT NOT NULL REFERENCES categories(id),
    relevance_score REAL DEFAULT 1.0, -- How relevant this keyword is to the category
    usage_count INTEGER DEFAULT 0, -- How many articles use this keyword
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Article-keyword relationships (many-to-many)
CREATE TABLE IF NOT EXISTS article_keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    keyword_id INTEGER NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
    confidence_score REAL DEFAULT 0.0, -- AI confidence that this keyword applies to article
    extraction_method TEXT DEFAULT 'ai', -- 'ai', 'manual', 'rss'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(article_id, keyword_id)
);

-- ===== AI PROCESSING TRACKING =====

-- Track AI processing jobs and results
CREATE TABLE IF NOT EXISTS ai_processing_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    processing_type TEXT NOT NULL, -- 'content_cleaning', 'keyword_extraction', 'categorization', 'quality_scoring'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    input_data JSON, -- Original content/data sent to AI
    output_data JSON, -- AI response/results
    processing_time INTEGER, -- Time taken in milliseconds
    error_message TEXT,
    ai_model TEXT, -- Which AI model was used
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Content similarity tracking for duplicate detection
CREATE TABLE IF NOT EXISTS content_similarity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    similar_article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    similarity_score REAL NOT NULL, -- 0.0 to 1.0
    comparison_method TEXT DEFAULT 'embedding', -- 'embedding', 'hash', 'content'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(article_id, similar_article_id)
);

-- ===== ZIMBABWE-SPECIFIC KEYWORDS =====

-- Insert comprehensive keyword set for Zimbabwe news (32 categories × 8 keywords each = 256)
INSERT OR IGNORE INTO keywords (keyword, category_id, relevance_score) VALUES

-- Politics keywords (8)
('government', 'politics', 1.0),
('parliament', 'politics', 0.9),
('president', 'politics', 0.95),
('minister', 'politics', 0.85),
('election', 'politics', 0.9),
('policy', 'politics', 0.8),
('democracy', 'politics', 0.85),
('opposition', 'politics', 0.8),

-- Business keywords (8)  
('economy', 'business', 1.0),
('market', 'business', 0.9),
('investment', 'business', 0.85),
('company', 'business', 0.8),
('finance', 'business', 0.9),
('trade', 'business', 0.85),
('banking', 'business', 0.8),
('industry', 'business', 0.85),

-- Sports keywords (8)
('football', 'sports', 1.0),
('cricket', 'sports', 0.9),
('rugby', 'sports', 0.85),
('athletics', 'sports', 0.8),
('soccer', 'sports', 0.95),
('champions', 'sports', 0.8),
('tournament', 'sports', 0.85),
('league', 'sports', 0.8),

-- Health keywords (8)
('hospital', 'health', 0.9),
('medical', 'health', 0.95),
('doctor', 'health', 0.85),
('medicine', 'health', 0.9),
('healthcare', 'health', 1.0),
('clinic', 'health', 0.8),
('treatment', 'health', 0.85),
('wellness', 'health', 0.8),

-- Education keywords (8)
('school', 'education', 0.95),
('university', 'education', 0.9),
('student', 'education', 0.9),
('teacher', 'education', 0.85),
('learning', 'education', 0.8),
('curriculum', 'education', 0.85),
('examination', 'education', 0.8),
('graduation', 'education', 0.75),

-- Technology keywords (8)
('innovation', 'technology', 0.9),
('digital', 'technology', 0.95),
('internet', 'technology', 0.9),
('mobile', 'technology', 0.85),
('software', 'technology', 0.8),
('startup', 'technology', 0.85),
('tech', 'technology', 1.0),
('artificial intelligence', 'technology', 0.8),

-- Entertainment keywords (8)
('music', 'entertainment', 0.95),
('movie', 'entertainment', 0.9),
('artist', 'entertainment', 0.85),
('celebrity', 'entertainment', 0.8),
('concert', 'entertainment', 0.85),
('festival', 'entertainment', 0.8),
('culture', 'entertainment', 0.9),
('arts', 'entertainment', 0.85),

-- Lifestyle keywords (8)
('fashion', 'lifestyle', 0.9),
('food', 'lifestyle', 0.85),
('travel', 'lifestyle', 0.8),
('home', 'lifestyle', 0.75),
('beauty', 'lifestyle', 0.8),
('relationship', 'lifestyle', 0.75),
('family', 'lifestyle', 0.8),
('wellness', 'lifestyle', 0.85),

-- Additional categories with 8 keywords each to reach 32 categories × 8 = 256 keywords

-- Agriculture (8)
('farming', 'agriculture', 1.0),
('crops', 'agriculture', 0.9),
('livestock', 'agriculture', 0.85),
('harvest', 'agriculture', 0.8),
('irrigation', 'agriculture', 0.8),
('tobacco', 'agriculture', 0.9),
('maize', 'agriculture', 0.85),
('cattle', 'agriculture', 0.8),

-- Mining (8)
('gold', 'mining', 0.95),
('diamond', 'mining', 0.9),
('platinum', 'mining', 0.85),
('coal', 'mining', 0.8),
('mining', 'mining', 1.0),
('minerals', 'mining', 0.9),
('extraction', 'mining', 0.8),
('resources', 'mining', 0.85),

-- Environment (8)  
('climate', 'environment', 0.9),
('conservation', 'environment', 0.85),
('wildlife', 'environment', 0.9),
('pollution', 'environment', 0.8),
('renewable', 'environment', 0.85),
('sustainability', 'environment', 0.8),
('ecosystem', 'environment', 0.75),
('biodiversity', 'environment', 0.8),

-- Tourism (8)
('safari', 'tourism', 0.9),
('victoria falls', 'tourism', 0.95),
('tourist', 'tourism', 0.85),
('hotel', 'tourism', 0.8),
('travel', 'tourism', 0.9),
('destination', 'tourism', 0.85),
('attraction', 'tourism', 0.8),
('heritage', 'tourism', 0.75),

-- International (8)
('diplomacy', 'international', 0.9),
('embassy', 'international', 0.8),
('trade', 'international', 0.85),
('relations', 'international', 0.9),
('cooperation', 'international', 0.8),
('agreement', 'international', 0.85),
('summit', 'international', 0.8),
('bilateral', 'international', 0.75),

-- Security (8)
('police', 'security', 0.9),
('crime', 'security', 0.95),
('safety', 'security', 0.85),
('investigation', 'security', 0.8),
('arrest', 'security', 0.85),
('court', 'security', 0.8),
('justice', 'security', 0.85),
('law', 'security', 0.9),

-- Religion (8)
('church', 'religion', 0.95),
('faith', 'religion', 0.9),
('pastor', 'religion', 0.85),
('prayer', 'religion', 0.8),
('christian', 'religion', 0.85),
('worship', 'religion', 0.8),
('congregation', 'religion', 0.75),
('spiritual', 'religion', 0.8),

-- Infrastructure (8)
('construction', 'infrastructure', 0.9),
('roads', 'infrastructure', 0.95),
('bridge', 'infrastructure', 0.8),
('transport', 'infrastructure', 0.9),
('development', 'infrastructure', 0.85),
('project', 'infrastructure', 0.8),
('electricity', 'infrastructure', 0.85),
('water', 'infrastructure', 0.8);

-- ===== INDEXES FOR PERFORMANCE =====

-- Keyword indexes
CREATE INDEX IF NOT EXISTS idx_keywords_category ON keywords(category_id);
CREATE INDEX IF NOT EXISTS idx_keywords_usage ON keywords(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_article_keywords_article ON article_keywords(article_id);
CREATE INDEX IF NOT EXISTS idx_article_keywords_keyword ON article_keywords(keyword_id);
CREATE INDEX IF NOT EXISTS idx_article_keywords_confidence ON article_keywords(confidence_score DESC);

-- AI processing indexes  
CREATE INDEX IF NOT EXISTS idx_ai_processing_article ON ai_processing_log(article_id);
CREATE INDEX IF NOT EXISTS idx_ai_processing_status ON ai_processing_log(status);
CREATE INDEX IF NOT EXISTS idx_ai_processing_type ON ai_processing_log(processing_type);

-- Content similarity indexes
CREATE INDEX IF NOT EXISTS idx_content_similarity_article ON content_similarity(article_id);
CREATE INDEX IF NOT EXISTS idx_content_similarity_score ON content_similarity(similarity_score DESC);

-- Articles AI indexes
CREATE INDEX IF NOT EXISTS idx_articles_quality_score ON articles(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_articles_embedding_id ON articles(embedding_id);
CREATE INDEX IF NOT EXISTS idx_articles_content_hash ON articles(content_hash);

-- ===== TRIGGERS FOR AUTOMATION =====

-- Update keywords timestamp on changes
CREATE TRIGGER IF NOT EXISTS update_keywords_timestamp 
    AFTER UPDATE ON keywords
    FOR EACH ROW
    BEGIN
        UPDATE keywords SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;

-- Update keyword usage count when article-keyword relationship is added
CREATE TRIGGER IF NOT EXISTS increment_keyword_usage
    AFTER INSERT ON article_keywords
    FOR EACH ROW
    BEGIN
        UPDATE keywords SET usage_count = usage_count + 1 WHERE id = NEW.keyword_id;
    END;

-- Decrement keyword usage count when article-keyword relationship is removed  
CREATE TRIGGER IF NOT EXISTS decrement_keyword_usage
    AFTER DELETE ON article_keywords
    FOR EACH ROW
    BEGIN
        UPDATE keywords SET usage_count = usage_count - 1 WHERE id = OLD.keyword_id;
    END;
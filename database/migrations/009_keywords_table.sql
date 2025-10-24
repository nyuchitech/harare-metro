-- Migration 009: Keywords Table
-- Structured keyword taxonomy (similar to categories)
-- Replaces the simple article_keywords.keyword TEXT with a proper keywords reference table

CREATE TABLE IF NOT EXISTS keywords (
    id TEXT PRIMARY KEY,                   -- e.g., 'zanu-pf', 'mnangagwa', 'inflation'
    name TEXT NOT NULL,                    -- Display name: 'ZANU-PF', 'Emmerson Mnangagwa', 'Inflation'
    slug TEXT NOT NULL UNIQUE,             -- URL-safe: 'zanu-pf', 'mnangagwa', 'inflation'
    category TEXT,                         -- Optional category association: 'politics', 'economy'
    type TEXT DEFAULT 'general',           -- 'person', 'organization', 'topic', 'location', 'general'
    description TEXT,                      -- Brief description
    related_keywords TEXT,                 -- JSON array of related keyword IDs
    article_count INTEGER DEFAULT 0,       -- Cached count of articles with this keyword
    trending_score REAL DEFAULT 0.0,       -- Calculated trending score
    enabled INTEGER DEFAULT 1,             -- 0 = disabled, 1 = enabled
    sort_order INTEGER DEFAULT 0,          -- Display order
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for querying keywords by category
CREATE INDEX IF NOT EXISTS idx_keywords_category ON keywords(category);

-- Index for querying keywords by type
CREATE INDEX IF NOT EXISTS idx_keywords_type ON keywords(type);

-- Index for trending keywords
CREATE INDEX IF NOT EXISTS idx_keywords_trending ON keywords(trending_score DESC) WHERE enabled = 1;

-- Index for article count
CREATE INDEX IF NOT EXISTS idx_keywords_article_count ON keywords(article_count DESC);

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_keywords_slug ON keywords(slug);

-- Update article_keywords table to reference keywords table
-- Note: This assumes existing article_keywords.keyword is TEXT
-- In production, you'd need a data migration to convert TEXT keywords to keyword IDs

-- Alter article_keywords to add keyword_id (if not exists)
-- Note: SQLite doesn't support ADD COLUMN IF NOT EXISTS, so we check first
-- CREATE TABLE IF NOT EXISTS article_keywords_new (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     article_id INTEGER NOT NULL,
--     keyword_id TEXT NOT NULL,
--     weight INTEGER DEFAULT 1,
--     FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
--     FOREIGN KEY (keyword_id) REFERENCES keywords(id) ON DELETE CASCADE
-- );

-- For now, we'll keep article_keywords as is and add a new table for structured keywords
CREATE TABLE IF NOT EXISTS article_keyword_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    keyword_id TEXT NOT NULL,
    relevance_score REAL DEFAULT 1.0,      -- How relevant this keyword is to the article
    source TEXT DEFAULT 'ai',              -- 'ai', 'manual', 'auto'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (keyword_id) REFERENCES keywords(id) ON DELETE CASCADE,
    UNIQUE(article_id, keyword_id)         -- Prevent duplicate keywords per article
);

-- Index for querying articles by keyword
CREATE INDEX IF NOT EXISTS idx_article_keyword_links_keyword ON article_keyword_links(keyword_id);

-- Index for querying keywords by article
CREATE INDEX IF NOT EXISTS idx_article_keyword_links_article ON article_keyword_links(article_id);

-- Index for relevance scoring
CREATE INDEX IF NOT EXISTS idx_article_keyword_links_relevance ON article_keyword_links(relevance_score DESC);

-- View for keyword statistics
CREATE VIEW IF NOT EXISTS keyword_stats AS
SELECT
    k.id,
    k.name,
    k.slug,
    k.category,
    k.type,
    COUNT(akl.article_id) as article_count,
    AVG(akl.relevance_score) as avg_relevance,
    k.trending_score
FROM keywords k
LEFT JOIN article_keyword_links akl ON k.id = akl.keyword_id
GROUP BY k.id
ORDER BY article_count DESC;

-- View for trending keywords (last 7 days)
CREATE VIEW IF NOT EXISTS trending_keywords AS
SELECT
    k.id,
    k.name,
    k.slug,
    k.category,
    COUNT(akl.article_id) as recent_article_count,
    k.trending_score
FROM keywords k
LEFT JOIN article_keyword_links akl ON k.id = akl.keyword_id
LEFT JOIN articles a ON akl.article_id = a.id
WHERE a.published_at >= datetime('now', '-7 days')
GROUP BY k.id
HAVING recent_article_count > 0
ORDER BY recent_article_count DESC, k.trending_score DESC
LIMIT 20;

-- View for keywords by category
CREATE VIEW IF NOT EXISTS keywords_by_category AS
SELECT
    category,
    COUNT(*) as keyword_count,
    GROUP_CONCAT(name, ', ') as keywords
FROM keywords
WHERE enabled = 1
GROUP BY category;

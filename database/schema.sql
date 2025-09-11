-- Harare Metro Articles Database Schema
-- D1 Database for storing articles with slugs and full content

-- Articles table with slugs for sharing
CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,           -- URL-friendly slug for sharing
    title TEXT NOT NULL,
    description TEXT,                     -- Short description/excerpt
    content TEXT,                         -- Full article content (from RSS)
    author TEXT,
    source TEXT NOT NULL,                -- RSS source name
    source_url TEXT,                     -- Original RSS feed URL
    category TEXT NOT NULL,              -- Article category
    tags TEXT,                           -- Comma-separated tags/keywords
    published_at DATETIME NOT NULL,      -- Original publish date
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Article metadata
    word_count INTEGER DEFAULT 0,
    reading_time INTEGER DEFAULT 0,      -- Estimated reading time in minutes
    
    -- SEO and sharing
    image_url TEXT,                      -- Featured image URL
    optimized_image_url TEXT,            -- Cloudflare Images optimized URL
    
    -- Article status and priority
    status TEXT DEFAULT 'published',    -- published, draft, archived
    priority INTEGER DEFAULT 0,         -- Higher priority articles appear first
    view_count INTEGER DEFAULT 0,       -- Track article views
    
    -- Original source data
    original_url TEXT,                   -- Original article URL
    rss_guid TEXT,                       -- RSS GUID for deduplication
    
    -- Full-text search index
    content_search TEXT,                 -- Searchable content (title + description + content)
    
    -- Timestamps
    last_viewed_at DATETIME
);

-- Article analytics table for tracking engagement  
CREATE TABLE IF NOT EXISTS article_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    event_type TEXT NOT NULL,            -- view, share, like, bookmark
    user_id TEXT,                        -- User ID if logged in (from Supabase)
    session_id TEXT,                     -- Anonymous session ID
    ip_address TEXT,                     -- Hashed IP for analytics
    user_agent TEXT,                     -- Browser info
    referrer TEXT,                       -- Where user came from
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional context
    reading_time INTEGER,               -- How long user spent reading
    scroll_depth INTEGER                -- Percentage of article scrolled
);

-- Create triggers for updating timestamps
CREATE TRIGGER IF NOT EXISTS update_articles_timestamp 
    AFTER UPDATE ON articles
    FOR EACH ROW
    BEGIN
        UPDATE articles SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;

-- Create trigger for maintaining search content
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
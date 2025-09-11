-- Create indexes for articles table
CREATE INDEX IF NOT EXISTS idx_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_source ON articles(source);
CREATE INDEX IF NOT EXISTS idx_priority ON articles(priority DESC);
CREATE INDEX IF NOT EXISTS idx_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_rss_guid ON articles(rss_guid);

-- Create indexes for article_analytics table
CREATE INDEX IF NOT EXISTS idx_article_analytics ON article_analytics(article_id, event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON article_analytics(created_at DESC);
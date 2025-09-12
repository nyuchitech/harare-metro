-- Enhance RSS Sources table for dynamic source management
-- Add new columns for quality monitoring and validation

-- Add new columns to existing rss_sources table
ALTER TABLE rss_sources ADD COLUMN rss_url TEXT;
ALTER TABLE rss_sources ADD COLUMN base_domain TEXT;
ALTER TABLE rss_sources ADD COLUMN country TEXT DEFAULT 'ZW';
ALTER TABLE rss_sources ADD COLUMN language TEXT DEFAULT 'en';
ALTER TABLE rss_sources ADD COLUMN quality_score INTEGER DEFAULT 50;
ALTER TABLE rss_sources ADD COLUMN reliability_score INTEGER DEFAULT 50;
ALTER TABLE rss_sources ADD COLUMN freshness_score INTEGER DEFAULT 50;
ALTER TABLE rss_sources ADD COLUMN validation_status TEXT DEFAULT 'pending';
ALTER TABLE rss_sources ADD COLUMN last_validated_at DATETIME;
ALTER TABLE rss_sources ADD COLUMN last_successful_fetch DATETIME;

-- Update existing sources with base domain and rss_url
UPDATE rss_sources SET 
  rss_url = url,
  base_domain = CASE 
    WHEN url LIKE '%herald.co.zw%' THEN 'herald.co.zw'
    WHEN url LIKE '%newsday.co.zw%' THEN 'newsday.co.zw'
    WHEN url LIKE '%chronicle.co.zw%' THEN 'chronicle.co.zw'
    WHEN url LIKE '%zbc.co.zw%' THEN 'zbc.co.zw'
    WHEN url LIKE '%businessweekly.co.zw%' THEN 'businessweekly.co.zw'
    WHEN url LIKE '%techzim.co.zw%' THEN 'techzim.co.zw'
    WHEN url LIKE '%thestandard.co.zw%' THEN 'thestandard.co.zw'
    WHEN url LIKE '%zimlive.com%' THEN 'zimlive.com'
    WHEN url LIKE '%newzimbabwe.com%' THEN 'newzimbabwe.com'
    WHEN url LIKE '%theindependent.co.zw%' THEN 'theindependent.co.zw'
    WHEN url LIKE '%263chat.com%' THEN '263chat.com'
    WHEN url LIKE '%dailynews.co.zw%' THEN 'dailynews.co.zw'
    WHEN url LIKE '%fingaz.co.zw%' THEN 'fingaz.co.zw'
    WHEN url LIKE '%sundaymail.co.zw%' THEN 'sundaymail.co.zw'
    WHEN url LIKE '%zimeye.net%' THEN 'zimeye.net'
    WHEN url LIKE '%news.pindula.co.zw%' THEN 'news.pindula.co.zw'
    WHEN url LIKE '%zimbabwesituation.com%' THEN 'zimbabwesituation.com'
    WHEN url LIKE '%nehandaradio.com%' THEN 'nehandaradio.com'
    WHEN url LIKE '%opennews.co.zw%' THEN 'opennews.co.zw'
    WHEN url LIKE '%manicapost.co.zw%' THEN 'manicapost.co.zw'
    WHEN url LIKE '%southerneye.co.zw%' THEN 'southerneye.co.zw'
    ELSE 'unknown'
  END,
  validation_status = 'valid',
  quality_score = CASE 
    WHEN priority >= 5 THEN 80
    WHEN priority = 4 THEN 70  
    ELSE 60
  END,
  reliability_score = CASE
    WHEN priority >= 5 THEN 85
    WHEN priority = 4 THEN 75
    ELSE 65
  END,
  freshness_score = 70,
  last_validated_at = datetime('now'),
  last_successful_fetch = datetime('now');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rss_sources_base_domain ON rss_sources(base_domain);
CREATE INDEX IF NOT EXISTS idx_rss_sources_quality_score ON rss_sources(quality_score);
CREATE INDEX IF NOT EXISTS idx_rss_sources_validation_status ON rss_sources(validation_status);
CREATE INDEX IF NOT EXISTS idx_rss_sources_enabled_priority ON rss_sources(enabled, priority DESC);

-- Create source performance tracking table
CREATE TABLE IF NOT EXISTS source_performance_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id TEXT NOT NULL,
  fetch_date DATE NOT NULL,
  success BOOLEAN NOT NULL,
  articles_fetched INTEGER DEFAULT 0,
  response_time INTEGER DEFAULT 0, -- in milliseconds
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_id) REFERENCES rss_sources(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_source_performance_source_date ON source_performance_log(source_id, fetch_date);
CREATE INDEX IF NOT EXISTS idx_source_performance_success ON source_performance_log(success);

-- Create source validation history table
CREATE TABLE IF NOT EXISTS source_validation_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id TEXT NOT NULL,
  validation_date DATETIME NOT NULL,
  is_valid BOOLEAN NOT NULL,
  feed_quality INTEGER DEFAULT 0,
  articles_count INTEGER DEFAULT 0,
  validation_details TEXT, -- JSON string
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_id) REFERENCES rss_sources(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_source_validation_source ON source_validation_history(source_id);
CREATE INDEX IF NOT EXISTS idx_source_validation_date ON source_validation_history(validation_date);
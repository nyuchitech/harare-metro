-- Migration 006: Cron Job Logging
-- Track cron job executions for monitoring and debugging

CREATE TABLE IF NOT EXISTS cron_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cron_type TEXT NOT NULL,              -- e.g., 'rss_refresh', 'cleanup', 'analytics'
    status TEXT NOT NULL,                  -- 'started', 'success', 'error'
    trigger_time DATETIME NOT NULL,        -- When the cron was triggered
    completed_at DATETIME,                 -- When it finished
    duration_ms INTEGER,                   -- How long it took in milliseconds
    articles_processed INTEGER DEFAULT 0,
    articles_new INTEGER DEFAULT 0,
    sources_processed INTEGER DEFAULT 0,
    sources_failed INTEGER DEFAULT 0,
    error_message TEXT,
    error_stack TEXT,
    metadata TEXT,                         -- JSON for additional info
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for querying recent cron runs
CREATE INDEX IF NOT EXISTS idx_cron_logs_created_at ON cron_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_logs_type ON cron_logs(cron_type);
CREATE INDEX IF NOT EXISTS idx_cron_logs_status ON cron_logs(status);

-- View for recent cron activity
CREATE VIEW IF NOT EXISTS cron_activity AS
SELECT
    cron_type,
    status,
    trigger_time,
    completed_at,
    duration_ms,
    articles_new,
    sources_processed,
    sources_failed,
    error_message,
    created_at
FROM cron_logs
ORDER BY created_at DESC
LIMIT 100;

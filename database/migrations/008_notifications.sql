-- Migration 008: Notifications Table
-- User notifications for various events

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,                    -- 'article_published', 'comment_reply', 'comment_like', 'author_milestone', 'system'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT,                         -- URL to navigate to when clicked
    link_text TEXT,                        -- Text for the link button
    is_read INTEGER DEFAULT 0,             -- 0 = unread, 1 = read
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME,                      -- When the notification was read
    metadata TEXT,                         -- JSON for additional data
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for querying user notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = 0;

-- Index for notification type
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Index for created_at (for sorting)
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- View for unread notifications count per user
CREATE VIEW IF NOT EXISTS unread_notifications_count AS
SELECT
    user_id,
    COUNT(*) as unread_count
FROM notifications
WHERE is_read = 0
GROUP BY user_id;

-- View for recent notifications (last 30 days)
CREATE VIEW IF NOT EXISTS recent_notifications AS
SELECT
    id,
    user_id,
    type,
    title,
    message,
    link_url,
    link_text,
    is_read,
    created_at,
    read_at
FROM notifications
WHERE created_at >= datetime('now', '-30 days')
ORDER BY created_at DESC;

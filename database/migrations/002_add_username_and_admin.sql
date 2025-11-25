-- Add username column to users table
ALTER TABLE users ADD COLUMN username TEXT;

-- Create unique index on username
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Create admin user
INSERT INTO users (id, email, username, display_name, role, status, email_verified, login_count, analytics_consent, preferences, created_at, updated_at)
VALUES ('admin-001', 'bryan@nyuchi.com', 'bryanceo', 'Bryan Fawcett', 'admin', 'active', 1, 0, 1, '{}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

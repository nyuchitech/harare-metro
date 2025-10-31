-- Create Super Admin User: bryan@nyuchi.com
-- This SQL script creates a super admin account for platform management

INSERT INTO users (
    email,
    display_name,
    role,
    email_verified,
    status,
    login_count,
    analytics_consent,
    created_at,
    updated_at
) VALUES (
    'bryan@nyuchi.com',
    'Bryan Nyuchi',
    'admin',
    TRUE,
    'active',
    0,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT(email) DO UPDATE SET
    role = 'admin',
    email_verified = TRUE,
    status = 'active',
    updated_at = CURRENT_TIMESTAMP;

-- Verify the super admin was created
SELECT id, email, display_name, role, status, email_verified, created_at
FROM users
WHERE email = 'bryan@nyuchi.com';

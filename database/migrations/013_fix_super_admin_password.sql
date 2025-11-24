-- Migration: Fix Super Admin Password for D1-First Architecture
-- Updates bryan@nyuchi.com password to use new salted hash format
-- Database: hararemetro_articles

-- The new password hashing uses format: salt:hash
-- Where both salt and hash are hex-encoded SHA-256
-- Password: admin123 (CHANGE IN PRODUCTION!)

-- Update super admin user with new salted password hash
-- This is a temporary password - user should change it after first login
UPDATE users
SET password_hash = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6:7c6a180b36896a0a8c02787eeafb0e4c37f4788d54ef4d63c1e5c6f6d8c4f9d3'
WHERE email = 'bryan@nyuchi.com';

-- Note: The above is a placeholder hash. In production, generate a proper hash using:
-- const hash = await PasswordHashingService.hashPassword('your-secure-password');
-- Then update this migration with the actual hash value

-- Verify the update
SELECT id, email, username, role,
       CASE
         WHEN password_hash LIKE '%:%' THEN 'New salted format'
         ELSE 'Legacy format'
       END as hash_format
FROM users
WHERE email = 'bryan@nyuchi.com';

-- Migration complete: Super admin password updated to D1-first architecture

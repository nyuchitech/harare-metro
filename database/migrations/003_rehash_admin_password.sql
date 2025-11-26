-- Migration: Rehash admin password with scrypt
-- This migration updates the admin password from SHA-256 to scrypt format
--
-- IMPORTANT: After running this migration, the admin user (bryan@nyuchi.com)
-- will need to log in with their password. The system will automatically
-- detect the legacy SHA-256 hash and upgrade it to scrypt on first login.
--
-- Alternatively, you can manually set a new scrypt hash using the script below.

-- No SQL changes needed - the password rehashing happens automatically on login
-- The system detects legacy SHA-256 hashes (64 hex characters, no colon)
-- and automatically upgrades them to scrypt format (salt:hash) on successful login

-- To manually generate a new scrypt hash, use this Node.js script:
-- node -e "const { scrypt } = require('@noble/hashes/scrypt'); const password = 'YOUR_NEW_PASSWORD'; const salt = new Uint8Array(16); crypto.getRandomValues(salt); const hash = scrypt(password, salt, { N: 16384, r: 8, p: 1, dkLen: 32 }); const bytesToHex = (b) => Array.from(b).map(x => x.toString(16).padStart(2, '0')).join(''); console.log(\`${bytesToHex(salt)}:${bytesToHex(hash)}\`);"

-- Then update the password_hash manually:
-- npx wrangler d1 execute hararemetro_articles --command="UPDATE users SET password_hash = 'NEW_SCRYPT_HASH_HERE' WHERE email = 'bryan@nyuchi.com';"

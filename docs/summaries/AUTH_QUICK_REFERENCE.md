# HARARE METRO AUTHENTICATION - QUICK REFERENCE

## Key Files & Paths

### Frontend (www.hararemetro.co.zw)
```
/app/routes/auth.login.tsx              → Login page
/app/routes/auth.register.tsx           → Registration page
/app/routes/auth.forgot-password.tsx    → Password reset page
/app/routes/settings.profile.tsx        → Profile settings page
/app/lib/auth.client.ts                 → Auth API client
/app/lib/config.ts                      → Backend URL configuration
/app/contexts/AuthContext.tsx           → Global auth state (React Context)
```

### Backend (admin.hararemetro.co.zw)
```
/backend/index.ts                       → Main app + all auth endpoints
/backend/services/OpenAuthService.ts    → D1 + KV auth service
/backend/services/PasswordHashService.ts → Password hashing & token generation
/backend/services/RateLimitService.ts   → Login rate limiting
```

---

## Authentication Endpoints Summary

### User Registration
```
POST /api/auth/register
Body: { email, password, displayName?, username? }
Returns: { user: {...} }
```

### User Login
```
POST /api/auth/login
Body: { email, password }
Returns: { session: {access_token}, user: {...} }
Sets: Set-Cookie: auth_token=...
```

### Check Session
```
GET /api/auth/session
Returns: { session: {access_token}, user: {...} }
Reads: Cookie: auth_token=... OR Authorization: Bearer ...
```

### Logout
```
POST /api/auth/logout
Clears: auth_token cookie
```

### Password Reset (Request Code)
```
POST /api/auth/forgot-password
Body: { email }
Note: Code logged to console (NOT EMAILED YET)
```

### Password Reset (Reset with Code)
```
POST /api/auth/reset-password
Body: { email, code, newPassword }
```

### Check Username Availability
```
GET /api/auth/check-username?username=value
Returns: { available: bool, username: string }
```

---

## Design Checklist (All Pages)

- [x] Dark theme (bg-black, text-white)
- [x] Zimbabwe flag strip (left side)
- [x] ZW green buttons (#00A651)
- [x] Georgia serif headings
- [x] Inter sans-serif body text
- [x] Rounded corners (rounded-xl, rounded-2xl)
- [x] Error messages in red with icon
- [x] Loading spinners on buttons
- [x] Proper form validation
- [x] Mobile responsive

---

## Critical Security Issues (Must Fix Before Production)

### 1. No Email Service
- Password reset codes logged to console, not emailed
- File: `/backend/index.ts:3170`
- Fix: Integrate SendGrid, Cloudflare Email Routing, or AWS SES

### 2. Wrong Password Hashing
- Register uses SHA-256 (INSECURE for passwords)
- Should use bcrypt with PasswordHashService
- File: `/backend/index.ts:2634-2638`
- Impact: All passwords registered are vulnerable to rainbow table attacks

### 3. Passwords in KV, not D1
- Passwords stored in KV namespace instead of D1
- KV is for sessions/cache, not secure storage
- File: `/backend/index.ts:2671`
- Fix: Migrate to D1.users.password_hash column

### 4. No Email Verification
- Users can register with any email
- No verification step before login
- File: `/backend/index.ts:2667`
- Fix: Add email verification before allowing login

### 5. No Rate Limiting on User Login
- Rate limiting only on admin login
- Brute force attacks possible on user login
- File: `/backend/index.ts:322`
- Fix: Add rate limiting to `/api/auth/login` and `/api/auth/register`

---

## Protected Routes

### Frontend
- `/settings/profile` - Requires auth_token cookie (redirects to login if missing)

### Backend
- `/` - Requires admin role
- `/admin` - Requires admin role
- `/api/admin/*` - Requires admin role

---

## Session Storage

### How It Works
1. User logs in → Backend creates session
2. Session stored in: D1 (user_sessions table) + KV (session:{token})
3. Session token set as cookie: `auth_token` with `.hararemetro.co.zw` domain
4. Cookie expires: 7 days
5. Protected routes check cookie + KV for validity

### Cookie Configuration
```
Production:
  auth_token={token}; Domain=.hararemetro.co.zw; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800

Development:
  auth_token={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800
```

---

## User Roles

- `creator` - Default role for new users
- `business-creator` - Business/organization accounts
- `moderator` - Can moderate content
- `admin` - Full platform access
- `super_admin` - Full platform access

---

## Testing Quick Tips

### Create Test User
1. Go to http://localhost:5173/auth/register
2. Email: test@example.com
3. Password: Test123!@
4. Username: testuser

### Test Password Reset
1. Go to /auth/forgot-password
2. Enter test@example.com
3. Check backend console for 6-digit code
4. Enter code + new password

### Test Protected Route
1. Log out: POST /api/auth/logout
2. Try to visit /settings/profile
3. Should redirect to /auth/login

### Test Admin Access
1. Requires admin role in user account
2. Backend redirects non-admins from `/api/admin/*`

---

## File Locations (Absolute Paths)

Frontend Auth Files:
- /Users/bfawcett/Github/harare-metro/app/routes/auth.login.tsx
- /Users/bfawcett/Github/harare-metro/app/routes/auth.register.tsx
- /Users/bfawcett/Github/harare-metro/app/routes/auth.forgot-password.tsx
- /Users/bfawcett/Github/harare-metro/app/routes/settings.profile.tsx
- /Users/bfawcett/Github/harare-metro/app/lib/auth.client.ts
- /Users/bfawcett/Github/harare-metro/app/lib/config.ts
- /Users/bfawcett/Github/harare-metro/app/contexts/AuthContext.tsx

Backend Auth Files:
- /Users/bfawcett/Github/harare-metro/backend/index.ts
- /Users/bfawcett/Github/harare-metro/backend/services/OpenAuthService.ts
- /Users/bfawcett/Github/harare-metro/backend/services/PasswordHashService.ts
- /Users/bfawcett/Github/harare-metro/backend/services/RateLimitService.ts

---

## Architecture Diagram

```
User (Browser)
    ↓
Frontend Worker (www.hararemetro.co.zw)
    ├─ /auth/login (Form submits to backend)
    ├─ /auth/register (Form submits to backend)
    ├─ /auth/forgot-password (Form submits to backend)
    ├─ /settings/profile (Checks auth_token cookie)
    └─ Home (Optional auth, shows different UI if signed in)
    ↓
Backend Worker (admin.hararemetro.co.zw)
    ├─ POST /api/auth/register
    ├─ POST /api/auth/login (Sets auth_token cookie)
    ├─ POST /api/auth/logout
    ├─ GET /api/auth/session
    ├─ POST /api/auth/forgot-password
    ├─ POST /api/auth/reset-password
    └─ All `/api/admin/*` routes (Require admin role)
    ↓
D1 Database (Single: hararemetro_articles)
    ├─ users table (User accounts)
    ├─ user_sessions table (Session records)
    └─ audit_log table (Login events)
    ↓
KV Namespace (AUTH_STORAGE)
    ├─ password:{email} (Password hashes - SHOULD BE D1!)
    ├─ reset:{email} (Password reset codes - 15min TTL)
    └─ session:{token} (Session cache - ADMIN ONLY)
```

---

## Design Theme Colors

```css
/* Zimbabwe Flag Palette */
--zw-green: 140 100% 32%;    /* #00A651 - Primary buttons, success */
--zw-yellow: 48 98% 54%;     /* #FDD116 - Warnings, accents */
--zw-red: 354 85% 57%;       /* #EF3340 - Errors, destructive actions */
--zw-black: 0 0% 0%;         /* #000000 - Backgrounds (dark mode) */
--zw-white: 0 0% 100%;       /* #FFFFFF - Text, borders */

/* Typography */
Headings: Georgia, serif
Body: Inter, sans-serif
```

---

## Next Steps

1. **CRITICAL (Do First)**
   - Fix password hashing (use bcrypt everywhere)
   - Fix password storage (move from KV to D1)
   - Integrate email service for password reset

2. **HIGH (Do Soon)**
   - Add email verification on registration
   - Add rate limiting to user login/register
   - Add input validation (password requirements)

3. **MEDIUM (Do Later)**
   - Add CSRF protection
   - Implement 2FA
   - Add session management UI
   - Add audit logging for user actions

4. **NICE (If Time)**
   - Implement OAuth (Google, GitHub)
   - Add password strength meter
   - Add "remember this device"
   - Add biometric authentication

---

See AUTHENTICATION_ANALYSIS.md for detailed report with all issues and recommendations.

# Shared Authentication Between Frontend and Backend Workers

## Overview

Both `www.hararemetro.co.zw` (frontend) and `admin.hararemetro.co.zw` (backend) share the same authentication system using a **shared KV namespace** (`AUTH_STORAGE`).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  www.hararemetro.co.zw                      │
│                    Frontend Worker                          │
│  • User logs in                                             │
│  • Creates session in AUTH_STORAGE KV                       │
│  • Sets cookie: auth_token=<session_id>                     │
│  • Domain: .hararemetro.co.zw (shared across subdomains)    │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    Shared KV Namespace
                      (AUTH_STORAGE)
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                admin.hararemetro.co.zw                      │
│                   Backend Worker                            │
│  • Reads cookie: auth_token                                 │
│  • Validates session from AUTH_STORAGE KV                   │
│  • Checks user.role in ['admin', 'super_admin', 'moderator']│
│  • Grants/denies admin access                               │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. Shared Cookie Configuration

**Cookie Name**: `auth_token` (NOT `admin_session`)
**Domain**: `.hararemetro.co.zw` (note the leading dot for subdomain sharing)
**Path**: `/`
**Secure**: `true`
**SameSite**: `Lax`
**HttpOnly**: `true`
**Max-Age**: `7 * 24 * 60 * 60` (7 days)

### 2. Session Storage Format (KV)

**Key**: `session:<session_id>`
**Value** (JSON):
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "username": "username",
  "role": "admin|super_admin|moderator|creator",
  "loginAt": "ISO8601 timestamp",
  "expiresAt": "ISO8601 timestamp"
}
```

### 3. Frontend Login Flow

1. User submits login form
2. Frontend validates credentials against D1
3. Frontend creates session ID: `crypto.randomUUID()`
4. Frontend stores session in `AUTH_STORAGE` KV:
   ```typescript
   await AUTH_STORAGE.put(
     `session:${sessionId}`,
     JSON.stringify(sessionData),
     { expirationTtl: 7 * 24 * 60 * 60 }
   );
   ```
5. Frontend sets cookie:
   ```typescript
   response.headers.set(
     'Set-Cookie',
     `auth_token=${sessionId}; Domain=.hararemetro.co.zw; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
   );
   ```

### 4. Backend Auth Middleware

```typescript
async function requireAuth(c: Context, next: Function) {
  // Read cookie from request
  const cookies = c.req.header('Cookie');
  const authToken = parseCookie(cookies, 'auth_token');

  if (!authToken) {
    return c.redirect('https://www.hararemetro.co.zw/auth/login');
  }

  // Validate session from KV
  const sessionData = await c.env.AUTH_STORAGE.get(`session:${authToken}`, 'json');

  if (!sessionData || !sessionData.userId) {
    return c.redirect('https://www.hararemetro.co.zw/auth/login');
  }

  // Check if session expired
  if (new Date(sessionData.expiresAt) < new Date()) {
    await c.env.AUTH_STORAGE.delete(`session:${authToken}`);
    return c.redirect('https://www.hararemetro.co.zw/auth/login');
  }

  // Store user in context for use in routes
  c.set('user', sessionData);

  await next();
}

async function requireAdmin(c: Context, next: Function) {
  await requireAuth(c, async () => {
    const user = c.get('user');
    const adminRoles = c.env.ADMIN_ROLES?.split(',') || ['admin', 'super_admin', 'moderator'];

    if (!adminRoles.includes(user.role)) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    await next();
  });
}
```

### 5. Frontend vs Backend Responsibilities

**Frontend (www.hararemetro.co.zw)**:
- ✅ User registration
- ✅ User login/logout
- ✅ Profile management
- ✅ Settings
- ✅ Onboarding flow
- ✅ Password reset
- ✅ Session creation

**Backend (admin.hararemetro.co.zw)**:
- ✅ Session validation only
- ✅ Admin role checking
- ✅ RSS management
- ✅ Content moderation
- ✅ Analytics
- ❌ NO user management
- ❌ NO profile editing
- ❌ Redirects to frontend for user settings

### 6. Backend Redirects

All user-related pages redirect to frontend:

```typescript
// Profile redirect
app.get("/profile", (c) => {
  return c.redirect("https://www.hararemetro.co.zw/settings/profile", 302);
});

// Settings redirect
app.get("/settings/*", (c) => {
  return c.redirect("https://www.hararemetro.co.zw/settings/profile", 302);
});

// Onboarding redirect
app.get("/onboarding", (c) => {
  return c.redirect("https://www.hararemetro.co.zw/onboarding", 302);
});
```

### 7. Logout Flow

When user logs out from frontend:
1. Delete session from KV: `AUTH_STORAGE.delete(`session:${sessionId}`)`
2. Clear cookie: Set-Cookie with Max-Age=0
3. User is logged out from both frontend AND backend

## Migration Steps

1. ✅ Add `AUTH_STORAGE` KV binding to frontend wrangler.jsonc
2. Update frontend auth to use KV sessions instead of Supabase
3. Update backend to read `auth_token` cookie instead of `admin_session`
4. Update backend middleware to validate against KV
5. Remove backend login page (redirect to frontend)
6. Add backend profile/settings redirects
7. Update cookie domain to `.hararemetro.co.zw`

## Security Considerations

- Session IDs are cryptographically random UUIDs
- HttpOnly cookies prevent XSS attacks
- Secure flag ensures HTTPS only
- SameSite=Lax prevents CSRF
- Sessions auto-expire after 7 days
- KV TTL ensures automatic cleanup
- Backend validates role on every admin request

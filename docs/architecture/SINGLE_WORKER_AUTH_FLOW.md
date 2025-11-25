# Single-Worker Authentication Flow

## ✅ Architecture Overview

**Before (2-Worker):**
```
Frontend (www.hararemetro.co.zw)
  ↓ calls
Backend (admin.hararemetro.co.zw/api/auth/*)
  ↓ sets cookie with domain .hararemetro.co.zw
Cookie shared across subdomains (complex!)
```

**After (1-Worker - MUCH SIMPLER!):**
```
Single Worker (www.hararemetro.co.zw)
  ├── /auth/login           → React Router page (UI)
  ├── /auth/register        → React Router page (UI)
  ├── /api/auth/login       → API endpoint (AJAX)
  └── /api/auth/register    → API endpoint (AJAX)

Cookie set on same origin (simple!)
```

---

## 🔄 Complete Authentication Flow

### **1. User Registration**

**User Journey:**
```
1. User visits www.hararemetro.co.zw/auth/register
2. Sees registration form (React component)
3. Fills email, password, display name
4. Clicks "Sign Up"
```

**Technical Flow:**
```javascript
// Frontend (app/routes/auth.register.tsx)
const handleSubmit = async (e) => {
  e.preventDefault();

  // Call API on same origin
  const { user, error } = await authClient.signUp(email, password, { displayName });

  if (error) {
    setError(error);
    return;
  }

  // Auto-login after registration
  const { user: loggedInUser, error: loginError } = await authClient.signIn(email, password);

  if (loggedInUser) {
    navigate('/'); // Redirect to home
  }
};

// Auth Client (app/lib/auth.client.ts)
async signUp(email, password, metadata) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName: metadata?.displayName })
  });

  return await response.json();
}

// Backend API (workers/app.js)
app.post("/api/auth/register", async (c) => {
  // 1. Validate input
  // 2. Check if email exists
  // 3. Hash password with SHA-256 + salt
  // 4. Create user in D1 database
  // 5. Return user data

  return c.json({ user: { id, email, username, role } }, 201);
});
```

---

### **2. User Login**

**User Journey:**
```
1. User visits www.hararemetro.co.zw/auth/login
2. Sees login form (React component)
3. Enters email and password
4. Clicks "Login"
5. Redirected to homepage (logged in)
```

**Technical Flow:**
```javascript
// Frontend (app/routes/auth.login.tsx)
const handleLogin = async (e) => {
  e.preventDefault();

  const { user, session, error } = await authClient.signIn(email, password);

  if (error) {
    setError(error);
    return;
  }

  // Cookie is automatically set by backend
  navigate('/'); // Redirect to home
};

// Auth Client (app/lib/auth.client.ts)
async signIn(email, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // IMPORTANT: Include cookies
    body: JSON.stringify({ email, password })
  });

  return await response.json();
}

// Backend API (workers/app.js)
app.post("/api/auth/login", async (c) => {
  // 1. Rate limiting (5 attempts per 15 minutes)
  // 2. Get user from D1 database
  // 3. Verify password hash
  // 4. Generate session token (UUID)
  // 5. Store session in KV namespace
  // 6. Set auth_token cookie
  // 7. Log audit event
  // 8. Return user data + session

  setAuthCookie(c, sessionToken);

  return c.json({
    session: { access_token: sessionToken },
    user: { id, email, username, displayName, role }
  });
});
```

---

### **3. Session Check (Protected Routes)**

**User Journey:**
```
1. User visits /settings/profile
2. App checks if user is logged in
3. If not logged in → Redirect to /auth/login
4. If logged in → Show profile page
```

**Technical Flow:**
```javascript
// Frontend (app/lib/auth.client.ts)
async getSession() {
  const response = await fetch('/api/auth/session', {
    credentials: 'include' // IMPORTANT: Include cookies
  });

  if (!response.ok) {
    return { user: null, session: null };
  }

  return await response.json();
}

// Backend API (workers/app.js)
app.get("/api/auth/session", async (c) => {
  // 1. Get auth_token from cookie
  // 2. Check if session exists in KV
  // 3. Check if session expired
  // 4. Get fresh user data from D1
  // 5. Return user + session

  const authToken = getCookie(c.req.header('cookie'), 'auth_token');
  const sessionData = await c.env.AUTH_STORAGE.get(`session:${authToken}`);

  if (!sessionData) {
    return c.json({ error: "Invalid session" }, 401);
  }

  const session = JSON.parse(sessionData);

  // Check expiry
  if (new Date(session.expiresAt) < new Date()) {
    return c.json({ error: "Session expired" }, 401);
  }

  return c.json({ session, user });
});
```

---

### **4. Logout**

**User Journey:**
```
1. User clicks "Logout" button
2. Session deleted
3. Redirected to homepage (logged out)
```

**Technical Flow:**
```javascript
// Frontend
const handleLogout = async () => {
  await authClient.signOut();
  navigate('/');
};

// Auth Client
async signOut() {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
}

// Backend API
app.post("/api/auth/logout", async (c) => {
  const authToken = getCookie(c.req.header('cookie'), 'auth_token');

  if (authToken) {
    // Delete session from KV
    await c.env.AUTH_STORAGE.delete(`session:${authToken}`);
  }

  // Clear cookie
  clearAuthCookie(c);

  return c.json({ success: true });
});
```

---

## 🔒 Security Features

### **1. Rate Limiting**
- **Registration**: 3 attempts per hour per IP
- **Login**: 5 attempts per 15 minutes per IP
- Storage: KV namespace with TTL

### **2. Password Security**
- **Algorithm**: SHA-256 with unique salt per password
- **Format**: `salt:hash` (both hex-encoded)
- **Salt**: 16 bytes (128 bits) cryptographically random
- **Hash**: 32 bytes (256 bits)

### **3. Session Management**
- **Token**: UUID v4 (cryptographically random)
- **Storage**: KV namespace with 7-day TTL
- **Format**:
  ```javascript
  {
    userId: "123",
    email: "user@example.com",
    username: "username",
    role: "creator",
    loginAt: "2025-11-24T12:00:00Z",
    expiresAt: "2025-12-01T12:00:00Z"
  }
  ```
- **Cookie**: HttpOnly, SameSite=Lax, Secure (production)

### **4. Audit Logging**
All auth events logged to D1 `audit_log` table:
- `registration_success`
- `registration_failed` (email exists, username taken)
- `registration_rate_limited`
- `login_success`
- `login_failed` (user not found, invalid password)
- `login_rate_limited`

### **5. Input Validation**
- **Email**: Regex validation
- **Password**: Min 8 chars, at least 1 letter + 1 number
- **Username**: 3-30 chars, alphanumeric + underscore/hyphen

---

## 📱 Cookie Configuration

### **Development:**
```
auth_token=<uuid>; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800
```

### **Production:**
```
auth_token=<uuid>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800
```

**Why This Works:**
- ✅ Same origin (www.hararemetro.co.zw)
- ✅ No domain attribute needed
- ✅ Automatic cookie inclusion in all requests
- ✅ No CORS complexity
- ✅ Simple and secure

---

## 🎯 Benefits of Single-Worker Auth

### **Before (2-Worker):**
❌ Complex cookie domain sharing (`.hararemetro.co.zw`)
❌ CORS configuration needed
❌ Two separate deployments
❌ Session validation in both workers
❌ Cross-worker communication for cron

### **After (1-Worker):**
✅ Same-origin cookies (simple!)
✅ No CORS complexity
✅ Single deployment
✅ Single session storage
✅ Everything in one place

---

## 🔄 Frontend Routes vs API Endpoints

### **User-Facing Routes (React Router):**
- `/auth/login` → Login page (React component)
- `/auth/register` → Registration page (React component)
- `/auth/forgot-password` → Password reset page
- `/settings/profile` → Profile settings page

### **API Endpoints (AJAX calls):**
- `POST /api/auth/register` → Register new user
- `POST /api/auth/login` → Login with credentials
- `GET /api/auth/session` → Check session validity
- `POST /api/auth/logout` → Logout and clear session

### **Admin Routes:**
- `/admin/login` → Admin login page (HTML, not React)
- `/admin` → Admin dashboard (requires admin role)
- `POST /api/admin/*` → Admin API endpoints

---

## 🧪 Testing Flow

### **1. Test Registration:**
```bash
curl -X POST http://localhost:5173/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","displayName":"Test User"}'
```

### **2. Test Login:**
```bash
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

### **3. Test Session Check:**
```bash
curl http://localhost:5173/api/auth/session \
  -b cookies.txt
```

### **4. Test Logout:**
```bash
curl -X POST http://localhost:5173/api/auth/logout \
  -b cookies.txt
```

---

## ✅ Migration Complete!

**Old Architecture:**
- 2 workers
- Cross-domain cookies
- Complex CORS
- Separate deployments

**New Architecture:**
- 1 worker
- Same-origin cookies
- No CORS complexity
- Single deployment

**Authentication is now 90% simpler!** 🎉

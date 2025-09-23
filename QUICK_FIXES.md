# Quick Fixes for Critical Issues

This document provides minimal code changes to fix the identified critical issues.

## Fix 1: Image Proxy System

### Issue: Missing CloudflareImagesService in workers

**Option A: Copy service from backend to workers**
```bash
tsc backend/services/CloudflareImagesService.ts --outDir workers/services --esModuleInterop
```

**Option B: Fix import paths to reference backend service**
In `workers/index.js` and `workers/index-d1.js`, change:
```javascript
// Current (broken)
import { CloudflareImagesService } from './services/CloudflareImagesService.js'

// Fixed
import { CloudflareImagesService } from '../backend/services/CloudflareImagesService.js'
```

## Fix 2: Backend Authentication

### Issue: No authentication middleware on admin routes

**Add authentication middleware to backend/index.ts:**

```typescript
// After line 54, add:
let authService: OpenAuthService;

// After line 88, add:
function initializeAuth(env: Bindings) {
  if (!authService) {
    authService = new OpenAuthService({
      DB: env.DB,
      AUTH_STORAGE: env.AUTH_STORAGE
    });
  }
  return authService;
}

// Create auth middleware
const requireAuth = async (c: any, next: any) => {
  const auth = initializeAuth(c.env);
  const authResult = await auth.handleAuth(c.req.raw);
  
  if (!authResult.ok) {
    return c.json({ error: 'Authentication required' }, 401);
  }
  
  c.set('user', authResult.user);
  await next();
};

const requireAdmin = async (c: any, next: any) => {
  const auth = initializeAuth(c.env);
  return auth.requireRole(['admin', 'super_admin', 'moderator'])(c, next);
};
```

**Apply auth middleware to admin routes:**

```typescript
// Change lines 91-99 from:
app.get("/", (c) => {
  c.header("Content-Type", "text/html");
  return c.html(getAdminHTML());
});

app.get("/admin", (c) => {
  c.header("Content-Type", "text/html");
  return c.html(getAdminHTML());
});

// To:
app.get("/", requireAuth, requireAdmin, (c) => {
  c.header("Content-Type", "text/html");
  return c.html(getAdminHTML());
});

app.get("/admin", requireAuth, requireAdmin, (c) => {
  c.header("Content-Type", "text/html");
  return c.html(getAdminHTML());
});
```

**Apply to all admin API endpoints:**
```typescript
// Change:
app.get("/api/admin/stats", async (c) => {
// To:
app.get("/api/admin/stats", requireAuth, requireAdmin, async (c) => {

// And similarly for all other /api/admin/* endpoints
```

## Fix 3: Admin Button Functions

### Issue: Non-functional admin buttons with placeholder alerts

**Replace placeholder functions in backend/admin/index.ts:**

```javascript
// Replace clearCache function (around line 504):
async function clearCache() {
    if (confirm('Are you sure you want to clear the cache?')) {
        try {
            const response = await fetch('/api/admin/clear-cache', { method: 'POST' });
            const data = await response.json();
            
            if (data.success) {
                alert('Cache cleared successfully!');
                loadDashboard();
            } else {
                alert('Failed to clear cache: ' + data.message);
            }
        } catch (error) {
            alert('Cache clear failed: ' + error.message);
        }
    }
}

// Replace exportData function (around line 510):
async function exportData() {
    try {
        const response = await fetch('/api/admin/export-data', { method: 'POST' });
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `harare-metro-export-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            window.URL.revokeObjectURL(url);
        } else {
            alert('Export failed');
        }
    } catch (error) {
        alert('Export failed: ' + error.message);
    }
}

// Add this HTML to your admin page (e.g., near the sources list):
/*
<div id="addSourceModal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.5); align-items:center; justify-content:center;">
  <div style="background:#fff; padding:24px; border-radius:8px; min-width:300px;">
    <h3>Add RSS Source</h3>
    <form id="addSourceForm">
      <label>
        Name:<br>
        <input type="text" id="sourceName" required>
      </label><br><br>
      <label>
        URL:<br>
        <input type="url" id="sourceUrl" required>
      </label><br><br>
      <button type="submit">Add Source</button>
      <button type="button" onclick="closeAddSourceModal()">Cancel</button>
    </form>
  </div>
</div>
*/

// Show the modal when "Add Source" is clicked
function showAddSourceModal() {
    document.getElementById('addSourceModal').style.display = 'flex';
}
function closeAddSourceModal() {
    document.getElementById('addSourceModal').style.display = 'none';
}

// Replace addSource function (around line 514):
document.getElementById('addSourceForm').onsubmit = async function(e) {
    e.preventDefault();
    const name = document.getElementById('sourceName').value.trim();
    const url = document.getElementById('sourceUrl').value.trim();

    // Basic validation
    if (!name) {
        alert('Source name is required.');
        return;
    }
    try {
        new URL(url);
    } catch {
        alert('Please enter a valid URL.');
        return;
    }

    try {
        const response = await fetch('/api/admin/add-source', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, url, enabled: true })
        });
        const data = await response.json();
        if (data.success) {
            alert(`Source "${name}" added successfully!`);
            closeAddSourceModal();
            loadSources();
        } else {
            alert('Failed to add source: ' + data.message);
        }
    } catch (error) {
        alert('Add source failed: ' + error.message);
    }
}

// Replace cleanupArticles function (around line 522):
async function cleanupArticles() {
    if (confirm('This will remove articles older than 30 days. Continue?')) {
        try {
            const response = await fetch('/api/admin/cleanup-articles', { method: 'POST' });
            const data = await response.json();
            
            if (data.success) {
                alert(`Cleanup completed! Removed ${data.removedCount} old articles.`);
                loadDashboard();
                loadArticles();
            } else {
                alert('Cleanup failed: ' + data.message);
            }
        } catch (error) {
            alert('Cleanup failed: ' + error.message);
        }
    }
}
```

**Add corresponding backend API endpoints:**

```typescript
// Add these routes to backend/index.ts:

app.post("/api/admin/clear-cache", requireAuth, requireAdmin, async (c) => {
  try {
    const services = initializeServices(c.env);
    await services.cacheService.clearCache();
    return c.json({ success: true, message: "Cache cleared successfully" });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

app.post("/api/admin/export-data", requireAuth, requireAdmin, async (c) => {
  try {
    const services = initializeServices(c.env);
    const articles = await services.d1Service.getAllArticles();
    const sources = await services.d1Service.getAllSources();
    
    const exportData = {
      timestamp: new Date().toISOString(),
      articles,
      sources,
      totalArticles: articles.length,
      totalSources: sources.length
    };
    
    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="harare-metro-export-${new Date().toISOString().split('T')[0]}.json"`
      }
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

app.post("/api/admin/add-source", requireAuth, requireAdmin, async (c) => {
  try {
    const { name, url, enabled } = await c.req.json();
    
    if (!name || !url) {
      return c.json({ success: false, message: "Name and URL are required" }, 400);
    }
    
    const services = initializeServices(c.env);
    const sourceId = await services.newsSourceManager.addSource({
      name,
      url, 
      enabled: enabled !== false,
      category_id: 1 // Default category
    });
    
    return c.json({ 
      success: true, 
      message: "Source added successfully",
      sourceId 
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

app.post("/api/admin/cleanup-articles", requireAuth, requireAdmin, async (c) => {
  try {
    const services = initializeServices(c.env);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    const result = await c.env.DB.prepare(`
      DELETE FROM articles 
      WHERE published_at < ? 
      LIMIT 1000
    `).bind(cutoffDate.toISOString()).run();
    
    return c.json({ 
      success: true, 
      message: "Cleanup completed successfully",
      removedCount: result.changes || 0
    });
  } catch (error) {
    return c.json({ success: false, message: error.message }, 500);
  }
});
```

## Fix 4: Build System Configuration

### Issue: Wrangler configuration conflicts

**Clean up conflicting configurations:**

```bash
# Remove any conflicting .wrangler directories
rm -rf .wrangler

# Ensure backend builds in its own directory context
cd backend && npm run build
```

**Alternative: Use separate wrangler contexts**

In `backend/package.json`, modify build script:
```json
{
  "scripts": {
    "build": "cd .. && wrangler deploy --config backend/wrangler.jsonc --dry-run"
  }
}
```

## Implementation Priority

1. **IMMEDIATE (Security Critical)**: Fix 2 - Add authentication
2. **HIGH (User Experience)**: Fix 1 - Fix image proxy  
3. **MEDIUM (Admin UX)**: Fix 3 - Implement admin buttons
4. **LOW (Development)**: Fix 4 - Fix build system

## Testing

After implementing fixes:

1. **Test authentication**: Try accessing `/admin` without login
2. **Test images**: Verify images load in the frontend
3. **Test admin functions**: Try each admin button operation
4. **Test builds**: Ensure `npm run build` works in both directories
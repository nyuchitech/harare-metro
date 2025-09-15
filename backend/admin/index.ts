export function getAdminHTML(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harare Metro Admin</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #000000;
            min-height: 100vh;
            padding: 20px;
            position: relative;
            color: #ffffff;
        }
        
        /* Zimbabwe Flag Strip - Core Brand Element */
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 8px;
            height: 100vh;
            z-index: 1000;
            background: linear-gradient(to bottom,
                #00A651 0% 20%,
                #FDD116 20% 40%, 
                #EF3340 40% 60%,
                #000000 60% 80%,
                #FFFFFF 80% 100%
            );
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            margin-left: calc(50% - 600px + 12px); /* Account for flag strip */
            background: #1a1a1a;
            border-radius: 16px;
            border: 1px solid #333;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            overflow: hidden;
        }
        
        .header {
            background: #000000;
            color: white;
            padding: 30px;
            text-align: center;
            border-bottom: 1px solid #333;
        }
        
        .header h1 {
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .header p {
            opacity: 0.9;
            font-size: 1.1rem;
        }
        
        .nav {
            display: flex;
            background: #2a2a2a;
            border-bottom: 1px solid #333;
        }
        
        .nav-item {
            flex: 1;
            text-align: center;
            padding: 15px;
            cursor: pointer;
            transition: background 0.3s;
            border: none;
            background: none;
            font-size: 1rem;
            color: #ccc;
        }
        
        .nav-item:hover {
            background: #333;
            color: #fff;
        }
        
        .nav-item.active {
            background: #fff;
            color: #000;
        }
        
        .content {
            padding: 30px;
        }
        
        .section {
            display: none;
        }
        
        .section.active {
            display: block;
        }
        
        .card {
            background: #2a2a2a;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 20px;
            border: 1px solid #444;
        }
        
        .card h3 {
            font-family: Georgia, 'Times New Roman', serif;
            color: #fff;
            margin-bottom: 15px;
            font-size: 1.3rem;
        }
        
        .btn {
            background: #fff;
            color: #000;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            transition: background 0.3s;
            margin-right: 10px;
        }
        
        .btn:hover {
            background: #ccc;
        }
        
        .btn-danger {
            background: #333;
            color: #fff;
        }
        
        .btn-danger:hover {
            background: #555;
        }
        
        .btn-warning {
            background: #666;
            color: #fff;
        }
        
        .btn-warning:hover {
            background: #888;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: #333;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            border: 2px solid #555;
            transition: transform 0.3s;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #fff;
        }
        
        .stat-label {
            color: #ccc;
            margin-top: 5px;
        }
        
        .log {
            background: #000;
            color: #00ff00;
            padding: 20px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            height: 300px;
            overflow-y: auto;
            margin-top: 20px;
        }
        
        .sources-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        .sources-table th,
        .sources-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #444;
            color: #fff;
        }
        
        .sources-table th {
            background: #333;
            color: #fff;
            font-weight: bold;
        }
        
        .status-active {
            color: #00ff00;
            font-weight: bold;
        }
        
        .status-inactive {
            color: #ff6666;
            font-weight: bold;
        }
        
        .loading {
            display: inline-block;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
                <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 2.5rem; font-weight: bold; color: #fff;">
                    Harare Metro
                </div>
                <div style="font-size: 1.5rem;">🇿🇼</div>
            </div>
            <div style="margin-top: 10px; font-size: 1.1rem; opacity: 0.9; color: #ccc;">
                Backend Management & Analytics Dashboard
            </div>
        </div>
        
        <div class="nav">
            <button class="nav-item active" onclick="showSection('dashboard')">Dashboard</button>
            <button class="nav-item" onclick="showSection('rss')">RSS Sources</button>
            <button class="nav-item" onclick="showSection('articles')">Articles</button>
            <button class="nav-item" onclick="showSection('analytics')">Analytics</button>
            <button class="nav-item" onclick="showSection('system')">System</button>
        </div>
        
        <div class="content">
            <!-- Dashboard Section -->
            <div id="dashboard" class="section active">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number" id="totalArticles">-</div>
                        <div class="stat-label">Total Articles</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="activeSources">-</div>
                        <div class="stat-label">Active Sources</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="lastRefresh">-</div>
                        <div class="stat-label">Last RSS Refresh</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="dbSize">-</div>
                        <div class="stat-label">Database Size</div>
                    </div>
                </div>
                
                <div class="card">
                    <h3>Quick Actions</h3>
                    <button class="btn" onclick="refreshRSS()">🔄 Refresh RSS Feeds</button>
                    <button class="btn btn-warning" onclick="clearCache()">🗑️ Clear Cache</button>
                    <button class="btn btn-danger" onclick="exportData()">📊 Export Data</button>
                </div>
            </div>
            
            <!-- RSS Sources Section -->
            <div id="rss" class="section">
                <div class="card">
                    <h3>RSS Source Management</h3>
                    <button class="btn" onclick="loadSources()">🔄 Refresh Sources</button>
                    <button class="btn" onclick="addSource()">➕ Add Source</button>
                    
                    <table class="sources-table" id="sourcesTable">
                        <thead>
                            <tr>
                                <th>Source</th>
                                <th>URL</th>
                                <th>Status</th>
                                <th>Last Fetch</th>
                                <th>Articles</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td colspan="6">Loading sources...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Articles Section -->
            <div id="articles" class="section">
                <div class="card">
                    <h3>Article Management</h3>
                    <button class="btn" onclick="loadArticles()">🔄 Refresh Articles</button>
                    <button class="btn btn-warning" onclick="cleanupArticles()">🧹 Cleanup Old Articles</button>
                    
                    <div id="articlesContainer">
                        <p>Loading articles...</p>
                    </div>
                </div>
            </div>
            
            <!-- Analytics Section -->
            <div id="analytics" class="section">
                <div class="card">
                    <h3>Analytics & Insights</h3>
                    <button class="btn" onclick="loadAnalytics()">📊 Load Analytics</button>
                    
                    <div id="analyticsContainer">
                        <p>Analytics data will appear here...</p>
                    </div>
                </div>
            </div>
            
            <!-- System Section -->
            <div id="system" class="section">
                <div class="card">
                    <h3>System Health</h3>
                    <button class="btn" onclick="checkHealth()">🏥 Health Check</button>
                    <button class="btn" onclick="viewLogs()">📋 View Logs</button>
                    
                    <div id="healthStatus">
                        <p>Click "Health Check" to view system status...</p>
                    </div>
                    
                    <div class="log" id="systemLogs" style="display: none;">
                        <div>System logs will appear here...</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Global state
        let currentSection = 'dashboard';
        
        // Navigation
        function showSection(sectionId) {
            // Hide all sections
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            
            // Show selected section
            document.getElementById(sectionId).classList.add('active');
            event.target.classList.add('active');
            currentSection = sectionId;
            
            // Load section data
            if (sectionId === 'dashboard') loadDashboard();
            if (sectionId === 'rss') loadSources();
            if (sectionId === 'articles') loadArticles();
            if (sectionId === 'analytics') loadAnalytics();
        }
        
        // Dashboard functions
        async function loadDashboard() {
            try {
                const response = await fetch('/api/admin/stats');
                const data = await response.json();
                
                document.getElementById('totalArticles').textContent = data.database?.total_articles || '0';
                document.getElementById('activeSources').textContent = data.database?.active_sources || '0';
                document.getElementById('dbSize').textContent = formatBytes(data.database?.size || 0);
                
                // Load last refresh time
                const lastRefresh = localStorage.getItem('lastRSSRefresh') || 'Never';
                document.getElementById('lastRefresh').textContent = formatTime(lastRefresh);
            } catch (error) {
                console.error('Failed to load dashboard:', error);
            }
        }
        
        // RSS Functions
        async function refreshRSS() {
            const button = event.target;
            const originalText = button.textContent;
            button.textContent = '🔄 Refreshing...';
            button.disabled = true;
            
            try {
                const response = await fetch('/api/admin/refresh-rss', { method: 'POST' });
                const data = await response.json();
                
                if (data.success) {
                    alert(\`RSS Refresh completed! \\n\${data.results.newArticles} new articles added.\`);
                    localStorage.setItem('lastRSSRefresh', new Date().toISOString());
                    loadDashboard();
                } else {
                    alert('RSS Refresh failed: ' + data.message);
                }
            } catch (error) {
                alert('RSS Refresh failed: ' + error.message);
            } finally {
                button.textContent = originalText;
                button.disabled = false;
            }
        }
        
        async function loadSources() {
            try {
                const response = await fetch('/api/admin/sources');
                const data = await response.json();
                // Implement sources table population
            } catch (error) {
                console.error('Failed to load sources:', error);
            }
        }
        
        async function loadArticles() {
            try {
                const response = await fetch('/api/feeds?limit=50');
                const data = await response.json();
                
                const container = document.getElementById('articlesContainer');
                if (data.articles && data.articles.length > 0) {
                    container.innerHTML = \`
                        <p><strong>\${data.total} articles</strong> in database</p>
                        <div style="max-height: 400px; overflow-y: auto; margin-top: 15px;">
                            \${data.articles.map(article => \`
                                <div style="border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                                    <strong>\${article.title}</strong><br>
                                    <small style="color: #6c757d;">
                                        \${article.source} • \${new Date(article.published_at).toLocaleDateString()}
                                    </small>
                                </div>
                            \`).join('')}
                        </div>
                    \`;
                } else {
                    container.innerHTML = '<p>No articles found.</p>';
                }
            } catch (error) {
                document.getElementById('articlesContainer').innerHTML = '<p>Failed to load articles.</p>';
            }
        }
        
        async function loadAnalytics() {
            document.getElementById('analyticsContainer').innerHTML = '<p>Analytics feature coming soon...</p>';
        }
        
        async function checkHealth() {
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                
                document.getElementById('healthStatus').innerHTML = \`
                    <div style="background: \${data.status === 'healthy' ? '#d4edda' : '#f8d7da'}; 
                                border-radius: 8px; padding: 15px; margin-top: 15px;">
                        <strong>Status:</strong> \${data.status}<br>
                        <strong>Database:</strong> \${data.services.database}<br>
                        <strong>Analytics:</strong> \${data.services.analytics ? 'enabled' : 'disabled'}<br>
                        <strong>Environment:</strong> \${data.environment}<br>
                        <strong>Timestamp:</strong> \${data.timestamp}
                    </div>
                \`;
            } catch (error) {
                document.getElementById('healthStatus').innerHTML = \`
                    <div style="background: #f8d7da; border-radius: 8px; padding: 15px; margin-top: 15px;">
                        <strong>Health check failed:</strong> \${error.message}
                    </div>
                \`;
            }
        }
        
        function viewLogs() {
            const logsDiv = document.getElementById('systemLogs');
            logsDiv.style.display = logsDiv.style.display === 'none' ? 'block' : 'none';
        }
        
        function clearCache() {
            if (confirm('Are you sure you want to clear the cache?')) {
                alert('Cache clearing functionality will be implemented soon.');
            }
        }
        
        function exportData() {
            alert('Data export functionality will be implemented soon.');
        }
        
        function addSource() {
            const name = prompt('RSS Source Name:');
            const url = prompt('RSS Feed URL:');
            if (name && url) {
                alert('Add source functionality will be implemented soon.');
            }
        }
        
        function cleanupArticles() {
            if (confirm('This will remove articles older than 30 days. Continue?')) {
                alert('Article cleanup functionality will be implemented soon.');
            }
        }
        
        // Utility functions
        function formatBytes(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
        
        function formatTime(isoString) {
            if (isoString === 'Never') return 'Never';
            try {
                return new Date(isoString).toLocaleString();
            } catch {
                return 'Invalid date';
            }
        }
        
        // Initialize dashboard on load
        window.addEventListener('load', () => {
            loadDashboard();
        });
    </script>
</body>
</html>
  `;
}
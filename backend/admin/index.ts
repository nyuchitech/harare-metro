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
        
        /* Modal Styles */
        .modal {
            display: none;
            position: fixed;
            z-index: 10000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.8);
            backdrop-filter: blur(8px);
        }
        
        .modal.show {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .modal-content {
            background: #1a1a1a;
            border-radius: 16px;
            border: 1px solid #444;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 20px 40px rgba(0,0,0,0.7);
        }
        
        .modal h3 {
            font-family: Georgia, 'Times New Roman', serif;
            color: #fff;
            margin-bottom: 20px;
            font-size: 1.4rem;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            color: #ccc;
            margin-bottom: 8px;
            font-weight: 500;
        }
        
        .form-group input {
            width: 100%;
            padding: 12px;
            border: 1px solid #444;
            border-radius: 8px;
            background: #2a2a2a;
            color: #fff;
            font-size: 1rem;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #00A651;
            box-shadow: 0 0 0 2px rgba(0, 166, 81, 0.2);
        }
        
        .modal-buttons {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 25px;
        }
        
        .btn-primary {
            background: #00A651;
            color: #fff;
        }
        
        .btn-primary:hover {
            background: #008A44;
        }
        
        .btn-secondary {
            background: #333;
            color: #fff;
        }
        
        .btn-secondary:hover {
            background: #555;
        }
        
        .confirmation-text {
            color: #ccc;
            margin-bottom: 20px;
            line-height: 1.5;
        }
        
        .warning-text {
            color: #FDD116;
            font-weight: 600;
        }
        
        .error-text {
            color: #EF3340;
            font-weight: 600;
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

    <!-- Add RSS Source Modal -->
    <div id="addSourceModal" class="modal">
        <div class="modal-content">
            <h3>Add RSS Source</h3>
            <form id="addSourceForm">
                <div class="form-group">
                    <label for="sourceName">RSS Source Name:</label>
                    <input type="text" id="sourceName" name="sourceName" required 
                           placeholder="e.g., The Herald Zimbabwe">
                </div>
                <div class="form-group">
                    <label for="sourceUrl">RSS Feed URL:</label>
                    <input type="url" id="sourceUrl" name="sourceUrl" required 
                           placeholder="https://example.com/rss">
                </div>
                <div class="modal-buttons">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('addSourceModal')">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Source</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Clear Cache Confirmation Modal -->
    <div id="clearCacheModal" class="modal">
        <div class="modal-content">
            <h3>Clear Cache</h3>
            <div class="confirmation-text">
                <p class="warning-text">⚠️ Warning</p>
                <p>Are you sure you want to clear the cache? This action will:</p>
                <ul style="margin: 10px 0; padding-left: 20px; color: #ccc;">
                    <li>Remove all cached RSS feed data</li>
                    <li>Force fresh fetching of all content</li>
                    <li>May temporarily slow down the application</li>
                </ul>
            </div>
            <div class="modal-buttons">
                <button type="button" class="btn btn-secondary" onclick="closeModal('clearCacheModal')">Cancel</button>
                <button type="button" class="btn btn-danger" onclick="confirmClearCache()">Yes, Clear Cache</button>
            </div>
        </div>
    </div>

    <!-- Cleanup Articles Confirmation Modal -->
    <div id="cleanupArticlesModal" class="modal">
        <div class="modal-content">
            <h3>Cleanup Old Articles</h3>
            <div class="confirmation-text">
                <p class="error-text">⚠️ Destructive Action</p>
                <p>This will <strong>permanently remove</strong> articles older than 30 days from the database.</p>
                <p><strong>This action cannot be undone.</strong></p>
                <p>Are you sure you want to continue?</p>
            </div>
            <div class="modal-buttons">
                <button type="button" class="btn btn-secondary" onclick="closeModal('cleanupArticlesModal')">Cancel</button>
                <button type="button" class="btn btn-danger" onclick="confirmCleanupArticles()">Yes, Delete Old Articles</button>
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
            openModal('clearCacheModal');
        }
        
        function confirmClearCache() {
            closeModal('clearCacheModal');
            alert('Cache clearing functionality will be implemented soon.');
        }
        
        function exportData() {
            alert('Data export functionality will be implemented soon.');
        }
        
        function addSource() {
            openModal('addSourceModal');
        }
        
        function cleanupArticles() {
            openModal('cleanupArticlesModal');
        }
        
        function confirmCleanupArticles() {
            closeModal('cleanupArticlesModal');
            alert('Article cleanup functionality will be implemented soon.');
        }
        
        // Modal management functions
        function openModal(modalId) {
            document.getElementById(modalId).classList.add('show');
        }
        
        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('show');
            
            // Reset form if it's the add source modal
            if (modalId === 'addSourceModal') {
                document.getElementById('addSourceForm').reset();
            }
        }
        
        // Close modal when clicking outside
        window.onclick = function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.classList.remove('show');
                
                // Reset form if it's the add source modal
                if (event.target.id === 'addSourceModal') {
                    document.getElementById('addSourceForm').reset();
                }
            }
        }
        
        // Handle add source form submission
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('addSourceForm').addEventListener('submit', function(e) {
                e.preventDefault();
                
                const name = document.getElementById('sourceName').value.trim();
                const url = document.getElementById('sourceUrl').value.trim();
                
                if (name && url) {
                    // Close modal first
                    closeModal('addSourceModal');
                    
                    // Show success message (functionality to be implemented)
                    alert(\`RSS Source "\${name}" will be added soon.\\nURL: \${url}\`);
                    
                    // TODO: Implement actual RSS source addition API call
                    console.log('Adding RSS source:', { name, url });
                }
            });
        });
        
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
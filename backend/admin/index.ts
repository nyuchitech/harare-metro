export function getAdminHTML(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harare Metro Admin</title>

    <!-- Favicons -->
    <link rel="icon" href="https://www.hararemetro.co.zw/favicon.ico" sizes="any">
    <link rel="icon" href="https://www.hararemetro.co.zw/favicon.png" type="image/png">
    <link rel="icon" href="https://www.hararemetro.co.zw/favicon-16x16.png" sizes="16x16" type="image/png">
    <link rel="icon" href="https://www.hararemetro.co.zw/favicon-32x32.png" sizes="32x32" type="image/png">
    <link rel="apple-touch-icon" href="https://www.hararemetro.co.zw/apple-touch-icon.png">

    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>

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
            color: #ffffff;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            background: #1a1a1a;
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 20px;
            border: 1px solid #333;
        }

        .header h1 {
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 8px;
            color: #fff;
        }

        .header p {
            color: #999;
            font-size: 0.95rem;
        }

        .nav {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            overflow-x: auto;
            padding-bottom: 5px;
        }

        .nav-item {
            background: #1a1a1a;
            color: #999;
            border: 1px solid #333;
            padding: 12px 24px;
            border-radius: 9999px;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.9rem;
            font-weight: 500;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .nav-item:hover {
            background: #2a2a2a;
            color: #fff;
            border-color: #555;
        }

        .nav-item.active {
            background: #fff;
            color: #000;
            border-color: #fff;
        }

        .content {
            min-height: 400px;
        }

        .section {
            display: none;
        }

        .section.active {
            display: block;
        }

        .card {
            background: #1a1a1a;
            border-radius: 16px;
            padding: 25px;
            margin-bottom: 20px;
            border: 1px solid #333;
        }

        .card h3 {
            font-family: Georgia, 'Times New Roman', serif;
            color: #fff;
            margin-bottom: 20px;
            font-size: 1.3rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .btn {
            background: #fff;
            color: #000;
            border: 1px solid #fff;
            padding: 10px 20px;
            border-radius: 9999px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .btn:hover {
            background: #e5e5e5;
            transform: translateY(-1px);
        }

        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .btn-secondary {
            background: transparent;
            color: #fff;
            border: 1px solid #555;
        }

        .btn-secondary:hover {
            background: #2a2a2a;
            border-color: #777;
        }

        .btn-danger {
            background: #333;
            color: #fff;
            border: 1px solid #555;
        }

        .btn-danger:hover {
            background: #444;
        }

        .btn-group {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 20px;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }

        .stat-card {
            background: #2a2a2a;
            border-radius: 12px;
            padding: 20px;
            border: 1px solid #444;
            transition: transform 0.2s;
        }

        .stat-card:hover {
            transform: translateY(-3px);
        }

        .stat-icon {
            width: 40px;
            height: 40px;
            background: #fff;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 12px;
        }

        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #fff;
            margin-bottom: 5px;
        }

        .stat-label {
            color: #999;
            font-size: 0.9rem;
        }

        /* Data Tables */
        .data-table-container {
            overflow-x: auto;
            margin-top: 20px;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.9rem;
        }

        .data-table th {
            background: #2a2a2a;
            color: #fff;
            font-weight: 600;
            text-align: left;
            padding: 12px 16px;
            border-bottom: 2px solid #444;
            position: sticky;
            top: 0;
        }

        .data-table td {
            padding: 12px 16px;
            border-bottom: 1px solid #333;
            color: #e5e5e5;
        }

        .data-table tbody tr {
            transition: background 0.2s;
        }

        .data-table tbody tr:hover {
            background: #2a2a2a;
        }

        .data-table input,
        .data-table select {
            background: #333;
            color: #fff;
            border: 1px solid #555;
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 0.85rem;
            width: 100%;
        }

        .data-table input:focus,
        .data-table select:focus {
            outline: none;
            border-color: #fff;
        }

        .table-actions {
            display: flex;
            gap: 8px;
        }

        .icon-btn {
            background: transparent;
            border: none;
            color: #999;
            cursor: pointer;
            padding: 6px;
            border-radius: 6px;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        .icon-btn:hover {
            background: #333;
            color: #fff;
        }

        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
        }

        .badge-active {
            background: #fff;
            color: #000;
        }

        .badge-inactive {
            background: #333;
            color: #999;
        }

        .badge-success {
            background: #2a2a2a;
            color: #fff;
            border: 1px solid #555;
        }

        .badge-error {
            background: #2a2a2a;
            color: #999;
            border: 1px solid #444;
        }

        /* Modal */
        .modal {
            display: none;
            position: fixed;
            z-index: 10000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.85);
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
            max-width: 600px;
            width: 90%;
            max-height: 85vh;
            overflow-y: auto;
        }

        .modal h3 {
            font-family: Georgia, 'Times New Roman', serif;
            color: #fff;
            margin-bottom: 25px;
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
            font-size: 0.9rem;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 12px;
            border: 1px solid #444;
            border-radius: 8px;
            background: #2a2a2a;
            color: #fff;
            font-size: 0.95rem;
        }

        .form-group textarea {
            min-height: 100px;
            resize: vertical;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #fff;
        }

        .modal-buttons {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 25px;
        }

        .loading-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #333;
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .alert {
            padding: 15px 20px;
            border-radius: 12px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .alert-success {
            background: #2a2a2a;
            color: #fff;
            border: 1px solid #555;
        }

        .alert-error {
            background: #2a2a2a;
            color: #fff;
            border: 1px solid #444;
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #666;
        }

        .empty-state-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            opacity: 0.3;
        }

        code {
            background: #2a2a2a;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.85rem;
            color: #e5e5e5;
        }

        pre {
            background: #0a0a0a;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 0.85rem;
            margin-top: 15px;
        }

        /* Device Restriction for Mobile */
        .device-restriction {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: #000000;
            z-index: 9999;
            align-items: center;
            justify-content: center;
            padding: 40px;
            text-align: center;
        }

        .device-restriction-content {
            max-width: 400px;
        }

        .device-restriction h2 {
            font-family: Georgia, serif;
            font-size: 32px;
            margin-bottom: 16px;
            color: #00A651;
        }

        .device-restriction p {
            color: #999;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 24px;
        }

        .device-restriction .icon {
            font-size: 64px;
            margin-bottom: 24px;
            opacity: 0.5;
        }

        /* Show restriction on mobile/small tablets */
        @media (max-width: 1023px) {
            .device-restriction {
                display: flex;
            }
            .container {
                display: none;
            }
        }
    </style>
</head>
<body>
    <!-- Device Restriction Overlay -->
    <div class="device-restriction">
        <div class="device-restriction-content">
            <div class="icon">💻</div>
            <h2>Desktop Only</h2>
            <p>
                The Harare Metro Admin Panel is designed for desktop and tablet (landscape) use only.
            </p>
            <p>
                Please access this page on a larger screen for the best experience.
            </p>
        </div>
    </div>

    <div class="container">
        <div class="header">
            <h1>Harare Metro Admin</h1>
            <p>Backend Management & Analytics Dashboard</p>
        </div>

        <div class="nav">
            <button class="nav-item active" onclick="showSection('dashboard')">
                <i data-lucide="layout-dashboard"></i> Dashboard
            </button>
            <button class="nav-item" onclick="showSection('sources')">
                <i data-lucide="rss"></i> RSS Sources
            </button>
            <button class="nav-item" onclick="showSection('articles')">
                <i data-lucide="newspaper"></i> Articles
            </button>
            <button class="nav-item" onclick="showSection('authors')">
                <i data-lucide="users"></i> Authors
            </button>
            <button class="nav-item" onclick="showSection('categories')">
                <i data-lucide="folder"></i> Categories
            </button>
            <button class="nav-item" onclick="showSection('analytics')">
                <i data-lucide="bar-chart-3"></i> Analytics
            </button>
            <button class="nav-item" onclick="showSection('system')">
                <i data-lucide="settings"></i> System
            </button>
        </div>

        <div class="content">
            <!-- Dashboard Section -->
            <div id="dashboard" class="section active">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i data-lucide="file-text" stroke="#000"></i>
                        </div>
                        <div class="stat-number" id="totalArticles">-</div>
                        <div class="stat-label">Total Articles</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i data-lucide="rss" stroke="#000"></i>
                        </div>
                        <div class="stat-number" id="activeSources">-</div>
                        <div class="stat-label">Active Sources</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i data-lucide="folder" stroke="#000"></i>
                        </div>
                        <div class="stat-number" id="totalCategories">-</div>
                        <div class="stat-label">Categories</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i data-lucide="database" stroke="#000"></i>
                        </div>
                        <div class="stat-number" id="dbSize">-</div>
                        <div class="stat-label">Database Size</div>
                    </div>
                </div>

                <div class="card">
                    <h3><i data-lucide="zap"></i> Quick Actions</h3>
                    <div class="btn-group">
                        <button class="btn" onclick="refreshRSS()">
                            <i data-lucide="refresh-cw"></i> Refresh RSS Feeds
                        </button>
                        <button class="btn btn-secondary" onclick="bulkPull()">
                            <i data-lucide="download"></i> Bulk Pull Articles
                        </button>
                        <button class="btn btn-secondary" onclick="viewLogs()">
                            <i data-lucide="terminal"></i> View Logs
                        </button>
                    </div>
                    <div id="actionResult"></div>
                </div>
            </div>

            <!-- RSS Sources Section -->
            <div id="sources" class="section">
                <div class="card">
                    <h3><i data-lucide="rss"></i> RSS Source Management</h3>
                    <div class="btn-group">
                        <button class="btn" onclick="loadSources()">
                            <i data-lucide="refresh-cw"></i> Refresh
                        </button>
                        <button class="btn btn-secondary" onclick="addSource()">
                            <i data-lucide="plus"></i> Add Source
                        </button>
                    </div>

                    <div class="data-table-container">
                        <table class="data-table" id="sourcesTable">
                            <thead>
                                <tr>
                                    <th>Source Name</th>
                                    <th>URL</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>Articles</th>
                                    <th>Last Fetch</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td colspan="7" style="text-align: center; padding: 40px;">Loading sources...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Articles Section -->
            <div id="articles" class="section">
                <div class="card">
                    <h3><i data-lucide="newspaper"></i> Article Management</h3>
                    <div class="btn-group">
                        <button class="btn" onclick="loadArticles()">
                            <i data-lucide="refresh-cw"></i> Refresh
                        </button>
                        <button class="btn btn-secondary" onclick="exportArticles()">
                            <i data-lucide="download"></i> Export
                        </button>
                    </div>

                    <div class="data-table-container">
                        <table class="data-table" id="articlesTable">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Source</th>
                                    <th>Author</th>
                                    <th>Published</th>
                                    <th>Views</th>
                                    <th>Likes</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td colspan="7" style="text-align: center; padding: 40px;">Loading articles...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Authors Section -->
            <div id="authors" class="section">
                <div class="card">
                    <h3><i data-lucide="users"></i> Author Profiles</h3>
                    <div class="btn-group">
                        <button class="btn" onclick="loadAuthors()">
                            <i data-lucide="refresh-cw"></i> Refresh
                        </button>
                    </div>

                    <div class="data-table-container">
                        <table class="data-table" id="authorsTable">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Outlet</th>
                                    <th>Articles</th>
                                    <th>Recognition Score</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td colspan="5" style="text-align: center; padding: 40px;">Loading authors...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Categories Section -->
            <div id="categories" class="section">
                <div class="card">
                    <h3><i data-lucide="folder"></i> Category Management</h3>
                    <div class="btn-group">
                        <button class="btn" onclick="loadCategories()">
                            <i data-lucide="refresh-cw"></i> Refresh
                        </button>
                        <button class="btn btn-secondary" onclick="addCategory()">
                            <i data-lucide="plus"></i> Add Category
                        </button>
                    </div>

                    <div class="data-table-container">
                        <table class="data-table" id="categoriesTable">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Slug</th>
                                    <th>Articles</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td colspan="5" style="text-align: center; padding: 40px;">Loading categories...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Analytics Section -->
            <div id="analytics" class="section">
                <div class="card">
                    <h3><i data-lucide="bar-chart-3"></i> Analytics & Insights</h3>
                    <div class="btn-group">
                        <button class="btn" onclick="loadAnalytics()">
                            <i data-lucide="refresh-cw"></i> Load Analytics
                        </button>
                    </div>

                    <div id="analyticsContainer">
                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <i data-lucide="bar-chart-3"></i>
                            </div>
                            <p>Click "Load Analytics" to view insights</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- System Section -->
            <div id="system" class="section">
                <div class="card">
                    <h3><i data-lucide="activity"></i> System Health</h3>
                    <div class="btn-group">
                        <button class="btn" onclick="checkHealth()">
                            <i data-lucide="heart-pulse"></i> Health Check
                        </button>
                        <button class="btn btn-secondary" onclick="viewAPIEndpoints()">
                            <i data-lucide="list"></i> API Endpoints
                        </button>
                    </div>

                    <div id="healthStatus"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Add/Edit RSS Source Modal -->
    <div id="sourceModal" class="modal">
        <div class="modal-content">
            <h3 id="sourceModalTitle">Add RSS Source</h3>
            <form id="sourceForm">
                <input type="hidden" id="sourceId">

                <div class="form-group">
                    <label for="sourceName">Source Name</label>
                    <input type="text" id="sourceName" required placeholder="e.g., The Herald Zimbabwe">
                </div>

                <div class="form-group">
                    <label for="sourceUrl">RSS Feed URL</label>
                    <input type="url" id="sourceUrl" required placeholder="https://example.com/rss">
                </div>

                <div class="form-group">
                    <label for="sourceCategory">Category</label>
                    <input type="text" id="sourceCategory" placeholder="news">
                </div>

                <div class="form-group">
                    <label for="sourcePriority">Priority (1-10)</label>
                    <input type="number" id="sourcePriority" min="1" max="10" value="5">
                </div>

                <div class="modal-buttons">
                    <button type="button" class="btn btn-secondary" onclick="closeModal('sourceModal')">Cancel</button>
                    <button type="submit" class="btn">Save Source</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        // Global fetch wrapper to handle authentication errors
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const response = await originalFetch(...args);

            // If 401 Unauthorized, redirect to login
            if (response.status === 401) {
                console.warn('[AUTH] Session expired, redirecting to login');
                window.location.href = '/login';
                throw new Error('Session expired');
            }

            return response;
        };

        // Initialize Lucide icons
        document.addEventListener('DOMContentLoaded', () => {
            lucide.createIcons();
            loadDashboard();
        });

        // Navigation
        function showSection(sectionId) {
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

            document.getElementById(sectionId).classList.add('active');
            event.target.closest('.nav-item').classList.add('active');

            // Load section data
            if (sectionId === 'dashboard') loadDashboard();
            else if (sectionId === 'sources') loadSources();
            else if (sectionId === 'articles') loadArticles();
            else if (sectionId === 'authors') loadAuthors();
            else if (sectionId === 'categories') loadCategories();

            // Reinitialize icons
            lucide.createIcons();
        }

        // Dashboard
        async function loadDashboard() {
            try {
                const response = await fetch('/api/admin/stats');
                const data = await response.json();

                document.getElementById('totalArticles').textContent = data.database?.total_articles || '0';
                document.getElementById('activeSources').textContent = data.database?.active_sources || '0';
                document.getElementById('totalCategories').textContent = data.database?.categories || '0';
                document.getElementById('dbSize').textContent = formatBytes(data.database?.size || 0);
            } catch (error) {
                console.error('Failed to load dashboard:', error);
            }
        }

        async function refreshRSS() {
            const button = event.target.closest('button');
            const originalHTML = button.innerHTML;
            button.innerHTML = '<span class="loading-spinner"></span> Refreshing...';
            button.disabled = true;

            try {
                const response = await fetch('/api/refresh-rss', { method: 'POST' });
                const data = await response.json();

                const resultDiv = document.getElementById('actionResult');
                if (data.success) {
                    resultDiv.innerHTML = \`
                        <div class="alert alert-success">
                            <i data-lucide="check-circle"></i>
                            <div>
                                <strong>Success!</strong> Added \${data.results?.newArticles || 0} new articles.
                            </div>
                        </div>
                    \`;
                    loadDashboard();
                } else {
                    resultDiv.innerHTML = \`
                        <div class="alert alert-error">
                            <i data-lucide="x-circle"></i>
                            <div><strong>Error:</strong> \${data.message}</div>
                        </div>
                    \`;
                }
                lucide.createIcons();

                setTimeout(() => resultDiv.innerHTML = '', 5000);
            } catch (error) {
                document.getElementById('actionResult').innerHTML = \`
                    <div class="alert alert-error">
                        <i data-lucide="x-circle"></i>
                        <div><strong>Error:</strong> \${error.message}</div>
                    </div>
                \`;
                lucide.createIcons();
            } finally {
                button.innerHTML = originalHTML;
                button.disabled = false;
                lucide.createIcons();
            }
        }

        async function bulkPull() {
            if (!confirm('This will fetch all articles from all sources. Continue?')) return;

            const button = event.target.closest('button');
            const originalHTML = button.innerHTML;
            button.innerHTML = '<span class="loading-spinner"></span> Pulling...';
            button.disabled = true;

            try {
                const response = await fetch('/api/admin/bulk-pull', { method: 'POST' });
                const data = await response.json();

                const resultDiv = document.getElementById('actionResult');
                resultDiv.innerHTML = \`
                    <div class="alert alert-success">
                        <i data-lucide="check-circle"></i>
                        <div><strong>Bulk pull completed!</strong> Check system logs for details.</div>
                    </div>
                \`;
                lucide.createIcons();

                setTimeout(() => resultDiv.innerHTML = '', 5000);
                loadDashboard();
            } catch (error) {
                document.getElementById('actionResult').innerHTML = \`
                    <div class="alert alert-error">
                        <i data-lucide="x-circle"></i>
                        <div><strong>Error:</strong> \${error.message}</div>
                    </div>
                \`;
                lucide.createIcons();
            } finally {
                button.innerHTML = originalHTML;
                button.disabled = false;
                lucide.createIcons();
            }
        }

        // RSS Sources
        async function loadSources() {
            try {
                const response = await fetch('/api/admin/sources');
                const data = await response.json();

                const tbody = document.querySelector('#sourcesTable tbody');

                if (data.sources && data.sources.length > 0) {
                    tbody.innerHTML = data.sources.map(source => \`
                        <tr>
                            <td><strong>\${source.name}</strong></td>
                            <td><code>\${truncate(source.url, 50)}</code></td>
                            <td>
                                <span class="badge \${source.enabled ? 'badge-active' : 'badge-inactive'}">
                                    \${source.enabled ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td>\${source.priority || '-'}</td>
                            <td>\${source.article_count || 0}</td>
                            <td>\${source.last_fetched_at ? formatDate(source.last_fetched_at) : 'Never'}</td>
                            <td>
                                <div class="table-actions">
                                    <button class="icon-btn" onclick="editSource(\${source.id})" title="Edit">
                                        <i data-lucide="edit"></i>
                                    </button>
                                    <button class="icon-btn" onclick="toggleSource(\${source.id}, \${source.enabled})" title="Toggle">
                                        <i data-lucide="\${source.enabled ? 'eye-off' : 'eye'}"></i>
                                    </button>
                                    <button class="icon-btn" onclick="deleteSource(\${source.id})" title="Delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    \`).join('');
                } else {
                    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #666;">No sources found</td></tr>';
                }

                lucide.createIcons();
            } catch (error) {
                console.error('Failed to load sources:', error);
            }
        }

        function addSource() {
            document.getElementById('sourceModalTitle').textContent = 'Add RSS Source';
            document.getElementById('sourceForm').reset();
            document.getElementById('sourceId').value = '';
            openModal('sourceModal');
        }

        async function editSource(id) {
            // TODO: Fetch source details and populate form
            console.log('Edit source:', id);
            alert('Edit functionality coming soon');
        }

        async function toggleSource(id, currentStatus) {
            // TODO: Implement toggle
            console.log('Toggle source:', id, currentStatus);
            alert('Toggle functionality coming soon');
        }

        async function deleteSource(id) {
            if (!confirm('Are you sure you want to delete this source?')) return;
            // TODO: Implement delete
            console.log('Delete source:', id);
            alert('Delete functionality coming soon');
        }

        // Articles
        async function loadArticles() {
            try {
                const response = await fetch('/api/feeds?limit=50');
                const data = await response.json();

                const tbody = document.querySelector('#articlesTable tbody');

                if (data.articles && data.articles.length > 0) {
                    tbody.innerHTML = data.articles.map(article => \`
                        <tr>
                            <td><strong>\${truncate(article.title, 60)}</strong></td>
                            <td>\${article.source || '-'}</td>
                            <td>\${article.author || '-'}</td>
                            <td>\${formatDate(article.published_at)}</td>
                            <td>\${article.view_count || 0}</td>
                            <td>\${article.like_count || 0}</td>
                            <td>
                                <div class="table-actions">
                                    <button class="icon-btn" onclick="viewArticle('\${article.id}')" title="View">
                                        <i data-lucide="eye"></i>
                                    </button>
                                    <button class="icon-btn" onclick="editArticle('\${article.id}')" title="Edit">
                                        <i data-lucide="edit"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    \`).join('');
                } else {
                    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #666;">No articles found</td></tr>';
                }

                lucide.createIcons();
            } catch (error) {
                console.error('Failed to load articles:', error);
            }
        }

        function viewArticle(id) {
            window.open(\`/api/article/\${id}\`, '_blank');
        }

        function editArticle(id) {
            alert('Edit article functionality coming soon');
        }

        function exportArticles() {
            alert('Export functionality coming soon');
        }

        // Authors
        async function loadAuthors() {
            try {
                const response = await fetch('/api/admin/authors');
                const data = await response.json();

                const tbody = document.querySelector('#authorsTable tbody');

                if (data.authors && data.authors.length > 0) {
                    tbody.innerHTML = data.authors.map(author => \`
                        <tr>
                            <td><strong>\${author.name}</strong></td>
                            <td>\${author.primary_outlet || '-'}</td>
                            <td>\${author.total_articles || 0}</td>
                            <td>\${(author.recognition_score * 100).toFixed(1)}%</td>
                            <td>
                                <div class="table-actions">
                                    <button class="icon-btn" onclick="viewAuthor('\${author.slug}')" title="View">
                                        <i data-lucide="eye"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    \`).join('');
                } else {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #666;">No authors found</td></tr>';
                }

                lucide.createIcons();
            } catch (error) {
                console.error('Failed to load authors:', error);
            }
        }

        function viewAuthor(slug) {
            window.open(\`/api/author/\${slug}\`, '_blank');
        }

        // Categories
        async function loadCategories() {
            try {
                const response = await fetch('/api/categories');
                const data = await response.json();

                const tbody = document.querySelector('#categoriesTable tbody');

                if (data.categories && data.categories.length > 0) {
                    tbody.innerHTML = data.categories.map(category => \`
                        <tr>
                            <td><strong>\${category.name}</strong></td>
                            <td><code>\${category.slug}</code></td>
                            <td>\${category.article_count || 0}</td>
                            <td>
                                <span class="badge \${category.enabled ? 'badge-active' : 'badge-inactive'}">
                                    \${category.enabled ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td>
                                <div class="table-actions">
                                    <button class="icon-btn" onclick="editCategory(\${category.id})" title="Edit">
                                        <i data-lucide="edit"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    \`).join('');
                } else {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #666;">No categories found</td></tr>';
                }

                lucide.createIcons();
            } catch (error) {
                console.error('Failed to load categories:', error);
            }
        }

        function addCategory() {
            alert('Add category functionality coming soon');
        }

        function editCategory(id) {
            alert('Edit category functionality coming soon');
        }

        // Analytics
        async function loadAnalytics() {
            const container = document.getElementById('analyticsContainer');
            container.innerHTML = '<div style="text-align: center; padding: 40px;"><span class="loading-spinner"></span> Loading analytics...</div>';

            try {
                const response = await fetch('/api/admin/analytics');
                const data = await response.json();

                container.innerHTML = \`
                    <pre>\${JSON.stringify(data, null, 2)}</pre>
                \`;
            } catch (error) {
                container.innerHTML = \`
                    <div class="alert alert-error">
                        <i data-lucide="x-circle"></i>
                        <div><strong>Error:</strong> Failed to load analytics</div>
                    </div>
                \`;
                lucide.createIcons();
            }
        }

        // System
        async function checkHealth() {
            const statusDiv = document.getElementById('healthStatus');
            statusDiv.innerHTML = '<div style="text-align: center; padding: 40px;"><span class="loading-spinner"></span> Checking system health...</div>';

            try {
                const response = await fetch('/api/health');
                const data = await response.json();

                const isHealthy = data.status === 'healthy';

                statusDiv.innerHTML = \`
                    <div class="alert \${isHealthy ? 'alert-success' : 'alert-error'}">
                        <i data-lucide="\${isHealthy ? 'check-circle' : 'x-circle'}"></i>
                        <div>
                            <strong>System Status: \${data.status.toUpperCase()}</strong>
                            <pre style="margin-top: 15px;">\${JSON.stringify(data, null, 2)}</pre>
                        </div>
                    </div>
                \`;

                lucide.createIcons();
            } catch (error) {
                statusDiv.innerHTML = \`
                    <div class="alert alert-error">
                        <i data-lucide="x-circle"></i>
                        <div><strong>Health check failed:</strong> \${error.message}</div>
                    </div>
                \`;
                lucide.createIcons();
            }
        }

        function viewLogs() {
            alert('Log viewing functionality coming soon');
        }

        function viewAPIEndpoints() {
            const statusDiv = document.getElementById('healthStatus');
            statusDiv.innerHTML = \`
                <div class="card" style="background: #0a0a0a; margin-top: 20px;">
                    <h4 style="margin-bottom: 15px;">Available API Endpoints</h4>

                    <strong>Public Endpoints:</strong>
                    <ul style="margin: 10px 0 20px 20px; color: #999;">
                        <li><code>GET /api/health</code> - System health check</li>
                        <li><code>GET /api/feeds</code> - Get articles</li>
                        <li><code>GET /api/categories</code> - Get categories</li>
                        <li><code>GET /api/news-bytes</code> - Articles with images</li>
                        <li><code>GET /api/search</code> - Search articles</li>
                        <li><code>GET /api/authors</code> - Get authors</li>
                        <li><code>GET /api/sources</code> - Get news sources</li>
                        <li><code>POST /api/refresh</code> - User-triggered refresh</li>
                    </ul>

                    <strong>Admin Endpoints:</strong>
                    <ul style="margin: 10px 0 20px 20px; color: #999;">
                        <li><code>GET /api/admin/stats</code> - Platform statistics</li>
                        <li><code>GET /api/admin/sources</code> - RSS sources with stats</li>
                        <li><code>GET /api/admin/authors</code> - Author profiles</li>
                        <li><code>GET /api/admin/analytics</code> - Analytics data</li>
                        <li><code>POST /api/refresh-rss</code> - Manual RSS refresh</li>
                        <li><code>POST /api/admin/bulk-pull</code> - Bulk article fetch</li>
                        <li><code>PUT /api/admin/rss-source/:id</code> - Update RSS source</li>
                    </ul>
                </div>
            \`;
        }

        // Modal management
        function openModal(modalId) {
            document.getElementById(modalId).classList.add('show');
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('show');
        }

        window.onclick = function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.classList.remove('show');
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

        function formatDate(isoString) {
            try {
                const date = new Date(isoString);
                return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch {
                return 'Invalid date';
            }
        }

        function truncate(str, length) {
            return str.length > length ? str.substring(0, length) + '...' : str;
        }
    </script>
</body>
</html>
  `;
}

export function getLoginHTML(): string {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login - Harare Metro</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #00A651 0%, #006633 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .login-container {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 420px;
            width: 100%;
        }
        h1 {
            font-family: Georgia, serif;
            color: #00A651;
            font-size: 32px;
            margin-bottom: 8px;
            text-align: center;
        }
        .subtitle {
            color: #666;
            text-align: center;
            margin-bottom: 32px;
            font-size: 14px;
        }
        .form-group { margin-bottom: 24px; }
        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
            font-size: 14px;
        }
        input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
            transition: all 0.2s;
            font-family: 'Inter', sans-serif;
        }
        input:focus {
            outline: none;
            border-color: #00A651;
            box-shadow: 0 0 0 3px rgba(0, 166, 81, 0.1);
        }
        button {
            width: 100%;
            padding: 14px;
            background: #00A651;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-family: 'Inter', sans-serif;
        }
        button:hover {
            background: #008f47;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 166, 81, 0.3);
        }
        button:disabled { background: #ccc; cursor: not-allowed; transform: none; }
        .error {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #991b1b;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
            display: none;
        }
        .error.show { display: block; }
        .info {
            background: #fef9c3;
            border: 1px solid #fde047;
            color: #854d0e;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .zimbabwe-flag-strip {
            position: fixed;
            top: 0;
            left: 0;
            width: 8px;
            height: 100vh;
            z-index: 1000;
            background: linear-gradient(to bottom, #00A651 0% 20%, #FDD116 20% 40%, #EF3340 40% 60%, #000000 60% 80%, #FFFFFF 80% 100%);
        }
    </style>
</head>
<body>
    <div class="zimbabwe-flag-strip"></div>
    <div class="login-container">
        <h1>Harare Metro</h1>
        <p class="subtitle">Admin Panel Login</p>
        <div class="info">
            <strong>Demo Credentials:</strong><br>
            Email: admin@hararemetro.co.zw<br>
            Password: admin123
        </div>
        <div class="error" id="error"></div>
        <form id="loginForm">
            <div class="form-group">
                <label for="email">Email Address</label>
                <input type="email" id="email" name="email" required placeholder="admin@hararemetro.co.zw" autocomplete="email">
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required placeholder="Enter your password" autocomplete="current-password">
            </div>
            <button type="submit" id="submitBtn">Sign In</button>
        </form>
    </div>
    <script>
        const form = document.getElementById('loginForm');
        const errorDiv = document.getElementById('error');
        const submitBtn = document.getElementById('submitBtn');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorDiv.classList.remove('show');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing in...';
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            try {
                const response = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });
                const data = await response.json();
                if (response.ok) {
                    document.cookie = \`admin_session=\${data.token}; path=/; max-age=\${7 * 24 * 60 * 60}; secure; samesite=strict\`;
                    window.location.href = '/admin';
                } else {
                    errorDiv.textContent = data.error || 'Login failed. Please check your credentials.';
                    errorDiv.classList.add('show');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Sign In';
                }
            } catch (error) {
                errorDiv.textContent = 'Network error. Please try again.';
                errorDiv.classList.add('show');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
            }
        });
    </script>
</body>
</html>`;
  return html;
}

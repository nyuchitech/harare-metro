export function getAdminHTML(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mukoko News API</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --zw-green: #00A651;
            --zw-yellow: #FDD116;
            --zw-red: #EF3340;
            --zw-black: #000000;
            --zw-white: #FFFFFF;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            min-height: 100vh;
            color: #e8e8e8;
            padding: 40px 20px;
        }

        .container {
            max-width: 1000px;
            margin: 0 auto;
        }

        .header {
            text-align: center;
            margin-bottom: 60px;
            padding: 40px 20px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .logo {
            font-size: 48px;
            font-weight: 700;
            background: linear-gradient(135deg, var(--zw-green) 0%, var(--zw-yellow) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 12px;
        }

        .tagline {
            font-size: 18px;
            color: #9ca3af;
            margin-bottom: 8px;
        }

        .status {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: rgba(0, 166, 81, 0.1);
            border: 1px solid var(--zw-green);
            border-radius: 20px;
            color: var(--zw-green);
            font-size: 14px;
            font-weight: 600;
            margin-top: 20px;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            background: var(--zw-green);
            border-radius: 50%;
            animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .section {
            background: rgba(255, 255, 255, 0.03);
            border-radius: 16px;
            padding: 32px;
            margin-bottom: 24px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .section-title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 24px;
            color: #ffffff;
        }

        .endpoint {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 16px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            transition: all 0.3s ease;
        }

        .endpoint:hover {
            border-color: var(--zw-green);
            transform: translateY(-2px);
        }

        .endpoint-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
        }

        .method {
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
        }

        .method.get {
            background: rgba(0, 166, 81, 0.2);
            color: var(--zw-green);
        }

        .method.post {
            background: rgba(253, 209, 22, 0.2);
            color: var(--zw-yellow);
        }

        .path {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #60a5fa;
        }

        .description {
            color: #9ca3af;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 12px;
        }

        .try-it {
            display: inline-block;
            padding: 8px 16px;
            background: var(--zw-green);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .try-it:hover {
            background: #008f45;
            transform: translateY(-1px);
        }

        .footer {
            text-align: center;
            margin-top: 60px;
            padding: 24px;
            color: #6b7280;
            font-size: 14px;
        }

        .footer a {
            color: var(--zw-green);
            text-decoration: none;
        }

        .footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Mukoko News API</div>
            <div class="tagline">Zimbabwe's Modern News Platform Backend</div>
            <div class="status">
                <span class="status-dot"></span>
                All Systems Operational
            </div>
        </div>

        <div class="section">
            <div class="section-title">📰 News & Articles</div>

            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/feeds</span>
                </div>
                <div class="description">
                    Get paginated news feed. Supports filtering by category.
                    <br>Query params: limit, offset, category
                </div>
                <a href="/api/feeds?limit=5" class="try-it" target="_blank">Try it →</a>
            </div>

            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/categories</span>
                </div>
                <div class="description">
                    Get all available news categories (Politics, Economy, Sports, etc.)
                </div>
                <a href="/api/categories" class="try-it" target="_blank">Try it →</a>
            </div>

            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/article/by-source-slug</span>
                </div>
                <div class="description">
                    Get single article by source and slug.
                    <br>Query params: source, slug
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">💚 User Engagement</div>

            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method post">POST</span>
                    <span class="path">/api/articles/:id/like</span>
                </div>
                <div class="description">
                    Like or unlike an article (requires authentication)
                </div>
            </div>

            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method post">POST</span>
                    <span class="path">/api/articles/:id/save</span>
                </div>
                <div class="description">
                    Bookmark or unbookmark an article (requires authentication)
                </div>
            </div>

            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method post">POST</span>
                    <span class="path">/api/articles/:id/view</span>
                </div>
                <div class="description">
                    Track article view for analytics
                </div>
            </div>

            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/articles/:id/comments</span>
                </div>
                <div class="description">
                    Get comments for an article
                </div>
            </div>

            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method post">POST</span>
                    <span class="path">/api/articles/:id/comment</span>
                </div>
                <div class="description">
                    Add a comment to an article (requires authentication)
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">🔐 Authentication</div>

            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method post">POST</span>
                    <span class="path">/api/auth/login</span>
                </div>
                <div class="description">
                    Login with email and password. Returns session token.
                </div>
            </div>

            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method post">POST</span>
                    <span class="path">/api/auth/register</span>
                </div>
                <div class="description">
                    Register new user account. Creates session automatically.
                </div>
            </div>

            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method post">POST</span>
                    <span class="path">/api/auth/logout</span>
                </div>
                <div class="description">
                    Logout and invalidate session token.
                </div>
            </div>

            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/auth/session</span>
                </div>
                <div class="description">
                    Get current session and user info.
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">👤 User Profile</div>

            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/user/me/preferences</span>
                </div>
                <div class="description">
                    Get user preferences and settings (requires authentication)
                </div>
            </div>

            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method post">POST</span>
                    <span class="path">/api/user/me/preferences</span>
                </div>
                <div class="description">
                    Update user preferences (requires authentication)
                </div>
            </div>

            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method post">POST</span>
                    <span class="path">/api/user/me/follows</span>
                </div>
                <div class="description">
                    Follow a news source or journalist (requires authentication)
                </div>
            </div>

            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/health</span>
                </div>
                <div class="description">
                    Health check endpoint. Returns service status.
                </div>
                <a href="/api/health" class="try-it" target="_blank">Try it →</a>
            </div>
        </div>

        <div class="footer">
            <p>Mukoko News Backend API • Powered by Cloudflare Workers</p>
            <p>
                <a href="https://news.mukoko.com" target="_blank">Visit News Site</a>
            </p>
        </div>
    </div>
</body>
</html>
`;
}

export function getLoginHTML(): string {
  return getAdminHTML(); // Same simple UI
}

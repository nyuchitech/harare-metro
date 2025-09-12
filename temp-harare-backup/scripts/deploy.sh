#!/bin/bash
echo "🚀 Deploying Harare Metro..."

echo "📦 Building frontend and worker..."
npm run build

# Verify build assets exist
if [ ! -d "dist" ]; then
    echo "❌ Error: dist/ directory not found after build"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "❌ Error: index.html not found in dist/ directory"
    exit 1
fi

echo "📁 Found $(ls -1 dist/ | wc -l | tr -d ' ') files in dist/ directory"

echo "☁️ Deploying with static assets..."
npx wrangler deploy --assets dist

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo "📊 Static assets uploaded to __STATIC_CONTENT KV namespace"
    echo "🌐 Site should be live at: https://www.hararemetro.co.zw"
    echo ""
    echo "🔍 Verifying deployment..."
    sleep 3
    
    # Test if site is responding
    if curl -s -I https://www.hararemetro.co.zw | head -1 | grep -q "200 OK"; then
        echo "✅ Site is responding correctly"
    else
        echo "⚠️  Site may still be propagating (this is normal)"
    fi
    
    echo ""
    echo "🔧 Next: Initialize KV configuration"
    echo "Run: ./scripts/configure.sh"
else
    echo "❌ Deployment failed"
    exit 1
fi

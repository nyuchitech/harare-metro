#!/bin/bash

echo "🏗️  Building Harare Metro for production..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist

# Build the React app
echo "⚛️  Building React application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ React build failed"
    exit 1
fi

echo "✅ Build completed successfully!"
echo ""
echo "📦 Build output:"
echo "   Frontend: dist/assets/"
echo "   Worker: worker/index.js"
echo ""
echo "🚀 Ready to deploy with: npm run deploy"

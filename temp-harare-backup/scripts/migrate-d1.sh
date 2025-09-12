#!/bin/bash

# Harare Metro D1 Migration Script
# This script migrates from KV storage to D1 database

echo "🗄️  Harare Metro - D1 Database Migration"
echo "========================================"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: Wrangler CLI is not installed"
    echo "Please install with: npm install -g wrangler"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "wrangler.toml" ]; then
    echo "❌ Error: wrangler.toml not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "📋 Step 1: Checking D1 database configuration..."

# Check if D1 database exists
DB_NAME="hararemetro_articles"
DB_ID="70d94fe9-4a78-4926-927b-e88e37141a54"

echo "   Database Name: $DB_NAME"
echo "   Database ID: $DB_ID"

# Create D1 database if it doesn't exist (this will fail if it already exists, which is fine)
echo "📊 Step 2: Ensuring D1 database exists..."
wrangler d1 create $DB_NAME 2>/dev/null || echo "   Database already exists (continuing...)"

echo "🔧 Step 3: Running schema migration..."
# Run the initial schema migration
wrangler d1 execute $DB_NAME --file=./worker/database/migrations/001_init_schema.sql

if [ $? -eq 0 ]; then
    echo "   ✅ Schema migration completed successfully"
else
    echo "   ❌ Schema migration failed"
    exit 1
fi

echo "📄 Step 4: Seeding initial data..."
# Seed the database with initial data
wrangler d1 execute $DB_NAME --file=./worker/database/migrations/002_seed_initial_data.sql

if [ $? -eq 0 ]; then
    echo "   ✅ Data seeding completed successfully"
else
    echo "   ❌ Data seeding failed"
    exit 1
fi

echo "🔄 Step 5: Backing up current worker..."
# Backup the current index.js
if [ -f "worker/index.js" ]; then
    cp worker/index.js worker/index-kv-backup.js
    echo "   ✅ Current worker backed up to worker/index-kv-backup.js"
else
    echo "   ⚠️  No existing worker/index.js found"
fi

echo "🚀 Step 6: Switching to D1-powered worker..."
# Replace the worker with the D1 version
cp worker/index-d1.js worker/index.js

if [ $? -eq 0 ]; then
    echo "   ✅ Worker updated to use D1 database"
else
    echo "   ❌ Failed to update worker"
    exit 1
fi

echo "📊 Step 7: Verifying database setup..."
# Query the database to verify it's working
echo "   Checking system configuration..."
wrangler d1 execute $DB_NAME --command="SELECT COUNT(*) as config_count FROM system_config;"

echo "   Checking RSS sources..."
wrangler d1 execute $DB_NAME --command="SELECT COUNT(*) as sources_count FROM rss_sources WHERE enabled = 1;"

echo "   Checking categories..."
wrangler d1 execute $DB_NAME --command="SELECT COUNT(*) as categories_count FROM categories WHERE enabled = 1;"

echo "🧪 Step 8: Optional - Deploy to preview environment..."
read -p "Do you want to deploy to preview environment for testing? (y/N): " deploy_preview

if [[ $deploy_preview =~ ^[Yy]$ ]]; then
    echo "   Deploying to preview..."
    wrangler deploy --env preview
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Preview deployment successful"
        echo "   🌐 Test your D1-powered app at your preview URL"
    else
        echo "   ❌ Preview deployment failed"
    fi
else
    echo "   ⏭️  Skipping preview deployment"
fi

echo ""
echo "🎉 D1 Migration Complete!"
echo "======================="
echo ""
echo "✅ What was completed:"
echo "   • D1 database schema created"
echo "   • Initial configuration and RSS sources loaded"
echo "   • Worker updated to use D1 instead of KV storage"
echo "   • Original KV-based worker backed up"
echo ""
echo "📋 Next steps:"
echo "   1. Test your app locally with: npm run dev"
echo "   2. Deploy to production when ready: wrangler deploy"
echo "   3. Monitor D1 database usage in Cloudflare dashboard"
echo ""
echo "🗄️  Benefits of D1 over KV:"
echo "   • Better scalability for growing user base"
echo "   • SQL queries for complex data operations"
echo "   • Consistent ACID transactions"
echo "   • Easier data management and backups"
echo ""
echo "⚠️  Important notes:"
echo "   • KV namespaces can be deleted after successful migration"
echo "   • User data remains in Supabase (unchanged)"
echo "   • Analytics continue using Analytics Engine"
echo "   • Images continue using Cloudflare Images"
echo ""
echo "📚 Database management:"
echo "   • Query database: wrangler d1 execute $DB_NAME --command=\"SQL\""
echo "   • Backup database: wrangler d1 export $DB_NAME --output backup.sql"
echo "   • View tables: wrangler d1 execute $DB_NAME --command=\".tables\""
echo ""

# Final status check
echo "📊 Final Status Check:"
echo "=================="

# Check if deployment looks healthy
if wrangler d1 execute $DB_NAME --command="SELECT COUNT(*) FROM articles;" 2>/dev/null | grep -q "0"; then
    echo "✅ D1 database is accessible and ready"
    echo "📝 Note: No articles yet - they will be populated when RSS feeds are processed"
else
    echo "⚠️  D1 database accessible but may need RSS feed refresh"
fi

echo ""
echo "🚀 Your Harare Metro app is now powered by Cloudflare D1!"
echo "Happy news aggregating! 📰🇿🇼"
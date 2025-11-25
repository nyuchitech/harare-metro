#!/bin/bash

# ============================================================================
# Deploy Consolidated Schema to Cloudflare D1
# ============================================================================
# This script deploys the consolidated database schema to Cloudflare D1
#
# Usage:
#   ./database/deploy-schema.sh [options]
#
# Options:
#   --local      Deploy to local D1 (for testing)
#   --remote     Deploy to remote D1 (production)
#   --verify     Verify deployment after applying schema
#   --seed       Seed initial data after schema deployment
#   --help       Show this help message
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
LOCAL=false
REMOTE=false
VERIFY=false
SEED=false

# Database info
DB_NAME="hararemetro_articles"
DB_ID="70d94fe9-4a78-4926-927b-e88e37141a54"
SCHEMA_FILE="./database/consolidated_schema.sql"
SEED_FILE="./database/migrations/002_seed_initial_data.sql"

# Functions
print_header() {
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

show_help() {
    echo "Usage: ./database/deploy-schema.sh [options]"
    echo ""
    echo "Options:"
    echo "  --local      Deploy to local D1 (for testing)"
    echo "  --remote     Deploy to remote D1 (production)"
    echo "  --verify     Verify deployment after applying schema"
    echo "  --seed       Seed initial data after schema deployment"
    echo "  --help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  # Test locally first"
    echo "  ./database/deploy-schema.sh --local --verify"
    echo ""
    echo "  # Deploy to production with seed data"
    echo "  ./database/deploy-schema.sh --remote --seed --verify"
    echo ""
    echo "  # Deploy to production without seed (existing data)"
    echo "  ./database/deploy-schema.sh --remote --verify"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --local)
            LOCAL=true
            shift
            ;;
        --remote)
            REMOTE=true
            shift
            ;;
        --verify)
            VERIFY=true
            shift
            ;;
        --seed)
            SEED=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate options
if [ "$LOCAL" = false ] && [ "$REMOTE" = false ]; then
    print_error "Must specify either --local or --remote"
    show_help
    exit 1
fi

if [ "$LOCAL" = true ] && [ "$REMOTE" = true ]; then
    print_error "Cannot specify both --local and --remote"
    show_help
    exit 1
fi

# Determine target
if [ "$LOCAL" = true ]; then
    TARGET="--local"
    TARGET_NAME="LOCAL"
else
    TARGET="--remote"
    TARGET_NAME="REMOTE (PRODUCTION)"
fi

# Confirm production deployment
if [ "$REMOTE" = true ]; then
    print_warning "You are about to deploy to PRODUCTION D1 database!"
    print_info "Database: $DB_NAME"
    print_info "Database ID: $DB_ID"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Deployment cancelled."
        exit 0
    fi
fi

# Start deployment
print_header "Deploying Consolidated Schema to $TARGET_NAME"

# Check if schema file exists
if [ ! -f "$SCHEMA_FILE" ]; then
    print_error "Schema file not found: $SCHEMA_FILE"
    exit 1
fi

print_info "Schema file: $SCHEMA_FILE"
print_info "Target: $TARGET_NAME"
echo ""

# Apply schema
print_info "Applying consolidated schema..."
if npx wrangler d1 execute "$DB_NAME" --file="$SCHEMA_FILE" $TARGET; then
    print_success "Schema applied successfully"
else
    print_error "Failed to apply schema"
    exit 1
fi

echo ""

# Seed data if requested
if [ "$SEED" = true ]; then
    if [ -f "$SEED_FILE" ]; then
        print_info "Seeding initial data..."
        if npx wrangler d1 execute "$DB_NAME" --file="$SEED_FILE" $TARGET; then
            print_success "Initial data seeded successfully"
        else
            print_warning "Failed to seed initial data (may already exist)"
        fi
        echo ""
    else
        print_warning "Seed file not found: $SEED_FILE"
        echo ""
    fi
fi

# Verify deployment if requested
if [ "$VERIFY" = true ]; then
    print_header "Verifying Deployment"

    # Count tables
    print_info "Counting tables..."
    TABLE_COUNT=$(npx wrangler d1 execute "$DB_NAME" $TARGET --command="SELECT COUNT(*) as count FROM sqlite_master WHERE type='table';" --json | grep -o '"count":[0-9]*' | grep -o '[0-9]*')
    print_success "Tables found: $TABLE_COUNT (expected: 40)"
    echo ""

    # Count indexes
    print_info "Counting indexes..."
    INDEX_COUNT=$(npx wrangler d1 execute "$DB_NAME" $TARGET --command="SELECT COUNT(*) as count FROM sqlite_master WHERE type='index';" --json | grep -o '"count":[0-9]*' | grep -o '[0-9]*')
    print_success "Indexes found: $INDEX_COUNT (expected: ~89)"
    echo ""

    # Count triggers
    print_info "Counting triggers..."
    TRIGGER_COUNT=$(npx wrangler d1 execute "$DB_NAME" $TARGET --command="SELECT COUNT(*) as count FROM sqlite_master WHERE type='trigger';" --json | grep -o '"count":[0-9]*' | grep -o '[0-9]*')
    print_success "Triggers found: $TRIGGER_COUNT (expected: 29)"
    echo ""

    # List critical tables
    print_info "Verifying critical tables..."
    CRITICAL_TABLES=("users" "articles" "categories" "news_sources" "user_likes" "user_bookmarks" "article_comments")

    for table in "${CRITICAL_TABLES[@]}"; do
        if npx wrangler d1 execute "$DB_NAME" $TARGET --command="SELECT name FROM sqlite_master WHERE type='table' AND name='$table';" --json | grep -q "\"name\":\"$table\""; then
            print_success "Table exists: $table"
        else
            print_error "Table missing: $table"
        fi
    done

    echo ""

    # Check for data
    print_info "Checking for data..."

    ARTICLE_COUNT=$(npx wrangler d1 execute "$DB_NAME" $TARGET --command="SELECT COUNT(*) as count FROM articles;" --json 2>/dev/null | grep -o '"count":[0-9]*' | grep -o '[0-9]*' || echo "0")
    print_info "Articles: $ARTICLE_COUNT"

    USER_COUNT=$(npx wrangler d1 execute "$DB_NAME" $TARGET --command="SELECT COUNT(*) as count FROM users;" --json 2>/dev/null | grep -o '"count":[0-9]*' | grep -o '[0-9]*' || echo "0")
    print_info "Users: $USER_COUNT"

    CATEGORY_COUNT=$(npx wrangler d1 execute "$DB_NAME" $TARGET --command="SELECT COUNT(*) as count FROM categories;" --json 2>/dev/null | grep -o '"count":[0-9]*' | grep -o '[0-9]*' || echo "0")
    print_info "Categories: $CATEGORY_COUNT"

    SOURCE_COUNT=$(npx wrangler d1 execute "$DB_NAME" $TARGET --command="SELECT COUNT(*) as count FROM news_sources;" --json 2>/dev/null | grep -o '"count":[0-9]*' | grep -o '[0-9]*' || echo "0")
    print_info "News Sources: $SOURCE_COUNT"

    echo ""
fi

# Summary
print_header "Deployment Complete"
print_success "Consolidated schema deployed to $TARGET_NAME"

if [ "$VERIFY" = true ]; then
    print_success "Verification complete"
fi

if [ "$SEED" = true ]; then
    print_success "Initial data seeded"
fi

echo ""
print_info "Next steps:"

if [ "$LOCAL" = true ]; then
    echo "  1. Test queries locally: npx wrangler d1 execute $DB_NAME --local --command=\"SELECT * FROM articles LIMIT 5;\""
    echo "  2. Start backend locally: cd backend && npx wrangler dev --remote"
    echo "  3. Test mobile app: cd mobile && npx expo start"
    echo "  4. If everything works, deploy to production: ./database/deploy-schema.sh --remote --verify"
else
    echo "  1. Deploy frontend worker: npm run deploy"
    echo "  2. Deploy backend worker: cd backend && npm run deploy"
    echo "  3. Trigger RSS refresh: curl -X POST https://admin.hararemetro.co.zw/api/refresh-rss"
    echo "  4. Test mobile app: cd mobile && npx expo start"
    echo "  5. Monitor Cloudflare Workers dashboard for errors"
fi

echo ""
print_success "Done!"

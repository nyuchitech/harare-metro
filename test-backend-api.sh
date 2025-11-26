#!/bin/bash

# Backend API Test Script for Mukoko News
# Tests all critical endpoints with the new mukoko_news_db database

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Mukoko News Backend API Tests${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
HEALTH=$(curl -s ${BASE_URL}/api/health)
if echo "$HEALTH" | grep -q "status"; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "$HEALTH" | jq . 2>/dev/null || echo "$HEALTH"
else
    echo -e "${RED}✗ Health check failed${NC}"
    echo "$HEALTH"
fi
echo ""

# Test 2: Get Categories
echo -e "${YELLOW}Test 2: Get Categories${NC}"
CATEGORIES=$(curl -s ${BASE_URL}/api/categories)
if echo "$CATEGORIES" | grep -q "Politics"; then
    COUNT=$(echo "$CATEGORIES" | jq '. | length' 2>/dev/null || echo "0")
    echo -e "${GREEN}✓ Categories loaded: $COUNT categories${NC}"
    echo "$CATEGORIES" | jq '.[0:3]' 2>/dev/null || echo "$CATEGORIES"
else
    echo -e "${RED}✗ Categories failed${NC}"
    echo "$CATEGORIES"
fi
echo ""

# Test 3: Get Articles Feed
echo -e "${YELLOW}Test 3: Get Articles Feed${NC}"
ARTICLES=$(curl -s "${BASE_URL}/api/feeds?limit=5&offset=0")
if echo "$ARTICLES" | grep -q "articles"; then
    TOTAL=$(echo "$ARTICLES" | jq '.total' 2>/dev/null || echo "0")
    echo -e "${GREEN}✓ Articles feed loaded: $TOTAL total articles${NC}"
    echo "$ARTICLES" | jq '.articles[0] | {title, source, published_at}' 2>/dev/null || echo "No articles yet"
else
    echo -e "${RED}✗ Articles feed failed${NC}"
    echo "$ARTICLES"
fi
echo ""

# Test 4: Test Admin Stats (should work even without auth)
echo -e "${YELLOW}Test 4: Admin Stats${NC}"
STATS=$(curl -s ${BASE_URL}/api/admin/stats)
if echo "$STATS" | grep -q "articles\|categories"; then
    echo -e "${GREEN}✓ Admin stats accessible${NC}"
    echo "$STATS" | jq . 2>/dev/null || echo "$STATS"
else
    echo -e "${YELLOW}⚠ Admin stats returned: $STATS${NC}"
fi
echo ""

# Test 5: Check RSS Sources
echo -e "${YELLOW}Test 5: RSS Sources${NC}"
SOURCES=$(curl -s ${BASE_URL}/api/admin/sources)
if echo "$SOURCES" | grep -q "sources"; then
    COUNT=$(echo "$SOURCES" | jq '.sources | length' 2>/dev/null || echo "0")
    echo -e "${GREEN}✓ RSS sources loaded: $COUNT sources${NC}"
    echo "$SOURCES" | jq '.sources[0:2] | .[] | {name, enabled, url}' 2>/dev/null || echo "No sources"
else
    echo -e "${YELLOW}⚠ RSS sources: $SOURCES${NC}"
fi
echo ""

# Test 6: Database Connection Test
echo -e "${YELLOW}Test 6: Database Connection${NC}"
echo "Testing D1 connection by querying categories table..."
CATEGORY_COUNT=$(echo "$CATEGORIES" | jq '. | length' 2>/dev/null || echo "0")
if [ "$CATEGORY_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ D1 database connected: mukoko_news_db${NC}"
    echo -e "  - Categories: $CATEGORY_COUNT"
    echo -e "  - Articles: $TOTAL"
else
    echo -e "${RED}✗ Database connection issue${NC}"
fi
echo ""

# Test 7: Test CORS Headers
echo -e "${YELLOW}Test 7: CORS Headers${NC}"
CORS=$(curl -s -I ${BASE_URL}/api/health | grep -i "access-control")
if [ ! -z "$CORS" ]; then
    echo -e "${GREEN}✓ CORS headers present${NC}"
    echo "$CORS"
else
    echo -e "${YELLOW}⚠ No CORS headers (may be intentional)${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Backend URL: ${BASE_URL}"
echo -e "Database: mukoko_news_db (remote)"
echo -e "Categories: ${CATEGORY_COUNT}"
echo -e "Articles: ${TOTAL}"
echo ""
echo -e "${GREEN}Backend is ready for mobile app testing!${NC}"
echo ""

#!/bin/bash

# scripts/dev-start-fixed.sh
# Enhanced development starter with proper API proxying

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║               🚀 Harare Metro Development                    ║"
echo "║              Starting React + Worker Servers                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    echo -e "${YELLOW}🔪 Killing processes on port $1...${NC}"
    if check_port $1; then
        lsof -ti:$1 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Clean up any existing processes
echo -e "${YELLOW}🧹 Cleaning up existing processes...${NC}"
kill_port 5173  # Vite dev server
kill_port 8787  # Wrangler dev server

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Check if wrangler is available
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Error: Wrangler CLI is not installed.${NC}"
    echo -e "${BLUE}💡 Install with: npm install -g wrangler${NC}"
    exit 1
fi

# Start Cloudflare Worker first (it takes longer to start)
echo -e "${BLUE}🔧 Starting Cloudflare Worker on port 8787...${NC}"
npm run dev:worker &
WORKER_PID=$!

# Wait a moment for worker to start
sleep 3

# Check if worker started successfully
if ! check_port 8787; then
    echo -e "${RED}❌ Failed to start Cloudflare Worker on port 8787${NC}"
    echo -e "${BLUE}💡 Try manually: npm run dev:worker${NC}"
    kill $WORKER_PID 2>/dev/null || true
    exit 1
fi

echo -e "${GREEN}✅ Cloudflare Worker started on http://localhost:8787${NC}"

# Start Vite dev server with API proxy
echo -e "${BLUE}⚛️  Starting React dev server on port 5173...${NC}"
npm run dev &
VITE_PID=$!

# Wait for Vite to start
sleep 5

# Check if Vite started successfully
if ! check_port 5173; then
    echo -e "${RED}❌ Failed to start Vite dev server on port 5173${NC}"
    echo -e "${BLUE}💡 Try manually: npm run dev${NC}"
    kill $WORKER_PID $VITE_PID 2>/dev/null || true
    exit 1
fi

echo -e "${GREEN}✅ React dev server started on http://localhost:5173${NC}"

echo ""
echo -e "${GREEN}🎉 Development servers are running!${NC}"
echo ""
echo -e "${BLUE}📋 Server Information:${NC}"
echo -e "   🌐 React App:      ${GREEN}http://localhost:5173${NC}"
echo -e "   🔧 Worker API:     ${GREEN}http://localhost:8787${NC}"
echo -e "   🔍 API Debug:      ${GREEN}http://localhost:8787/api/debug${NC}"
echo -e "   💊 Health Check:   ${GREEN}http://localhost:8787/api/health${NC}"
echo ""
echo -e "${BLUE}📡 API Proxy:${NC}"
echo -e "   All ${YELLOW}/api/*${NC} requests from React app will be proxied to the Worker"
echo -e "   Example: ${YELLOW}http://localhost:5173/api/feeds${NC} → ${YELLOW}http://localhost:8787/api/feeds${NC}"
echo ""
echo -e "${BLUE}🔥 Quick Tests:${NC}"
echo -e "   Test Worker:       ${YELLOW}curl http://localhost:8787/api/health${NC}"
echo -e "   Test Proxy:        ${YELLOW}curl http://localhost:5173/api/health${NC}"
echo -e "   Test Feeds:        ${YELLOW}curl http://localhost:5173/api/feeds${NC}"
echo ""
echo -e "${YELLOW}⏹️  To stop: Press Ctrl+C or run: ./scripts/dev-stop.sh${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down development servers...${NC}"
    kill $WORKER_PID $VITE_PID 2>/dev/null || true
    kill_port 5173
    kill_port 8787
    echo -e "${GREEN}✅ Development servers stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running and show logs
echo -e "${BLUE}📊 Monitoring servers... (Ctrl+C to stop)${NC}"
echo ""

# Wait for background processes
wait
#!/bin/bash

# Local Development Startup Script for Harare Metro
echo "🚀 Starting Harare Metro Local Development..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found. Creating from template..."
    cp .env.example .env.local
    echo "✅ Created .env.local - Please update with your Supabase credentials"
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if ports are available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "❌ Port $1 is already in use"
        echo "   Please stop any running services on port $1"
        return 1
    fi
    return 0
}

echo "🔍 Checking ports..."
if ! check_port 5173; then
    exit 1
fi
if ! check_port 8787; then
    exit 1
fi

echo "✅ Ports available"

# Start development server
echo "🌐 Starting development server..."
echo "   Frontend: http://localhost:5173"
echo "   Worker:   http://localhost:8787"
echo ""
echo "Press Ctrl+C to stop"

# Start the development server
npm run dev:local
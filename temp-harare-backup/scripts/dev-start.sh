#!/bin/bash

echo "🚀 Starting Harare Metro development servers..."

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
        echo "Port $port is already in use"
        return 1
    fi
    return 0
}

# Kill any existing processes on our ports
echo "Cleaning up existing processes..."
pkill -f "vite" 2>/dev/null || true
pkill -f "wrangler dev" 2>/dev/null || true

# Wait a moment for processes to die
sleep 2

# Check ports
if ! check_port 5173; then
    echo "❌ Port 5173 (Vite) is still in use. Please kill the process manually."
    exit 1
fi

if ! check_port 8787; then
    echo "❌ Port 8787 (Wrangler) is still in use. Please kill the process manually."
    exit 1
fi

echo "✅ Ports are available"

# Function to open URLs based on OS
open_urls() {
    sleep 5  # Wait for servers to start
    
    if command -v open >/dev/null 2>&1; then
        # macOS
        open http://localhost:5173
    elif command -v xdg-open >/dev/null 2>&1; then
        # Linux
        xdg-open http://localhost:5173
    elif command -v start >/dev/null 2>&1; then
        # Windows
        start http://localhost:5173
    fi
}

# Start development servers
if command -v gnome-terminal >/dev/null 2>&1; then
    # Linux with GNOME Terminal
    gnome-terminal --tab --title="Vite Dev Server" -- bash -c "echo 'Starting Vite dev server...'; npm run dev; exec bash"
    gnome-terminal --tab --title="Wrangler Dev Server" -- bash -c "echo 'Starting Wrangler dev server...'; npm run dev:worker; exec bash"
    open_urls &
    
elif command -v osascript >/dev/null 2>&1; then
    # macOS Terminal
    osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && echo 'Starting Vite dev server...' && npm run dev\""
    osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && echo 'Starting Wrangler dev server...' && npm run dev:worker\""
    open_urls &
    
elif command -v cmd.exe >/dev/null 2>&1; then
    # Windows
    cmd.exe /c start "Vite Dev Server" cmd /k "echo Starting Vite dev server... && npm run dev"
    cmd.exe /c start "Wrangler Dev Server" cmd /k "echo Starting Wrangler dev server... && npm run dev:worker"
    open_urls &
    
else
    echo "🔧 Manual setup required:"
    echo ""
    echo "Please run these commands in separate terminals:"
    echo "📋 Terminal 1: npm run dev"
    echo "📋 Terminal 2: npm run dev:worker"
    echo ""
    echo "Then open: http://localhost:5173"
    echo ""
    echo "Press any key to continue..."
    read -n 1
fi

echo ""
echo "🌐 Development URLs:"
echo "   React App: http://localhost:5173"
echo "   Worker API: http://localhost:8787"
echo "   API Health: http://localhost:8787/api/health"
echo ""
echo "💡 Tips:"
echo "   - The React app will proxy /api requests to the Worker"
echo "   - Hot reload is enabled for both frontend and backend"
echo "   - Check the terminals for any error messages"
echo ""

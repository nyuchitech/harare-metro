#!/bin/bash
echo "🚀 Starting Harare Metro development..."

if ! command -v concurrently &> /dev/null; then
    echo "Installing concurrently..."
    npm install -g concurrently
fi

lsof -ti:5173 | xargs kill -9 2>/dev/null || true
lsof -ti:8787 | xargs kill -9 2>/dev/null || true

echo "Starting development servers..."
concurrently \
  --names "VITE,WORKER" \
  --prefix-colors "cyan,magenta" \
  "npm run dev" \
  "npx wrangler dev"

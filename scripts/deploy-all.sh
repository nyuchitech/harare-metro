#!/bin/bash

# Harare Metro - Deploy All Script
# Deploys both frontend and backend with proper validation

set -e  # Exit on any error

echo "🚀 Harare Metro - Full Deployment Script"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory (monorepo structure)
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the harare-metro monorepo root directory"
    print_error "Expected monorepo structure:"
    print_error "  harare-metro/ (frontend - root)"
    print_error "  harare-metro/backend/ (backend)"
    exit 1
fi

# Function to deploy backend
deploy_backend() {
    print_status "Starting backend deployment..."
    
    cd backend
    
    print_status "Installing backend dependencies..."
    npm install
    
    print_status "Running backend tests..."
    npm run test
    
    print_status "Deploying backend to admin.hararemetro.co.zw..."
    npm run deploy
    
    print_success "Backend deployed successfully!"
    
    cd ..
}

# Function to deploy frontend
deploy_frontend() {
    print_status "Starting frontend deployment..."
    
    print_status "Installing frontend dependencies..."
    npm install
    
    print_status "Running frontend tests..."
    npm run test
    
    print_status "Deploying frontend to www.hararemetro.co.zw..."
    npm run deploy
    
    print_success "Frontend deployed successfully!"
}

# Function to test deployments
test_deployments() {
    print_status "Testing deployments..."
    
    print_status "Testing backend health..."
    if curl -f -s "https://admin.hararemetro.co.zw/api/health" > /dev/null; then
        print_success "Backend is responding!"
    else
        print_warning "Backend health check failed - may take a moment to be ready"
    fi
    
    print_status "Testing frontend..."
    if curl -f -s "https://www.hararemetro.co.zw" > /dev/null; then
        print_success "Frontend is responding!"
    else
        print_warning "Frontend health check failed - may take a moment to be ready"
    fi
}

# Main deployment flow
main() {
    print_status "Starting full deployment process..."
    
    # Deploy backend first (frontend depends on it)
    deploy_backend
    
    # Wait a moment for backend to be ready
    print_status "Waiting for backend to stabilize..."
    sleep 10
    
    # Deploy frontend
    deploy_frontend
    
    # Test both deployments
    test_deployments
    
    print_success "🎉 Full deployment completed!"
    echo ""
    echo "🌍 Your applications are now live:"
    echo "   Frontend: https://www.hararemetro.co.zw"
    echo "   Backend:  https://admin.hararemetro.co.zw"
    echo ""
    echo "📊 Admin Interface: https://admin.hararemetro.co.zw/admin"
    echo "🔧 API Health:     https://admin.hararemetro.co.zw/api/health"
}

# Handle script arguments
case "${1:-all}" in
    "backend")
        deploy_backend
        ;;
    "frontend")
        deploy_frontend
        ;;
    "test")
        test_deployments
        ;;
    "all"|"")
        main
        ;;
    *)
        echo "Usage: $0 [backend|frontend|test|all]"
        echo ""
        echo "Options:"
        echo "  backend   - Deploy only the backend"
        echo "  frontend  - Deploy only the frontend"
        echo "  test      - Test current deployments"
        echo "  all       - Deploy both (default)"
        exit 1
        ;;
esac
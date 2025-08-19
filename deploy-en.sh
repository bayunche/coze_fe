#!/bin/bash

# Production deployment script (English version)
# Build frontend app and start Nginx reverse proxy service

set -e  # Exit on error

echo "=== Frontend Application Deployment Script ==="

# 1. Check dependencies
echo "1. Checking deployment dependencies..."
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker not installed, please install Docker first"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "ERROR: Docker Compose not installed, please install Docker Compose first"
    exit 1
fi

echo "SUCCESS: Docker and Docker Compose are installed"

# 2. Clean old build files
echo "2. Cleaning old build files..."
rm -rf dist/
rm -rf nginx/logs/
mkdir -p nginx/logs

# 3. Install dependencies
echo "3. Installing project dependencies..."
if command -v yarn &> /dev/null; then
    yarn install
else
    npm install
fi

# 4. Build production version
echo "4. Building production version..."
if command -v yarn &> /dev/null; then
    yarn build-prod
else
    npm run build-prod
fi

# 5. Check build result
if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
    echo "ERROR: Build failed, dist directory does not exist or is empty"
    exit 1
fi

echo "SUCCESS: Frontend build completed"

# 6. Start services
echo "5. Starting Docker services..."
docker-compose down --remove-orphans
docker-compose up -d frontend

# 7. Wait for services to start
echo "6. Waiting for services to start..."
sleep 5

# 8. Health check
echo "7. Health check..."
if curl -f http://localhost/health &> /dev/null; then
    echo "SUCCESS: Service health check passed"
else
    echo "WARNING: Service might not be fully started, please check logs"
fi

# 9. Get server IP address
echo ""
echo "=== Deployment Completed ==="

# Get server IP (prefer non-loopback address)
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ip route get 1 2>/dev/null | awk '{print $7}' || echo "Not found")

echo "Server access addresses:"
echo "  Local access: http://localhost"
echo "  External access: http://$SERVER_IP"
echo "  Health check: http://$SERVER_IP/health"
echo ""
echo "Nginx logs: ./nginx/logs/"
echo ""
echo "API forwarding configuration:"
echo "  /api/* -> localhost:1207/*"
echo "  /backend-api/* -> localhost:1202/*"
echo ""
echo "Common commands:"
echo "  Check service status: docker-compose ps"
echo "  View logs: docker-compose logs -f frontend"
echo "  Stop services: docker-compose down"
echo "  Redeploy: ./deploy-en.sh"
echo ""

# 10. Check Java services status
echo "Checking Java services status:"
if curl -s http://localhost:1207/ &> /dev/null; then
    echo "SUCCESS: Port 1207 (Main Business API) service is running"
else
    echo "ERROR: Port 1207 (Main Business API) no response"
fi

if curl -s http://localhost:1202/ &> /dev/null; then
    echo "SUCCESS: Port 1202 (Chat/Workflow API) service is running"  
else
    echo "ERROR: Port 1202 (Chat/Workflow API) no response"
fi

echo ""
echo "TIP: If Java services are not responding, please start the backend services first"
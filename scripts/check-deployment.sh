#!/bin/bash

# Check FinFlow Tracker deployment status

echo "🚀 FinFlow Tracker Deployment Status"
echo "====================================="

PROD_URL="https://finflow-tracker-fern.netlify.app"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check production site
echo -e "\n📍 Production Site Check"
echo "URL: $PROD_URL"

# Check if site is up
if curl -s -o /dev/null -w "%{http_code}" "$PROD_URL" | grep -q "200"; then
    echo -e "${GREEN}✓${NC} Site is accessible"
else
    echo -e "${RED}✗${NC} Site is not accessible"
    exit 1
fi

# Check API health
echo -e "\n🔧 API Health Check"
API_RESPONSE=$(curl -s "$PROD_URL/api/ping")
if echo "$API_RESPONSE" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✓${NC} API is healthy"
    echo "Response: $API_RESPONSE"
else
    echo -e "${RED}✗${NC} API health check failed"
    exit 1
fi

# Get latest commit on main
echo -e "\n📝 Latest Deployment Info"
LATEST_COMMIT=$(git ls-remote origin main | cut -f1 | cut -c1-7)
echo "Latest commit on main: $LATEST_COMMIT"

# Show Netlify dashboard link
echo -e "\n🔗 Useful Links:"
echo "• Netlify Dashboard: https://app.netlify.com/sites/finflow-tracker-fern/deploys"
echo "• Production Site: $PROD_URL"
echo "• GitHub Repo: https://github.com/Fern-Labs-Open-Source/finflow-tracker"

echo -e "\n${GREEN}✨ Deployment status check complete!${NC}"

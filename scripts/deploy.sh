#!/bin/bash

# FinFlow Tracker Deployment Script
# This script automates the deployment process to Netlify

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}FinFlow Tracker Deployment Script${NC}"
echo -e "${GREEN}=========================================${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Not in the FinFlow Tracker directory${NC}"
    echo "Please run this script from the root of the repository"
    exit 1
fi

# Function to check git status
check_git_status() {
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
        git status --short
        read -p "Do you want to commit these changes? (y/n): " -r
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -p "Enter commit message: " commit_msg
            git add -A
            git commit -m "$commit_msg"
        else
            echo -e "${RED}Deployment cancelled. Please commit or stash your changes.${NC}"
            exit 1
        fi
    fi
}

# Function to setup git auth if needed
setup_git_auth() {
    # Try to fetch to test authentication
    if ! git fetch origin main &>/dev/null; then
        echo -e "${YELLOW}Git authentication needed${NC}"
        ./scripts/setup-git-auth.sh
    fi
}

# Main deployment process
main() {
    echo -e "\n${GREEN}1. Checking current branch...${NC}"
    current_branch=$(git branch --show-current)
    echo "Current branch: $current_branch"

    if [ "$current_branch" != "main" ]; then
        echo -e "${YELLOW}You're not on the main branch${NC}"
        read -p "Do you want to merge $current_branch into main? (y/n): " -r
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # Check for uncommitted changes
            check_git_status
            
            # Switch to main and merge
            echo -e "\n${GREEN}2. Switching to main branch...${NC}"
            git checkout main
            
            echo -e "\n${GREEN}3. Pulling latest changes...${NC}"
            setup_git_auth
            git pull origin main
            
            echo -e "\n${GREEN}4. Merging $current_branch...${NC}"
            git merge "$current_branch" --no-ff -m "Merge $current_branch into main"
        else
            read -p "Do you want to deploy the current branch directly? (y/n): " -r
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo -e "${RED}Deployment cancelled${NC}"
                exit 1
            fi
        fi
    else
        # On main branch
        echo -e "\n${GREEN}2. Checking for uncommitted changes...${NC}"
        check_git_status
        
        echo -e "\n${GREEN}3. Pulling latest changes...${NC}"
        setup_git_auth
        git pull origin main
    fi

    echo -e "\n${GREEN}5. Running tests...${NC}"
    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        npm test || echo -e "${YELLOW}Tests failed or not configured. Continuing...${NC}"
    fi

    echo -e "\n${GREEN}6. Building locally to verify...${NC}"
    npm run build || {
        echo -e "${RED}Build failed! Please fix errors before deploying.${NC}"
        exit 1
    }

    echo -e "\n${GREEN}7. Pushing to GitHub...${NC}"
    setup_git_auth
    git push origin main

    echo -e "\n${GREEN}=========================================${NC}"
    echo -e "${GREEN}✅ Deployment triggered successfully!${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    echo "📊 Monitor deployment at:"
    echo "   https://app.netlify.com/sites/finflow-tracker-fern/deploys"
    echo ""
    echo "🌐 Your app will be available at:"
    echo "   https://finflow-tracker-fern.netlify.app"
    echo ""
    echo -e "${YELLOW}⏱️  Deployment usually takes 2-3 minutes${NC}"
    
    # Optional: Wait and check deployment
    read -p "Do you want to wait and verify deployment? (y/n): " -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "\n${GREEN}Waiting for deployment (60 seconds)...${NC}"
        sleep 60
        
        echo -e "\n${GREEN}Checking deployment status...${NC}"
        response=$(curl -s -o /dev/null -w "%{http_code}" https://finflow-tracker-fern.netlify.app/api/health)
        
        if [ "$response" == "200" ]; then
            echo -e "${GREEN}✅ Deployment verified! Site is live.${NC}"
            curl -s https://finflow-tracker-fern.netlify.app/api/health | jq .
        else
            echo -e "${YELLOW}⚠️  Site might still be deploying. Check the Netlify dashboard.${NC}"
        fi
    fi
}

# Run main function
main

echo -e "\n${GREEN}Deployment script completed!${NC}"

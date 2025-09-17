#!/bin/bash

# FinFlow Tracker Deployment Script
# This script helps with manual deployment to Vercel

set -e

echo "🚀 FinFlow Tracker Deployment Script"
echo "===================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Function to deploy
deploy() {
    local env=$1
    
    echo "📦 Building application..."
    npm run build
    
    if [ "$env" = "production" ]; then
        echo "🚀 Deploying to production..."
        vercel --prod
    else
        echo "👁️ Deploying preview..."
        vercel
    fi
    
    echo "✅ Deployment complete!"
}

# Main menu
echo ""
echo "Select deployment target:"
echo "1) Production"
echo "2) Preview"
echo "3) Exit"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo "⚠️  WARNING: You are about to deploy to PRODUCTION!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            deploy "production"
        else
            echo "Deployment cancelled."
        fi
        ;;
    2)
        deploy "preview"
        ;;
    3)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice. Exiting..."
        exit 1
        ;;
esac

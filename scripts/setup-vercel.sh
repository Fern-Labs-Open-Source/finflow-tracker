#!/bin/bash

# FinFlow Tracker - Vercel Setup Script
# This script helps with initial Vercel project setup

set -e

echo "🔧 FinFlow Tracker - Vercel Setup"
echo "================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo ""
echo "This script will help you set up Vercel for FinFlow Tracker."
echo "You'll need:"
echo "  • A Vercel account"
echo "  • Your Neon database credentials"
echo "  • A generated NEXTAUTH_SECRET"
echo ""

read -p "Continue? (y/n): " continue
if [ "$continue" != "y" ]; then
    echo "Setup cancelled."
    exit 0
fi

# Login to Vercel
echo ""
echo "📝 Step 1: Login to Vercel"
vercel login

# Link project
echo ""
echo "🔗 Step 2: Link project to Vercel"
vercel link

# Pull environment info
echo ""
echo "📥 Step 3: Pulling Vercel project info..."
vercel env pull .env.vercel.local

# Display next steps
echo ""
echo "✅ Initial setup complete!"
echo ""
echo "📋 Next Steps:"
echo "============="
echo ""
echo "1. Get your Vercel IDs from .env.vercel.local:"
echo "   cat .env.vercel.local | grep VERCEL"
echo ""
echo "2. Add these secrets to GitHub repository:"
echo "   • VERCEL_ORG_ID"
echo "   • VERCEL_PROJECT_ID" 
echo "   • VERCEL_TOKEN (get from https://vercel.com/account/tokens)"
echo "   • DATABASE_URL"
echo "   • NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"
echo "   • NEXTAUTH_URL (your production URL)"
echo ""
echo "3. Add environment variables in Vercel Dashboard:"
echo "   https://vercel.com/dashboard/projects"
echo "   Select your project → Settings → Environment Variables"
echo ""
echo "4. Deploy your first version:"
echo "   vercel --prod"
echo ""
echo "For detailed instructions, see DEPLOYMENT.md"

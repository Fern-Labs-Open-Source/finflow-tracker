#!/bin/bash

# FinFlow Tracker - Git Authentication Setup Script
# This script helps developers set up Git authentication for the repository

echo "========================================="
echo "FinFlow Tracker Git Authentication Setup"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d ".git" ]; then
    echo "❌ Error: Please run this script from the root of the finflow-tracker repository"
    exit 1
fi

# Check if SSH key already exists and is configured
if [ -f ~/.ssh/id_ed25519 ]; then
    echo "✅ SSH key found at ~/.ssh/id_ed25519"
    echo ""
    echo "📋 Your SSH public key is:"
    echo "------------------------"
    cat ~/.ssh/id_ed25519.pub
    echo "------------------------"
    echo ""
    echo "🔍 Testing GitHub SSH connection..."
    ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"
    if [ $? -eq 0 ]; then
        echo "✅ SSH authentication is working!"
        echo ""
        echo "🎉 Your environment is already set up to use SSH!"
        echo "   Repository is configured to use: git@github.com:Fern-Labs-Open-Source/finflow-tracker.git"
        echo ""
        echo "You can now use git commands without any additional authentication:"
        echo "  git pull"
        echo "  git push"
        echo "  git fetch"
        echo ""
        exit 0
    else
        echo "⚠️  SSH key exists but is not authorized on GitHub"
        echo ""
        echo "To fix this:"
        echo "1. Copy the SSH key above"
        echo "2. Go to https://github.com/settings/keys"
        echo "3. Click 'New SSH key'"
        echo "4. Paste the key and save"
        echo ""
        read -p "Have you added the SSH key to GitHub? (y/n): " ssh_added
        if [ "$ssh_added" = "y" ] || [ "$ssh_added" = "Y" ]; then
            git remote set-url origin git@github.com:Fern-Labs-Open-Source/finflow-tracker.git
            echo "✅ Repository configured to use SSH!"
            exit 0
        fi
    fi
fi

echo "This script will help you set up Git authentication for the FinFlow Tracker repository."
echo ""
echo "You have two options for authentication:"
echo "1. SSH Key (Recommended for long-term development)"
echo "2. GitHub Personal Access Token (PAT) or GitHub App Token"
echo ""

read -p "Choose your authentication method (1 for SSH, 2 for Token): " choice

case $choice in
    1)
        echo ""
        echo "📝 Setting up SSH authentication..."
        echo ""
        
        # Check if SSH key exists
        if [ ! -f ~/.ssh/id_ed25519 ] && [ ! -f ~/.ssh/id_rsa ]; then
            echo "No SSH key found. Creating a new one..."
            read -p "Enter your email for the SSH key: " email
            ssh-keygen -t ed25519 -C "$email" -f ~/.ssh/id_ed25519 -N ""
            echo ""
            echo "✅ SSH key created successfully!"
        else
            echo "✅ SSH key already exists"
        fi
        
        # Display public key
        echo ""
        echo "📋 Your SSH public key:"
        echo "------------------------"
        if [ -f ~/.ssh/id_ed25519.pub ]; then
            cat ~/.ssh/id_ed25519.pub
        elif [ -f ~/.ssh/id_rsa.pub ]; then
            cat ~/.ssh/id_rsa.pub
        fi
        echo "------------------------"
        echo ""
        echo "📌 To complete SSH setup:"
        echo "1. Copy the SSH key above"
        echo "2. Go to https://github.com/settings/keys"
        echo "3. Click 'New SSH key'"
        echo "4. Paste the key and save"
        echo ""
        
        read -p "Press Enter after you've added the SSH key to GitHub..." 
        
        # Configure git to use SSH
        echo ""
        echo "🔧 Configuring repository to use SSH..."
        git remote set-url origin git@github.com:Fern-Labs-Open-Source/finflow-tracker.git
        
        # Test connection
        echo ""
        echo "🔍 Testing SSH connection..."
        ssh -T git@github.com 2>&1 | grep -q "successfully authenticated" && echo "✅ SSH authentication successful!" || echo "⚠️  SSH test failed. Please check your key is added to GitHub."
        
        # Configure SSH for better stability
        if [ ! -f ~/.ssh/config ] || ! grep -q "github.com" ~/.ssh/config; then
            echo ""
            echo "📝 Adding GitHub to SSH config for better stability..."
            cat >> ~/.ssh/config << EOF

Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519
    AddKeysToAgent yes
EOF
            echo "✅ SSH config updated"
        fi
        ;;
        
    2)
        echo ""
        echo "📝 Setting up Token authentication..."
        echo ""
        echo "You'll need a GitHub Personal Access Token (PAT) with 'repo' scope."
        echo ""
        echo "To create one:"
        echo "1. Go to https://github.com/settings/tokens/new"
        echo "2. Give it a name (e.g., 'FinFlow Tracker Development')"
        echo "3. Select 'repo' scope"
        echo "4. Click 'Generate token'"
        echo "5. Copy the token (it won't be shown again!)"
        echo ""
        
        read -p "Enter your GitHub token (or 'skip' to do this later): " token
        
        if [ "$token" != "skip" ] && [ ! -z "$token" ]; then
            echo ""
            echo "🔧 Configuring repository to use token..."
            git remote set-url origin https://x-access-token:${token}@github.com/Fern-Labs-Open-Source/finflow-tracker.git
            
            # Store token in git config (local to this repo only)
            git config --local credential.helper store
            
            echo "✅ Token authentication configured!"
            echo ""
            echo "⚠️  Note: This token is stored in the repository's git config."
            echo "    Never commit the .git/config file!"
            
            # Create .env.local if it doesn't exist
            if [ ! -f .env.local ]; then
                echo ""
                echo "📝 Creating .env.local for GitHub token..."
                echo "# GitHub Token for API access (if needed)" >> .env.local
                echo "GITHUB_TOKEN=${token}" >> .env.local
                echo "✅ Token saved to .env.local"
            fi
        else
            echo ""
            echo "📌 You can configure token authentication later by running:"
            echo "   git remote set-url origin https://x-access-token:YOUR_TOKEN@github.com/Fern-Labs-Open-Source/finflow-tracker.git"
        fi
        ;;
        
    *)
        echo "❌ Invalid choice. Please run the script again and choose 1 or 2."
        exit 1
        ;;
esac

echo ""
echo "🔧 Setting up Git user information..."

# Get current git config
current_name=$(git config --global user.name)
current_email=$(git config --global user.email)

if [ -z "$current_name" ]; then
    read -p "Enter your name for Git commits: " name
    git config --global user.name "$name"
else
    echo "Git user name: $current_name"
    read -p "Keep this name? (Y/n): " keep_name
    if [ "$keep_name" = "n" ] || [ "$keep_name" = "N" ]; then
        read -p "Enter new name: " name
        git config --global user.name "$name"
    fi
fi

if [ -z "$current_email" ]; then
    read -p "Enter your email for Git commits: " email
    git config --global user.email "$email"
else
    echo "Git user email: $current_email"
    read -p "Keep this email? (Y/n): " keep_email
    if [ "$keep_email" = "n" ] || [ "$keep_email" = "N" ]; then
        read -p "Enter new email: " email
        git config --global user.email "$email"
    fi
fi

echo ""
echo "========================================="
echo "✅ Git Authentication Setup Complete!"
echo "========================================="
echo ""
echo "Your Git configuration:"
echo "  Name:  $(git config --global user.name)"
echo "  Email: $(git config --global user.email)"
echo "  Remote: $(git remote get-url origin)"
echo ""
echo "📚 Useful Git commands:"
echo "  git pull                     - Get latest changes"
echo "  git push                     - Push your commits"
echo "  git checkout -b feature/name - Create new feature branch"
echo "  git status                   - Check current status"
echo ""
echo "Happy coding! 🚀"

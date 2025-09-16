#!/bin/bash

# FinFlow Tracker - Development Environment Setup Script
# This script automates the setup of the development environment

set -e  # Exit on error

echo "🚀 FinFlow Tracker - Development Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    print_error "Node.js 20+ is required. Current version: $(node -v)"
    exit 1
else
    print_success "Node.js version: $(node -v)"
fi

# Check npm version
echo "Checking npm version..."
NPM_VERSION=$(npm -v | cut -d'.' -f1)
if [ "$NPM_VERSION" -lt 10 ]; then
    print_error "npm 10+ is required. Current version: $(npm -v)"
    exit 1
else
    print_success "npm version: $(npm -v)"
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install
print_success "Dependencies installed"

# Check if .env.local exists
echo ""
if [ -f .env.local ]; then
    print_warning ".env.local already exists. Skipping..."
else
    echo "Creating .env.local from template..."
    cp .env.example .env.local
    print_success ".env.local created"
    echo ""
    print_warning "Please edit .env.local and add your configuration:"
    echo "  - DATABASE_URL: Your Neon PostgreSQL connection string"
    echo "  - NEXTAUTH_SECRET: Run 'openssl rand -base64 32' to generate"
    echo "  - NEXTAUTH_URL: Set to http://localhost:3000 for local dev"
    echo "  - ADMIN_EMAIL: Your email address"
    echo "  - EXCHANGERATE_API_KEY: Get from https://app.exchangerate-api.com/sign-up"
    echo ""
    echo "Press Enter to continue after updating .env.local..."
    read -r
fi

# Check if environment variables are set
echo ""
echo "Checking environment configuration..."
if [ -f .env.local ]; then
    # Check for required variables
    if grep -q "DATABASE_URL=postgresql://" .env.local; then
        print_success "DATABASE_URL is configured"
    else
        print_warning "DATABASE_URL needs to be configured"
    fi
    
    if grep -q "NEXTAUTH_SECRET=.\+" .env.local; then
        print_success "NEXTAUTH_SECRET is configured"
    else
        print_warning "NEXTAUTH_SECRET needs to be configured"
        echo "  Generate with: openssl rand -base64 32"
    fi
    
    if grep -q "ADMIN_EMAIL=.*@.*" .env.local; then
        print_success "ADMIN_EMAIL is configured"
    else
        print_warning "ADMIN_EMAIL needs to be configured"
    fi
fi

# Setup database
echo ""
echo "Setting up database..."
echo "Running Prisma migrations..."
npm run prisma:generate
npm run prisma:push
print_success "Database setup complete"

# Check if gitleaks is installed
echo ""
echo "Checking for Gitleaks..."
if command -v gitleaks &> /dev/null; then
    print_success "Gitleaks is installed"
    echo "Running secret scan..."
    if gitleaks detect --source . --verbose --no-banner 2>&1 | grep -q "no leaks found"; then
        print_success "No secrets detected"
    else
        print_warning "Potential secrets detected. Please review."
    fi
else
    print_warning "Gitleaks not installed. Install for secret scanning:"
    echo "  macOS: brew install gitleaks"
    echo "  Linux: See DEVELOPMENT_GUIDE.md for instructions"
fi

# Setup git hooks
echo ""
echo "Setting up git hooks..."
if [ -d .git ]; then
    # Create pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook for FinFlow Tracker

echo "Running pre-commit checks..."

# Run linting
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Linting failed. Please fix errors before committing."
    exit 1
fi

# Run type checking
npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ Type checking failed. Please fix errors before committing."
    exit 1
fi

# Run tests for changed files
npm run test:changed
if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Please fix failing tests before committing."
    exit 1
fi

echo "✅ All pre-commit checks passed!"
EOF
    chmod +x .git/hooks/pre-commit
    print_success "Git hooks configured"
else
    print_warning "Not a git repository. Skipping git hooks setup."
fi

# Final summary
echo ""
echo "======================================"
echo -e "${GREEN}Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Ensure .env.local is properly configured"
echo "2. Run 'npm run setup:admin' to create an admin user"
echo "3. Run 'npm run dev' to start the development server"
echo "4. Visit http://localhost:3000"
echo ""
echo "Useful commands:"
echo "  npm run dev          - Start development server"
echo "  npm test            - Run tests"
echo "  npm run prisma:studio - Open database GUI"
echo "  npm run lint        - Check code quality"
echo ""
echo "See DEVELOPMENT_GUIDE.md for more information"
echo "========================================"

#!/bin/bash

# FinFlow Tracker Deployment Readiness Check
# Run this script before deploying to ensure everything is ready

set -e

echo "🔍 FinFlow Tracker Deployment Check"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Check Node version
echo -e "\n📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    check_pass "Node.js version is 18 or higher"
else
    check_fail "Node.js version must be 18 or higher (found: $(node -v))"
fi

# 2. Check npm dependencies
echo -e "\n📚 Checking dependencies..."
if npm ls &>/dev/null; then
    check_pass "All npm dependencies are satisfied"
else
    check_warn "Some dependencies might have issues, running npm install..."
    npm install
fi

# 3. Check for TypeScript errors
echo -e "\n🔧 Checking TypeScript..."
if npx tsc --noEmit; then
    check_pass "No TypeScript errors found"
else
    check_fail "TypeScript compilation errors found"
fi

# 4. Check for linting errors
echo -e "\n🧹 Checking ESLint..."
if npm run lint &>/dev/null; then
    check_pass "No linting errors found"
else
    check_warn "Linting warnings/errors found (non-blocking)"
fi

# 5. Run tests
echo -e "\n🧪 Running tests..."
if npm test -- --passWithNoTests; then
    check_pass "All tests passed"
else
    check_fail "Tests failed"
fi

# 6. Check build
echo -e "\n🏗️  Testing build process..."
if npm run build; then
    check_pass "Build successful"
else
    check_fail "Build failed"
fi

# 7. Check environment variables
echo -e "\n🔐 Checking environment configuration..."
if [ -f .env.example ]; then
    check_pass "Environment example file exists"
else
    check_warn ".env.example file not found"
fi

# 8. Check for uncommitted changes
echo -e "\n📝 Checking git status..."
if [ -z "$(git status --porcelain)" ]; then
    check_pass "No uncommitted changes"
else
    check_warn "Uncommitted changes found:"
    git status --short
fi

# 9. Check current branch
echo -e "\n🌿 Checking git branch..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ]; then
    check_pass "On main branch"
else
    check_warn "Not on main branch (current: $CURRENT_BRANCH)"
fi

# 10. Check remote status
echo -e "\n🔄 Checking remote status..."
git fetch origin main &>/dev/null
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
    check_pass "Branch is up to date with remote"
else
    check_warn "Branch differs from remote main"
fi

echo -e "\n✨ Deployment check complete!"
echo "===================================="

if [ "$CURRENT_BRANCH" = "main" ] && [ -z "$(git status --porcelain)" ] && [ "$LOCAL" = "$REMOTE" ]; then
    echo -e "${GREEN}🚀 Ready for deployment!${NC}"
    echo "Push to main branch to trigger automatic deployment to Netlify"
else
    echo -e "${YELLOW}⚠ Some checks require attention before deploying${NC}"
fi

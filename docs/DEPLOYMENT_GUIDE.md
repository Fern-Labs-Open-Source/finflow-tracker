# FinFlow Tracker Deployment Guide

## Table of Contents
1. [Production Deployment](#production-deployment)
2. [Environment Configuration](#environment-configuration)
3. [Authentication Setup](#authentication-setup)
4. [Local Development](#local-development)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Database Management](#database-management)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedures](#rollback-procedures)

## Production Deployment

### Current Setup
- **Platform**: Netlify
- **URL**: https://finflow-tracker-fern.netlify.app
- **Admin Dashboard**: https://app.netlify.com/sites/finflow-tracker-fern
- **GitHub Repository**: https://github.com/Fern-Labs-Open-Source/finflow-tracker
- **Database**: Neon PostgreSQL (weathered-sea-97310034 project)

### Deployment Process

#### Automatic Deployment (Recommended)
1. **Push to main branch**: Any push to the `main` branch automatically triggers a deployment
   ```bash
   git checkout main
   git pull origin main
   git merge feature/your-feature
   git push origin main
   ```

2. **Monitor deployment**:
   - Visit: https://app.netlify.com/sites/finflow-tracker-fern/deploys
   - Check build logs for any errors
   - Deployment typically takes 2-3 minutes

3. **Verify deployment**:
   ```bash
   curl https://finflow-tracker-fern.netlify.app/api/health
   ```

#### Manual Deployment
1. **Via Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod --dir=.next
   ```

2. **Via Netlify Dashboard**:
   - Go to https://app.netlify.com/sites/finflow-tracker-fern
   - Click "Trigger deploy" → "Deploy site"

## Environment Configuration

### Required Environment Variables

#### Production (Netlify)
```env
# Database
DATABASE_URL=postgresql://user:pass@host/database?sslmode=require

# Authentication
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://finflow-tracker-fern.netlify.app
BYPASS_AUTH=false

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Environment
NODE_ENV=production
```

#### Local Development
Create `.env.local` file:
```env
# Database (use different from production)
DATABASE_URL=postgresql://localhost:5432/finflow_dev

# Authentication
NEXTAUTH_SECRET=dev-secret-key-for-testing
NEXTAUTH_URL=http://localhost:3000
BYPASS_AUTH=false

# OAuth Providers (same as production)
GOOGLE_CLIENT_ID=same-as-production
GOOGLE_CLIENT_SECRET=same-as-production

# Mock OAuth for offline testing
USE_MOCK_AUTH=true  # Optional

# Environment
NODE_ENV=development
```

### Managing Environment Variables

#### Update via Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Set a variable
netlify env:set VARIABLE_NAME "value" --force

# List all variables
netlify env:list

# Delete a variable
netlify env:unset VARIABLE_NAME
```

#### Update via Dashboard
1. Go to https://app.netlify.com/sites/finflow-tracker-fern/settings/env
2. Click "Add a variable"
3. Enter key and value
4. Click "Save"
5. Trigger a new deployment for changes to take effect

## Authentication Setup

### Email/Password Authentication
- Works out of the box
- Users register at `/register`
- Login at `/login`

### Google OAuth Setup

1. **Create Google OAuth App**:
   - Go to https://console.cloud.google.com/
   - Create new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials

2. **Configure OAuth Consent Screen**:
   - Add application name
   - Add authorized domains: `finflow-tracker-fern.netlify.app`
   - Add scopes: email, profile

3. **Set Authorized Redirect URIs**:
   - Production: `https://finflow-tracker-fern.netlify.app/api/auth/callback/google`
   - Local development: `http://localhost:3000/api/auth/callback/google`

4. **Add OAuth Credentials to Netlify**:
   ```bash
   # Using Netlify CLI
   netlify env:set GOOGLE_CLIENT_ID "your-client-id" --force
   netlify env:set GOOGLE_CLIENT_SECRET "your-client-secret" --force
   ```

   Or via Dashboard:
   - Go to Site settings → Environment variables
   - Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
   - Trigger redeployment

5. **Current OAuth Credentials** (for testing):
   - Client ID: `833642046035-f9avo67n1caqhkbg13sgrjukupimgp7d.apps.googleusercontent.com`
   - These are configured locally but need to be added to Netlify
   http://localhost:3000/api/auth/callback/google  # For local dev
   ```

4. **Add credentials to Netlify**:
   ```bash
   netlify env:set GOOGLE_CLIENT_ID "your-client-id" --force
   netlify env:set GOOGLE_CLIENT_SECRET "your-client-secret" --force
   ```

### GitHub OAuth Setup (Optional)

1. **Create GitHub OAuth App**:
   - Go to https://github.com/settings/developers
   - Click "New OAuth App"
   - Application name: FinFlow Tracker
   - Homepage URL: https://finflow-tracker-fern.netlify.app
   - Authorization callback URL: https://finflow-tracker-fern.netlify.app/api/auth/callback/github

2. **Add credentials to Netlify**:
   ```bash
   netlify env:set GITHUB_CLIENT_ID "your-client-id" --force
   netlify env:set GITHUB_CLIENT_SECRET "your-client-secret" --force
   ```

## Local Development

### Setup Instructions

1. **Clone repository**:
   ```bash
   git clone https://github.com/Fern-Labs-Open-Source/finflow-tracker.git
   cd finflow-tracker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Setup environment**:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with:
   ```env
   # Database (use production Neon DB for now, or setup local PostgreSQL)
   DATABASE_URL=postgresql://neondb_owner:npg_MCa2yow5epmz@ep-silent-cell-adwln18k-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
   
   # NextAuth
   NEXTAUTH_SECRET=your-secret-here
   NEXTAUTH_URL=http://localhost:3000
   
   # OAuth (optional)
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   
   # Development settings
   NODE_ENV=development
   BYPASS_AUTH=false
   ```

4. **Setup local database** (optional - currently using Neon):
   ```bash
   # Using Docker
   docker run -d \
     --name finflow-postgres \
     -e POSTGRES_PASSWORD=password \
     -e POSTGRES_DB=finflow_dev \
     -p 5432:5432 \
     postgres:14

   # Update DATABASE_URL in .env.local
   # DATABASE_URL=postgresql://postgres:password@localhost:5432/finflow_dev
   
   # Run migrations
   npx prisma migrate dev
   ```

5. **Run development server**:
   ```bash
   npm run dev
   # Opens at http://localhost:3000
   ```

### Git Authentication

Run the setup script:
```bash
./scripts/setup-git-auth.sh
```

Or manually:
```bash
# Get GitHub access token
# Visit https://github.com/settings/tokens/new
# Create token with 'repo' scope

# Configure git
git config user.name "Your Name"
git config user.email "your.email@example.com"
git remote set-url origin https://x-access-token:YOUR_TOKEN@github.com/Fern-Labs-Open-Source/finflow-tracker.git
```

## CI/CD Pipeline

### Current Pipeline

1. **Trigger**: Push to `main` branch
2. **Build Process**:
   - Netlify detects push via webhook
   - Runs build command: `npm run build`
   - Executes postinstall: `prisma generate`
   - Builds Next.js application
3. **Deployment**: Automatic to production URL
4. **Rollback**: Available via Netlify dashboard

### Build Configuration

**netlify.toml**:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[[redirects]]
  from = "/api/*"
  to = "/api/:splat"
  status = 200

[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
```

### Branch Deployments

- **Production**: `main` branch → https://finflow-tracker-fern.netlify.app
- **Preview**: All other branches create preview deployments
- **URL Format**: https://BRANCH--finflow-tracker-fern.netlify.app

## Database Management

### Production Database
- **Provider**: Neon PostgreSQL
- **Project**: weathered-sea-97310034
- **Connection**: Via DATABASE_URL environment variable

### Database Migrations

1. **Create migration**:
   ```bash
   npx prisma migrate dev --name migration_name
   ```

2. **Apply to production**:
   ```bash
   # Migrations run automatically during build
   # Or manually:
   DATABASE_URL="production_url" npx prisma migrate deploy
   ```

3. **View database**:
   ```bash
   npx prisma studio
   ```

### Backup and Restore

1. **Backup**:
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
   ```

2. **Restore**:
   ```bash
   psql $DATABASE_URL < backup_file.sql
   ```

## Troubleshooting

### Common Issues

#### 1. Build Failures
- **Check logs**: https://app.netlify.com/sites/finflow-tracker-fern/deploys
- **Common causes**:
  - Missing environment variables
  - Package version conflicts
  - Prisma schema issues

#### 2. Authentication Issues
- **Verify environment variables**:
  ```bash
  curl https://finflow-tracker-fern.netlify.app/api/health
  ```
- **Check OAuth callbacks are configured correctly**
- **Ensure NEXTAUTH_URL matches deployment URL**

#### 3. Database Connection
- **Test connection**:
  ```bash
  DATABASE_URL="your_url" npx prisma db pull
  ```
- **Check SSL mode**: Must be `?sslmode=require` for Neon

### Debug Mode

Enable debug logging:
```bash
netlify env:set DEBUG "true" --force
netlify env:set NEXTAUTH_DEBUG "true" --force
```

## Rollback Procedures

### Via Netlify Dashboard

1. Go to https://app.netlify.com/sites/finflow-tracker-fern/deploys
2. Find the last working deployment
3. Click on the deployment
4. Click "Publish deploy"

### Via Git

1. **Find last working commit**:
   ```bash
   git log --oneline -10
   ```

2. **Revert to commit**:
   ```bash
   git revert HEAD  # Revert last commit
   # or
   git reset --hard COMMIT_HASH  # Reset to specific commit
   ```

3. **Force push** (use with caution):
   ```bash
   git push --force origin main
   ```

### Database Rollback

1. **Revert migration**:
   ```bash
   npx prisma migrate resolve --rolled-back MIGRATION_NAME
   ```

2. **Restore from backup**:
   ```bash
   psql $DATABASE_URL < backup_file.sql
   ```

## Monitoring

### Health Checks
- **API Health**: https://finflow-tracker-fern.netlify.app/api/health
- **Netlify Status**: https://app.netlify.com/sites/finflow-tracker-fern

### Logs
- **Build logs**: Netlify dashboard → Deploys
- **Function logs**: Netlify dashboard → Functions
- **Runtime errors**: Browser console + Netlify Functions tab

### Performance
- **Lighthouse**: Run via Chrome DevTools
- **Netlify Analytics**: Available in dashboard (if enabled)

## Security Best Practices

1. **Never commit sensitive data**:
   - Use environment variables
   - Add `.env*` to `.gitignore`

2. **Rotate secrets regularly**:
   ```bash
   # Generate new NEXTAUTH_SECRET
   openssl rand -base64 32
   ```

3. **Use least privilege**:
   - Database user should only have necessary permissions
   - OAuth apps should request minimal scopes

4. **Keep dependencies updated**:
   ```bash
   npm audit
   npm audit fix
   npm update
   ```

## Support and Resources

- **Repository**: https://github.com/Fern-Labs-Open-Source/finflow-tracker
- **Netlify Dashboard**: https://app.netlify.com/sites/finflow-tracker-fern
- **Neon Dashboard**: https://console.neon.tech/
- **NextAuth Documentation**: https://next-auth.js.org/
- **Prisma Documentation**: https://www.prisma.io/docs/

## Quick Commands Reference

```bash
# Deploy to production
git push origin main

# Check deployment status
curl https://finflow-tracker-fern.netlify.app/api/health

# Update environment variable
netlify env:set KEY "value" --force

# Run locally
npm run dev

# Run database migrations
npx prisma migrate dev

# View database
npx prisma studio

# Check for vulnerabilities
npm audit

# Build locally
npm run build
npm run start
```

---

Last updated: 2025-01-24

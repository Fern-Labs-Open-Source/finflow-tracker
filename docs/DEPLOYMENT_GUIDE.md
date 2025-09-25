# FinFlow Tracker Deployment Guide

## Overview
FinFlow Tracker uses a modern CI/CD pipeline with automatic deployments to Netlify from the main branch.

## Table of Contents
1. [Deployment Architecture](#deployment-architecture)
2. [Environment Setup](#environment-setup)
3. [Deployment Process](#deployment-process)
4. [Rollback Procedures](#rollback-procedures)
5. [Monitoring](#monitoring)
6. [Troubleshooting](#troubleshooting)

## Deployment Architecture

```
Developer → GitHub PR → CI Checks → Merge to Main → Auto Deploy to Netlify → Production
                ↓                           ↓
          Preview Deploy              Staging (optional)
```

### Production Environment
- **URL**: https://finflow-tracker-fern.netlify.app
- **Platform**: Netlify
- **Database**: Neon PostgreSQL
- **Auto-deploy**: Enabled from `main` branch

### Preview Deployments
- Automatically created for each pull request
- URL format: `https://deploy-preview-{PR-NUMBER}--finflow-tracker-fern.netlify.app`

## Environment Setup

### Required Environment Variables

#### Production (Netlify)
```env
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require
NEXTAUTH_SECRET=[generate-secure-random-string]
NEXTAUTH_URL=https://finflow-tracker-fern.netlify.app
NODE_ENV=production
BYPASS_AUTH=false
```

#### Local Development
```env
DATABASE_URL=postgresql://localhost:5432/finflow_dev
NEXTAUTH_SECRET=dev-secret-change-in-production
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
BYPASS_AUTH=true  # Optional for development
```

### Setting Up Environment Variables

#### On Netlify
1. Go to [Netlify Dashboard](https://app.netlify.com/sites/finflow-tracker-fern/settings/env)
2. Click "Environment variables"
3. Add each variable with its production value
4. Click "Save"
5. Trigger a redeploy if needed

#### Locally
1. Copy `.env.example` to `.env.local`
2. Update values for your local setup
3. Never commit `.env.local` to git

## Deployment Process

### Automatic Deployment (Recommended)

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make your changes**
   ```bash
   # Edit files
   git add .
   git commit -m "feat: your feature description"
   ```

3. **Push and create PR**
   ```bash
   git push origin feature/your-feature
   # Create PR on GitHub
   ```

4. **Wait for CI checks**
   - Linting
   - Type checking
   - Tests
   - Build verification
   - Security scan

5. **Review preview deployment**
   - Check the preview URL posted by the bot
   - Test your changes in the preview environment

6. **Merge to main**
   - Once approved and checks pass
   - Netlify automatically deploys to production

7. **Verify production deployment**
   - Check https://finflow-tracker-fern.netlify.app
   - Monitor [Netlify deploys](https://app.netlify.com/sites/finflow-tracker-fern/deploys)

### Manual Deployment (Emergency Only)

1. **Via Netlify Dashboard**
   - Go to [Deploys page](https://app.netlify.com/sites/finflow-tracker-fern/deploys)
   - Click "Trigger deploy" → "Deploy site"

2. **Via Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod --dir=.next
   ```

### Database Migrations

1. **Create migration**
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```

2. **Test locally**
   ```bash
   npm run dev
   # Test application with migration
   ```

3. **Deploy migration**
   - Migrations run automatically during build via `postinstall` script
   - For manual migration:
     ```bash
     DATABASE_URL=production_url npx prisma migrate deploy
     ```

## Rollback Procedures

### Quick Rollback (< 5 minutes)

1. **Via Netlify Dashboard**
   - Go to [Deploys page](https://app.netlify.com/sites/finflow-tracker-fern/deploys)
   - Find the last working deployment
   - Click on it → "Publish deploy"

2. **Verify rollback**
   ```bash
   curl https://finflow-tracker-fern.netlify.app/api/ping
   ```

### Git-based Rollback

1. **Revert the problematic commit**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Wait for auto-deployment**
   - Monitor at Netlify dashboard

### Database Rollback

⚠️ **Critical**: Always backup before rollback

1. **Connect to production database**
   ```bash
   DATABASE_URL=production_url npx prisma studio
   ```

2. **Run rollback migration**
   ```bash
   DATABASE_URL=production_url npx prisma migrate resolve --rolled-back
   ```

## Monitoring

### Health Checks

1. **API Health**
   ```bash
   curl https://finflow-tracker-fern.netlify.app/api/ping
   ```

2. **Application Status**
   - Visit https://finflow-tracker-fern.netlify.app
   - Check login functionality
   - Verify data loading

### Deployment Status

- **Netlify Dashboard**: https://app.netlify.com/sites/finflow-tracker-fern/deploys
- **GitHub Actions**: https://github.com/Fern-Labs-Open-Source/finflow-tracker/actions
- **Build Logs**: Available in Netlify dashboard for each deployment

### Error Monitoring

1. **Netlify Functions logs**
   - Go to Functions tab in Netlify dashboard
   - Check real-time logs

2. **Browser Console**
   - Check for client-side errors
   - Monitor network requests

## Troubleshooting

### Common Issues

#### Build Failures

**Problem**: Build fails on Netlify
```
Error: Cannot find module '@prisma/client'
```

**Solution**:
1. Ensure `postinstall` script runs `prisma generate`
2. Check `package.json`:
   ```json
   "scripts": {
     "postinstall": "prisma generate"
   }
   ```

#### Environment Variable Issues

**Problem**: Feature works locally but not in production

**Solution**:
1. Verify all env vars are set in Netlify
2. Check for typos in variable names
3. Ensure no spaces in values
4. Redeploy after adding variables

#### Database Connection Issues

**Problem**: `P1001: Can't reach database server`

**Solution**:
1. Verify DATABASE_URL is correct
2. Check SSL mode: `?sslmode=require`
3. Ensure database is not suspended (Neon)
4. Check connection pooling settings

#### Next.js Version Compatibility

**Problem**: Runtime errors with Next.js 15 on Netlify

**Solution**:
1. Use Next.js 14.2.x for Netlify compatibility
2. Check `package.json`:
   ```json
   "next": "^14.2.18"
   ```
3. Ensure Netlify plugin is compatible:
   ```json
   "@netlify/plugin-nextjs": "^5.13.3"
   ```

### Emergency Contacts

- **Netlify Support**: https://www.netlify.com/support/
- **Neon Database Support**: https://neon.tech/docs/support
- **GitHub Issues**: https://github.com/Fern-Labs-Open-Source/finflow-tracker/issues

## Deployment Checklist

### Pre-deployment
- [ ] All tests passing locally
- [ ] Environment variables documented
- [ ] Database migrations tested
- [ ] Preview deployment verified
- [ ] PR approved by reviewer

### Post-deployment
- [ ] Production site accessible
- [ ] API endpoints responding
- [ ] Login functionality working
- [ ] Data loading correctly
- [ ] No console errors
- [ ] Monitoring alerts configured

## Useful Commands

```bash
# Local development
npm run dev

# Build locally
npm run build

# Run tests
npm test

# Check types
npm run type-check

# Lint code
npm run lint

# Database commands
npx prisma studio          # Open database GUI
npx prisma migrate dev      # Create migration
npx prisma migrate deploy   # Apply migrations
npx prisma generate        # Generate client

# Deployment
git push origin main       # Triggers auto-deploy

# Monitoring
curl https://finflow-tracker-fern.netlify.app/api/ping
```

## Security Notes

1. **Never commit sensitive data**
   - Use environment variables
   - Add `.env*` to `.gitignore`

2. **Rotate secrets regularly**
   - NEXTAUTH_SECRET should be unique per environment
   - Database passwords should be rotated quarterly

3. **Use branch protection**
   - Require PR reviews for main branch
   - Enable status checks before merge

4. **Monitor dependencies**
   - Run `npm audit` regularly
   - Keep dependencies updated
   - Review security alerts on GitHub

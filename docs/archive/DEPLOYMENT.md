# FinFlow Tracker Deployment Guide

## Overview
FinFlow Tracker is deployed on Vercel with automated CI/CD pipelines via GitHub Actions. The application uses Neon PostgreSQL for the database and NextAuth.js for authentication.

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   GitHub     │────▶│    Vercel    │────▶│     Neon     │
│  Repository  │     │   Hosting    │     │  PostgreSQL  │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                      │
       │                    │                      │
       ▼                    ▼                      ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   GitHub     │     │   Next.js    │     │    Prisma    │
│   Actions    │     │  Application │     │     ORM      │
└──────────────┘     └──────────────┘     └──────────────┘
```

## Deployment Environments

### Production
- **URL**: https://finflow-tracker.vercel.app (to be configured)
- **Branch**: `main`
- **Database**: Production Neon database
- **Deployment**: Automatic on push to `main`

### Preview
- **URL**: Generated per pull request
- **Branch**: Any PR branch
- **Database**: Production database (read-only recommended)
- **Deployment**: Automatic on PR creation/update

### Development
- **URL**: http://localhost:3000
- **Branch**: Any local branch
- **Database**: Development Neon branch or local PostgreSQL
- **Deployment**: Manual via `npm run dev`

## Initial Setup

### 1. Vercel Project Setup

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Link the project:
   ```bash
   vercel link
   ```

4. Configure project settings in Vercel Dashboard:
   - Framework Preset: Next.js
   - Node.js Version: 20.x
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### 2. Environment Variables

#### Required Production Variables (Set in Vercel Dashboard):

```env
# Database
DATABASE_URL="postgresql://neondb_owner:npg_MCa2yow5epmz@ep-silent-cell-a5wln18k-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Authentication
NEXTAUTH_URL="https://your-production-domain.vercel.app"
NEXTAUTH_SECRET="your-generated-secret"  # Generate with: openssl rand -base64 32
BYPASS_AUTH="false"

# Application
NODE_ENV="production"
NEXT_PUBLIC_APP_NAME="FinFlow Tracker"
NEXT_PUBLIC_APP_URL="https://your-production-domain.vercel.app"
```

#### GitHub Secrets Required:

```env
VERCEL_ORG_ID="your-vercel-org-id"
VERCEL_PROJECT_ID="your-vercel-project-id"
VERCEL_TOKEN="your-vercel-token"
DATABASE_URL="production-database-url"
NEXTAUTH_SECRET="production-secret"
NEXTAUTH_URL="https://your-domain.vercel.app"
```

To get Vercel IDs:
```bash
# After linking your project
vercel env pull .env.vercel.local
# Check the file for VERCEL_ORG_ID and VERCEL_PROJECT_ID
```

### 3. Database Setup

#### Production Database
The production database is already configured in Neon. Connection string is stored in environment variables.

#### Development Database
1. Create a new branch in Neon for development:
   ```bash
   # Use Neon CLI or dashboard to create a development branch
   ```

2. Update `.env.local` with development database URL:
   ```env
   DATABASE_URL="your-development-database-url"
   ```

3. Run migrations:
   ```bash
   npx prisma migrate dev
   ```

## Deployment Process

### Automated Deployment (Recommended)

1. **Production Deployment**:
   - Push or merge to `main` branch
   - GitHub Actions runs CI pipeline
   - If tests pass, automatically deploys to Vercel
   - View deployment at production URL

2. **Preview Deployment**:
   - Create a pull request
   - GitHub Actions creates preview deployment
   - Preview URL is commented on the PR
   - Updates with each commit

### Manual Deployment

1. **Using Vercel CLI**:
   ```bash
   # Deploy to production
   vercel --prod
   
   # Deploy preview
   vercel
   ```

2. **Using GitHub Actions**:
   - Go to Actions tab in GitHub
   - Select "Deploy to Production" workflow
   - Click "Run workflow"
   - Select branch and run

## CI/CD Pipeline

### GitHub Actions Workflows

1. **CI Pipeline** (`ci.yml`):
   - Triggers: Push to main/develop, PRs to main
   - Jobs:
     - Lint and type check
     - Run tests
     - Security scanning
     - Build application

2. **Production Deployment** (`deploy-production.yml`):
   - Triggers: Push to main
   - Jobs:
     - Run tests
     - Build with Vercel
     - Deploy to production
     - Run smoke tests

3. **Preview Deployment** (`deploy-preview.yml`):
   - Triggers: Pull requests
   - Jobs:
     - Build with Vercel
     - Deploy preview
     - Comment URL on PR

## Local Development

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/Fern-Labs-Open-Source/finflow-tracker.git
   cd finflow-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment template:
   ```bash
   cp .env.development.template .env.local
   ```

4. Configure `.env.local`:
   - Set development database URL
   - Set BYPASS_AUTH=true for easier development
   - Use localhost URLs

5. Run database migrations:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

6. Start development server:
   ```bash
   npm run dev
   ```

### Common Commands

```bash
# Development
npm run dev           # Start development server
npm run build        # Build for production
npm start            # Start production server locally

# Database
npx prisma migrate dev     # Run migrations in development
npx prisma migrate deploy  # Run migrations in production
npx prisma studio         # Open Prisma Studio
npx prisma generate       # Generate Prisma Client

# Testing
npm test             # Run tests
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks

# Deployment
vercel              # Deploy preview
vercel --prod       # Deploy to production
vercel env pull     # Pull environment variables
```

## Monitoring and Logs

### Vercel Dashboard
- View deployments: https://vercel.com/dashboard
- Check function logs
- Monitor performance metrics
- View error reports

### GitHub Actions
- Check workflow runs in Actions tab
- View logs for each job
- Debug failed deployments

## Rollback Process

### Quick Rollback
1. Go to Vercel Dashboard
2. Navigate to Deployments
3. Find previous stable deployment
4. Click "..." menu → "Promote to Production"

### Git Rollback
```bash
# Revert last commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force origin main
```

## Security Considerations

1. **Secrets Management**:
   - Never commit `.env` files
   - Use GitHub Secrets for CI/CD
   - Rotate secrets regularly
   - Use different secrets for each environment

2. **Database Security**:
   - Use connection pooling
   - Enable SSL/TLS
   - Restrict IP access in production
   - Use read-only credentials where possible

3. **Authentication**:
   - Always use HTTPS in production
   - Set secure NEXTAUTH_SECRET
   - Configure CORS properly
   - Implement rate limiting

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Node.js version (should be 20.x)
   - Clear cache: `rm -rf .next node_modules`
   - Reinstall dependencies: `npm ci`

2. **Database Connection**:
   - Verify DATABASE_URL is correct
   - Check SSL settings
   - Ensure migrations are up to date

3. **Authentication Issues**:
   - Verify NEXTAUTH_URL matches deployment URL
   - Check NEXTAUTH_SECRET is set
   - Ensure callback URLs are configured

4. **Deployment Issues**:
   - Check Vercel logs
   - Verify environment variables
   - Check GitHub Actions logs
   - Ensure build command is correct

### Debug Commands

```bash
# Check environment
vercel env ls

# View logs
vercel logs

# Check build output
vercel inspect

# Test build locally
vercel build
vercel dev
```

## Support

For deployment issues:
1. Check Vercel status: https://www.vercel-status.com/
2. Review GitHub Actions logs
3. Check Neon database status
4. Contact team lead or DevOps

## Version History

- v1.0.0 - Initial deployment setup with Vercel and GitHub Actions
- Latest updates in this document reflect current deployment configuration

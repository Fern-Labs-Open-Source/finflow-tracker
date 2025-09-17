# Vercel Deployment Guide for FinFlow Tracker

## 📋 Prerequisites

- GitHub account with access to the repository
- Vercel account (free tier works)
- Neon database (already configured in artefacts)

## 🚀 Method 1: One-Click Deploy (Recommended)

1. **Click the Deploy Button**
   
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FFern-Labs-Open-Source%2Ffinflow-tracker&env=DATABASE_URL,NEXTAUTH_SECRET,NEXTAUTH_URL,BYPASS_AUTH&envDescription=Required%20environment%20variables%20for%20FinFlow%20Tracker&envLink=https%3A%2F%2Fgithub.com%2FFern-Labs-Open-Source%2Ffinflow-tracker%2Fblob%2Fmain%2FDEPLOYMENT.md&project-name=finflow-tracker&repository-name=finflow-tracker)

2. **Configure Environment Variables**
   
   When prompted, set these required variables:
   
   ```env
   DATABASE_URL=postgresql://neondb_owner:npg_MCa2yow5epmz@ep-silent-cell-adwln18k-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
   NEXTAUTH_SECRET=af6Ohe4zRy5RUKD9KsT9lBggdvmT3dx5DLCz4KeTKqI=
   NEXTAUTH_URL=https://[your-project-name].vercel.app
   BYPASS_AUTH=false
   ```

3. **Deploy**
   - Click "Deploy" 
   - Wait for the build to complete (typically 2-3 minutes)
   - Your app will be live at `https://[your-project-name].vercel.app`

## 🛠️ Method 2: Manual Import

1. **Go to Vercel Dashboard**
   - Visit [https://vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"

2. **Import Repository**
   - Select "Import from GitHub"
   - Choose: `Fern-Labs-Open-Source/finflow-tracker`
   - Or paste URL: `https://github.com/Fern-Labs-Open-Source/finflow-tracker`

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

4. **Set Environment Variables**
   
   Add these variables in the "Environment Variables" section:
   
   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | `postgresql://neondb_owner:npg_MCa2yow5epmz@ep-silent-cell-adwln18k-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require` |
   | `NEXTAUTH_SECRET` | `af6Ohe4zRy5RUKD9KsT9lBggdvmT3dx5DLCz4KeTKqI=` |
   | `NEXTAUTH_URL` | `https://[your-project-name].vercel.app` |
   | `BYPASS_AUTH` | `false` |
   | `NODE_ENV` | `production` |

5. **Deploy**
   - Click "Deploy"
   - Monitor the build logs
   - Once complete, visit your live app

## 🔧 Post-Deployment Setup

### 1. Update NEXTAUTH_URL

After deployment, update the `NEXTAUTH_URL` with your actual domain:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Edit `NEXTAUTH_URL` to match your deployment URL
3. Redeploy to apply changes

### 2. Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXTAUTH_URL` to use the custom domain

### 3. Set Up GitHub Integration for Auto-Deploy

1. Go to Project Settings → Git
2. Connect to GitHub repository
3. Configure branch deployments:
   - Production: `main` branch
   - Preview: All other branches

## 🔍 Verify Deployment

1. **Check Application Health**
   ```bash
   curl https://[your-project-name].vercel.app/api/health
   ```

2. **Test Authentication**
   - Visit your deployment URL
   - Try to sign in (if BYPASS_AUTH=false)
   - Create a test account

3. **Verify Database Connection**
   - Create a new financial account
   - Add a transaction
   - Check if data persists

## 🐛 Troubleshooting

### Build Fails

**Error**: "Module not found"
- **Solution**: Check if all dependencies are in `package.json`
- Run `npm install` locally and commit `package-lock.json`

**Error**: "Prisma Client not generated"
- **Solution**: Ensure build command includes Prisma generation
- Update build command to: `npx prisma generate && npm run build`

### Runtime Errors

**Error**: "Database connection failed"
- **Solution**: Verify `DATABASE_URL` is correct
- Check if database is accessible from Vercel's IP addresses

**Error**: "Authentication not working"
- **Solution**: 
  - Verify `NEXTAUTH_URL` matches your deployment URL exactly
  - Ensure `NEXTAUTH_SECRET` is set
  - Check browser console for specific errors

### Environment Variables Not Working

- Go to Project Settings → Environment Variables
- Ensure variables are set for the correct environment (Production/Preview/Development)
- Redeploy after changing environment variables

## 📊 Monitoring

### Vercel Analytics

1. Enable Analytics in Project Settings
2. View metrics at: https://vercel.com/[your-username]/[project-name]/analytics

### Function Logs

1. Go to Functions tab in Vercel Dashboard
2. View real-time logs for API routes
3. Set up log drains for external monitoring (optional)

## 🔄 Updates and Rollbacks

### Automatic Updates

With GitHub integration:
- Push to `main` → Automatic production deployment
- Create PR → Automatic preview deployment

### Manual Rollback

1. Go to Deployments tab
2. Find previous working deployment
3. Click "..." menu → "Promote to Production"

## 📝 Important Notes

1. **Database**: The production database URL is for the main Neon branch. For development, use the development branch created earlier.

2. **Secrets**: The `NEXTAUTH_SECRET` provided is for demonstration. Generate a new one for production:
   ```bash
   openssl rand -base64 32
   ```

3. **Authentication**: Set `BYPASS_AUTH=true` for easier testing initially, then switch to `false` for production.

4. **Performance**: Vercel automatically optimizes the Next.js application with:
   - Edge caching
   - Image optimization
   - Code splitting
   - Serverless functions

## 🎉 Success!

Once deployed, your FinFlow Tracker instance will be:
- ✅ Accessible globally via Vercel's CDN
- ✅ Automatically scaled based on traffic
- ✅ Protected with HTTPS
- ✅ Connected to your Neon PostgreSQL database
- ✅ Ready for production use

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables Guide](https://vercel.com/docs/environment-variables)
- [Custom Domains](https://vercel.com/docs/custom-domains)

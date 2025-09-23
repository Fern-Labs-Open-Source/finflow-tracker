# FinFlow Tracker Deployment Guide

## Production Deployment

The FinFlow Tracker application is deployed on **Netlify**.

### Production URL
🌐 **Live Application:** https://finflow-tracker-fern.netlify.app

### Deployment Platform
- **Platform:** Netlify
- **Site Name:** finflow-tracker-fern
- **Project ID:** 8bbd0ece-a773-4c6f-945a-c49bba345a88
- **Admin Dashboard:** https://app.netlify.com/projects/finflow-tracker-fern

## Environment Variables

The following environment variables are configured in Netlify:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string for Neon database |
| `NEXTAUTH_SECRET` | Secret key for NextAuth.js authentication |
| `NEXTAUTH_URL` | Production URL of the application |
| `BYPASS_AUTH` | Set to `false` for production |
| `NODE_ENV` | Set to `production` |

## Deployment Process

### Automatic Deployment (GitHub Integration)
The application is set up for continuous deployment. Any push to the `main` branch will trigger an automatic deployment.

### Manual Deployment via CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Set Authentication:**
   ```bash
   export NETLIFY_AUTH_TOKEN="your-token-here"
   ```

3. **Deploy to Production:**
   ```bash
   netlify deploy --build --prod
   ```

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Fern-Labs-Open-Source/finflow-tracker.git
   cd finflow-tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file with:
   ```
   DATABASE_URL=your-local-database-url
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=http://localhost:3000
   BYPASS_AUTH=true  # For local development without auth
   ```

4. **Run database migrations:**
   ```bash
   npx prisma migrate dev
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

## Updating the Application

### Step 1: Make Changes
Make your changes in the local repository.

### Step 2: Test Locally
```bash
npm run build
npm run start
```

### Step 3: Commit and Push
```bash
git add .
git commit -m "Your descriptive commit message"
git push origin main
```

### Step 4: Automatic Deployment
The push to `main` will trigger automatic deployment on Netlify.

### Step 5: Monitor Deployment
Check the deployment status at: https://app.netlify.com/projects/finflow-tracker-fern/deploys

## Configuration Files

### `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "18"
  NEXT_TELEMETRY_DISABLED = "1"
```

## Troubleshooting

### Build Failures
- Check build logs at: https://app.netlify.com/projects/finflow-tracker-fern/deploys
- Ensure all dependencies are listed in `package.json`
- Verify environment variables are correctly set

### Database Connection Issues
- Ensure `DATABASE_URL` is correctly set in Netlify environment variables
- Check that the Neon database is accessible and running
- Verify SSL mode is set to `require` in the connection string

### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set and matches across environments
- Ensure `NEXTAUTH_URL` matches the deployed URL
- Check that `BYPASS_AUTH` is set to `false` for production

## Monitoring

- **Build Logs:** https://app.netlify.com/projects/finflow-tracker-fern/deploys
- **Function Logs:** https://app.netlify.com/projects/finflow-tracker-fern/logs/functions
- **Edge Function Logs:** https://app.netlify.com/projects/finflow-tracker-fern/logs/edge-functions

## Support

For issues or questions:
1. Check the [GitHub repository](https://github.com/Fern-Labs-Open-Source/finflow-tracker)
2. Review the [Netlify documentation](https://docs.netlify.com/)
3. Check application logs in the Netlify dashboard

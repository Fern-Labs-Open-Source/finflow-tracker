# FinFlow Tracker - Production Deployment Guide

## Prerequisites

### Required Services
- Node.js 18+ runtime environment
- PostgreSQL database (or Neon cloud database)
- Domain with SSL certificate
- Environment for hosting (Vercel, AWS, DigitalOcean, etc.)

### Required Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# Authentication
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-a-secure-random-string"

# Application
NODE_ENV="production"
BYPASS_AUTH="false"

# Optional
SENTRY_DSN="your-sentry-dsn-for-error-tracking"
ANALYTICS_ID="your-analytics-id"
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Link project
   vercel link
   ```

2. **Configure Environment Variables**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add all required environment variables
   - Ensure `BYPASS_AUTH=false` for production

3. **Deploy**
   ```bash
   # Deploy to production
   vercel --prod
   
   # Or use GitHub integration for automatic deployments
   ```

### Option 2: Docker Deployment

1. **Build Docker Image**
   ```dockerfile
   # Dockerfile
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npx prisma generate
   RUN npm run build

   FROM node:18-alpine
   WORKDIR /app
   COPY --from=builder /app/.next ./.next
   COPY --from=builder /app/node_modules ./node_modules
   COPY --from=builder /app/package*.json ./
   COPY --from=builder /app/prisma ./prisma
   COPY --from=builder /app/public ./public

   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and Run**
   ```bash
   docker build -t finflow-tracker .
   docker run -p 3000:3000 --env-file .env.production finflow-tracker
   ```

### Option 3: Traditional VPS Deployment

1. **Server Setup**
   ```bash
   # SSH into your server
   ssh user@your-server.com
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   npm install -g pm2
   
   # Clone repository
   git clone https://github.com/your-org/finflow-tracker.git
   cd finflow-tracker
   ```

2. **Install Dependencies & Build**
   ```bash
   # Install dependencies
   npm ci
   
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate deploy
   
   # Build application
   npm run build
   ```

3. **Start with PM2**
   ```bash
   # Create ecosystem file
   cat > ecosystem.config.js << EOF
   module.exports = {
     apps: [{
       name: 'finflow-tracker',
       script: 'npm',
       args: 'start',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       }
     }]
   }
   EOF
   
   # Start application
   pm2 start ecosystem.config.js
   
   # Save PM2 configuration
   pm2 save
   pm2 startup
   ```

## Database Setup

### Production Database Migration

1. **Backup Existing Data** (if applicable)
   ```bash
   pg_dump $OLD_DATABASE_URL > backup.sql
   ```

2. **Run Migrations**
   ```bash
   # Set production database URL
   export DATABASE_URL="your-production-database-url"
   
   # Run migrations
   npx prisma migrate deploy
   
   # Verify schema
   npx prisma db pull
   ```

3. **Seed Initial Data** (optional)
   ```bash
   # Create initial institutions/accounts if needed
   npx tsx scripts/seed-production.ts
   ```

### Database Optimization

1. **Add Indexes**
   ```sql
   -- Add indexes for frequently queried fields
   CREATE INDEX idx_snapshots_account_date ON account_snapshots(account_id, date DESC);
   CREATE INDEX idx_accounts_institution ON accounts(institution_id);
   CREATE INDEX idx_exchange_rates_date ON exchange_rates(date DESC);
   ```

2. **Connection Pooling**
   - Use PgBouncer for connection pooling
   - Or use Prisma's connection pool settings:
   ```
   DATABASE_URL="postgresql://...?connection_limit=10&pool_timeout=20"
   ```

## Security Checklist

### Pre-Deployment

- [ ] **Environment Variables**
  - [ ] Set `NODE_ENV=production`
  - [ ] Set `BYPASS_AUTH=false`
  - [ ] Generate secure `NEXTAUTH_SECRET`
  - [ ] Verify database SSL mode

- [ ] **Authentication**
  - [ ] Configure production auth provider
  - [ ] Set correct callback URLs
  - [ ] Test login/logout flow

- [ ] **API Security**
  - [ ] Verify all endpoints require authentication
  - [ ] Check rate limiting is configured
  - [ ] Validate CORS settings

- [ ] **Data Protection**
  - [ ] Enable HTTPS only
  - [ ] Set secure headers
  - [ ] Configure CSP policy

### Nginx Configuration (if using)

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Performance Optimization

### Caching Strategy

1. **CDN Configuration**
   - Static assets: Cache for 1 year
   - API responses: Cache based on endpoint
   - HTML pages: Cache for 5 minutes

2. **Redis Setup** (optional)
   ```bash
   # Install Redis
   sudo apt-get install redis-server
   
   # Configure for session storage
   # Add to .env
   REDIS_URL="redis://localhost:6379"
   ```

3. **Image Optimization**
   - Use Next.js Image component
   - Configure image domains in next.config.js
   - Consider using image CDN

### Monitoring & Logging

1. **Application Monitoring**
   ```bash
   # Install monitoring dependencies
   npm install @sentry/nextjs
   
   # Configure Sentry
   npx @sentry/wizard -i nextjs
   ```

2. **Performance Monitoring**
   - Set up Google Analytics or Plausible
   - Configure Web Vitals reporting
   - Monitor API response times

3. **Error Tracking**
   - Configure Sentry for error tracking
   - Set up alerts for critical errors
   - Monitor error rates

4. **Logging**
   ```javascript
   // Configure structured logging
   import winston from 'winston';
   
   const logger = winston.createLogger({
     level: 'info',
     format: winston.format.json(),
     transports: [
       new winston.transports.File({ filename: 'error.log', level: 'error' }),
       new winston.transports.File({ filename: 'combined.log' })
     ]
   });
   ```

## Post-Deployment

### Verification Checklist

- [ ] **Functionality Testing**
  - [ ] User registration/login works
  - [ ] Account creation and editing
  - [ ] Balance updates create snapshots
  - [ ] Search and filtering work
  - [ ] Data export functions

- [ ] **Performance Testing**
  - [ ] Page load times < 3 seconds
  - [ ] API responses < 500ms
  - [ ] Smooth animations (60 FPS)
  - [ ] Mobile performance acceptable

- [ ] **Security Testing**
  - [ ] HTTPS enforced
  - [ ] Authentication required for protected routes
  - [ ] No sensitive data in responses
  - [ ] CORS properly configured

### Maintenance Tasks

1. **Regular Backups**
   ```bash
   # Daily backup script
   #!/bin/bash
   DATE=$(date +%Y%m%d)
   pg_dump $DATABASE_URL > backup_$DATE.sql
   # Upload to S3 or other storage
   ```

2. **Database Maintenance**
   ```sql
   -- Weekly maintenance
   VACUUM ANALYZE;
   REINDEX DATABASE finflow;
   ```

3. **Dependency Updates**
   ```bash
   # Monthly security updates
   npm audit fix
   npm update
   ```

## Rollback Plan

### Quick Rollback

1. **Vercel**: Use instant rollback feature
2. **Docker**: Switch to previous image tag
3. **Traditional**: 
   ```bash
   # Revert to previous commit
   git checkout [previous-commit]
   npm run build
   pm2 restart finflow-tracker
   ```

### Database Rollback

```bash
# Restore from backup
psql $DATABASE_URL < backup.sql

# Or rollback migration
npx prisma migrate rollback
```

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancing**
   - Use Nginx or HAProxy
   - Configure sticky sessions for auth
   - Health check endpoints

2. **Database Scaling**
   - Read replicas for queries
   - Connection pooling
   - Consider sharding for large datasets

3. **Caching Layer**
   - Redis for session storage
   - CDN for static assets
   - API response caching

### Vertical Scaling

- Monitor CPU and memory usage
- Upgrade server resources as needed
- Optimize database queries
- Implement pagination for large datasets

## Support & Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check DATABASE_URL format
   - Verify SSL certificates
   - Check connection limits

2. **Authentication Problems**
   - Verify NEXTAUTH_URL matches domain
   - Check NEXTAUTH_SECRET is set
   - Confirm callback URLs

3. **Performance Issues**
   - Check database indexes
   - Monitor API response times
   - Review caching configuration

### Getting Help

- GitHub Issues: [github.com/your-org/finflow-tracker/issues](https://github.com)
- Documentation: [docs/](./docs/)
- Logs: Check application and server logs

## Final Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database migrated and backed up
- [ ] SSL certificate installed
- [ ] Authentication tested
- [ ] Monitoring configured
- [ ] Error tracking enabled
- [ ] Backup strategy implemented
- [ ] Team trained on deployment process
- [ ] Rollback plan documented and tested
- [ ] Performance benchmarks met

## Conclusion

Your FinFlow Tracker application is now ready for production deployment. Follow this guide carefully, test thoroughly, and monitor closely during the initial deployment phase. 

Good luck with your deployment! 🚀

# Local Development Setup Guide

## Overview
This guide explains how to set up FinFlow Tracker for local development with proper separation from production.

## Prerequisites
- Node.js 18+ installed
- PostgreSQL 15+ installed locally
- Git configured

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/Fern-Labs-Open-Source/finflow-tracker.git
cd finflow-tracker
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Local Database

#### Install PostgreSQL (if not already installed)
```bash
# On Debian/Ubuntu
sudo apt-get update
sudo apt-get install -y postgresql postgresql-client

# Start PostgreSQL service
sudo service postgresql start
```

#### Create Local Database
```bash
# Create database
sudo -u postgres createdb finflow_dev

# Create user with password
sudo -u postgres psql -c "CREATE USER finflow_user WITH PASSWORD 'localdev123';"

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE finflow_dev TO finflow_user;"
sudo -u postgres psql finflow_dev -c "GRANT ALL ON SCHEMA public TO finflow_user;"

# Configure PostgreSQL for password authentication
echo "host    all             all             127.0.0.1/32            md5" | sudo tee -a /etc/postgresql/15/main/pg_hba.conf
sudo service postgresql restart
```

### 4. Configure Environment Variables

Create `.env.local` file (or copy from `.env.example`):
```bash
cp .env.example .env.local
```

Edit `.env.local` with your local settings:
```env
# Local Development Environment Configuration
# This uses a local PostgreSQL database, separate from production

# Local PostgreSQL Database
DATABASE_URL=postgresql://finflow_user:localdev123@localhost:5432/finflow_dev

# NextAuth Configuration for local development
NEXTAUTH_SECRET=dev-secret-please-change-for-production
NEXTAUTH_URL=http://localhost:3000

# OAuth (optional for local development - can use BYPASS_AUTH instead)
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here

# Development Settings
BYPASS_AUTH=true  # Set to true to skip authentication in development
NODE_ENV=development
```

### 5. Run Database Migrations
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed database with sample data
npx prisma db seed
```

### 6. Start Development Server
```bash
npm run dev
```

The application will be available at http://localhost:3000

## Development Workflow

### Making Changes
1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and test locally

3. Run tests:
   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

4. Commit changes:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

5. Push and create PR:
   ```bash
   git push origin feature/your-feature-name
   ```

### Database Development

#### Creating New Migrations
```bash
# Create a new migration after schema changes
npx prisma migrate dev --name your_migration_name

# This will:
# 1. Generate SQL migration file
# 2. Apply migration to local database
# 3. Regenerate Prisma Client
```

#### Viewing Database
```bash
# Open Prisma Studio (GUI for database)
npx prisma studio
```

#### Resetting Database
```bash
# Reset database (drops all data)
npx prisma migrate reset

# This will:
# 1. Drop the database
# 2. Create a new database
# 3. Run all migrations
# 4. Run seed script (if configured)
```

## Environment Configuration

### Key Environment Variables

| Variable | Development | Production | Description |
|----------|------------|------------|-------------|
| `DATABASE_URL` | Local PostgreSQL | Neon PostgreSQL | Database connection string |
| `NEXTAUTH_SECRET` | Dev secret | Secure random | Authentication secret |
| `NEXTAUTH_URL` | http://localhost:3000 | https://your-domain.com | Application URL |
| `BYPASS_AUTH` | true (optional) | false (always) | Skip authentication |
| `NODE_ENV` | development | production | Environment mode |

### Important Notes
- **Never use production database for local development**
- **Never commit `.env.local` or any `.env` file with real credentials**
- **Always use different secrets for development and production**
- **Keep BYPASS_AUTH=false in production**

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Test database connection
psql -U finflow_user -d finflow_dev -h localhost

# Check environment variables
echo $DATABASE_URL
grep DATABASE_URL .env.local
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Prisma Client Issues
```bash
# Regenerate Prisma Client
npm run prisma:generate

# Clear cache and reinstall
rm -rf node_modules/.prisma
npm install
npm run prisma:generate
```

### Authentication Issues
For local development, you can:
1. Set `BYPASS_AUTH=true` to skip authentication
2. Configure OAuth providers with test credentials
3. Use test accounts for development

## Available Scripts

```bash
# Development
npm run dev           # Start development server
npm run build        # Build for production
npm start            # Start production server

# Database
npm run prisma:generate    # Generate Prisma Client
npm run prisma:migrate     # Run migrations
npm run prisma:studio      # Open database GUI

# Testing & Quality
npm test             # Run tests
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript types

# Utilities
npm run clean        # Clean build artifacts
```

## Project Structure

```
finflow-tracker/
├── app/              # Next.js app directory
├── src/              # Source code
│   ├── components/   # React components
│   ├── lib/         # Utilities and libraries
│   └── types/       # TypeScript types
├── prisma/          # Database schema and migrations
├── public/          # Static assets
├── tests/           # Test files
├── docs/            # Documentation
└── .env.example     # Environment template
```

## Best Practices

1. **Environment Separation**
   - Always use local database for development
   - Never mix production and development data
   - Use different API keys/secrets per environment

2. **Database Management**
   - Create migrations for all schema changes
   - Test migrations locally before deploying
   - Keep migrations small and focused

3. **Code Quality**
   - Run tests before committing
   - Fix linting issues
   - Keep TypeScript types updated

4. **Security**
   - Never commit secrets
   - Use environment variables
   - Keep dependencies updated

## Getting Help

- Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for deployment information
- View [README.md](../README.md) for project overview
- Create an issue on GitHub for bugs or questions
- Review existing issues before creating new ones

## Next Steps

After setting up local development:
1. Explore the codebase
2. Run the application locally
3. Make a small change to test the workflow
4. Review the deployment guide for production setup

# FinFlow Tracker - Development Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Code Guidelines](#code-guidelines)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Contributing](#contributing)
9. [Documentation Management](#documentation-management)

---

## Important Notice: Documentation Updates

**⚠️ IMPORTANT**: If you wish to add documentation or update the specification, you must update one of these three files only:
- `docs/SPECIFICATION.md` - For product and technical specifications
- `docs/CURRENT_STATE.md` - For implementation status and progress
- `docs/DEVELOPMENT.md` - For development guidelines and contribution instructions

Do not create additional markdown files in the root directory or docs folder. All documentation must be consolidated in these three files to maintain clarity and prevent documentation fragmentation.

---

## Getting Started

### Prerequisites
Before you begin, ensure you have the following installed:
- **Node.js** 20.x or higher (LTS recommended)
- **npm** 10.x or higher
- **Git** 2.x or higher
- **PostgreSQL** client tools (optional, for direct DB access)

### Required Accounts
- **GitHub** account (for repository access)
- **Vercel** account (free tier, for deployment)
- **Neon** database account (free tier, for PostgreSQL hosting)
- **Google Cloud** console access (optional, for OAuth)

---

## Development Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/Fern-Labs-Open-Source/finflow-tracker.git
cd finflow-tracker

# Or if you're working in the Fern environment
cd /root/finflow-tracker
```

### 2. Install Dependencies

```bash
# Install all npm packages
npm install

# Generate Prisma client
npx prisma generate
```

### 3. Configure Environment

Create a `.env.local` file in the project root:

```bash
# Copy the template
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Authentication
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Development Mode (optional)
BYPASS_AUTH="true"  # Set to bypass auth in development

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Exchange Rate API
EXCHANGE_RATE_API_URL="https://api.exchangerate-api.com/v4/latest/EUR"
```

#### Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

### 4. Database Setup

#### Using Neon (Recommended)
1. Create a free account at https://neon.tech
2. Create a new project
3. Copy the connection string to `DATABASE_URL`

#### Local PostgreSQL (Alternative)
```bash
# Create database
createdb finflow_tracker

# Run migrations
npx prisma db push

# Seed sample data (optional)
npm run db:seed
```

### 5. Git Authentication Setup

If you need to push changes to GitHub:

```bash
# Run the setup script
./scripts/setup-git-auth.sh

# Or manually configure
git config user.name "Your Name"
git config user.email "your-email@example.com"

# For authentication, use GitHub token
git remote set-url origin https://<token>@github.com/Fern-Labs-Open-Source/finflow-tracker.git
```

### 6. Start Development Server

```bash
# Start the development server
npm run dev

# The app will be available at http://localhost:3000
```

### 7. Verify Setup

1. Open http://localhost:3000
2. Register a new account or use bypass auth
3. Create a test institution and account
4. Verify data saves and displays correctly

---

## Project Structure

```
finflow-tracker/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── api/                # API routes
│   │   ├── auth/               # Authentication pages
│   │   ├── dashboard/          # Main dashboard
│   │   ├── accounts/           # Account management
│   │   └── layout.tsx          # Root layout
│   │
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── charts/             # Chart components
│   │   └── layout/             # Layout components
│   │
│   ├── lib/                    # Utility libraries
│   │   ├── prisma.ts           # Database client
│   │   ├── auth.ts             # Auth configuration
│   │   └── utils.ts            # Helper functions
│   │
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript type definitions
│   └── styles/                 # Global styles
│
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Database seeder
│
├── public/                     # Static assets
├── scripts/                    # Utility scripts
├── docs/                       # Documentation (3 files only!)
│   ├── SPECIFICATION.md        # Project specifications
│   ├── CURRENT_STATE.md        # Implementation status
│   └── DEVELOPMENT.md          # This file
│
└── config files                # Various configuration files
```

---

## Development Workflow

### Git Workflow

#### Branch Strategy
```bash
main                    # Production-ready code
├── develop            # Integration branch
└── feature/*          # Feature branches
```

#### Creating a Feature Branch
```bash
# Create and checkout a new feature branch
git checkout -b feature/your-feature-name

# Make your changes
git add .
git commit -m "feat: add new feature"

# Push to GitHub
git push origin feature/your-feature-name
```

#### Commit Message Convention
Follow the Conventional Commits specification:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only (use sparingly - update the 3 main docs)
- `style:` Code style changes
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Adding tests
- `chore:` Maintenance tasks

### Code Development Process

1. **Plan Your Feature**
   - Review `SPECIFICATION.md` for requirements
   - Check `CURRENT_STATE.md` for existing implementation
   - Create a feature branch

2. **Implement the Feature**
   - Write TypeScript code with proper types
   - Follow the existing code style
   - Add appropriate error handling
   - Include loading states for async operations

3. **Test Your Changes**
   - Run the development server
   - Test all affected features
   - Check responsive design
   - Verify database operations

4. **Update Documentation**
   - Update `CURRENT_STATE.md` if implementing new features
   - Update `DEVELOPMENT.md` if changing development process
   - Update `SPECIFICATION.md` only if requirements change

5. **Create Pull Request**
   - Push your branch
   - Create PR with clear description
   - Link any related issues
   - Wait for review

### Database Development

#### Making Schema Changes
```bash
# Edit prisma/schema.prisma

# Create migration
npx prisma migrate dev --name descriptive_name

# Apply to database
npx prisma db push

# Generate client
npx prisma generate
```

#### Database Commands
```bash
# View database in Prisma Studio
npx prisma studio

# Reset database (CAUTION: deletes all data)
npx prisma db push --force-reset

# Seed sample data
npm run db:seed
```

---

## Code Guidelines

### TypeScript Best Practices

1. **Always use TypeScript**
   - Define interfaces for all data structures
   - Avoid `any` type
   - Use proper return types for functions

2. **Type Examples**
```typescript
// Good
interface Account {
  id: string;
  name: string;
  balance: number;
  currency: Currency;
}

// Bad
const account: any = { ... };
```

### React Component Guidelines

1. **Functional Components Only**
```tsx
// Good
export function AccountCard({ account }: { account: Account }) {
  return <div>...</div>;
}

// Avoid class components
```

2. **Use Hooks Properly**
```tsx
// Custom hooks in src/hooks/
export function useAccounts() {
  return useSWR('/api/accounts', fetcher);
}
```

3. **Component Organization**
```tsx
// 1. Imports
// 2. Type definitions
// 3. Component function
// 4. Helper functions
// 5. Exports
```

### API Route Guidelines

1. **Consistent Error Handling**
```typescript
export async function GET(request: Request) {
  try {
    // Validate user session
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Business logic
    const data = await prisma.account.findMany({
      where: { userId: session.user.id }
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

2. **Input Validation**
```typescript
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1).max(100),
  balance: z.number().min(0),
  currency: z.enum(['EUR', 'GBP', 'SEK', 'USD'])
});

// In your API route
const body = await request.json();
const validated = schema.parse(body);
```

### Styling Guidelines

1. **Use Tailwind CSS**
```tsx
// Good
<div className="flex items-center justify-between p-4">

// Avoid inline styles
<div style={{ display: 'flex' }}>  // Bad
```

2. **Component Styling Pattern**
```tsx
// Use cn() for conditional classes
import { cn } from '@/lib/utils';

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  isError && "error-classes"
)}>
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- accounts.test.ts

# Run with coverage
npm run test:coverage
```

### Writing Tests

#### Unit Tests
```typescript
// src/__tests__/utils.test.ts
import { formatCurrency } from '@/lib/utils';

describe('formatCurrency', () => {
  it('formats EUR correctly', () => {
    expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
  });
});
```

#### API Route Tests
```typescript
// src/__tests__/api/accounts.test.ts
import { GET } from '@/app/api/accounts/route';

describe('GET /api/accounts', () => {
  it('returns accounts for authenticated user', async () => {
    const response = await GET(mockRequest);
    expect(response.status).toBe(200);
  });
});
```

### Manual Testing Checklist

Before submitting a PR, manually test:
- [ ] User registration and login
- [ ] Creating/editing/deleting accounts
- [ ] Balance updates and snapshots
- [ ] Chart displays correctly
- [ ] Mobile responsive design
- [ ] Error states display properly
- [ ] Loading states show appropriately

---

## Deployment

### Deploying to Vercel

#### Automatic Deployment (Recommended)
1. Push to `main` branch
2. Vercel automatically deploys
3. Check deployment at https://finflow-tracker.vercel.app

#### Manual Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Environment Variables for Production

Required environment variables:
```env
DATABASE_URL          # PostgreSQL connection string
NEXTAUTH_SECRET      # Generated secret (32+ chars)
NEXTAUTH_URL         # Your production URL
BYPASS_AUTH          # Set to "false" in production
```

Optional OAuth configuration:
```env
GOOGLE_CLIENT_ID     # From Google Cloud Console
GOOGLE_CLIENT_SECRET # From Google Cloud Console
GITHUB_CLIENT_ID     # From GitHub OAuth Apps
GITHUB_CLIENT_SECRET # From GitHub OAuth Apps
```

### Pre-deployment Checklist

- [ ] All tests passing
- [ ] Build completes successfully (`npm run build`)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] OAuth redirect URLs updated (if using)
- [ ] BYPASS_AUTH set to false
- [ ] Documentation updated

### Deployment Commands

```bash
# Build for production
npm run build

# Start production server locally
npm start

# Check for type errors
npm run type-check

# Lint code
npm run lint

# Run pre-deployment checks
npm run precommit
```

---

## Contributing

### How to Contribute

1. **Find an Issue**
   - Check existing issues on GitHub
   - Or identify a bug/feature to work on

2. **Discuss First**
   - Comment on the issue
   - Propose your solution
   - Wait for approval before starting major work

3. **Fork and Develop**
   - Fork the repository
   - Create a feature branch
   - Make your changes
   - Test thoroughly

4. **Submit PR**
   - Clear description of changes
   - Link related issues
   - Include screenshots for UI changes
   - Update documentation in the 3 main docs

### Code Review Process

Your PR will be reviewed for:
- Code quality and TypeScript usage
- Performance implications
- Security considerations
- Test coverage
- Documentation updates

### Development Best Practices

1. **Performance First**
   - Minimize bundle size
   - Optimize database queries
   - Use proper caching strategies
   - Lazy load when possible

2. **Security Always**
   - Never commit secrets
   - Validate all inputs
   - Use parameterized queries
   - Check user authorization

3. **User Experience**
   - Provide loading states
   - Handle errors gracefully
   - Make it responsive
   - Test on multiple browsers

4. **Code Quality**
   - Write self-documenting code
   - Add comments for complex logic
   - Keep functions small and focused
   - Follow DRY principle

---

## Documentation Management

### Documentation Structure

All project documentation is consolidated into three files:

1. **`docs/SPECIFICATION.md`**
   - Product requirements
   - Technical architecture
   - API specifications
   - Database schema
   - Security requirements

2. **`docs/CURRENT_STATE.md`**
   - Implementation status
   - Completed features
   - Performance metrics
   - Known issues
   - Deployment status

3. **`docs/DEVELOPMENT.md`** (This file)
   - Development setup
   - Code guidelines
   - Testing procedures
   - Deployment instructions
   - Contribution guide

### When to Update Documentation

- **New Feature**: Update `CURRENT_STATE.md` when implemented
- **Requirement Change**: Update `SPECIFICATION.md` with approval
- **Process Change**: Update `DEVELOPMENT.md` for dev workflow
- **Bug Discovery**: Add to Known Issues in `CURRENT_STATE.md`
- **Performance Improvement**: Update metrics in `CURRENT_STATE.md`

### Documentation Guidelines

1. **Keep it Current**: Update docs with your code changes
2. **Be Concise**: Clear and to the point
3. **Use Examples**: Show, don't just tell
4. **Stay Organized**: Follow existing structure
5. **No Redundancy**: Don't duplicate information

---

## Troubleshooting

### Common Issues and Solutions

#### Database Connection Issues
```bash
# Error: Can't connect to database
# Solution: Check DATABASE_URL format
postgresql://user:password@host:5432/dbname?sslmode=require

# Verify connection
npx prisma db pull
```

#### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

#### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

#### Authentication Issues
```bash
# In development, bypass auth
BYPASS_AUTH=true npm run dev

# Check NEXTAUTH_URL matches your URL
NEXTAUTH_URL=http://localhost:3000
```

### Getting Help

1. **Check Documentation**: Review the three main docs
2. **GitHub Issues**: Search existing issues
3. **Create Issue**: If bug found, create detailed issue
4. **Pull Request**: For questions about PRs

---

## Scripts Reference

### Package.json Scripts

```json
{
  "dev": "Start development server",
  "build": "Build for production",
  "start": "Start production server",
  "lint": "Run ESLint",
  "type-check": "Check TypeScript types",
  "test": "Run tests",
  "test:watch": "Run tests in watch mode",
  "test:coverage": "Generate coverage report",
  "db:push": "Push schema to database",
  "db:seed": "Seed sample data",
  "db:studio": "Open Prisma Studio",
  "precommit": "Run all checks before commit"
}
```

### Utility Scripts

```bash
# Git authentication setup
./scripts/setup-git-auth.sh

# Database backup
./scripts/backup-db.sh

# Generate test data
./scripts/generate-test-data.sh
```

---

## Additional Resources

### Internal Documentation
- [Specification](./SPECIFICATION.md) - Complete project requirements
- [Current State](./CURRENT_STATE.md) - Implementation status
- [README](../README.md) - Project overview

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [NextAuth.js](https://next-auth.js.org)

### Development Tools
- [Prisma Studio](https://www.prisma.io/studio) - Database GUI
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Vercel CLI](https://vercel.com/cli)
- [Thunder Client](https://www.thunderclient.com) - API testing

---

## License

This project is open source. See the LICENSE file for details.

---

## Contact

For questions or support related to development:
- Create an issue on GitHub
- Check existing documentation first
- Provide detailed information about your issue

Remember: Keep all documentation updates in the three main files!

# Development Specification - FinFlow Tracker

## Repository Structure

```
finflow-tracker/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                 # Main CI pipeline
│   │   ├── security.yml           # Security scanning (CRITICAL)
│   │   └── deploy.yml             # Production deployment
│   └── pull_request_template.md
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API routes (ALL MUST BE PROTECTED)
│   │   │   ├── auth/
│   │   │   ├── accounts/
│   │   │   ├── institutions/
│   │   │   ├── brokerage/
│   │   │   ├── portfolio/
│   │   │   ├── exchange/
│   │   │   └── export/
│   │   ├── (auth)/               # Auth-protected pages
│   │   │   ├── dashboard/
│   │   │   ├── accounts/
│   │   │   └── analytics/
│   │   ├── login/
│   │   └── layout.tsx
│   ├── components/               # React components
│   │   ├── ui/                  # Base UI components (shadcn/ui)
│   │   ├── charts/              # Chart components (Recharts)
│   │   ├── forms/               # Form components
│   │   └── layout/              # Layout components
│   ├── lib/                     # Utilities and libraries
│   │   ├── auth.ts              # Authentication helpers
│   │   ├── db.ts                # Database client (Prisma)
│   │   ├── exchange-rates.ts    # Exchange rate utilities
│   │   ├── validators.ts        # Zod input validators
│   │   └── security.ts          # Security utilities
│   ├── hooks/                   # Custom React hooks
│   ├── types/                   # TypeScript type definitions
│   └── styles/                  # Global styles (Tailwind)
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Database migrations
├── public/                      # Static assets (minimal)
├── tests/
│   ├── unit/                   # Unit tests
│   ├── integration/             # Integration tests
│   └── e2e/                     # End-to-end tests
├── scripts/
│   ├── setup-dev.sh             # Development setup script
│   ├── setup-admin.js           # Create admin user securely
│   └── check-env.js             # Environment validation
├── docs/
│   ├── PRODUCT_SPEC.md
│   ├── TECHNICAL_SPEC.md
│   ├── DEVELOPMENT_SPEC.md
│   └── CONTRIBUTING.md          # Contributing guidelines
├── .env.example                 # Environment template (NO SECRETS!)
├── .gitignore
├── .gitleaksignore             # Gitleaks configuration
├── .eslintrc.json              # ESLint configuration
├── .prettierrc                 # Prettier configuration
├── next.config.js              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── package.json
└── README.md
```

## Development Workflow

### 1. Branch Strategy

```mermaid
gitGraph
    commit id: "main"
    branch feature/add-account-type
    checkout feature/add-account-type
    commit id: "Add account model"
    commit id: "Add UI component"
    commit id: "Add tests"
    checkout main
    merge feature/add-account-type
    branch fix/calculation-error
    checkout fix/calculation-error
    commit id: "Fix calculation"
    checkout main
    merge fix/calculation-error
```

**Branch Naming Convention:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates
- `ci/` - CI/CD updates

### 2. Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions or corrections
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Other changes

**Examples:**
```bash
feat(accounts): add support for crypto wallets
fix(charts): correct EUR conversion in historical data
docs(api): update authentication endpoints documentation
```

### 3. Pull Request Process

#### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] No secrets in code
```

#### Review Process
1. Create feature branch
2. Make changes with tests
3. Run local checks: `npm run pre-commit`
4. Create PR with description
5. Wait for CI checks
6. Address review comments
7. Merge after approval

## CI/CD Pipeline

### GitHub Actions Workflows

#### 1. Main CI Pipeline (`.github/workflows/ci.yml`)
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # Security check FIRST - fail fast if secrets detected
  security-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check for secrets
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
  lint:
    needs: security-check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check

  test:
    needs: security-check
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      - run: npm test
      - run: npm run test:integration

  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
```

#### 2. Security Scanning (`.github/workflows/security.yml`)
```yaml
name: Security Audit

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1'  # Weekly on Monday

jobs:
  # CRITICAL: Detect exposed secrets
  secret-scanning:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Full history for better detection
      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - name: Check .env.example
        run: |
          if grep -E "(password|secret|key|token)=" .env.example; then
            echo "ERROR: .env.example contains sensitive-looking values!"
            exit 1
          fi

  dependency-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm audit --audit-level=moderate
      - name: Check for known vulnerabilities
        run: npm audit --json | jq '.vulnerabilities | length' | xargs -I {} test {} -eq 0

  code-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check for hardcoded secrets
        run: |
          # Check for common secret patterns
          ! grep -r "ADMIN_PASSWORD\|DATABASE_URL\|NEXTAUTH_SECRET" --include="*.ts" --include="*.tsx" --include="*.js" src/
```

#### 3. Deployment (`.github/workflows/deploy.yml`)
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Development Environment Setup

### Prerequisites
```bash
# Required software
Node.js 20+ (LTS)
npm 10+
Git 2.30+
PostgreSQL 15+ (or Neon account)
VS Code (recommended)
```

### Initial Setup Script
```bash
#!/bin/bash
# scripts/setup-dev.sh

echo "🚀 Setting up FinFlow Tracker development environment..."

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 20+ required"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup environment
echo "🔧 Setting up environment..."
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "⚠️  Please update .env.local with your configuration"
fi

# Setup database
echo "🗄️ Setting up database..."
npx prisma generate
npx prisma migrate dev

# Run initial checks
echo "✅ Running initial checks..."
npm run lint
npm run type-check
npm run test

echo "✨ Setup complete! Run 'npm run dev' to start developing"
```

### VS Code Configuration

#### `.vscode/settings.json`
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.exclude": {
    "**/.git": true,
    "**/.DS_Store": true,
    "**/node_modules": true,
    "**/.next": true
  }
}
```

#### `.vscode/extensions.json`
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

## Code Quality Standards

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### ESLint Rules
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### Pre-commit Hooks

#### `.husky/pre-commit`
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run linting
npm run lint

# Run type checking
npm run type-check

# Check for secrets
npx gitleaks detect --source . --verbose

# Run tests for changed files
npm run test:changed
```

## Testing Strategy

### Unit Testing
```typescript
// Example: lib/exchange-rates.test.ts
import { convertCurrency } from './exchange-rates';

describe('convertCurrency', () => {
  it('should convert EUR to GBP correctly', () => {
    const result = convertCurrency(100, 'EUR', 'GBP', 0.86);
    expect(result).toBe(86);
  });
});
```

### Integration Testing
```typescript
// Example: app/api/accounts/route.test.ts
import { createMocks } from 'node-mocks-http';
import handler from './route';

describe('/api/accounts', () => {
  it('should create new account', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { name: 'Test Account', type: 'cash' }
    });
    
    await handler(req, res);
    expect(res._getStatusCode()).toBe(201);
  });
});
```

### E2E Testing
```typescript
// Example: tests/e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="username"]', 'testuser');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

## Contributing Guidelines

### For Human Contributors

1. **Fork & Clone**: Fork the repository and clone locally
2. **Branch**: Create a feature branch from `main`
3. **Develop**: Make changes following code standards
4. **Test**: Write/update tests for your changes
5. **Document**: Update documentation if needed
6. **Commit**: Use conventional commits
7. **Push**: Push to your fork
8. **PR**: Create a pull request with description

### For AI Agents

1. **Context**: Read all specification documents first
2. **Branch**: Always work in feature branches
3. **Small Changes**: Make focused, atomic commits
4. **Test First**: Write tests before implementation
5. **Document**: Add clear comments for complex logic
6. **Validate**: Run all checks before pushing
7. **Description**: Provide detailed PR descriptions

### Code Review Checklist

- [ ] Code follows project style guide
- [ ] All tests pass
- [ ] No hardcoded secrets
- [ ] Documentation updated
- [ ] Performance impact considered
- [ ] Security implications reviewed
- [ ] Database migrations tested
- [ ] Error handling implemented
- [ ] Accessibility maintained

## Security Practices (CRITICAL)

### NEVER Commit (Will Fail CI)
- API keys or tokens
- Database credentials  
- JWT secrets or NEXTAUTH_SECRET
- Admin username/password (even hashed)
- Personal financial data
- `.env.local` or any `.env` files with values
- Exchange rate API keys

### Security Checklist for Every PR
- [ ] No hardcoded credentials anywhere
- [ ] All API routes use `withAuth` middleware
- [ ] Input validation with Zod schemas
- [ ] No console.log of sensitive data
- [ ] Environment variables properly used
- [ ] Dependencies audited (npm audit)
- [ ] No SQL string concatenation

### Required Security Measures
```typescript
// ALWAYS protect API routes
export default withAuth(async function handler(req, res) {
  // Your code here
});

// ALWAYS validate inputs
const validated = accountUpdateSchema.parse(req.body);

// ALWAYS use parameterized queries (Prisma does this)
await prisma.account.update({
  where: { id: accountId },
  data: validated
});

// NEVER log sensitive data
console.log('User logged in'); // OK
console.log(`Password: ${password}`); // NEVER DO THIS
```

## Performance Guidelines

### Frontend
- Lazy load components
- Optimize images
- Minimize bundle size
- Use React.memo wisely
- Implement virtual scrolling for large lists

### Backend
- Use database indexes
- Implement caching
- Paginate large datasets
- Optimize queries
- Use connection pooling

### Monitoring
- Track Core Web Vitals
- Monitor API response times
- Log error rates
- Track database query performance
- Monitor memory usage

## Documentation Standards

### Code Comments
```typescript
/**
 * Converts amount from one currency to another
 * @param amount - The amount to convert
 * @param from - Source currency code
 * @param to - Target currency code
 * @param rate - Exchange rate (optional, fetches if not provided)
 * @returns Converted amount in target currency
 */
export async function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  rate?: number
): Promise<number> {
  // Implementation
}
```

### API Documentation
- Use OpenAPI/Swagger format
- Include request/response examples
- Document error responses
- Specify rate limits
- Note authentication requirements

## Deployment Checklist

- [ ] All tests pass
- [ ] Security scan complete
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Performance testing done
- [ ] Documentation updated
- [ ] Monitoring configured
- [ ] Backup strategy confirmed
- [ ] Rollback plan ready
- [ ] Stakeholders notified

## Implementation Lessons Learned (September 2024)

### Key Success Factors
1. **Test Infrastructure First**: Setting up auth bypass headers (`X-Test-Bypass-Auth`) early made development significantly faster
2. **Comprehensive Seed Data**: Realistic test data (30 days of portfolio history) helped identify edge cases early
3. **Service Layer Pattern**: Abstracting business logic into services (`/src/lib/services/`) improved maintainability
4. **Type Safety**: Prisma-generated types prevented many runtime errors

### Common Pitfalls to Avoid
1. **Middleware API Protection**: Ensure middleware excludes `/api` routes from authentication checks
2. **Missing UI Dependencies**: Install all shadcn/ui dependencies upfront (`class-variance-authority`, `clsx`, etc.)
3. **Data Structure Alignment**: Design API responses to match frontend expectations from the start
4. **Port Management**: Standardize on port 3000 for development to avoid conflicts

### Recommended Development Flow
1. **Backend First**: Complete all API endpoints with tests before frontend
2. **Test Coverage Target**: Aim for 80%+ coverage on critical paths
3. **Progressive Enhancement**: Start with functionality, then improve UX/UI
4. **Documentation as You Go**: Update CURRENT_STATE.md after each major feature

### Testing Best Practices
1. **API Testing Script**: Create comprehensive test scripts early (`/scripts/test-*.sh`)
2. **Auth Bypass for Dev**: Use conditional auth checking based on environment
3. **Seed Data Scripts**: Maintain idempotent seed scripts for consistent testing
4. **Integration Tests**: Focus on testing API routes with real database connections

### Frontend Development Tips
1. **Component Library**: Use Radix UI primitives with Tailwind for consistent styling
2. **Chart Library**: Recharts works well for financial visualizations
3. **Form Handling**: React Hook Form with Zod validation provides good DX
4. **Error Boundaries**: Implement error boundaries for better error handling

### Database Considerations
1. **Neon PostgreSQL**: Works excellently with Prisma and Next.js
2. **Connection Pooling**: Use pooled connections for serverless environments
3. **Migration Strategy**: Test migrations on temporary branches first
4. **Backup Strategy**: Regular exports using the CSV functionality

### Security Enhancements Made
1. **Session Management**: NextAuth.js with JWT strategy
2. **Input Validation**: Zod schemas on all API endpoints
3. **CORS Configuration**: Properly configured for production
4. **Environment Variables**: All secrets in `.env.local`, never committed
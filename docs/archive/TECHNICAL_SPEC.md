# Technical Specification - FinFlow Tracker

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 14+ with React 18 and TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components  
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon cloud hosting)
- **ORM**: Prisma
- **Authentication**: Simple username/password (NextAuth.js with credentials provider)
- **State Management**: React Context + SWR for data fetching
- **Charts**: Recharts for interactive visualizations
- **Deployment**: Vercel
- **Monitoring**: Vercel Analytics

## Database Design

### Core Schema

```sql
-- Single user table (personal use application)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Financial institutions
CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50), -- 'bank', 'brokerage', 'investment', 'other'
    color VARCHAR(7), -- Hex color for UI consistency
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accounts under institutions
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'checking', 'investment', 'brokerage_total', 'brokerage_cash', 'brokerage_investment'
    currency VARCHAR(3) NOT NULL, -- 'EUR', 'GBP', 'SEK'
    is_derived BOOLEAN DEFAULT FALSE, -- For calculated brokerage investment accounts
    parent_account_id UUID REFERENCES accounts(id), -- Link for brokerage account relationships
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(institution_id, name)
);

-- Daily snapshots of account values (one per day max)
CREATE TABLE account_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    value_original DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    value_eur DECIMAL(15, 2) NOT NULL, -- EUR normalized value
    exchange_rate DECIMAL(10, 6),
    notes TEXT, -- Optional context for the update
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, date) -- Enforce one snapshot per account per day
);

-- Brokerage account special handling
CREATE TABLE brokerage_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brokerage_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_value DECIMAL(15, 2) NOT NULL,
    cash_value DECIMAL(15, 2) NOT NULL,
    investment_value DECIMAL(15, 2) GENERATED ALWAYS AS (total_value - cash_value) STORED,
    currency VARCHAR(3) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(brokerage_account_id, date)
);

-- Exchange rates cache
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(10, 6) NOT NULL,
    source VARCHAR(50) DEFAULT 'exchangerate-api',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, from_currency, to_currency)
);

-- Future: Assets table (Phase 2)
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'vehicle', 'crypto', 'property', 'other'
    currency VARCHAR(3) NOT NULL,
    purchase_price DECIMAL(15, 2),
    purchase_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Asset value snapshots (Phase 2)
CREATE TABLE asset_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    value_original DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    value_eur DECIMAL(15, 2) NOT NULL,
    exchange_rate DECIMAL(10, 6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(asset_id, date)
);
```

### Database Indexes for Performance
```sql
-- Critical indexes for query performance
CREATE INDEX idx_account_snapshots_date ON account_snapshots(date DESC);
CREATE INDEX idx_account_snapshots_account_date ON account_snapshots(account_id, date DESC);
CREATE INDEX idx_brokerage_entries_date ON brokerage_entries(date DESC);
CREATE INDEX idx_exchange_rates_lookup ON exchange_rates(date DESC, from_currency, to_currency);
CREATE INDEX idx_accounts_institution ON accounts(institution_id);
CREATE INDEX idx_accounts_active ON accounts(is_active) WHERE is_active = TRUE;
```

## API Design

### Authentication Endpoints
```typescript
POST   /api/auth/login      - User login (username/password)
POST   /api/auth/logout     - User logout
GET    /api/auth/session    - Validate current session
POST   /api/auth/change-password - Change password (authenticated)
```

### Data Management Endpoints
```typescript
// Institutions
GET    /api/institutions          - List all institutions
POST   /api/institutions          - Create new institution
PUT    /api/institutions/:id      - Update institution
DELETE /api/institutions/:id      - Delete institution (cascades to accounts)

// Accounts
GET    /api/accounts              - List all accounts with latest values
GET    /api/accounts/:id          - Get account details with history
POST   /api/accounts              - Create new account
PUT    /api/accounts/:id          - Update account metadata
DELETE /api/accounts/:id          - Delete account
POST   /api/accounts/:id/snapshot - Update account value (creates daily snapshot)

// Brokerage Special Handling
POST   /api/brokerage/update      - Update brokerage with total + cash (auto-splits)

// Portfolio Analytics
GET    /api/portfolio/summary     - Current net worth and breakdown
GET    /api/portfolio/history     - Historical data for charting
GET    /api/portfolio/currencies  - Per-currency breakdown

// Exchange Rates
GET    /api/exchange/rates        - Get current rates for EUR, GBP, SEK
POST   /api/exchange/sync         - Force sync from external API

// Data Export
GET    /api/export/csv            - Export all data as CSV
```

## Security Implementation

### Authentication & Authorization
- **Single User System**: One admin user for personal use
- **Password Security**: bcrypt with salt rounds = 12
- **Session Management**: 
  - JWT tokens with HttpOnly cookies
  - 7-day expiry with automatic refresh
  - Secure flag in production
- **No OAuth Initially**: Keep it simple for personal use

### Environment Variables (NEVER commit to repo!)
```env
# Database
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"

# Authentication
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="[generate-with-openssl-rand-base64-32]"
ADMIN_USERNAME="your-username"
ADMIN_PASSWORD_HASH="[bcrypt-hash-never-plain-text]"

# Exchange Rate API (Free tier)
EXCHANGE_RATE_API_URL="https://api.exchangerate-api.com/v4/latest/EUR"

# Environment
NODE_ENV="production"
```

### Security Best Practices
- **Input Validation**: Zod schemas for all API inputs
- **SQL Injection Prevention**: Prisma ORM parameterized queries
- **XSS Protection**: React's automatic escaping
- **CSRF Protection**: Built into NextAuth
- **Rate Limiting**: Vercel Edge functions rate limiting
- **Secrets Management**: 
  - All secrets in environment variables
  - CI/CD checks for exposed secrets (Gitleaks)
  - Regular secret rotation

### API Security Middleware
```typescript
// Every API route must be protected
export function withAuth(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);
    if (!session || session.user?.username !== process.env.ADMIN_USERNAME) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return handler(req, res);
  };
}

// Input validation example
const accountUpdateSchema = z.object({
  value: z.number().min(0).max(999999999),
  currency: z.enum(['EUR', 'GBP', 'SEK']),
  date: z.string().datetime().optional(),
  notes: z.string().max(500).optional()
});
```

## External Integrations

### Exchange Rate API (Free Tier)
- **Provider**: ExchangeRate-API.com
- **Endpoint**: `https://api.exchangerate-api.com/v4/latest/EUR`
- **Update Frequency**: Daily automatic sync
- **Caching**: 24-hour cache to minimize API calls
- **Supported**: EUR, GBP, SEK
- **Fallback**: Use last known rates if API fails

### Implementation
```typescript
async function syncExchangeRates() {
  const response = await fetch(EXCHANGE_RATE_API_URL);
  const data = await response.json();
  
  // Store rates for EUR base
  await prisma.exchangeRate.upsert({
    where: { date_from_to: { date, from: 'EUR', to: 'GBP' }},
    create: { date, from: 'EUR', to: 'GBP', rate: data.rates.GBP },
    update: { rate: data.rates.GBP }
  });
  // Similar for SEK...
}
```

## Performance Optimization

### Caching Strategy
- Exchange rates: 24-hour cache
- Portfolio calculations: 5-minute SWR cache
- Static pages: ISR with 1-hour revalidation
- Database queries: Optimized with proper indexes

### Frontend Optimization
- Code splitting with dynamic imports
- Lazy loading for charts
- Debounced form inputs
- Optimistic UI updates with SWR

### Database Optimization
- Efficient indexes on date and foreign keys
- Daily snapshot constraint (one per account per day)
- Minimal data model for fast queries
- Connection pooling via Prisma

## Development Setup

### Prerequisites
```bash
# Required
Node.js 20+ LTS
npm 10+
Git

# Accounts needed
- GitHub account
- Vercel account (free tier)
- Neon database account (free tier)
```

### Local Development
```bash
# Clone repository
git clone https://github.com/Fern-Labs-Open-Source/finflow-tracker.git
cd finflow-tracker

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your values

# Setup database
npx prisma generate
npx prisma db push

# Create admin user (run once)
npm run setup:admin

# Start development
npm run dev
```

### Testing Requirements
- Unit tests for calculations and utilities
- Integration tests for API endpoints
- E2E test for critical user flow (login → update → view chart)
- Security scanning in CI

## Deployment

### Vercel Deployment
```json
{
  "framework": "nextjs",
  "buildCommand": "prisma generate && npm run build",
  "env": {
    "DATABASE_URL": "@neon-database-url",
    "NEXTAUTH_SECRET": "@nextauth-secret",
    "ADMIN_USERNAME": "@admin-username",
    "ADMIN_PASSWORD_HASH": "@admin-password-hash"
  }
}
```

### Production Checklist
- [ ] Environment variables set in Vercel
- [ ] Database migrations applied
- [ ] Admin credentials created securely
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Monitoring enabled
- [ ] Backup strategy in place

## Monitoring & Maintenance

### Application Monitoring
- Vercel Analytics for performance
- Error tracking with console logs
- Database query performance via Prisma logs
- Uptime monitoring (optional for personal use)

### Backup Strategy
- Daily CSV export (manual or automated)
- Database backups via Neon
- Git repository for code versioning

### Maintenance Tasks
- Monthly: Check for dependency updates
- Weekly: Review error logs
- Daily: Automated exchange rate sync
- As needed: Security patches
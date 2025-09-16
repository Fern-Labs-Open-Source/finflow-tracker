# Technical Specification - FinFlow Tracker

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 14+ with React 18 and TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon cloud hosting)
- **ORM**: Prisma
- **Authentication**: NextAuth.js with credentials provider
- **State Management**: React Context + SWR for data fetching
- **Charts**: Recharts or Chart.js
- **Deployment**: Vercel
- **Monitoring**: Vercel Analytics

## Database Design

### Schema Definition

```sql
-- Users table for authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Financial institutions
CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50), -- 'bank', 'brokerage', 'other'
    color VARCHAR(7), -- Hex color for UI
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

-- Accounts under institutions
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'cash', 'investment', 'brokerage_cash', 'brokerage_investment'
    currency VARCHAR(3) NOT NULL, -- 'EUR', 'GBP', 'SEK'
    is_derived BOOLEAN DEFAULT FALSE, -- For calculated brokerage investment accounts
    parent_account_id UUID REFERENCES accounts(id), -- Link for derived accounts
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily snapshots of account values
CREATE TABLE account_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    value_original DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    value_eur DECIMAL(15, 2) NOT NULL, -- EUR normalized value
    exchange_rate DECIMAL(10, 6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, date) -- Only one snapshot per account per day
);

-- Brokerage account entries (for split handling)
CREATE TABLE brokerage_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_value DECIMAL(15, 2) NOT NULL,
    cash_value DECIMAL(15, 2) NOT NULL,
    investment_value DECIMAL(15, 2) GENERATED ALWAYS AS (total_value - cash_value) STORED,
    currency VARCHAR(3) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, date)
);

-- Exchange rates cache
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(10, 6) NOT NULL,
    source VARCHAR(50), -- API source
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, from_currency, to_currency)
);

-- Future: Assets table (Phase 2)
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'vehicle', 'property', 'crypto', 'other'
    currency VARCHAR(3) NOT NULL,
    purchase_price DECIMAL(15, 2),
    purchase_date DATE,
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

### Database Indexes
```sql
-- Performance indexes
CREATE INDEX idx_account_snapshots_date ON account_snapshots(date DESC);
CREATE INDEX idx_account_snapshots_account_date ON account_snapshots(account_id, date DESC);
CREATE INDEX idx_exchange_rates_lookup ON exchange_rates(date, from_currency, to_currency);
CREATE INDEX idx_institutions_user ON institutions(user_id);
CREATE INDEX idx_accounts_institution ON accounts(institution_id);
```

## API Design

### Authentication Endpoints
```typescript
POST   /api/auth/register   - User registration
POST   /api/auth/login      - User login
POST   /api/auth/logout     - User logout
GET    /api/auth/session    - Get current session
```

### Institution Endpoints
```typescript
GET    /api/institutions          - List all user institutions
POST   /api/institutions          - Create new institution
PUT    /api/institutions/:id      - Update institution
DELETE /api/institutions/:id      - Delete institution
```

### Account Endpoints
```typescript
GET    /api/accounts              - List all accounts with latest values
GET    /api/accounts/:id          - Get specific account details
POST   /api/accounts              - Create new account
PUT    /api/accounts/:id          - Update account details
DELETE /api/accounts/:id          - Delete account
POST   /api/accounts/:id/snapshot - Create/update today's snapshot
```

### Data Endpoints
```typescript
GET    /api/portfolio/summary     - Get portfolio summary
GET    /api/portfolio/history     - Get historical data with filters
GET    /api/portfolio/chart       - Get chart-ready data
POST   /api/brokerage/entry       - Create brokerage entry with auto-split
```

### Exchange Rate Endpoints
```typescript
GET    /api/exchange-rates/latest - Get latest rates
GET    /api/exchange-rates/historical/:date - Get historical rates
POST   /api/exchange-rates/sync   - Force sync from external API
```

### Export Endpoints
```typescript
GET    /api/export/csv            - Export all data as CSV
GET    /api/export/pdf            - Generate PDF report
```

## Security Implementation

### Authentication & Authorization
- **Password Security**: bcrypt with salt rounds = 12
- **Session Management**: JWT tokens with HttpOnly cookies
- **Token Expiry**: 7 days with refresh mechanism
- **CSRF Protection**: Built into NextAuth

### API Security
```typescript
// Middleware for protected routes
export function withAuth(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return handler(req, res);
  };
}

// Input validation using Zod
const accountUpdateSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['cash', 'investment']),
  currency: z.enum(['EUR', 'GBP', 'SEK'])
});
```

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generated-secret-key"

# Exchange Rate API
EXCHANGE_RATE_API_KEY="your-api-key"
EXCHANGE_RATE_API_URL="https://api.exchangerate-api.com/v4"

# Environment
NODE_ENV="development|production"
```

### Data Protection
- All database connections over SSL
- Input sanitization on all endpoints
- Rate limiting on API routes
- SQL injection prevention via Prisma ORM
- XSS protection via React's default escaping

## Performance Optimization

### Caching Strategy
- Exchange rates cached for 24 hours
- Portfolio calculations cached with SWR
- Static pages with ISR (Incremental Static Regeneration)
- Database query optimization with proper indexes

### Frontend Optimization
- Code splitting with dynamic imports
- Image optimization with Next.js Image
- Lazy loading for charts
- Virtual scrolling for large data tables
- Debounced API calls for real-time updates

### Database Optimization
- Efficient indexes on frequently queried columns
- Materialized views for complex calculations
- Connection pooling via Prisma
- Query result pagination

## External Integrations

### Exchange Rate API
- **Provider**: ExchangeRate-API (free tier)
- **Endpoint**: `https://api.exchangerate-api.com/v4/latest/EUR`
- **Rate Limit**: 1500 requests/month (free tier)
- **Caching**: 24-hour cache to minimize API calls
- **Fallback**: Store last known rates for offline capability

## Error Handling

### API Error Responses
```typescript
interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
}
```

### Client-Side Error Handling
- Toast notifications for user actions
- Graceful fallbacks for failed data loads
- Offline mode detection
- Retry logic with exponential backoff

## Monitoring & Logging

### Application Monitoring
- Vercel Analytics for performance metrics
- Custom error tracking
- API response time monitoring
- Database query performance tracking

### Audit Logging
- User authentication events
- Data modifications (create, update, delete)
- Export operations
- Failed login attempts

## Development Configuration

### Local Development Setup
```bash
# Required software
- Node.js 20+
- PostgreSQL 15+ or Neon account
- Git

# Environment setup
cp .env.example .env.local
npm install
npx prisma migrate dev
npm run dev
```

### Testing Strategy
- Unit tests for utility functions
- Integration tests for API endpoints
- E2E tests for critical user flows
- Snapshot testing for UI components

## Deployment Configuration

### Production Deployment (Vercel)
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "outputDirectory": ".next",
  "env": {
    "DATABASE_URL": "@database_url",
    "NEXTAUTH_SECRET": "@nextauth_secret",
    "EXCHANGE_RATE_API_KEY": "@exchange_rate_api_key"
  }
}
```

### Database Migrations
- Automated via GitHub Actions on main branch
- Rollback strategy with versioned migrations
- Backup before major migrations

## Scalability Considerations

### Future Growth
- Database sharding strategy for multi-tenant use
- Redis cache layer for session management
- CDN for static assets
- Horizontal scaling with load balancing
- Microservices architecture for complex calculations
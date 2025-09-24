# FinFlow Tracker - Project Specification

## Table of Contents
1. [Product Specification](#product-specification)
2. [Technical Specification](#technical-specification)
3. [Database Design](#database-design)
4. [API Specification](#api-specification)
5. [Security Requirements](#security-requirements)
6. [Performance Requirements](#performance-requirements)

---

## Product Specification

### Overview
FinFlow Tracker is a personal net worth tracking application designed to provide a comprehensive view of total net worth across multiple accounts, institutions, and currencies. The application focuses on simplicity in data entry (weekly/monthly updates) while providing powerful visualization and historical tracking capabilities.

### Primary Goal
Track and visualize net worth over time through simple account balance updates, with multi-currency support and historical trend analysis.

### Core Features

#### Account Management
- **Multi-Institution Support**: Track accounts across multiple banks and financial institutions
- **Account Types**:
  - Checking/Current accounts
  - Investment accounts (total value tracking)
  - Brokerage accounts (with automatic cash/investment splitting)
  - Cryptocurrency accounts
  - Asset accounts (vehicles, property, etc.)
  
- **Smart Brokerage Handling**: 
  - User enters: Total portfolio value + Cash value
  - System automatically derives: Investment value = Total - Cash
  - Creates paired accounts for clear cash/investment separation
  - Shows calculation formula in UI: "Total: €X | Cash: €Y | Investments: €X-Y"
  - Each component tracked as separate account for analytics

#### Multi-Currency Support
- **Supported Currencies**: EUR (base currency), GBP, SEK, USD
- **Automatic Conversion**: Daily exchange rates from free API
- **Dual Display**: 
  - Show original currency values
  - Show EUR-normalized values for total net worth
- **Currency Breakdown**: View net worth per currency

#### Historical Tracking
- **Snapshot System**: 
  - Captures account values when user makes updates
  - Daily granularity (only latest update per day is preserved)
  - If multiple updates in one day, keep only the most recent
  - Enables comprehensive trend analysis over time
- **Data Integrity**: Each account maintains its own historical record
- **Flexible Reporting**: View trends at account, institution, or portfolio level

#### User Interface Requirements

##### Desktop Experience (Primary)
- **Dashboard Overview**:
  - Current net worth prominently displayed (EUR normalized)
  - Currency breakdown showing value in each currency
  - Month-over-month and year-to-date change percentages
  - Asset allocation pie chart (Cash vs Investments)
  - List of recent account updates with timestamps
  
- **Account Management Page**:
  - Accounts grouped by institution
  - Simple value entry forms with inline editing
  - For brokerage accounts: Enter total and cash, see derived investment value
  - For standard accounts: Direct value entry
  - Currency selector for each account
  - Last updated timestamp for each account
  
- **Analytics Page**:
  - Primary chart: Net worth over time (line/area chart)
  - Toggle views: Combined, Segmented (cash vs investments)
  - Time range selection: 1M, 3M, 6M, 1Y, All
  - Hover tooltips showing exact values and date
  - Per-institution breakdown option
  - Export functionality (CSV, PDF)

##### Mobile Experience
- **Quick Overview**:
  - Total net worth
  - Simple trend indicator
  - Basic chart (last 3 months)
  - Quick access to update values
- **Streamlined Updates**:
  - List of accounts with quick edit
  - Optimized for thumb navigation

#### Data Management
- **Manual Balance Updates**:
  - Clean, focused interface
  - Enter account totals only (no transaction tracking)
  - Currency selector per account
  - Optional notes field for context
  - Validation for reasonable values
  
- **Data Export**:
  - CSV export for full data backup
  - Historical snapshots included
  - Formatted for spreadsheet import
  - Include all currencies with EUR conversions

### User Experience Principles

#### Simplicity First
- Minimal data entry required
- Account totals only (no transaction details)
- Smart defaults and auto-calculations
- Clear, uncluttered interface

#### Data Transparency
- Show all calculations clearly
- Display formulas for derived values
- Clear audit trail of updates
- Easy data export for backup

#### Visual Clarity
- Desktop-first design
- Consistent color coding
- Intuitive chart interactions
- Mobile-responsive for quick checks

### Success Metrics
- Time to update all accounts: < 2 minutes
- Page load times: < 1 second
- Chart rendering: < 500ms
- Zero data loss incidents
- 100% uptime for personal use

---

## Technical Specification

### Architecture Overview

#### Technology Stack
- **Frontend**: Next.js 14+ with React 18/19 and TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components  
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon cloud hosting)
- **ORM**: Prisma
- **Authentication**: NextAuth.js with multiple providers
  - Credentials provider (username/password)
  - OAuth providers (Google, GitHub)
- **State Management**: React Context + SWR for data fetching
- **Charts**: Recharts for interactive visualizations
- **Deployment**: Vercel
- **Monitoring**: Vercel Analytics

### System Architecture
```
┌─────────────────────────────────────────────────┐
│                   Frontend                      │
│  Next.js + React + TypeScript + Tailwind CSS    │
└─────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│                API Routes Layer                 │
│         Next.js API + Authentication            │
└─────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│                 Data Layer                      │
│           Prisma ORM + PostgreSQL               │
└─────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│              External Services                  │
│     Exchange Rate API + OAuth Providers         │
└─────────────────────────────────────────────────┘
```

---

## Database Design

### Core Schema

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    password_hash VARCHAR(255), -- For credentials auth
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Institutions Table
```sql
CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50), -- 'bank', 'brokerage', 'investment', 'crypto', 'other'
    color VARCHAR(7), -- Hex color for UI consistency
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);
```

#### Accounts Table
```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'checking', 'investment', 'crypto', 'brokerage_total', 'brokerage_cash', 'brokerage_investment'
    currency VARCHAR(3) NOT NULL, -- 'EUR', 'GBP', 'SEK', 'USD'
    is_derived BOOLEAN DEFAULT FALSE, -- For calculated brokerage investment accounts
    parent_account_id UUID REFERENCES accounts(id), -- Link for brokerage account relationships
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(institution_id, name)
);
```

#### Account Snapshots Table
```sql
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
```

#### Exchange Rates Table
```sql
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
```

#### Assets Table (Phase 2)
```sql
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'vehicle', 'crypto', 'property', 'other'
    currency VARCHAR(3) NOT NULL,
    purchase_price DECIMAL(15, 2),
    purchase_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Database Indexes
```sql
-- Critical indexes for query performance
CREATE INDEX idx_account_snapshots_date ON account_snapshots(date DESC);
CREATE INDEX idx_account_snapshots_account_date ON account_snapshots(account_id, date DESC);
CREATE INDEX idx_exchange_rates_lookup ON exchange_rates(date DESC, from_currency, to_currency);
CREATE INDEX idx_accounts_institution ON accounts(institution_id);
CREATE INDEX idx_accounts_user ON accounts(user_id);
CREATE INDEX idx_accounts_active ON accounts(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_institutions_user ON institutions(user_id);
```

---

## API Specification

### Authentication Endpoints
```typescript
POST   /api/auth/register      - User registration
POST   /api/auth/[...nextauth] - NextAuth.js handlers
GET    /api/auth/session       - Validate current session
POST   /api/auth/logout        - User logout
```

### Data Management Endpoints

#### Institutions
```typescript
GET    /api/institutions          - List user's institutions
POST   /api/institutions          - Create new institution
PUT    /api/institutions/[id]     - Update institution
DELETE /api/institutions/[id]     - Delete institution (cascades to accounts)
```

#### Accounts
```typescript
GET    /api/accounts              - List all user's accounts with latest values
GET    /api/accounts/[id]         - Get account details with history
POST   /api/accounts              - Create new account
PATCH  /api/accounts/[id]         - Update account metadata
DELETE /api/accounts/[id]         - Delete account
POST   /api/accounts/[id]/snapshot - Update account value (creates daily snapshot)
```

#### Portfolio Analytics
```typescript
GET    /api/portfolio/summary     - Current net worth and breakdown
GET    /api/portfolio/history     - Historical data for charting
GET    /api/portfolio/performance - Performance metrics
GET    /api/portfolio/currencies  - Per-currency breakdown
```

#### Exchange Rates
```typescript
GET    /api/exchange/rates        - Get current rates for supported currencies
POST   /api/exchange/sync         - Force sync from external API
```

#### Data Export
```typescript
GET    /api/export/csv            - Export all user data as CSV
GET    /api/export/pdf            - Generate PDF report (future)
```

---

## Security Requirements

### Authentication & Authorization
- **Multi-User Support**: Each user has isolated data
- **Password Security**: bcrypt with salt rounds = 12
- **Session Management**: 
  - JWT tokens with HttpOnly cookies
  - Configurable session expiry
  - Secure flag in production
- **OAuth Support**: Google and GitHub providers ready

### Data Protection
- **User Isolation**: Complete data separation by userId
- **Input Validation**: Zod schemas for all API inputs
- **SQL Injection Prevention**: Prisma ORM parameterized queries
- **XSS Protection**: React's automatic escaping
- **CSRF Protection**: Built into NextAuth
- **Rate Limiting**: Via Vercel Edge functions

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_URL="https://..."
NEXTAUTH_SECRET="[generated-secret]"

# OAuth (optional)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."

# Exchange Rate API
EXCHANGE_RATE_API_URL="..."

# Environment
NODE_ENV="production"
```

---

## Performance Requirements

### Response Times
- Page load: < 1 second
- API responses: < 100ms
- Chart rendering: < 500ms
- Search/filter: < 300ms (with debouncing)

### Optimization Strategies
- **Caching**: 
  - Exchange rates: 24-hour cache
  - Portfolio calculations: 5-minute SWR cache
  - Static pages: ISR with revalidation
  
- **Frontend**: 
  - Code splitting with dynamic imports
  - Lazy loading for charts
  - Optimistic UI updates
  - Skeleton loading states
  
- **Database**: 
  - Efficient indexes on foreign keys and dates
  - Query optimization with Prisma
  - Connection pooling

### Scalability
- Designed for personal use but architected for growth
- Database structure supports multi-user from day one
- Stateless API design for horizontal scaling
- CDN-ready static assets

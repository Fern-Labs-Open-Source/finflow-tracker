# Product Specification - FinFlow Tracker

## Overview
FinFlow Tracker is a personal net worth tracking application designed to provide a comprehensive view of total net worth across multiple accounts, institutions, and currencies. The application focuses on simplicity in data entry (weekly/monthly updates) while providing powerful visualization and historical tracking capabilities.

## Primary Goal
Track and visualize net worth over time through simple account balance updates, with multi-currency support and historical trend analysis.

## Core Features (Phase 1)

### Account Management
- **Multi-Institution Support**: Track accounts across multiple banks and financial institutions
- **Account Types**:
  - Checking/Current accounts
  - Investment accounts (total value tracking)
  - Brokerage accounts (with automatic cash/investment splitting)
- **Smart Brokerage Handling**: 
  - User enters: Total portfolio value + Cash value
  - System automatically derives: Investment value = Total - Cash
  - Creates paired accounts for clear cash/investment separation
  - Shows calculation formula in UI: "Total: €X | Cash: €Y | Investments: €X-Y"
  - Each component tracked as separate account for analytics

### Multi-Currency Support
- **Supported Currencies**: EUR (base currency), GBP, SEK
- **Automatic Conversion**: Daily exchange rates from free API
- **Dual Display**: 
  - Show original currency values
  - Show EUR-normalized values for total net worth
- **Currency Breakdown**: View net worth per currency

### Historical Tracking
- **Snapshot System**: 
  - Captures account values when user makes updates
  - Daily granularity (only latest update per day is preserved)
  - If multiple updates in one day, keep only the most recent
  - Enables comprehensive trend analysis over time
- **Data Integrity**: Each account maintains its own historical record
- **Flexible Reporting**: View trends at account, institution, or portfolio level

### User Interface

#### Desktop Experience (Primary)
- **Dashboard Overview**:
  - Current net worth prominently displayed (EUR normalized)
  - Currency breakdown showing value in each currency
  - Month-over-month and year-to-date change percentages
  - Asset allocation pie chart (Cash vs Investments)
  - List of recent account updates with timestamps
  
- **Account Management Page**:
  - Accounts grouped by institution
  - Simple value entry forms
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

#### Mobile Experience (Simplified)
- **Quick Overview**:
  - Total net worth
  - Simple trend indicator
  - Basic chart (last 3 months)
  - Quick access to update values
- **Streamlined Updates**:
  - List of accounts with quick edit
  - Optimized for thumb navigation

### Data Entry
- **Manual Balance Updates**:
  - Clean, focused interface
  - Enter account totals only (no transaction tracking)
  - Currency selector per account
  - Optional notes field for context
  - Validation for reasonable values
  
- **Brokerage Special Handling**:
  - Enter: Total Portfolio Value
  - Enter: Cash Holdings
  - System calculates: Investment Value
  - Display formula clearly in UI
  
- **Update Workflow**:
  - Weekly or monthly update cycle
  - Quick sequential updates for all accounts
  - Option to skip unchanged accounts
  - Confirmation before saving

### Data Export
- **CSV Export**: 
  - Full data backup capability
  - Historical snapshots included
  - Formatted for spreadsheet import
  - Include all currencies with EUR conversions

### Security & Privacy
- **Authentication**: Single-user system with secure login
- **Data Protection**: Encrypted storage, no external sharing
- **Access Control**: Username/password authentication (initially)
- **No Secrets in Code**: All sensitive data in environment variables

## Phase 2 Features (Future Enhancement)

### Asset Tracking
- **Asset Types**:
  - Vehicles (with depreciation tracking)
  - Cryptocurrency holdings
  - Property/Real estate
  - Other valuables
  
- **Asset Management**:
  - Manual value updates
  - Purchase price vs current value tracking
  - Include in net worth calculations
  - Separate assets view from liquid accounts

### Advanced Features
- **Enhanced Authentication**: OAuth integration
- **Goals & Milestones**: Set and track net worth targets
- **Automated Reminders**: Monthly update notifications
- **Advanced Analytics**: Year-over-year comparisons
- **PDF Reports**: Formatted monthly/quarterly summaries

## User Experience Principles

### Simplicity First
- Minimal data entry required
- Account totals only (no transaction details)
- Smart defaults and auto-calculations
- Clear, uncluttered interface

### Data Transparency
- Show all calculations clearly
- Display formulas for derived values
- Clear audit trail of updates
- Easy data export for backup

### Visual Clarity
- Desktop-first design
- Consistent color coding
- Intuitive chart interactions
- Mobile-responsive for quick checks

## Success Metrics
- Time to update all accounts: < 2 minutes
- Page load times: < 1 second
- Chart rendering: < 500ms
- Zero data loss incidents
- 100% uptime for personal use

## Technical Constraints
- Manual data entry only (no bank API integrations)
- Single-user system (personal use)
- Low data volume (daily snapshots)
- Cloud hosted (Vercel + Neon database)
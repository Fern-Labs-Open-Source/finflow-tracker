# Product Specification - FinFlow Tracker

## Overview
FinFlow Tracker is a personal finance management application designed to provide a comprehensive view of net worth across multiple accounts, institutions, and currencies. The application focuses on simplicity in data entry while providing powerful visualization and tracking capabilities.

## Core Features

### Account Management
- **Multi-Institution Support**: Track accounts across multiple banks and financial institutions
- **Account Types**:
  - Current/Checking accounts
  - Investment accounts
  - Brokerage accounts (with automatic cash/investment splitting)
  - Savings accounts
- **Smart Brokerage Handling**: 
  - Automatically derives investment value from total portfolio and cash values
  - Creates paired accounts for clear cash/investment separation
  - Shows calculation formula in UI: "Total: €X | Cash: €Y | Investments: €X-Y"

### Multi-Currency Support
- **Supported Currencies**: EUR (base), GBP, SEK
- **Automatic Conversion**: Real-time exchange rates from free API
- **Dual Display**: Show both original currency and EUR-normalized values
- **Historical Rates**: Maintain exchange rate history for accurate historical charts

### Historical Tracking
- **Snapshot System**: 
  - Captures account values when user makes updates
  - Daily granularity (latest update per day is preserved)
  - Enables comprehensive trend analysis
- **Data Integrity**: Each account maintains its own historical record
- **Flexible Reporting**: View trends at account, institution, or portfolio level

### User Interface

#### Desktop Experience
- **Dashboard Overview**:
  - Current net worth prominently displayed
  - Quick stats: Month-over-month change, YTD performance
  - Asset allocation pie chart
  - Recent account updates list
- **Account Management Page**:
  - Grouped by institution
  - Clear value entry forms
  - Formula display for derived values
  - Last updated timestamps
- **Analytics Page**:
  - Interactive net worth chart (line/area)
  - Segmented views (cash vs investments)
  - Currency breakdown
  - Custom date range selection

#### Mobile Experience
- **Simplified Dashboard**:
  - Net worth and key metrics
  - Condensed account list
  - Basic trend chart
- **Quick Update**:
  - Fast account value updates
  - Swipe actions for common tasks

### Visualizations

#### Primary Chart - Net Worth Over Time
- Line chart showing total portfolio value
- Toggle between:
  - Combined view
  - Segmented (stacked area) showing cash/investments/assets
  - Per-institution breakdown
- Zoom capabilities (1M, 3M, 6M, 1Y, All)
- Hover tooltips with exact values

#### Supporting Visualizations
- **Asset Allocation**: Donut chart of current portfolio composition
- **Currency Exposure**: Bar chart showing value per currency
- **Account Table**: Sortable table with sparkline trends
- **Institution Summary**: Grouped bar chart by institution

### Data Entry
- **Manual Entry Forms**:
  - Clean, focused interface
  - Currency selector
  - Optional notes field
  - Validation for reasonable values
- **Bulk Operations**:
  - Update multiple accounts in sequence
  - Copy previous values option
- **Import/Export**:
  - CSV export for backup
  - Formatted reports for record-keeping

## Phase 2 Features (Future Enhancement)

### Asset Tracking
- **Asset Types**:
  - Vehicles
  - Real estate/Property
  - Collectibles
  - Cryptocurrency wallets
  - Other valuables
- **Valuation Management**:
  - Manual value updates
  - Depreciation tracking (vehicles)
  - Purchase price vs current value
- **Integration**: Seamlessly included in net worth calculations and charts

### Advanced Features
- **Goals & Targets**:
  - Set net worth goals
  - Track progress over time
- **Alerts & Notifications**:
  - Significant value changes
  - Monthly update reminders
- **Reports**:
  - Monthly/quarterly summaries
  - Year-over-year comparisons
  - Tax preparation exports

## User Experience Principles

### Simplicity First
- Minimal clicks to update values
- Clear, uncluttered interface
- Smart defaults and auto-calculations

### Data Transparency
- Show all calculations and formulas
- Clear audit trail of changes
- Easy data export

### Visual Clarity
- Consistent color coding
- Intuitive chart interactions
- Mobile-responsive design

### Security & Privacy
- Secure authentication required
- Encrypted data storage
- No external data sharing
- Complete user control over data

## Success Metrics
- Time to update all accounts: < 2 minutes
- Page load times: < 1 second
- Chart rendering: < 500ms
- Mobile usability score: > 95/100
- Zero data loss incidents
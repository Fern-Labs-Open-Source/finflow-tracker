# FinFlow Tracker

A modern personal finance tracking application with multi-currency support, beautiful visualizations, and comprehensive net worth management.

## 🚀 Quick Deploy to Vercel

Deploy your own instance of FinFlow Tracker with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FFern-Labs-Open-Source%2Ffinflow-tracker&env=DATABASE_URL,NEXTAUTH_SECRET,NEXTAUTH_URL,BYPASS_AUTH&envDescription=Required%20environment%20variables%20for%20FinFlow%20Tracker&envLink=https%3A%2F%2Fgithub.com%2FFern-Labs-Open-Source%2Ffinflow-tracker%2Fblob%2Fmain%2Fdocs%2FDEVELOPMENT.md&project-name=finflow-tracker&repository-name=finflow-tracker)

## 🎯 Purpose

FinFlow Tracker helps you monitor your net worth across multiple accounts, institutions, and currencies. It's designed for simple weekly/monthly updates of account balances, providing powerful visualizations of your financial trends over time.

## ✨ Key Features

- 📊 **Complete Net Worth Tracking**: Monitor total wealth across all accounts and assets
- 💱 **Multi-Currency Support**: EUR (base), GBP, SEK, and USD with automatic conversion
- 📈 **Interactive Analytics**: Beautiful charts with 30-day history and performance metrics
- 🏦 **Smart Account Management**: Support for banks, brokerages, crypto, and assets
- 👥 **Multi-User Support**: Each user has completely isolated data
- 🔒 **Secure Authentication**: OAuth support (Google, GitHub) and credential-based login
- 📥 **Data Export**: CSV export for backups and external analysis
- ⚡ **Lightning Fast**: Optimized performance with < 100ms API responses

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ LTS
- npm 10+
- PostgreSQL database (or Neon cloud account)
- Vercel account (for deployment)

### Local Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/Fern-Labs-Open-Source/finflow-tracker.git
cd finflow-tracker
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your database and auth settings
```

4. **Set up the database**
```bash
npx prisma generate
npx prisma db push
```

5. **Create admin user**
```bash
npm run setup:admin
```

6. **Start development server**
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🔐 Security

This application prioritizes security:

- **No secrets in code**: All sensitive data in environment variables
- **CI/CD security scanning**: Automatic detection of exposed secrets
- **Protected API routes**: All endpoints require authentication
- **Input validation**: Zod schemas for all user inputs
- **Secure headers**: HTTPS enforced, XSS protection, CSRF protection

## 📚 Documentation

All project documentation is consolidated into three comprehensive files:

- [**Specification**](docs/SPECIFICATION.md) - Complete product and technical specifications
- [**Current State**](docs/CURRENT_STATE.md) - Implementation status, features, and known issues  
- [**Development Guide**](docs/DEVELOPMENT.md) - Setup instructions, contribution guidelines, and deployment

**Note**: All documentation updates must be made to one of these three files only. Do not create additional documentation files.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Neon)
- **Charts**: Recharts
- **Authentication**: NextAuth.js
- **Deployment**: Vercel

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run prisma:studio` - Open Prisma Studio
- `npm run check:security` - Run security audit

## 🤝 Contributing

Please read the [Development Guide](docs/DEVELOPMENT.md) for details on setup, code guidelines, and the process for submitting pull requests.

## ⚠️ Important Notes

- **Multi-user support** with complete data isolation
- **Manual data entry** for account balances (no transaction tracking)
- **Self-hosted** - All financial data stays on your own infrastructure
- **Privacy-focused** - No external data sharing or analytics

## 📄 License

This project is for personal use. See the repository for license details.

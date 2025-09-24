# FinFlow Tracker - Development Guide

This guide provides step-by-step instructions for setting up the development environment and contributing to the FinFlow Tracker project.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm 10+
- Git
- A Neon database account (free tier is sufficient)

### Initial Setup

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
   ```
   
   Then edit `.env.local` with your actual values:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL`: Set to `http://localhost:3000` for local development
   - `ADMIN_EMAIL`: Your email for admin access
   - `EXCHANGERATE_API_KEY`: Get from [ExchangeRate-API](https://app.exchangerate-api.com/sign-up) (free tier)

4. **Set up the database**
   ```bash
   npm run prisma:push
   npm run prisma:generate
   ```

5. **Create admin user**
   ```bash
   npm run setup:admin
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

   Visit http://localhost:3000 to see the application.

## 📁 Project Structure

```
finflow-tracker/
├── src/
│   ├── app/           # Next.js App Router pages
│   ├── components/    # React components
│   ├── lib/          # Utility functions and configurations
│   ├── services/     # Business logic and API services
│   └── types/        # TypeScript type definitions
├── prisma/
│   └── schema.prisma # Database schema
├── public/           # Static assets
├── tests/           # Test files
└── scripts/         # Utility scripts
```

## 🔧 Development Workflow

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation if needed

3. **Run checks before committing**
   ```bash
   npm run pre-commit
   ```
   
   This runs:
   - ESLint for code quality
   - TypeScript type checking
   - Tests for changed files

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: description of your change"
   ```
   
   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes
   - `refactor:` Code refactoring
   - `test:` Test changes
   - `chore:` Build/tooling changes

5. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```
   
   Then create a PR on GitHub.

## 🧪 Testing

### Run all tests
```bash
npm test
```

### Watch mode for development
```bash
npm run test:watch
```

### Run only changed tests
```bash
npm run test:changed
```

### Integration tests
```bash
npm run test:integration
```

## 🗄️ Database Management

### View database with Prisma Studio
```bash
npm run prisma:studio
```

### Create a migration after schema changes
```bash
npm run prisma:migrate
```

### Push schema changes (development only)
```bash
npm run prisma:push
```

## 🔒 Security

### Check for vulnerabilities
```bash
npm run check:security
```

### Install Gitleaks for secret scanning
```bash
# macOS
brew install gitleaks

# Linux
wget https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_linux_amd64.tar.gz
tar -xzf gitleaks_linux_amd64.tar.gz
sudo mv gitleaks /usr/local/bin/

# Windows (using Chocolatey)
choco install gitleaks
```

### Run secret scanning
```bash
gitleaks detect --source .
```

## 🎨 Code Style

### Format code with Prettier
```bash
npx prettier --write .
```

### Lint with ESLint
```bash
npm run lint
```

### Type checking
```bash
npm run type-check
```

## 🚦 CI/CD Pipeline

The project uses GitHub Actions for continuous integration:

1. **On Pull Request**:
   - Runs linting
   - Type checking
   - Unit tests
   - Secret scanning

2. **On Push to main**:
   - All PR checks
   - Builds the application
   - Runs integration tests

## 🐛 Common Issues & Solutions

### Database connection issues
- Ensure your `DATABASE_URL` in `.env.local` is correct
- Check that your Neon database is active
- Try running `npm run prisma:generate` again

### Authentication not working
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your development URL
- Ensure cookies are enabled in your browser

### Module not found errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

### Port already in use
- Check if another process is using port 3000
- Use a different port: `PORT=3001 npm run dev`

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Getting Help

1. Check the [existing issues](https://github.com/Fern-Labs-Open-Source/finflow-tracker/issues)
2. Review the documentation in the `docs/` folder
3. Create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)

## 🎯 Development Tips

1. **Use environment-specific configurations**
   - `.env.local` for local development
   - Never commit sensitive data
   - Use `.env.example` as a template

2. **Keep components small and focused**
   - One component = one responsibility
   - Use composition over inheritance
   - Extract reusable logic to hooks

3. **Write meaningful commit messages**
   - Explain what and why, not how
   - Reference issue numbers when applicable
   - Keep the first line under 50 characters

4. **Test edge cases**
   - Empty states
   - Error states
   - Loading states
   - Large datasets

5. **Performance considerations**
   - Use React Query for data fetching
   - Implement proper loading states
   - Optimize images and assets
   - Use dynamic imports for large components

## 📈 Contributing Guidelines

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for detailed contribution guidelines.

---

Happy coding! 🚀

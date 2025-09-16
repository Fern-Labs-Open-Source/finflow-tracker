# Contributing to FinFlow Tracker

Thank you for your interest in contributing to FinFlow Tracker! This document provides guidelines and instructions for contributing to the project.

## 📋 Before You Begin

### Understanding the Project

FinFlow Tracker is a personal net worth tracking application designed for simplicity and privacy. Please read through:
- [README.md](../README.md) - Project overview
- [PRODUCT_SPEC.md](PRODUCT_SPEC.md) - Product requirements
- [TECHNICAL_SPEC.md](TECHNICAL_SPEC.md) - Technical architecture
- [DEVELOPMENT_SPEC.md](DEVELOPMENT_SPEC.md) - Development processes
- [DEVELOPMENT_GUIDE.md](../DEVELOPMENT_GUIDE.md) - Setup instructions

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Respect differing viewpoints and experiences

## 🚀 Getting Started

### 1. Set Up Your Environment

Follow the [DEVELOPMENT_GUIDE.md](../DEVELOPMENT_GUIDE.md) to:
- Clone the repository
- Install dependencies
- Configure environment variables
- Set up the database

### 2. Find an Issue to Work On

- Check the [Issues](https://github.com/Fern-Labs-Open-Source/finflow-tracker/issues) page
- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to express interest
- Wait for confirmation before starting work

### 3. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

Use descriptive branch names:
- `feature/add-export-csv` - New features
- `fix/currency-conversion` - Bug fixes
- `docs/update-readme` - Documentation
- `refactor/optimize-queries` - Code refactoring
- `test/add-unit-tests` - Test improvements

## 📝 Development Guidelines

### Code Style

#### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public functions
- Keep functions small and focused

#### React Components
- Use functional components with hooks
- Keep components focused on a single responsibility
- Extract reusable logic to custom hooks
- Use proper TypeScript types for props

#### CSS/Styling
- Use Tailwind CSS classes
- Avoid inline styles
- Keep responsive design in mind
- Test on different screen sizes

### Testing

#### Write Tests For
- New features
- Bug fixes
- Edge cases
- Error handling

#### Test Commands
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:changed  # Test changed files only
```

### Database Changes

- Update the Prisma schema in `prisma/schema.prisma`
- Run `npm run prisma:generate` after changes
- Test migrations locally before committing
- Document any new fields or relationships

## 🔄 Pull Request Process

### 1. Before Creating a PR

Run all checks locally:
```bash
npm run lint          # Check code style
npm run type-check    # TypeScript validation
npm test              # Run tests
npm run build         # Ensure it builds
```

### 2. Creating the PR

#### Title Format
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat: add CSV export functionality`
- `fix: correct currency conversion rates`
- `docs: update installation instructions`
- `style: format code with prettier`
- `refactor: optimize database queries`
- `test: add unit tests for auth`
- `chore: update dependencies`

#### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing
- [ ] Tests pass locally
- [ ] Added new tests for changes
- [ ] Tested on different browsers

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] My code follows the project style
- [ ] I've added comments where needed
- [ ] Documentation is updated
- [ ] No console errors or warnings
- [ ] Sensitive data is not exposed
```

### 3. After Creating the PR

- Respond to review comments promptly
- Make requested changes in new commits
- Keep the PR updated with the main branch
- Be patient - reviews take time

## 🏗️ Project Structure

```
finflow-tracker/
├── src/
│   ├── app/              # Next.js pages
│   ├── components/       # React components
│   │   ├── common/       # Shared components
│   │   ├── dashboard/    # Dashboard components
│   │   ├── accounts/     # Account management
│   │   └── layout/       # Layout components
│   ├── lib/              # Utilities
│   ├── services/         # Business logic
│   ├── hooks/            # Custom React hooks
│   └── types/            # TypeScript definitions
├── prisma/
│   └── schema.prisma     # Database schema
├── public/               # Static assets
├── tests/                # Test files
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── e2e/             # End-to-end tests
└── scripts/              # Utility scripts
```

## 🎯 Areas for Contribution

### High Priority
- Multi-currency support improvements
- Data visualization enhancements
- Export functionality (PDF, Excel)
- Mobile responsiveness
- Performance optimizations

### Good First Issues
- UI/UX improvements
- Documentation updates
- Test coverage expansion
- Accessibility enhancements
- Translation support preparation

### Future Features
- Budgeting tools
- Investment tracking
- Financial goals
- Reports and analytics
- Data backup/restore

## 🐛 Reporting Bugs

### Bug Report Template
```markdown
## Description
Clear description of the bug

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error...

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Screenshots
If applicable

## Environment
- Browser:
- OS:
- Node version:
- npm version:
```

## 💡 Suggesting Features

### Feature Request Template
```markdown
## Problem Statement
What problem does this solve?

## Proposed Solution
How would you solve it?

## Alternatives Considered
Other approaches

## Additional Context
Any other information
```

## 🔒 Security

### Important Guidelines
- Never commit sensitive data
- Use environment variables for secrets
- Validate all user inputs
- Sanitize data before display
- Follow OWASP best practices
- Report security issues privately

### Security Checklist
- [ ] No hardcoded credentials
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Proper authentication checks
- [ ] Secure data transmission

## 📚 Resources

### Documentation
- [Next.js](https://nextjs.org/docs)
- [Prisma](https://www.prisma.io/docs)
- [TypeScript](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React](https://react.dev)

### Tools
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
- [Jest](https://jestjs.io/)
- [GitHub CLI](https://cli.github.com/)

## 🤝 Getting Help

### Where to Ask Questions
1. Check existing [issues](https://github.com/Fern-Labs-Open-Source/finflow-tracker/issues)
2. Review [documentation](../docs/)
3. Create a new issue with the `question` label
4. Be specific and provide context

### Response Times
- Issues: 1-3 days
- Pull requests: 2-5 days
- Security issues: Within 24 hours

## 🎉 Recognition

Contributors will be:
- Listed in the project README
- Credited in release notes
- Given credit in commit messages

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to FinFlow Tracker! Your efforts help make personal finance management more accessible and secure for everyone.

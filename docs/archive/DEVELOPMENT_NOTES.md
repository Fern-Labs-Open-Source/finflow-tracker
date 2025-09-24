# FinFlow Tracker - Development Notes

## Authentication Implementation Details

### Recent Changes (Sept 23, 2025)
Successfully implemented a complete multi-user authentication system with the following components:

#### Database Schema Updates
- Added `userId` foreign keys to all data models
- Created `OAuthAccount` model for social logins  
- Updated unique constraints to include userId where appropriate
- Ensured cascade delete for data cleanup

#### Key Implementation Decisions

1. **Authentication Strategy**
   - Used NextAuth.js for flexibility and security
   - Prisma Adapter for OAuth account management
   - JWT strategy for session tokens (30-day expiry)
   - bcrypt with 12 rounds for password hashing

2. **Data Isolation Approach**
   - Every API endpoint requires authentication (401 for unauthorized)
   - User context passed via `AuthenticatedRequest` interface
   - All database queries filter by `userId`
   - Ownership verification before any update/delete operations

3. **User Registration Flow**
   - Email/password registration with validation
   - Auto-generated username from email
   - Sample data creation for new users
   - Support for name field (optional)

4. **OAuth Integration**
   - Providers configured but awaiting credentials
   - Google and GitHub ready to activate
   - Email-based account linking enabled
   - Initial data creation for OAuth users

### Common Issues & Solutions

#### Issue 1: Database Connection Errors
**Problem**: Prisma client caching old connection strings in development
**Solution**: 
- Clear `.next` cache
- Regenerate Prisma client
- Modified `prisma.ts` to not cache in development
- Check both `.env` and `.env.local` files (`.env.local` takes precedence)

#### Issue 2: TypeScript Errors with User Context
**Problem**: Optional userId in authenticated requests
**Solution**: Used non-null assertion (`userId!`) after auth middleware guarantees presence

#### Issue 3: Derived Account Creation
**Problem**: Brokerage sub-accounts need userId
**Solution**: Extract userId from parent account in BrokerageService

### Security Considerations

1. **Password Security**
   - Minimum 8 characters enforced
   - bcrypt with cost factor 12
   - Passwords never logged or exposed

2. **Session Management**
   - JWT tokens with NEXTAUTH_SECRET
   - 30-day expiry for convenience
   - Secure, httpOnly cookies in production

3. **Data Access Control**
   - No global data queries
   - User ownership verified at API level
   - Cascade delete prevents orphaned data

### Testing Authentication

Use the provided test scripts:
```bash
# Basic authentication test
./test-auth.sh

# Manual testing
1. Register new user at /login
2. Create some financial data
3. Logout and register another user
4. Verify data isolation
```

### Environment Variables

Critical for authentication:
```env
# Database (check for typos in hostname!)
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_SECRET=<random-32-char-string>
NEXTAUTH_URL=http://localhost:3000

# OAuth (when available)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### Migration Path from Single-User

For existing deployments:
1. Create a default admin user
2. Assign all existing data to this user
3. Run migration: `UPDATE institutions SET user_id = '<admin-id>'`
4. Repeat for all tables with data

### Performance Considerations

- User filtering adds minimal overhead
- Indexes on userId columns important for large datasets
- Consider pagination for user-specific queries
- Cache user session in request context

### Future Enhancements

1. **Email Verification**
   - Send verification email on registration
   - Require verification for sensitive operations
   - Password reset via email

2. **Two-Factor Authentication**
   - TOTP support
   - Backup codes
   - Security key support

3. **User Management**
   - Profile editing
   - Account deletion with data export
   - Activity logs

4. **Role-Based Access**
   - Admin users for multi-tenant scenarios
   - Read-only access for advisors
   - Family member permissions

### Development Workflow

When modifying authentication:
1. Update Prisma schema if needed
2. Run migrations: `npx prisma migrate dev`
3. Update affected API endpoints
4. Test with multiple users
5. Verify data isolation
6. Check for SQL injection vectors
7. Test OAuth flows (when configured)

### Debugging Tips

- Enable Prisma query logging in development
- Use `console.log(req.userId)` to verify context
- Check NextAuth debug logs
- Test with curl for API endpoints
- Use browser DevTools for session inspection

### Common Patterns

#### Authenticated API Route
```typescript
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  const data = await prisma.model.findMany({
    where: { userId: req.userId }
  });
  return NextResponse.json(data);
});
```

#### Ownership Verification
```typescript
const item = await prisma.model.findFirst({
  where: { 
    id: params.id,
    userId: req.userId 
  }
});

if (!item) {
  return NextResponse.json(
    { error: 'Not found or access denied' },
    { status: 404 }
  );
}
```

#### Creating User-Owned Data
```typescript
const created = await prisma.model.create({
  data: {
    ...validatedData,
    userId: req.userId!
  }
});
```

---

*These notes document the authentication implementation process and should be referenced when making changes to the authentication system.*

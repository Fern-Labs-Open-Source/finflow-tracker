import { NextRequest, NextResponse } from 'next/server';
import { withAuth as prodWithAuth, AuthenticatedRequest } from './get-server-session';

// Re-export for convenience
export type { AuthenticatedRequest } from './get-server-session';

// Development-only auth wrapper that bypasses authentication in test mode
export function withAuthDev(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  // In development/test mode, bypass auth if specific header is present
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    return async (req: NextRequest, context?: any) => {
      // Check for test bypass header
      const testBypass = req.headers.get('X-Test-Bypass-Auth');
      
      if (testBypass === 'test-mode') {
        // Bypass authentication for testing
        console.log('🔓 Auth bypassed for testing:', req.nextUrl.pathname);
        // Add a test user auth object
        const authReq = req as AuthenticatedRequest;
        authReq.userId = 'test-user-id';
        authReq.userEmail = 'test@example.com';
        return handler(authReq, context);
      }
      
      // Otherwise use normal auth
      return prodWithAuth(handler)(req, context);
    };
  }
  
  // In production, always use normal auth
  return prodWithAuth(handler);
}

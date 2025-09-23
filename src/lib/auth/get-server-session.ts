import { getServerSession as getNextAuthSession } from 'next-auth';
import { authOptions } from './auth-options';
import { NextRequest, NextResponse } from 'next/server';

export async function getServerSession() {
  return await getNextAuthSession(authOptions);
}

export async function requireAuth() {
  const session = await getServerSession();
  
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  
  return session;
}

// Extend NextRequest to include user context
export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
  userEmail?: string;
}

// API route middleware wrapper with user context
export function withAuth(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
    try {
      const session = await getServerSession();
      
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Unauthorized - Please sign in' },
          { status: 401 }
        );
      }
      
      // Add user context to request
      const authReq = req as AuthenticatedRequest;
      authReq.userId = session.user.id;
      authReq.userEmail = session.user.email || '';
      
      return handler(authReq, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

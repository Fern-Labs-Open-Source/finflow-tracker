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

// API route middleware wrapper
export function withAuth(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
    try {
      const session = await getServerSession();
      
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      return handler(req, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

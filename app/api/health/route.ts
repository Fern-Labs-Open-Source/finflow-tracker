import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    // Test database connection
    const userCount = await prisma.user.count();
    
    // Check environment variables
    const envCheck = {
      hasDatabase: !!process.env.DATABASE_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasGoogleAuth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      bypassAuth: process.env.BYPASS_AUTH,
      nodeEnv: process.env.NODE_ENV,
    };
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      userCount,
      environment: envCheck,
      timestamp: new Date().toISOString(),
    }, { status: 200 });
    
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        hasDatabase: !!process.env.DATABASE_URL,
        databaseUrl: process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set',
      },
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../src/lib/auth/auth-options';
import { prisma } from '../../../../src/lib/db/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Get OAuth accounts count
    const oauthAccounts = await prisma.oAuthAccount.count();
    const users = await prisma.user.count();
    
    // Get recent OAuth accounts
    const recentOAuth = await prisma.oAuthAccount.findMany({
      take: 5,
      orderBy: { id: 'desc' },
      select: {
        id: true,
        provider: true,
        userId: true,
        providerAccountId: true,
      }
    });
    
    // Get recent users
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        emailVerified: true,
      }
    });
    
    return NextResponse.json({
      session: session ? {
        user: session.user,
        expires: session.expires,
      } : null,
      stats: {
        oauthAccounts,
        users,
      },
      recentOAuth,
      recentUsers,
      authConfig: {
        hasGoogleProvider: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        nextAuthUrl: process.env.NEXTAUTH_URL,
        nodeEnv: process.env.NODE_ENV,
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

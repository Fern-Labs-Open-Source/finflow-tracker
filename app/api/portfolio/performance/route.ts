import { NextRequest, NextResponse } from 'next/server';
import { withAuthDev as withAuth, AuthenticatedRequest } from '../../../../src/lib/auth/with-auth-dev';
import { PortfolioService } from '../../../../src/lib/services/portfolio.service';

// GET /api/portfolio/performance - Get portfolio performance metrics
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    
    // First check if user has any accounts
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const accountCount = await prisma.account.count({
      where: { userId: req.userId }
    });
    
    // Return empty performance data if no accounts
    if (accountCount === 0) {
      await prisma.$disconnect();
      return NextResponse.json({
        currentValue: 0,
        previousValue: 0,
        change: 0,
        changePercent: 0,
        history: [],
        startDate: searchParams.get('startDate') || new Date(new Date().getFullYear(), 0, 1).toISOString(),
        endDate: searchParams.get('endDate') || new Date().toISOString()
      });
    }
    
    await prisma.$disconnect();
    
    // Default to YTD if not specified
    const now = new Date();
    const endDate = searchParams.get('endDate') 
      ? new Date(searchParams.get('endDate')!)
      : now;
    
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(now.getFullYear(), 0, 1); // Beginning of year

    // CRITICAL FIX: Pass userId to filter data
    const metrics = await PortfolioService.getPerformanceMetrics(
      startDate,
      endDate,
      req.userId
    );

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
});

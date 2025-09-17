import { NextRequest, NextResponse } from 'next/server';
import { withAuthDev as withAuth } from '@/lib/auth/with-auth-dev';
import { PortfolioService } from '@/lib/services/portfolio.service';

// GET /api/portfolio/performance - Get portfolio performance metrics
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    
    // Default to YTD if not specified
    const now = new Date();
    const endDate = searchParams.get('endDate') 
      ? new Date(searchParams.get('endDate')!)
      : now;
    
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(now.getFullYear(), 0, 1); // Beginning of year

    const metrics = await PortfolioService.getPerformanceMetrics(
      startDate,
      endDate
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

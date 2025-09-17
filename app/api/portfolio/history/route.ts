import { NextRequest, NextResponse } from 'next/server';
import { withAuthDev as withAuth } from '../../../../src/lib/auth/with-auth-dev';
import { PortfolioService } from '../../../../src/lib/services/portfolio.service';

// GET /api/portfolio/history - Get historical portfolio data
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    
    // Default to last 30 days if not specified
    const endDate = searchParams.get('endDate') 
      ? new Date(searchParams.get('endDate')!)
      : new Date();
    
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const history = await PortfolioService.getHistoricalData(
      startDate,
      endDate,
      includeInactive
    );

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching portfolio history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio history' },
      { status: 500 }
    );
  }
});

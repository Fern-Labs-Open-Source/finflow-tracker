import { NextRequest, NextResponse } from 'next/server';
import { withAuthDev as withAuth } from '../../../../src/lib/auth/with-auth-dev';
import { PortfolioService } from '../../../../src/lib/services/portfolio.service';

// GET /api/portfolio/summary - Get portfolio summary
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const detailed = searchParams.get('detailed') !== 'false'; // Default to detailed

    const summary = detailed 
      ? await PortfolioService.getDetailedPortfolioSummary(includeInactive)
      : await PortfolioService.getPortfolioSummary(includeInactive);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching portfolio summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio summary' },
      { status: 500 }
    );
  }
});

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/get-server-session';
import { PortfolioService } from '@/lib/services/portfolio.service';

// GET /api/portfolio/summary - Get portfolio summary
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const summary = await PortfolioService.getPortfolioSummary(includeInactive);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching portfolio summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio summary' },
      { status: 500 }
    );
  }
});

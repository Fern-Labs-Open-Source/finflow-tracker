import { NextRequest, NextResponse } from 'next/server';
import { withAuthDev as withAuth } from '../../../../src/lib/auth/with-auth-dev';
import { PortfolioService } from '../../../../src/lib/services/portfolio.service';

// GET /api/portfolio/currencies - Get currency breakdown
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const breakdown = await PortfolioService.getCurrencyBreakdown();

    return NextResponse.json(breakdown);
  } catch (error) {
    console.error('Error fetching currency breakdown:', error);
    return NextResponse.json(
      { error: 'Failed to fetch currency breakdown' },
      { status: 500 }
    );
  }
});

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/get-server-session';
import { PortfolioService } from '@/lib/services/portfolio.service';

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

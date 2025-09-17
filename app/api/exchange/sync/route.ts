import { NextRequest, NextResponse } from 'next/server';
import { withAuthDev as withAuth } from '@/lib/auth/with-auth-dev';
import { ExchangeRateService } from '@/lib/services/exchange-rate.service';
import { syncExchangeRatesSchema } from '@/lib/validation/schemas';
import { Currency } from '@prisma/client';
import { z } from 'zod';

// POST /api/exchange/sync - Sync exchange rates
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const validatedData = syncExchangeRatesSchema.parse(body);

    // Default to last 7 days if no dates specified
    const dates = validatedData.dates?.map(d => new Date(d)) || [
      ...Array(7)
    ].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date;
    });

    const currencies = validatedData.currencies || [
      Currency.EUR,
      Currency.GBP,
      Currency.SEK,
    ];

    await ExchangeRateService.syncExchangeRates(dates, currencies);

    return NextResponse.json({
      success: true,
      syncedDates: dates.length,
      currencies: currencies.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error syncing exchange rates:', error);
    return NextResponse.json(
      { error: 'Failed to sync exchange rates' },
      { status: 500 }
    );
  }
});

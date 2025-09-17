import { NextRequest, NextResponse } from 'next/server';
import { withAuthDev as withAuth } from '@/lib/auth/with-auth-dev';
import { ExchangeRateService } from '@/lib/services/exchange-rate.service';
import { exchangeRateQuerySchema } from '@/lib/validation/schemas';
import { z } from 'zod';

// GET /api/exchange/rates - Get exchange rates
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    
    // If specific rate requested
    if (searchParams.get('date') && searchParams.get('fromCurrency') && searchParams.get('toCurrency')) {
      const params = exchangeRateQuerySchema.parse({
        date: searchParams.get('date'),
        fromCurrency: searchParams.get('fromCurrency'),
        toCurrency: searchParams.get('toCurrency'),
      });

      const rate = await ExchangeRateService.getExchangeRate(
        new Date(params.date),
        params.fromCurrency,
        params.toCurrency
      );

      return NextResponse.json({
        date: params.date,
        fromCurrency: params.fromCurrency,
        toCurrency: params.toCurrency,
        rate: rate.toNumber(),
      });
    }

    // Otherwise return latest rates
    const latestRates = await ExchangeRateService.getLatestRates();
    
    const formattedRates = latestRates.map(rate => ({
      id: rate.id,
      date: rate.date,
      fromCurrency: rate.fromCurrency,
      toCurrency: rate.toCurrency,
      rate: rate.rate.toNumber(),
      source: rate.source,
    }));

    return NextResponse.json(formattedRates);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error fetching exchange rates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    );
  }
});

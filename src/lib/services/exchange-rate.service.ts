import { prisma } from '@/lib/db/prisma';
import { Currency } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class ExchangeRateService {
  private static readonly BASE_CURRENCY = Currency.EUR;
  private static readonly API_BASE_URL = 'https://api.exchangerate-api.com/v4/latest';

  /**
   * Get exchange rate for a specific date
   */
  static async getExchangeRate(
    date: Date,
    fromCurrency: Currency,
    toCurrency: Currency
  ): Promise<Decimal> {
    // If same currency, return 1
    if (fromCurrency === toCurrency) {
      return new Decimal(1);
    }

    // Check cache first
    const cached = await prisma.exchangeRate.findUnique({
      where: {
        date_fromCurrency_toCurrency: {
          date,
          fromCurrency: fromCurrency as string,
          toCurrency: toCurrency as string,
        },
      },
    });

    if (cached) {
      return cached.rate;
    }

    // If not cached, try to fetch from API
    try {
      const rate = await this.fetchExchangeRate(date, fromCurrency, toCurrency);
      
      // Cache the result
      await prisma.exchangeRate.create({
        data: {
          date,
          fromCurrency: fromCurrency as string,
          toCurrency: toCurrency as string,
          rate,
          source: 'exchangerate-api',
        },
      });

      return rate;
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      
      // Try to get the most recent rate as fallback
      const recentRate = await prisma.exchangeRate.findFirst({
        where: {
          fromCurrency: fromCurrency as string,
          toCurrency: toCurrency as string,
          date: {
            lte: date,
          },
        },
        orderBy: {
          date: 'desc',
        },
      });

      if (recentRate) {
        return recentRate.rate;
      }

      // If all else fails, return 1 (should not happen in production with proper setup)
      console.warn(`No exchange rate found for ${fromCurrency} to ${toCurrency} on ${date}`);
      return new Decimal(1);
    }
  }

  /**
   * Convert amount from one currency to another
   */
  static async convertCurrency(
    amount: Decimal | number,
    fromCurrency: Currency,
    toCurrency: Currency,
    date: Date = new Date()
  ): Promise<Decimal> {
    const decimalAmount = new Decimal(amount.toString());
    
    if (fromCurrency === toCurrency) {
      return decimalAmount;
    }

    const rate = await this.getExchangeRate(date, fromCurrency, toCurrency);
    return decimalAmount.mul(rate);
  }

  /**
   * Convert to EUR (base currency)
   */
  static async convertToEur(
    amount: Decimal | number,
    fromCurrency: Currency,
    date: Date = new Date()
  ): Promise<Decimal> {
    return this.convertCurrency(amount, fromCurrency, this.BASE_CURRENCY, date);
  }

  /**
   * Fetch exchange rate from external API
   */
  private static async fetchExchangeRate(
    date: Date,
    fromCurrency: Currency,
    toCurrency: Currency
  ): Promise<Decimal> {
    // Note: The free API doesn't support historical rates
    // In production, you'd use a paid API that supports historical data
    // For now, we'll use current rates as a placeholder
    
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    
    if (!apiKey) {
      // Use mock rates for development if no API key
      const mockRates: Record<string, Record<string, number>> = {
        EUR: { EUR: 1, GBP: 0.86, SEK: 11.5 },
        GBP: { EUR: 1.16, GBP: 1, SEK: 13.4 },
        SEK: { EUR: 0.087, GBP: 0.075, SEK: 1 },
      };
      
      const rate = mockRates[fromCurrency]?.[toCurrency] || 1;
      return new Decimal(rate);
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/${fromCurrency}`);
      const data = await response.json();
      
      if (data.rates && data.rates[toCurrency]) {
        return new Decimal(data.rates[toCurrency]);
      }
      
      throw new Error(`Rate not found for ${fromCurrency} to ${toCurrency}`);
    } catch (error) {
      console.error('API fetch failed:', error);
      throw error;
    }
  }

  /**
   * Sync exchange rates for multiple dates and currencies
   */
  static async syncExchangeRates(
    dates: Date[],
    currencies: Currency[] = [Currency.EUR, Currency.GBP, Currency.SEK]
  ): Promise<void> {
    for (const date of dates) {
      for (const fromCurrency of currencies) {
        for (const toCurrency of currencies) {
          if (fromCurrency !== toCurrency) {
            try {
              await this.getExchangeRate(date, fromCurrency, toCurrency);
            } catch (error) {
              console.error(
                `Failed to sync rate for ${fromCurrency} to ${toCurrency} on ${date}:`,
                error
              );
            }
          }
        }
      }
    }
  }

  /**
   * Get latest rates for all currency pairs
   */
  static async getLatestRates(): Promise<any[]> {
    const rates = await prisma.exchangeRate.findMany({
      distinct: ['fromCurrency', 'toCurrency'],
      orderBy: {
        date: 'desc',
      },
      take: 9, // 3 currencies = 6 pairs (excluding same currency pairs)
    });

    return rates;
  }
}

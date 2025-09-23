import { prisma } from '../db/prisma';
import { Currency } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { ExchangeRateService } from './exchange-rate.service';

interface PortfolioSummary {
  totalValueEur: number;
  totalValueByInstitution: Record<string, number>;
  totalValueByCurrency: Record<Currency, number>;
  accountCount: number;
  activeAccountCount: number;
  lastUpdated: Date | null;
}

interface DetailedPortfolioSummary {
  totalNetWorth: number;
  totalNetWorthInBaseCurrency: number;
  baseCurrency: string;
  accountsByType: {
    type: string;
    count: number;
    totalBalance: number;
    totalBalanceInBaseCurrency: number;
  }[];
  accountsByCurrency: {
    currency: string;
    count: number;
    totalBalance: number;
    totalBalanceInBaseCurrency: number;
  }[];
  changeFromLastSnapshot: {
    absolute: number;
    percentage: number;
  } | null;
}

interface HistoricalDataPoint {
  date: Date;
  totalValue: number;
  breakdown: {
    institutionId: string;
    institutionName: string;
    value: number;
  }[];
}

export class PortfolioService {
  /**
   * Get detailed portfolio summary for dashboard
   */
  static async getDetailedPortfolioSummary(
    includeInactive = false,
    userId?: string
  ): Promise<DetailedPortfolioSummary> {
    const baseCurrency = 'EUR'; // Default base currency
    
    // Get all accounts with their latest snapshots
    const accounts = await prisma.account.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(includeInactive ? {} : { isActive: true })
      },
      include: {
        institution: true,
        snapshots: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });

    let totalNetWorthInBaseCurrency = 0;
    const accountsByTypeMap = new Map<string, { count: number; totalBalance: number; totalBalanceInBaseCurrency: number }>();
    const accountsByCurrencyMap = new Map<string, { count: number; totalBalance: number; totalBalanceInBaseCurrency: number }>();

    for (const account of accounts) {
      const latestSnapshot = account.snapshots[0];
      if (!latestSnapshot) continue;

      const valueInBaseCurrency = latestSnapshot.valueEur.toNumber();
      const originalValue = latestSnapshot.valueOriginal.toNumber();
      
      totalNetWorthInBaseCurrency += valueInBaseCurrency;

      // Group by type
      const typeData = accountsByTypeMap.get(account.type) || { count: 0, totalBalance: 0, totalBalanceInBaseCurrency: 0 };
      typeData.count += 1;
      typeData.totalBalance += originalValue;
      typeData.totalBalanceInBaseCurrency += valueInBaseCurrency;
      accountsByTypeMap.set(account.type, typeData);

      // Group by currency
      const currencyData = accountsByCurrencyMap.get(account.currency) || { count: 0, totalBalance: 0, totalBalanceInBaseCurrency: 0 };
      currencyData.count += 1;
      currencyData.totalBalance += originalValue;
      currencyData.totalBalanceInBaseCurrency += valueInBaseCurrency;
      accountsByCurrencyMap.set(account.currency, currencyData);
    }

    // Calculate change from previous day
    let changeFromLastSnapshot = null;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const previousSnapshots = await prisma.accountSnapshot.findMany({
      where: {
        accountId: { in: accounts.map(a => a.id) },
        date: {
          gte: yesterday,
          lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (previousSnapshots.length > 0) {
      const previousTotal = previousSnapshots.reduce((sum, snap) => sum + snap.valueEur.toNumber(), 0);
      const absoluteChange = totalNetWorthInBaseCurrency - previousTotal;
      const percentageChange = previousTotal !== 0 ? (absoluteChange / previousTotal) * 100 : 0;
      
      changeFromLastSnapshot = {
        absolute: absoluteChange,
        percentage: percentageChange,
      };
    }

    return {
      totalNetWorth: totalNetWorthInBaseCurrency,
      totalNetWorthInBaseCurrency,
      baseCurrency,
      accountsByType: Array.from(accountsByTypeMap.entries()).map(([type, data]) => ({
        type,
        ...data,
      })),
      accountsByCurrency: Array.from(accountsByCurrencyMap.entries()).map(([currency, data]) => ({
        currency,
        ...data,
      })),
      changeFromLastSnapshot,
    };
  }

  /**
   * Get current portfolio summary
   */
  static async getPortfolioSummary(
    includeInactive = false,
    userId?: string
  ): Promise<PortfolioSummary> {
    // Get all accounts with their latest snapshots
    const accounts = await prisma.account.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(includeInactive ? {} : { isActive: true })
      },
      include: {
        institution: true,
        snapshots: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });

    let totalValueEur = new Decimal(0);
    const totalValueByInstitution: Record<string, number> = {};
    const totalValueByCurrency: Record<Currency, number> = {
      [Currency.EUR]: 0,
      [Currency.GBP]: 0,
      [Currency.SEK]: 0,
    };
    let lastUpdated: Date | null = null;

    for (const account of accounts) {
      if (account.snapshots.length === 0) continue;

      const latestSnapshot = account.snapshots[0];
      const valueEur = latestSnapshot.valueEur;
      
      totalValueEur = totalValueEur.add(valueEur);

      // Aggregate by institution
      if (!totalValueByInstitution[account.institution.name]) {
        totalValueByInstitution[account.institution.name] = 0;
      }
      totalValueByInstitution[account.institution.name] += valueEur.toNumber();

      // Aggregate by currency
      totalValueByCurrency[account.currency] += latestSnapshot.valueOriginal.toNumber();

      // Track the most recent update
      if (!lastUpdated || latestSnapshot.date > lastUpdated) {
        lastUpdated = latestSnapshot.date;
      }
    }

    return {
      totalValueEur: totalValueEur.toNumber(),
      totalValueByInstitution,
      totalValueByCurrency,
      accountCount: accounts.length,
      activeAccountCount: accounts.filter((a) => a.isActive).length,
      lastUpdated,
    };
  }

  /**
   * Get historical portfolio data
   */
  static async getHistoricalData(
    startDate: Date,
    endDate: Date,
    includeInactive = false,
    userId?: string
  ): Promise<HistoricalDataPoint[]> {
    // Get all snapshots in the date range
    const snapshots = await prisma.accountSnapshot.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        account: {
          ...(userId ? { userId } : {}),
          ...(includeInactive ? {} : { isActive: true })
        },
      },
      include: {
        account: {
          include: {
            institution: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { accountId: 'asc' },
      ],
    });

    // Group snapshots by date
    const dataByDate = new Map<string, HistoricalDataPoint>();

    for (const snapshot of snapshots) {
      const dateKey = snapshot.date.toISOString().split('T')[0];
      
      if (!dataByDate.has(dateKey)) {
        dataByDate.set(dateKey, {
          date: snapshot.date,
          totalValue: 0,
          breakdown: [],
        });
      }

      const dataPoint = dataByDate.get(dateKey)!;
      dataPoint.totalValue += snapshot.valueEur.toNumber();

      // Find or create institution breakdown
      let institutionBreakdown = dataPoint.breakdown.find(
        (b) => b.institutionId === snapshot.account.institutionId
      );

      if (!institutionBreakdown) {
        institutionBreakdown = {
          institutionId: snapshot.account.institutionId,
          institutionName: snapshot.account.institution.name,
          value: 0,
        };
        dataPoint.breakdown.push(institutionBreakdown);
      }

      institutionBreakdown.value += snapshot.valueEur.toNumber();
    }

    return Array.from(dataByDate.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
  }

  /**
   * Get currency exposure breakdown
   */
  static async getCurrencyBreakdown(): Promise<{
    byCurrency: Record<Currency, { original: number; inEur: number }>;
    total: number;
    percentages: Record<Currency, number>;
  }> {
    const accounts = await prisma.account.findMany({
      where: { isActive: true },
      include: {
        snapshots: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });

    const byCurrency: Record<Currency, { original: number; inEur: number }> = {
      [Currency.EUR]: { original: 0, inEur: 0 },
      [Currency.GBP]: { original: 0, inEur: 0 },
      [Currency.SEK]: { original: 0, inEur: 0 },
    };

    let totalEur = new Decimal(0);

    for (const account of accounts) {
      if (account.snapshots.length === 0) continue;

      const snapshot = account.snapshots[0];
      byCurrency[account.currency].original += snapshot.valueOriginal.toNumber();
      byCurrency[account.currency].inEur += snapshot.valueEur.toNumber();
      totalEur = totalEur.add(snapshot.valueEur);
    }

    const total = totalEur.toNumber();
    const percentages: Record<Currency, number> = {
      [Currency.EUR]: total > 0 ? (byCurrency[Currency.EUR].inEur / total) * 100 : 0,
      [Currency.GBP]: total > 0 ? (byCurrency[Currency.GBP].inEur / total) * 100 : 0,
      [Currency.SEK]: total > 0 ? (byCurrency[Currency.SEK].inEur / total) * 100 : 0,
    };

    return {
      byCurrency,
      total,
      percentages,
    };
  }

  /**
   * Calculate portfolio performance metrics
   */
  static async getPerformanceMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<{
    startValue: number;
    endValue: number;
    absoluteChange: number;
    percentageChange: number;
    periodInDays: number;
  }> {
    // Get start value
    const startSnapshots = await prisma.accountSnapshot.findMany({
      where: {
        date: {
          gte: startDate,
          lt: new Date(startDate.getTime() + 24 * 60 * 60 * 1000),
        },
        account: { isActive: true },
      },
    });

    // Get end value
    const endSnapshots = await prisma.accountSnapshot.findMany({
      where: {
        date: {
          gte: endDate,
          lt: new Date(endDate.getTime() + 24 * 60 * 60 * 1000),
        },
        account: { isActive: true },
      },
    });

    const startValue = startSnapshots.reduce(
      (sum, s) => sum.add(s.valueEur),
      new Decimal(0)
    );

    const endValue = endSnapshots.reduce(
      (sum, s) => sum.add(s.valueEur),
      new Decimal(0)
    );

    const absoluteChange = endValue.sub(startValue);
    const percentageChange = startValue.gt(0)
      ? absoluteChange.div(startValue).mul(100)
      : new Decimal(0);

    const periodInDays = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      startValue: startValue.toNumber(),
      endValue: endValue.toNumber(),
      absoluteChange: absoluteChange.toNumber(),
      percentageChange: percentageChange.toNumber(),
      periodInDays,
    };
  }
}

/**
 * Quick stats endpoint for portfolio
 * Returns essential portfolio metrics with minimal processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthDev as withAuth } from '@/lib/auth/with-auth-dev';
import { prisma } from '@/lib/db/prisma';
import { CacheHeaders } from '@/lib/api/cache-headers';

// GET /api/portfolio/quick-stats - Get quick portfolio statistics
export const GET = withAuth(async (req: NextRequest) => {
  try {
    // Get all accounts with latest snapshots in one query
    const accounts = await prisma.account.findMany({
      where: { 
        isActive: true,
      },
      include: {
        institution: {
          select: {
            name: true,
            type: true,
          },
        },
        snapshots: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });

    // Get exchange rates for currency conversion
    const currencies = [...new Set(accounts.map(a => a.currency))];
    const exchangeRates = await prisma.exchangeRate.findMany({
      where: {
        fromCurrency: { in: currencies.filter(c => c !== 'EUR') },
        toCurrency: 'EUR',
      },
      orderBy: { date: 'desc' },
      distinct: ['fromCurrency'],
    });

    const rateMap = new Map(exchangeRates.map(r => [r.fromCurrency, r.rate]));
    rateMap.set('EUR', 1); // EUR to EUR is always 1

    // Calculate quick stats
    let totalValueEUR = 0;
    const byType: Record<string, number> = {};
    const byCurrency: Record<string, number> = {};
    const byInstitution: Record<string, number> = {};

    for (const account of accounts) {
      // Get latest snapshot value
      const latestSnapshot = account.snapshots[0];
      if (!latestSnapshot) continue; // Skip accounts without snapshots
      
      const balance = Number(latestSnapshot.valueOriginal);
      
      // Track by currency (native amounts)
      byCurrency[account.currency] = (byCurrency[account.currency] || 0) + balance;
      
      // Convert to EUR for totals
      const rate = rateMap.get(account.currency) || 1;
      const valueInEUR = balance * rate;
      totalValueEUR += valueInEUR;
      
      // Track by type (in EUR)
      byType[account.type] = (byType[account.type] || 0) + valueInEUR;
      
      // Track by institution (in EUR)
      const instName = account.institution.name;
      byInstitution[instName] = (byInstitution[instName] || 0) + valueInEUR;
    }

    // Get change from yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const yesterdaySnapshots = await prisma.accountSnapshot.findMany({
      where: {
        accountId: { in: accounts.map(a => a.id) },
        date: {
          gte: yesterday,
          lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { date: 'desc' },
      distinct: ['accountId'],
    });

    let yesterdayTotalEUR = 0;
    for (const snapshot of yesterdaySnapshots) {
      const rate = rateMap.get(snapshot.currency) || 1;
      yesterdayTotalEUR += Number(snapshot.valueOriginal) * rate;
    }

    const dailyChange = totalValueEUR - yesterdayTotalEUR;
    const dailyChangePercent = yesterdayTotalEUR > 0 
      ? ((dailyChange / yesterdayTotalEUR) * 100).toFixed(2)
      : '0';

    const stats = {
      totalValue: {
        eur: Math.round(totalValueEUR * 100) / 100,
        formatted: `€${totalValueEUR.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
      dailyChange: {
        amount: Math.round(dailyChange * 100) / 100,
        percent: parseFloat(dailyChangePercent),
        formatted: `${dailyChange >= 0 ? '+' : ''}€${dailyChange.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${dailyChange >= 0 ? '+' : ''}${dailyChangePercent}%)`,
      },
      accountCount: accounts.length,
      distribution: {
        byType: Object.entries(byType).map(([type, value]) => ({
          type,
          value: Math.round(value * 100) / 100,
          percentage: Math.round((value / totalValueEUR) * 100),
        })),
        byCurrency: Object.entries(byCurrency).map(([currency, value]) => ({
          currency,
          value: Math.round(value * 100) / 100,
        })),
        byInstitution: Object.entries(byInstitution)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5) // Top 5 institutions
          .map(([name, value]) => ({
            name,
            value: Math.round(value * 100) / 100,
            percentage: Math.round((value / totalValueEUR) * 100),
          })),
      },
      lastUpdated: new Date().toISOString(),
    };

    // Cache for 1 minute - quick stats can be slightly stale
    return NextResponse.json(stats, { 
      headers: CacheHeaders.shortCache 
    });
  } catch (error) {
    console.error('Error fetching quick stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio statistics' },
      { status: 500 }
    );
  }
});

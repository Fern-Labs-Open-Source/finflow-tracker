import { NextRequest, NextResponse } from 'next/server';
import { withAuthDev as withAuth } from '../../../../src/lib/auth/with-auth-dev';
import { prisma } from '../../../../src/lib/db/prisma';

// GET /api/export/csv - Export data as CSV
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'snapshots';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let csvContent = '';
    let filename = '';

    switch (type) {
      case 'snapshots': {
        const where: any = {};
        if (startDate) where.date = { ...where.date, gte: new Date(startDate) };
        if (endDate) where.date = { ...where.date, lte: new Date(endDate) };

        const snapshots = await prisma.accountSnapshot.findMany({
          where,
          orderBy: [
            { date: 'desc' },
            { accountId: 'asc' },
          ],
          include: {
            account: {
              include: {
                institution: true,
              },
            },
          },
        });

        // CSV header
        csvContent = 'Date,Institution,Account,Currency,Value,Value (EUR),Exchange Rate,Notes\n';
        
        // CSV rows
        snapshots.forEach(snapshot => {
          const row = [
            snapshot.date.toISOString().split('T')[0],
            `"${snapshot.account.institution.name}"`,
            `"${snapshot.account.name}"`,
            snapshot.currency,
            snapshot.valueOriginal.toNumber(),
            snapshot.valueEur.toNumber(),
            snapshot.exchangeRate?.toNumber() || '',
            snapshot.notes ? `"${snapshot.notes.replace(/"/g, '""')}"` : '',
          ].join(',');
          csvContent += row + '\n';
        });

        filename = `portfolio_snapshots_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      case 'accounts': {
        const accounts = await prisma.account.findMany({
          orderBy: [
            { institution: { displayOrder: 'asc' } },
            { displayOrder: 'asc' },
          ],
          include: {
            institution: true,
            snapshots: {
              orderBy: { date: 'desc' },
              take: 1,
            },
          },
        });

        // CSV header
        csvContent = 'Institution,Account Name,Type,Currency,Active,Latest Value,Latest Value (EUR),Last Updated\n';
        
        // CSV rows
        accounts.forEach(account => {
          const latestSnapshot = account.snapshots[0];
          const row = [
            `"${account.institution.name}"`,
            `"${account.name}"`,
            account.type,
            account.currency,
            account.isActive ? 'Yes' : 'No',
            latestSnapshot?.valueOriginal.toNumber() || '0',
            latestSnapshot?.valueEur.toNumber() || '0',
            latestSnapshot?.date.toISOString().split('T')[0] || '',
          ].join(',');
          csvContent += row + '\n';
        });

        filename = `accounts_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      case 'institutions': {
        const institutions = await prisma.institution.findMany({
          orderBy: { displayOrder: 'asc' },
          include: {
            accounts: {
              include: {
                snapshots: {
                  orderBy: { date: 'desc' },
                  take: 1,
                },
              },
            },
          },
        });

        // CSV header
        csvContent = 'Institution,Type,Total Accounts,Active Accounts,Total Value (EUR)\n';
        
        // CSV rows
        institutions.forEach(institution => {
          const activeAccounts = institution.accounts.filter(a => a.isActive);
          const totalValue = institution.accounts.reduce((sum, account) => {
            const snapshot = account.snapshots[0];
            return sum + (snapshot?.valueEur.toNumber() || 0);
          }, 0);

          const row = [
            `"${institution.name}"`,
            institution.type || '',
            institution.accounts.length,
            activeAccounts.length,
            totalValue.toFixed(2),
          ].join(',');
          csvContent += row + '\n';
        });

        filename = `institutions_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid export type. Use: snapshots, accounts, or institutions' },
          { status: 400 }
        );
    }

    // Return CSV as download
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
});

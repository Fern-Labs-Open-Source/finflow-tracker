import { NextRequest, NextResponse } from 'next/server';
import { withAuthDev as withAuth } from '@/lib/auth/with-auth-dev';
import { createBrokerageEntrySchema } from '@/lib/validation/schemas';
import { BrokerageService } from '@/lib/services/brokerage.service';
import { z } from 'zod';

// POST /api/brokerage/update - Update brokerage account with cash/investment split
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const validatedData = createBrokerageEntrySchema.parse(body);

    const result = await BrokerageService.processBrokerageEntry(
      validatedData.brokerageAccountId,
      validatedData.date,
      validatedData.totalValue,
      validatedData.cashValue,
      validatedData.currency
    );

    const response = {
      entry: {
        ...result.entry,
        totalValue: result.entry.totalValue.toNumber(),
        cashValue: result.entry.cashValue.toNumber(),
        investmentValue: result.entry.totalValue.sub(result.entry.cashValue).toNumber(),
      },
      accounts: {
        total: {
          id: result.accounts.total.id,
          name: result.accounts.total.name,
        },
        cash: {
          id: result.accounts.cash.id,
          name: result.accounts.cash.name,
        },
        investment: {
          id: result.accounts.investment.id,
          name: result.accounts.investment.name,
        },
      },
      snapshots: {
        total: {
          value: result.snapshots.total.value.toNumber(),
          valueEur: result.snapshots.total.valueEur.toNumber(),
        },
        cash: {
          value: result.snapshots.cash.value.toNumber(),
          valueEur: result.snapshots.cash.valueEur.toNumber(),
        },
        investment: {
          value: result.snapshots.investment.value.toNumber(),
          valueEur: result.snapshots.investment.valueEur.toNumber(),
        },
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating brokerage:', error);
    return NextResponse.json(
      { error: 'Failed to update brokerage account' },
      { status: 500 }
    );
  }
});

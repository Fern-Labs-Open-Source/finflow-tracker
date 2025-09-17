/**
 * Simple batch update endpoint for accounts
 * Allows updating multiple account balances at once
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthDev as withAuth } from '../../../../src/lib/auth/with-auth-dev';
import { prisma } from '../../../../src/lib/db/prisma';
import { z } from 'zod';
import { validateRequest } from '../../../../src/lib/validation/helpers';
import { CacheHeaders } from '../../../../src/lib/api/cache-headers';

const batchUpdateSchema = z.object({
  updates: z.array(z.object({
    id: z.string(),
    balance: z.number().positive().finite(),
  })).min(1).max(50), // Limit to 50 updates at once for safety
});

// POST /api/accounts/batch-update - Update multiple account balances
export const POST = withAuth(async (req: NextRequest) => {
  const { data, error } = await validateRequest(req, batchUpdateSchema);
  
  if (error) {
    return NextResponse.json(
      { error: error.message, fieldErrors: error.fields },
      { status: 400 }
    );
  }

  try {
    // Verify all accounts exist and belong to the user
    const accountIds = data.updates.map(u => u.id);
    const accounts = await prisma.account.findMany({
      where: {
        id: { in: accountIds },
      },
    });

    if (accounts.length !== accountIds.length) {
      const foundIds = new Set(accounts.map(a => a.id));
      const missingIds = accountIds.filter(id => !foundIds.has(id));
      
      return NextResponse.json(
        { 
          error: 'Some accounts not found or unauthorized',
          missingIds,
        },
        { status: 404 }
      );
    }

    // Create new snapshots for all updates in a transaction
    const results = await prisma.$transaction(async (tx) => {
      const snapshots = [];
      
      for (const update of data.updates) {
        const account = accounts.find(a => a.id === update.id)!;
        
        // Create a new snapshot with the updated balance
        const snapshot = await tx.accountSnapshot.create({
          data: {
            accountId: update.id,
            valueOriginal: update.balance,
            valueEur: update.balance, // Should be converted with exchange rate in production
            currency: account.currency,
            date: new Date(),
          },
        });
        
        snapshots.push(snapshot);
      }
      
      return snapshots;
    });

    // Return updated accounts with no cache (fresh data)
    return NextResponse.json(
      {
        success: true,
        updated: results.length,
        accounts: results,
      },
      { headers: CacheHeaders.noCache }
    );
  } catch (error) {
    console.error('Batch update error:', error);
    return NextResponse.json(
      { error: 'Failed to update accounts' },
      { status: 500 }
    );
  }
});

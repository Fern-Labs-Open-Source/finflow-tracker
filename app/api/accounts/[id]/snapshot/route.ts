import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withAuthDev as withAuth } from '@/lib/auth/with-auth-dev';
import { createAccountSnapshotSchema } from '@/lib/validation/schemas';
import { ExchangeRateService } from '@/lib/services/exchange-rate.service';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';

interface RouteParams {
  params: { id: string };
}

// GET /api/accounts/[id]/snapshot - Get snapshots for an account
export const GET = withAuth(async (req: NextRequest, { params }: RouteParams) => {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '30');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = { accountId: params.id };
    if (startDate) {
      where.date = { ...where.date, gte: new Date(startDate) };
    }
    if (endDate) {
      where.date = { ...where.date, lte: new Date(endDate) };
    }

    const snapshots = await prisma.accountSnapshot.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
    });

    const formattedSnapshots = snapshots.map((snapshot) => ({
      id: snapshot.id,
      date: snapshot.date,
      valueOriginal: snapshot.valueOriginal.toNumber(),
      currency: snapshot.currency,
      valueEur: snapshot.valueEur.toNumber(),
      exchangeRate: snapshot.exchangeRate?.toNumber() || null,
      notes: snapshot.notes,
    }));

    return NextResponse.json(formattedSnapshots);
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch snapshots' },
      { status: 500 }
    );
  }
});

// POST /api/accounts/[id]/snapshot - Create a snapshot for an account
export const POST = withAuth(async (req: NextRequest, { params }: RouteParams) => {
  try {
    const body = await req.json();
    const validatedData = createAccountSnapshotSchema.parse({
      ...body,
      accountId: params.id,
    });

    // Get the account details
    const account = await prisma.account.findUnique({
      where: { id: params.id },
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Use account currency if not provided
    const currency = validatedData.currency || account.currency;

    // Convert to EUR
    const valueDecimal = new Decimal(validatedData.valueOriginal);
    const exchangeRate = await ExchangeRateService.getExchangeRate(
      validatedData.date,
      currency,
      'EUR' as any
    );
    const valueEur = valueDecimal.mul(exchangeRate);

    // Check if snapshot already exists for this date
    const existing = await prisma.accountSnapshot.findUnique({
      where: {
        accountId_date: {
          accountId: params.id,
          date: validatedData.date,
        },
      },
    });

    if (existing) {
      // Update existing snapshot
      const snapshot = await prisma.accountSnapshot.update({
        where: { id: existing.id },
        data: {
          valueOriginal: valueDecimal,
          currency,
          valueEur,
          exchangeRate,
          notes: validatedData.notes,
        },
      });

      return NextResponse.json({
        ...snapshot,
        valueOriginal: snapshot.valueOriginal.toNumber(),
        valueEur: snapshot.valueEur.toNumber(),
        exchangeRate: snapshot.exchangeRate?.toNumber() || null,
      });
    } else {
      // Create new snapshot
      const snapshot = await prisma.accountSnapshot.create({
        data: {
          accountId: params.id,
          date: validatedData.date,
          valueOriginal: valueDecimal,
          currency,
          valueEur,
          exchangeRate,
          notes: validatedData.notes,
        },
      });

      return NextResponse.json({
        ...snapshot,
        valueOriginal: snapshot.valueOriginal.toNumber(),
        valueEur: snapshot.valueEur.toNumber(),
        exchangeRate: snapshot.exchangeRate?.toNumber() || null,
      }, { status: 201 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to create snapshot' },
      { status: 500 }
    );
  }
});

// DELETE /api/accounts/[id]/snapshot - Delete a snapshot
export const DELETE = withAuth(async (req: NextRequest, { params }: RouteParams) => {
  try {
    const { searchParams } = new URL(req.url);
    const snapshotId = searchParams.get('snapshotId');
    const date = searchParams.get('date');

    if (snapshotId) {
      await prisma.accountSnapshot.delete({
        where: { id: snapshotId },
      });
    } else if (date) {
      await prisma.accountSnapshot.delete({
        where: {
          accountId_date: {
            accountId: params.id,
            date: new Date(date),
          },
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Must provide snapshotId or date' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to delete snapshot' },
      { status: 500 }
    );
  }
});

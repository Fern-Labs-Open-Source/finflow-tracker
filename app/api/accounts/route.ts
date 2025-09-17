import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withAuthDev as withAuth } from '@/lib/auth/with-auth-dev';
import { createAccountSchema } from '@/lib/validation/schemas';
import { z } from 'zod';

// GET /api/accounts - Get all accounts
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const institutionId = searchParams.get('institutionId');

    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    }
    if (institutionId) {
      where.institutionId = institutionId;
    }

    const accounts = await prisma.account.findMany({
      where,
      orderBy: [
        { institution: { displayOrder: 'asc' } },
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
      include: {
        institution: true,
        snapshots: {
          orderBy: { date: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            snapshots: true,
            childAccounts: true,
          },
        },
      },
    });

    // Calculate latest values
    const accountsWithValues = accounts.map((account) => {
      const latestSnapshot = account.snapshots[0];
      return {
        ...account,
        currentBalance: latestSnapshot?.valueOriginal.toNumber() || 0,
        latestValue: latestSnapshot?.valueOriginal.toNumber() || 0,
        latestValueEur: latestSnapshot?.valueEur.toNumber() || 0,
        lastSnapshotDate: latestSnapshot?.date || null,
        lastUpdated: latestSnapshot?.date || null,
      };
    });

    return NextResponse.json(accountsWithValues);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
});

// POST /api/accounts - Create a new account
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const validatedData = createAccountSchema.parse(body);

    // Check if institution exists
    const institution = await prisma.institution.findUnique({
      where: { id: validatedData.institutionId },
    });

    if (!institution) {
      return NextResponse.json(
        { error: 'Institution not found' },
        { status: 404 }
      );
    }

    const account = await prisma.account.create({
      data: validatedData,
      include: {
        institution: true,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating account:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
});

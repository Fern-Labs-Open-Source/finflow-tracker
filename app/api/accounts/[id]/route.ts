import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../src/lib/db/prisma';
import { withAuthDev as withAuth, AuthenticatedRequest } from '../../../../src/lib/auth/with-auth-dev';
import { updateAccountSchema } from '../../../../src/lib/validation/schemas';
import { z } from 'zod';

interface RouteParams {
  params: { id: string };
}

// GET /api/accounts/[id] - Get a specific account
export const GET = withAuth(async (req: AuthenticatedRequest, { params }: RouteParams) => {
  try {
    const account = await prisma.account.findFirst({
      where: { 
        id: params.id,
        userId: req.userId // CRITICAL: Ensure account belongs to user
      },
      include: {
        institution: true,
        parentAccount: true,
        childAccounts: true,
        snapshots: {
          orderBy: { date: 'desc' },
          take: 30, // Last 30 days
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found or access denied' },
        { status: 404 }
      );
    }

    // Calculate statistics
    const snapshots = account.snapshots;
    const latestSnapshot = snapshots[0];
    
    const stats = {
      currentValue: latestSnapshot?.valueOriginal.toNumber() || 0,
      currentValueEur: latestSnapshot?.valueEur.toNumber() || 0,
      lastUpdated: latestSnapshot?.date || null,
      monthlyChange: 0,
      yearlyChange: 0,
    };

    // Calculate monthly change
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const monthAgoSnapshot = snapshots.find(
      (s) => s.date <= oneMonthAgo
    );
    if (monthAgoSnapshot && latestSnapshot) {
      stats.monthlyChange = 
        ((latestSnapshot.valueEur.toNumber() - monthAgoSnapshot.valueEur.toNumber()) / 
         monthAgoSnapshot.valueEur.toNumber()) * 100;
    }

    // Calculate yearly change
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const yearAgoSnapshot = snapshots.find(
      (s) => s.date <= oneYearAgo
    );
    if (yearAgoSnapshot && latestSnapshot) {
      stats.yearlyChange = 
        ((latestSnapshot.valueEur.toNumber() - yearAgoSnapshot.valueEur.toNumber()) / 
         yearAgoSnapshot.valueEur.toNumber()) * 100;
    }

    return NextResponse.json({
      ...account,
      stats,
    });
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account' },
      { status: 500 }
    );
  }
});

// PATCH /api/accounts/[id] - Update an account
export const PATCH = withAuth(async (req: AuthenticatedRequest, { params }: RouteParams) => {
  try {
    // First verify the account belongs to the user
    const existingAccount = await prisma.account.findFirst({
      where: {
        id: params.id,
        userId: req.userId // CRITICAL: Ensure account belongs to user
      }
    });

    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Account not found or access denied' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = updateAccountSchema.parse(body);

    const account = await prisma.account.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        institution: true,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating account:', error);
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
});

// DELETE /api/accounts/[id] - Delete an account
export const DELETE = withAuth(async (req: AuthenticatedRequest, { params }: RouteParams) => {
  try {
    // First verify the account belongs to the user
    const existingAccount = await prisma.account.findFirst({
      where: {
        id: params.id,
        userId: req.userId // CRITICAL: Ensure account belongs to user
      }
    });

    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Account not found or access denied' },
        { status: 404 }
      );
    }

    // Check if account has child accounts
    const childCount = await prisma.account.count({
      where: { 
        parentAccountId: params.id,
        userId: req.userId 
      },
    });

    if (childCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete account with child accounts' },
        { status: 400 }
      );
    }

    // Delete account (snapshots will cascade delete)
    await prisma.account.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
});

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withAuthDev as withAuth } from '@/lib/auth/with-auth-dev';
import { updateInstitutionSchema } from '@/lib/validation/schemas';
import { createValidationErrorResponse } from '@/lib/validation/error-formatter';
import { z } from 'zod';

interface RouteParams {
  params: { id: string };
}

// GET /api/institutions/[id] - Get a specific institution
export const GET = withAuth(async (req: NextRequest, { params }: RouteParams) => {
  try {
    const institution = await prisma.institution.findUnique({
      where: { id: params.id },
      include: {
        accounts: {
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: { accounts: true },
        },
      },
    });

    if (!institution) {
      return NextResponse.json(
        { error: 'Institution not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(institution);
  } catch (error) {
    console.error('Error fetching institution:', error);
    return NextResponse.json(
      { error: 'Failed to fetch institution' },
      { status: 500 }
    );
  }
});

// PATCH /api/institutions/[id] - Update an institution
export const PATCH = withAuth(async (req: NextRequest, { params }: RouteParams) => {
  try {
    const body = await req.json();
    const validatedData = updateInstitutionSchema.parse(body);

    const institution = await prisma.institution.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        _count: {
          select: { accounts: true },
        },
      },
    });

    return NextResponse.json(institution);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = createValidationErrorResponse(error);
      return NextResponse.json(validationError, { status: 400 });
    }
    
    console.error('Error updating institution:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update institution',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
});

// DELETE /api/institutions/[id] - Delete an institution
export const DELETE = withAuth(async (req: NextRequest, { params }: RouteParams) => {
  try {
    // Check URL params for cascade option
    const url = new URL(req.url);
    const cascade = url.searchParams.get('cascade') === 'true';
    
    // Check if institution exists
    const institution = await prisma.institution.findUnique({
      where: { id: params.id },
      include: {
        accounts: {
          include: {
            snapshots: true,
            childAccounts: true,
          }
        },
      },
    });

    if (!institution) {
      return NextResponse.json(
        { error: 'Institution not found' },
        { status: 404 }
      );
    }

    const accountCount = institution.accounts.length;
    
    if (accountCount > 0 && !cascade) {
      // Return more informative error
      return NextResponse.json(
        { 
          error: 'Cannot delete institution with existing accounts',
          message: `This institution has ${accountCount} account(s). Either delete the accounts first or use cascade delete.`,
          accountCount,
          accounts: institution.accounts.map(acc => ({
            id: acc.id,
            name: acc.name,
            type: acc.type,
            snapshotCount: acc.snapshots.length
          }))
        },
        { status: 400 }
      );
    }

    if (cascade && accountCount > 0) {
      // Delete all related data in the correct order
      // First, delete account snapshots
      await prisma.accountSnapshot.deleteMany({
        where: {
          accountId: {
            in: institution.accounts.map(acc => acc.id)
          }
        }
      });

      // Delete brokerage entries if any
      await prisma.brokerageEntry.deleteMany({
        where: {
          brokerageAccountId: {
            in: institution.accounts.map(acc => acc.id)
          }
        }
      });

      // Then delete accounts
      await prisma.account.deleteMany({
        where: { institutionId: params.id }
      });
    }

    // Finally delete the institution
    await prisma.institution.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ 
      success: true,
      message: cascade && accountCount > 0 
        ? `Institution and ${accountCount} related account(s) deleted successfully`
        : 'Institution deleted successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting institution:', error);
    return NextResponse.json(
      { error: 'Failed to delete institution', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
});

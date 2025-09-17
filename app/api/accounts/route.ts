import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withAuthDev as withAuth } from '@/lib/auth/with-auth-dev';
import { createAccountSchema } from '@/lib/validation/schemas';
import { createValidationErrorResponse } from '@/lib/validation/error-formatter';
import { CacheHeaders, addCacheHeaders } from '@/lib/api/cache-headers';
import { parsePaginationParams, calculateOffset, createPaginatedResponse } from '@/lib/api/pagination';
import { z } from 'zod';

// GET /api/accounts - Get all accounts with optional pagination
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const institutionId = searchParams.get('institutionId');
    const usePagination = searchParams.get('paginated') === 'true';
    
    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    }
    if (institutionId) {
      where.institutionId = institutionId;
    }

    // If pagination is requested
    if (usePagination) {
      const { page, limit } = parsePaginationParams(searchParams, 20, 100);
      const offset = calculateOffset(page, limit);
      
      // Get total count for pagination
      const total = await prisma.account.count({ where });
      
      const accounts = await prisma.account.findMany({
        where,
        skip: offset,
        take: limit,
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

      const paginatedResponse = createPaginatedResponse(
        accountsWithValues,
        page,
        limit,
        total
      );
      
      const response = NextResponse.json(paginatedResponse);
      return addCacheHeaders(response, CacheHeaders.shortCache);
    }
    
    // Default behavior without pagination (backward compatibility)
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

    const response = NextResponse.json(accountsWithValues);
    return addCacheHeaders(response, CacheHeaders.shortCache);
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
      const validationError = createValidationErrorResponse(error);
      return NextResponse.json(validationError, { status: 400 });
    }
    
    console.error('Error creating account:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create account',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
});

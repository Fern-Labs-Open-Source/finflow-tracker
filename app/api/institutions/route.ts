import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/lib/db/prisma';
import { withAuthDev as withAuth, AuthenticatedRequest } from '../../../src/lib/auth/with-auth-dev';
import { createInstitutionSchema } from '../../../src/lib/validation/schemas';
import { z } from 'zod';

// GET /api/institutions - Get all institutions for the authenticated user
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const institutions = await prisma.institution.findMany({
      where: {
        userId: req.userId // CRITICAL: Filter by authenticated user
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
      include: {
        _count: {
          select: { accounts: true },
        },
      },
    });

    return NextResponse.json(institutions);
  } catch (error) {
    console.error('Error fetching institutions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch institutions' },
      { status: 500 }
    );
  }
});

// POST /api/institutions - Create a new institution for the authenticated user
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validatedData = createInstitutionSchema.parse(body);

    const institution = await prisma.institution.create({
      data: {
        ...validatedData,
        userId: req.userId!, // CRITICAL: Associate with authenticated user (guaranteed by middleware)
      },
      include: {
        _count: {
          select: { accounts: true },
        },
      },
    });

    return NextResponse.json(institution, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating institution:', error);
    return NextResponse.json(
      { error: 'Failed to create institution' },
      { status: 500 }
    );
  }
});

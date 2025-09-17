import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/lib/db/prisma';
import { withAuthDev as withAuth } from '../../../src/lib/auth/with-auth-dev';
import { createInstitutionSchema } from '../../../src/lib/validation/schemas';
import { z } from 'zod';

// GET /api/institutions - Get all institutions
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const institutions = await prisma.institution.findMany({
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

// POST /api/institutions - Create a new institution
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const validatedData = createInstitutionSchema.parse(body);

    const institution = await prisma.institution.create({
      data: validatedData,
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

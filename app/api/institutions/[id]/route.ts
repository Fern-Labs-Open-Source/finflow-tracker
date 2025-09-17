import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/get-server-session';
import { updateInstitutionSchema } from '@/lib/validation/schemas';
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
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating institution:', error);
    return NextResponse.json(
      { error: 'Failed to update institution' },
      { status: 500 }
    );
  }
});

// DELETE /api/institutions/[id] - Delete an institution
export const DELETE = withAuth(async (req: NextRequest, { params }: RouteParams) => {
  try {
    // Check if institution has accounts
    const accountCount = await prisma.account.count({
      where: { institutionId: params.id },
    });

    if (accountCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete institution with existing accounts' },
        { status: 400 }
      );
    }

    await prisma.institution.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting institution:', error);
    return NextResponse.json(
      { error: 'Failed to delete institution' },
      { status: 500 }
    );
  }
});

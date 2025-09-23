import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../../src/lib/db/prisma';

// Registration schema
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input
    const validatedData = registerSchema.parse(body);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        passwordHash,
        // Generate a username from email if not provided
        username: validatedData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Math.random().toString(36).substring(2, 7),
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    });
    
    // Create sample data for the new user
    await createSampleDataForUser(user.id);
    
    return NextResponse.json({
      message: 'User registered successfully',
      user,
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}

// Create sample data for new users
async function createSampleDataForUser(userId: string) {
  try {
    // Create a sample institution
    const institution = await prisma.institution.create({
      data: {
        userId,
        name: 'Sample Bank',
        type: 'bank',
        color: '#4F46E5',
        displayOrder: 0,
      }
    });
    
    // Create a sample checking account
    const checkingAccount = await prisma.account.create({
      data: {
        userId,
        institutionId: institution.id,
        name: 'Sample Checking',
        type: 'CHECKING',
        currency: 'EUR',
        displayOrder: 0,
        isActive: true,
      }
    });
    
    // Create a sample investment account
    const investmentAccount = await prisma.account.create({
      data: {
        userId,
        institutionId: institution.id,
        name: 'Sample Investment',
        type: 'INVESTMENT',
        currency: 'EUR',
        displayOrder: 1,
        isActive: true,
      }
    });
    
    // Add some initial snapshots
    const today = new Date();
    const snapshots = [];
    
    // Create 30 days of sample data
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Checking account snapshot
      snapshots.push({
        accountId: checkingAccount.id,
        date,
        valueOriginal: 5000 + Math.random() * 1000,
        currency: 'EUR' as const,
        valueEur: 5000 + Math.random() * 1000,
        exchangeRate: 1,
      });
      
      // Investment account snapshot
      snapshots.push({
        accountId: investmentAccount.id,
        date,
        valueOriginal: 10000 + Math.random() * 2000,
        currency: 'EUR' as const,
        valueEur: 10000 + Math.random() * 2000,
        exchangeRate: 1,
      });
    }
    
    await prisma.accountSnapshot.createMany({
      data: snapshots,
    });
    
    // Create a sample asset
    const asset = await prisma.asset.create({
      data: {
        userId,
        name: 'Sample Vehicle',
        type: 'vehicle',
        currency: 'EUR',
        purchasePrice: 15000,
        purchaseDate: new Date('2023-01-01'),
        notes: 'This is a sample asset to get you started',
        isActive: true,
      }
    });
    
    // Add asset snapshot
    await prisma.assetSnapshot.create({
      data: {
        assetId: asset.id,
        date: today,
        valueOriginal: 12000,
        currency: 'EUR',
        valueEur: 12000,
        exchangeRate: 1,
      }
    });
    
  } catch (error) {
    console.error('Error creating sample data:', error);
    // Don't fail registration if sample data creation fails
  }
}

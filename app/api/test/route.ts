import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/lib/db/prisma';
import bcrypt from 'bcryptjs';

// Test endpoint - no auth required for testing
export async function GET(req: NextRequest) {
  try {
    // Debug database URL
    const dbUrl = process.env.DATABASE_URL;
    console.log('DATABASE_URL:', dbUrl);
    
    // List all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        createdAt: true,
      }
    });
    
    // List all institutions
    const institutions = await prisma.institution.findMany();
    
    // List all accounts
    const accounts = await prisma.account.findMany();
    
    return NextResponse.json({
      success: true,
      data: {
        users,
        institutions,
        accounts,
        dbConnection: 'OK',
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

// Create test user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;
    
    if (!username || !password) {
      return NextResponse.json({
        success: false,
        error: 'Username and password required',
      }, { status: 400 });
    }
    
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { username }
    });
    
    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'User already exists',
      }, { status: 409 });
    }
    
    // Create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash: hashedPassword,
      }
    });
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

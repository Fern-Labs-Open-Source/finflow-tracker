import { NextRequest, NextResponse } from 'next/server';

const MOCK_USERS = {
  test: {
    sub: 'mock-user-test',
    name: 'Test User',
    email: 'test@example.com',
    email_verified: true,
    picture: 'https://via.placeholder.com/150',
  },
  admin: {
    sub: 'mock-user-admin',
    name: 'Admin User',
    email: 'admin@example.com',
    email_verified: true,
    picture: 'https://via.placeholder.com/150',
  },
  new: {
    sub: 'mock-user-new',
    name: 'New User',
    email: 'newuser@example.com',
    email_verified: true,
    picture: 'https://via.placeholder.com/150',
  },
};

export async function GET(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.substring(7);
  
  // Parse user type from token
  let userType = 'test';
  if (token.includes('mock_access_token_')) {
    const parts = token.split('_');
    userType = parts[3] || 'test';
  }

  const user = MOCK_USERS[userType as keyof typeof MOCK_USERS] || MOCK_USERS.test;

  return NextResponse.json(user);
}

export async function POST(req: NextRequest) {
  return GET(req);
}

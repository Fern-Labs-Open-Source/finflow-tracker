import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const body = await req.formData();
  const code = body.get('code') as string;
  const grant_type = body.get('grant_type');

  // Parse the user from the mock code
  let userType = 'test';
  if (code && code.includes('mock_code_')) {
    const parts = code.split('_');
    userType = parts[2] || 'test';
  }

  // Return mock tokens
  return NextResponse.json({
    access_token: `mock_access_token_${userType}_${Date.now()}`,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: `mock_refresh_token_${userType}_${Date.now()}`,
    scope: 'openid email profile',
    id_token: `mock_id_token_${userType}_${Date.now()}`,
  });
}

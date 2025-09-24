import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const searchParams = req.nextUrl.searchParams;
  const state = searchParams.get('state');
  const redirect_uri = searchParams.get('redirect_uri');
  const user = searchParams.get('user');

  // Generate a mock authorization code
  const code = `mock_code_${user}_${Date.now()}`;

  // Store the mock user selection (in real scenario, this would be in a session/cache)
  // For simplicity, we'll encode it in the code itself

  // Redirect back to NextAuth with the authorization code
  const callbackUrl = new URL(redirect_uri || 'http://localhost:3000/api/auth/callback/mock-google');
  callbackUrl.searchParams.set('code', code);
  if (state) {
    callbackUrl.searchParams.set('state', state);
  }

  return NextResponse.redirect(callbackUrl);
}

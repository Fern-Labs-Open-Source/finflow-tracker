import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const searchParams = req.nextUrl.searchParams;
  const client_id = searchParams.get('client_id');
  const redirect_uri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  const response_type = searchParams.get('response_type');

  // Simulate Google OAuth consent screen
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Mock OAuth - Sign In</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: #f0f0f0;
        }
        .container {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          max-width: 400px;
          width: 100%;
        }
        h2 {
          color: #333;
          margin-bottom: 1rem;
        }
        .info {
          background: #f9f9f9;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
          color: #666;
        }
        .user-option {
          display: block;
          width: 100%;
          padding: 1rem;
          margin-bottom: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        }
        .user-option:hover {
          background: #f5f5f5;
          border-color: #4285f4;
        }
        .user-email {
          color: #666;
          font-size: 0.85rem;
          margin-top: 0.25rem;
        }
        .warning {
          color: #ff6b6b;
          font-size: 0.8rem;
          text-align: center;
          margin-top: 1rem;
          padding: 0.5rem;
          background: #fff0f0;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>🔐 Mock OAuth Sign In</h2>
        <div class="info">
          <strong>Development Mode</strong><br>
          Select a test account to continue
        </div>
        
        <form method="GET" action="/api/auth/mock/callback">
          <input type="hidden" name="state" value="${state || ''}" />
          <input type="hidden" name="redirect_uri" value="${redirect_uri || ''}" />
          
          <button type="submit" name="user" value="test" class="user-option">
            <div><strong>Test User</strong></div>
            <div class="user-email">test@example.com</div>
          </button>
          
          <button type="submit" name="user" value="admin" class="user-option">
            <div><strong>Admin User</strong></div>
            <div class="user-email">admin@example.com</div>
          </button>
          
          <button type="submit" name="user" value="new" class="user-option">
            <div><strong>New User</strong></div>
            <div class="user-email">newuser@example.com</div>
          </button>
        </form>
        
        <div class="warning">
          ⚠️ This is a mock OAuth provider for development only
        </div>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}

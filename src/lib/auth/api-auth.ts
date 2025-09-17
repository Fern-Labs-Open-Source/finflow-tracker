import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth-options'

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development'
const bypassAuth = process.env.BYPASS_AUTH === 'true'

export type AuthenticatedHandler = (
  request: NextRequest,
  context?: any
) => Promise<NextResponse> | NextResponse

/**
 * Middleware to protect API routes with authentication
 * In development with BYPASS_AUTH=true or with X-Test-Bypass-Auth header, auth is bypassed
 * In production, requires valid session
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest, context?: any) => {
    // Check for test bypass header (for testing in any environment)
    const testBypassHeader = request.headers.get('X-Test-Bypass-Auth')
    if (testBypassHeader === 'test-mode') {
      console.log('🔓 Auth bypassed for testing:', request.url)
      return handler(request, context)
    }

    // In development with BYPASS_AUTH enabled, skip auth
    if (isDevelopment && bypassAuth) {
      console.log('🔓 Auth bypassed in development mode')
      return handler(request, context)
    }

    // In production or when auth is required, check session
    try {
      const session = await getServerSession(authOptions)
      
      if (!session) {
        return NextResponse.json(
          { error: 'Unauthorized - Please sign in' },
          { status: 401 }
        )
      }

      // Add session to request for handler to use if needed
      (request as any).session = session
      
      return handler(request, context)
    } catch (error) {
      console.error('Auth error:', error)
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Simple auth check for API routes that returns boolean
 */
export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  // Check for test bypass header
  const testBypassHeader = request.headers.get('X-Test-Bypass-Auth')
  if (testBypassHeader === 'test-mode') {
    return true
  }

  // In development with BYPASS_AUTH enabled
  if (isDevelopment && bypassAuth) {
    return true
  }

  // Check actual session
  try {
    const session = await getServerSession(authOptions)
    return !!session
  } catch {
    return false
  }
}

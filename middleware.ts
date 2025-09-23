import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  // Temporarily bypass auth for Netlify debugging
  if (process.env.BYPASS_AUTH === 'true') {
    return NextResponse.next()
  }

  const token = await getToken({ req: request })
  const isAuthPage = request.nextUrl.pathname === '/login'
  const isPublicPath = request.nextUrl.pathname === '/'

  if (!token && !isAuthPage && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (all API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

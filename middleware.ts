import { NextRequest, NextResponse } from 'next/server'

// Phase 1: all non-API, non-static traffic goes to root (waitlist)
// Remove entries from LIVE_ROUTES as each page ships
const LIVE_ROUTES = new Set(['/', '/faq', '/about', '/product'])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always pass through: API routes, static files, Next.js internals, admin
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/admin') ||
    pathname.includes('.')  // static files (favicon.ico, logo.svg, etc.)
  ) {
    return NextResponse.next()
  }

  if (!LIVE_ROUTES.has(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

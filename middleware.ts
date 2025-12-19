import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Middleware runs on server, so we can't access localStorage
  // Authentication will be handled client-side in the layout/components
  const isLoginPage = request.nextUrl.pathname === '/login'
  
  // Allow all requests - auth is handled client-side
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}


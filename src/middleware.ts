
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = '404gotcha-auth';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  const isStatsPage = pathname.startsWith('/stats');
  const isLoginPage = pathname.startsWith('/login');

  // Allow access to the setup page anytime
  if (pathname.startsWith('/setup')) {
    return NextResponse.next();
  }
  
  // If trying to access stats page and not authenticated, redirect to login
  if (isStatsPage && authToken !== 'true') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If on login page but already authenticated, redirect to stats
  if (isLoginPage && authToken === 'true') {
    return NextResponse.redirect(new URL('/stats', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to stats and login pages
  matcher: ['/stats/:path*', '/login'],
};

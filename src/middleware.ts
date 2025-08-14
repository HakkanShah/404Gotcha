import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = '404gotcha-auth';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  const isTryingToAccessStats = request.nextUrl.pathname.startsWith('/stats');
  const isTryingToAccessLogin = request.nextUrl.pathname.startsWith('/login');

  if (isTryingToAccessStats && authToken !== 'true') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isTryingToAccessLogin && authToken === 'true') {
    return NextResponse.redirect(new URL('/stats', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/stats/:path*', '/login'],
};


import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = '404gotcha-auth';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  const isTryingToAccessStats = pathname.startsWith('/stats');
  const isTryingToAccessLogin = pathname.startsWith('/login');

  if (pathname.startsWith('/setup')) {
    return NextResponse.next();
  }
  
  if (isTryingToAccessStats && authToken !== 'true') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isTryingToAccessLogin && authToken === 'true') {
    return NextResponse.redirect(new URL('/stats', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/stats', '/login', '/setup'],
};

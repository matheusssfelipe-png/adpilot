import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/disconnect',
  '/api/auth/meta',
  '/api/auth/google',
  '/api/auth/tokens',
  '/api/google/accounts/list',
  '/api/clients',
  '/client/',
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files, _next, favicon, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Allow public paths
  if (isPublicPath(pathname)) {
    // If user is already logged in and tries to access /login, redirect to /dashboard
    if (pathname === '/login') {
      const token = request.cookies.get('adpilot_session')?.value;
      if (token) {
        try {
          const jwtSecret = process.env.JWT_SECRET;
          if (!jwtSecret) return NextResponse.next();
          const secret = new TextEncoder().encode(jwtSecret);
          await jwtVerify(token, secret);
          return NextResponse.redirect(new URL('/dashboard', request.url));
        } catch {
          // Token invalid, let them see login page
        }
      }
    }
    return NextResponse.next();
  }

  // Protected routes — check for valid session
  const token = request.cookies.get('adpilot_session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      // If no secret configured, allow access (dev mode)
      return NextResponse.next();
    }
    const secret = new TextEncoder().encode(jwtSecret);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    // Token expired or invalid
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('adpilot_session');
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

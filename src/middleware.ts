import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'fallback-secret-at-least-32-chars-long'
);

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Allow static files, api auth, and login page
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api/auth') ||
    path === '/login' ||
    path.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    await jwtVerify(token, SECRET_KEY);
    return NextResponse.next();
  } catch (err) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};

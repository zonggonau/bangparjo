import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

const { auth } = NextAuth(authConfig);

// Pages that are blocked from public access (catalog/browsing)
const BLOCKED_PATHS = [
  '/category',
  '/product',
  '/cart',
  '/favorites',
  '/help-center',
];

export default auth(function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Block catalog/browsing pages → redirect to home (tracking)
  for (const blocked of BLOCKED_PATHS) {
    if (pathname.startsWith(blocked)) {
      const homeUrl = req.nextUrl.clone();
      homeUrl.pathname = '/';
      return NextResponse.redirect(homeUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/admin/:path*',
    '/category/:path*',
    '/product/:path*',
    '/cart/:path*',
    '/favorites/:path*',
    '/help-center/:path*',
  ],
};

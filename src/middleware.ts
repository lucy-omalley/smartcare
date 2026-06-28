import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default withAuth(
  function middleware(request: NextRequest) {
    const response = NextResponse.next();
    const headers = response.headers;

    headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://*.vercel-insights.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self'",
        "connect-src 'self' https://*.vercel-insights.com",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "worker-src 'self' blob:",
        "child-src 'self' blob:",
        "media-src 'self' blob:",
        "manifest-src 'self'"
      ].join('; ')
    );

    headers.set('X-DNS-Prefetch-Control', 'on');
    headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    headers.set('X-XSS-Protection', '1; mode=block');
    headers.set('X-Frame-Options', 'SAMEORIGIN');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'origin-when-cross-origin');
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/home/:path*',
    '/mumbot/:path*',
    '/memory/:path*',
    '/profile/:path*',
    '/community/:path*',
    '/activities/:path*',
    '/exchange/:path*',
    '/onboarding/:path*',
    '/dashboard/:path*',
    '/chat/:path*',
  ],
};

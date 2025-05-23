import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Combine auth middleware with security headers
export default withAuth(
  function middleware(request: NextRequest) {
    // Get the response
    const response = NextResponse.next();

    // Add security headers
    const headers = response.headers;

    // Content Security Policy
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

    // Other security headers
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

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    // Protected routes that require authentication
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/chat/:path*',
    '/bookings/:path*',
    '/messages/:path*',
  ],
}; 
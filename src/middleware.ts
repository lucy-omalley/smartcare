import { withAuth } from 'next-auth/middleware';
import type { NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(request: NextRequestWithAuth) {
    const token = request.nextauth.token;

    if (token && token.emailVerified === false) {
      return NextResponse.redirect(new URL('/auth/verify-email', request.url));
    }

    const response = NextResponse.next();
    const headers = response.headers;

    headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://*.vercel-insights.com https://www.google.com https://www.gstatic.com https://challenges.cloudflare.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self'",
        "connect-src 'self' https://*.vercel-insights.com https://*.posthog.com https://us.i.posthog.com https://eu.i.posthog.com https://www.google.com https://*.ingest.sentry.io",
        "frame-src 'self' https://www.google.com https://challenges.cloudflare.com",
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
    const pathname = request.nextUrl.pathname;
    // Single Permissions-Policy source — next.config must NOT set microphone (duplicate headers block mic).
    const allowMicrophone = pathname.startsWith('/stories/voice');
    headers.set(
      'Permissions-Policy',
      allowMicrophone
        ? 'camera=(), microphone=(self), geolocation=()'
        : 'camera=(), microphone=(), geolocation=()'
    );

    return response;
  },
  {
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
      authorized: ({ token }) => Boolean(token?.sub || token?.id),
    },
  }
);

export const config = {
  matcher: [
    '/today/:path*',
    '/home/:path*',
    '/mumbot/:path*',
    '/memory/:path*',
    '/profile/:path*',
    '/connect/:path*',
    '/community/:path*',
    '/more/:path*',
    '/activities/:path*',
    '/exchange/:path*',
    '/saved/:path*',
    '/library/:path*',
    '/stories/:path*',
    '/routines/:path*',
    '/routine-designer/:path*',
    '/posters/:path*',
    '/learning-plan/:path*',
    '/onboarding/:path*',
    '/dashboard/:path*',
    '/chat/:path*',
    '/admin/:path*',
  ],
};

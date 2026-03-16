import { NextResponse } from 'next/server';

/**
 * Launch Gate Middleware
 *
 * LAUNCH_MODE=private  →  Only users with ?ref=ACCESS_KEY can browse the site.
 *                         Everyone else is redirected to /waitlist.
 *                         Visiting with the key sets a 30-day cookie so the
 *                         user isn't locked out on the next visit.
 *
 * LAUNCH_MODE=public   →  Middleware is completely transparent — full site visible
 *                         to everyone. Set this when you're ready to go live.
 *
 * Env vars (server-side only, never exposed to the browser):
 *   LAUNCH_MODE   = private | public          (default: private)
 *   ACCESS_KEY    = your-secret-invite-key    (default: crewup2026)
 */

const LAUNCH_MODE = process.env.NEXT_PUBLIC_LAUNCH_MODE  || 'private';
const ACCESS_KEY  = process.env.NEXT_PUBLIC_ACCESS_KEY   || 'crewup2026';
const COOKIE_NAME = 'crewup_access';

// Paths that are ALWAYS accessible regardless of launch mode
const PUBLIC_PATHS = [
  '/waitlist',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/verify-phone',
];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Always pass through Next.js internals + static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/images') ||
    pathname.includes('.')           // any static file with extension
  ) {
    return NextResponse.next();
  }

  // If site is fully public — let everything through
  if (LAUNCH_MODE === 'public') {
    return NextResponse.next();
  }

  // ── Private mode ─────────────────────────────────────────────────────

  // Always allow the public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check access cookie
  const accessCookie = request.cookies.get(COOKIE_NAME)?.value;
  if (accessCookie === 'granted') {
    return NextResponse.next();
  }

  // Check ?ref= query param — if correct, grant access via cookie
  const refParam = request.nextUrl.searchParams.get('ref');
  if (refParam === ACCESS_KEY) {
    // Redirect to the same page (without ref param) and set the cookie
    const cleanUrl = new URL(pathname, request.url);
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set(COOKIE_NAME, 'granted', {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
    });
    return response;
  }

  // No access — redirect to waitlist
  return NextResponse.redirect(new URL('/waitlist', request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image  (image optimisation)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

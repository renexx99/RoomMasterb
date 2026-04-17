// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// Define protected route prefixes and which roles can access them
const ROLE_ROUTE_MAP: Record<string, string[]> = {
  '/ta': ['Travel Agent'],
  '/fo': ['Front Office', 'Super Admin'],
  '/manager': ['Hotel Manager', 'Super Admin'],
  '/admin': ['Hotel Admin', 'Super Admin'],
  '/super-admin': ['Super Admin'],
  '/housekeeping': ['Housekeeping', 'Super Admin'],
};

// Where each role should be redirected by default
const ROLE_DEFAULT_DASHBOARD: Record<string, string> = {
  'Super Admin': '/super-admin/dashboard',
  'Hotel Admin': '/admin/dashboard',
  'Hotel Manager': '/manager/dashboard',
  'Front Office': '/fo/dashboard',
  'Housekeeping': '/housekeeping/dashboard',
  'Travel Agent': '/ta/dashboard',
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect root to login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Skip middleware for auth routes, API routes, and static assets
  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Create Supabase client for middleware
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // Check session
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // No session — redirect to login for any protected route
    const isProtectedRoute = Object.keys(ROLE_ROUTE_MAP).some(prefix =>
      pathname.startsWith(prefix)
    );
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    return res;
  }

  // Determine the matching route prefix
  const matchedPrefix = Object.keys(ROLE_ROUTE_MAP).find(prefix =>
    pathname.startsWith(prefix)
  );

  if (!matchedPrefix) {
    return res; // Not a role-protected route
  }

  // Fetch user roles
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('hotel_id, role:roles(name)')
    .eq('user_id', session.user.id);

  if (!userRoles || userRoles.length === 0) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Extract role names
  const roleNames: string[] = userRoles.map(
    (ur: any) => (ur.role as { name: string })?.name
  ).filter(Boolean);

  // Check if user has any of the allowed roles for this route
  const allowedRoles = ROLE_ROUTE_MAP[matchedPrefix];
  const hasAccess = roleNames.some(role => allowedRoles.includes(role));

  if (!hasAccess) {
    // Redirect the user to their own dashboard
    const userDefaultRoute = roleNames
      .map(role => ROLE_DEFAULT_DASHBOARD[role])
      .find(Boolean);

    return NextResponse.redirect(
      new URL(userDefaultRoute || '/auth/login', request.url)
    );
  }

  return res;
}

// Match all relevant route prefixes
export const config = {
  matcher: [
    '/',
    '/ta/:path*',
    '/fo/:path*',
    '/manager/:path*',
    '/admin/:path*',
    '/super-admin/:path*',
    '/housekeeping/:path*',
  ],
};
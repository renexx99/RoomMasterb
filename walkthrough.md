# B2B Travel Agent Portal — Walkthrough

## Summary

Implemented a complete B2B Travel Agent (TA) / OTA portal for the RoomMaster PMS. The feature spans **15 files** across 4 layers: database schema, auth/routing, TypeScript types, and 4 new portal pages.

---

## Changes Made

### 1. Database Migration

#### [NEW] [20260417_add_travel_agent_portal.sql](file:///c:/Users/mercy/AppData/Local/roommaster/supabase/migrations/20260417_add_travel_agent_portal.sql)

- Inserts `Travel Agent` role into `public.roles`
- Adds `agent_id` (UUID FK → `auth.users`) column to `reservations`
- Extends `booking_source` enum with `travel_agent` and `corporate` values
- Creates 7 RLS policies:
  - **Reservations**: TA can SELECT/INSERT/UPDATE only where `agent_id = auth.uid()`
  - **Room Types & Rooms**: TA can SELECT for their assigned hotel only
  - **Guests**: TA can INSERT (for bookings) and SELECT (their own guests only)

---

### 2. Auth & Routing

#### [MODIFY] [middleware.ts](file:///c:/Users/mercy/AppData/Local/roommaster/src/middleware.ts)

Full rewrite from simple root-redirect to **role-based route protection**:
- Reads session via `createMiddlewareClient`
- Queries `user_roles` → `roles` to determine role name
- Enforces access matrix: TA users can only access `/ta/*`, blocked from `/fo/*`, `/manager/*`, etc.
- Unauthenticated users redirected to `/auth/login`

```diff:middleware.ts
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Jika pengguna mengakses halaman root ('/')
  if (request.nextUrl.pathname === '/') {
    // Arahkan mereka ke halaman login
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Lanjutkan ke halaman yang diminta jika bukan halaman root
  return NextResponse.next();
}

// Tentukan rute mana yang akan dijaga oleh middleware ini
export const config = {
  matcher: ['/'],
};
===
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
};
```

#### [MODIFY] [LoginForm.tsx](file:///c:/Users/mercy/AppData/Local/roommaster/src/features/auth/components/LoginForm.tsx)

- Added `Travel Agent` to `ROLES_REQUIRING_HOTEL` array
- Added redirect: `Travel Agent` → `/ta/dashboard`

#### [MODIFY] [ProtectedRoute.tsx](file:///c:/Users/mercy/AppData/Local/roommaster/src/features/auth/components/ProtectedRoute.tsx)

- Added `Travel Agent` to `ADMIN_PATH_ROLES`
- Added TA-specific redirect in the role-mismatch handler

#### [MODIFY] [useAuth.ts](file:///c:/Users/mercy/AppData/Local/roommaster/src/features/auth/hooks/useAuth.ts)

- Added `Travel Agent` → `/ta/dashboard` in impersonation redirect map

---

### 3. TypeScript Types

#### [MODIFY] [database.ts](file:///c:/Users/mercy/AppData/Local/roommaster/src/core/types/database.ts)

- Added `BookingSource` type
- Extended `Reservation` interface with `agent_id`, `booking_source`, `special_requests`, `checked_in_at`, `checked_out_at`

---

### 4. TA Portal Pages

All pages use a **strict monochrome** design (black, white, shades of gray). No color accents.

#### [NEW] [layout.tsx](file:///c:/Users/mercy/AppData/Local/roommaster/src/app/ta/layout.tsx)

- Mantine `AppShell` with collapsible sidebar
- Navigation: Dashboard, Availability, Reservations, Book Room
- Protected by `ProtectedRoute` with `requiredRoleName="Travel Agent"`
- Monochrome styling throughout

#### [NEW] Dashboard — `/ta/dashboard/`

| File | Description |
|---|---|
| [page.tsx](file:///c:/Users/mercy/AppData/Local/roommaster/src/app/ta/dashboard/page.tsx) | Server component — fetches stats (total, confirmed, checked-in, cancelled) + recent reservations |
| [client.tsx](file:///c:/Users/mercy/AppData/Local/roommaster/src/app/ta/dashboard/client.tsx) | Stat cards, allotment progress bar (mocked), agent info panel, recent reservations table |

#### [NEW] Availability — `/ta/availability/`

| File | Description |
|---|---|
| [page.tsx](file:///c:/Users/mercy/AppData/Local/roommaster/src/app/ta/availability/page.tsx) | Server component — fetches room types with available room counts |
| [client.tsx](file:///c:/Users/mercy/AppData/Local/roommaster/src/app/ta/availability/client.tsx) | Date filters, search, data grid with room type details, "Contract Rate" placeholder, Book buttons |

#### [NEW] Reservations — `/ta/reservations/`

| File | Description |
|---|---|
| [page.tsx](file:///c:/Users/mercy/AppData/Local/roommaster/src/app/ta/reservations/page.tsx) | Server component — queries reservations where `agent_id = session.user.id` |
| [client.tsx](file:///c:/Users/mercy/AppData/Local/roommaster/src/app/ta/reservations/client.tsx) | Search, data table with confirmation #, guest, room, dates, monochrome status badges |

#### [NEW] Book Room — `/ta/book-room/`

| File | Description |
|---|---|
| [page.tsx](file:///c:/Users/mercy/AppData/Local/roommaster/src/app/ta/book-room/page.tsx) | Server component — fetches room types + available room IDs |
| [client.tsx](file:///c:/Users/mercy/AppData/Local/roommaster/src/app/ta/book-room/client.tsx) | Booking form: Guest name/email/phone, check-in/out dates, room type, special remarks. Creates `guest` + `reservation` with `agent_id` and `booking_source='travel_agent'` |

---

## File Tree

```
src/
├── middleware.ts                          (MODIFIED)
├── core/types/database.ts                 (MODIFIED)
├── features/auth/
│   ├── components/LoginForm.tsx           (MODIFIED)
│   ├── components/ProtectedRoute.tsx      (MODIFIED)
│   └── hooks/useAuth.ts                   (MODIFIED)
└── app/ta/
    ├── layout.tsx                          (NEW)
    ├── dashboard/
    │   ├── page.tsx                        (NEW)
    │   └── client.tsx                      (NEW)
    ├── availability/
    │   ├── page.tsx                        (NEW)
    │   └── client.tsx                      (NEW)
    ├── reservations/
    │   ├── page.tsx                        (NEW)
    │   └── client.tsx                      (NEW)
    └── book-room/
        ├── page.tsx                        (NEW)
        └── client.tsx                      (NEW)

supabase/migrations/
└── 20260417_add_travel_agent_portal.sql   (NEW)
```

---

## Verification

| Check | Result |
|---|---|
| TypeScript compilation (TA files) | ✅ No errors |
| TypeScript compilation (middleware) | ✅ No errors |
| Pre-existing errors in other files | ⚠️ Unchanged (MapChart, Storybook, etc.) |

---

## Next Steps

1. **Run the SQL migration** on your Supabase project to create the role, schema changes, and RLS policies
2. **Create a test TA user** via Super Admin → assign `Travel Agent` role with a `hotel_id`
3. **Login as the TA user** to verify:
   - Redirect to `/ta/dashboard`
   - Access blocked to `/fo/*`, `/manager/*`
   - Availability, reservations, and booking flow all work
4. **Future enhancements**:
   - `contract_rates` table for actual TA-specific pricing
   - Real allotment management (daily limits, tracking)
   - TA registration/onboarding flow
   - Reservation modification and cancellation from the TA portal

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
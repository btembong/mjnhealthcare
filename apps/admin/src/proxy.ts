import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/_next', '/favicon.ico'];
const STATIC_EXT = /\.(jpg|jpeg|png|gif|svg|ico|webp|woff|woff2|ttf|otf|json)$/i;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || STATIC_EXT.test(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('mjn_admin_token')?.value;
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

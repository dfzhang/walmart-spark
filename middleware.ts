import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SPANISH_PREFIX = "/es";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Spanish paths: rewrite /es/... → /es/... (handled by [locale] route group)
  // English paths: rewrite /... → /en/... internally (no visible URL change)
  if (pathname.startsWith(SPANISH_PREFIX + "/") || pathname === SPANISH_PREFIX) {
    // Already has /es prefix — let it through to [locale] route group
    return NextResponse.next();
  }

  // No locale prefix — treat as English. Rewrite internally to /en/...
  // URL stays clean (no /en/ prefix visible to user)
  const url = request.nextUrl.clone();
  url.pathname = `/en${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Match all paths except API routes, static files, and Next.js internals
  matcher: ["/((?!api|_next|favicon\\.ico|.*\\..*).*)"],
};

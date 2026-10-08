import { NextResponse, type NextRequest } from "next/server";

/**
 * Hands the requested admin path to the page guards (as the `x-admin-path` request header), so
 * a signed-out visitor to a deep link comes back to that exact page after signing in. Next.js
 * does not otherwise tell a layout which URL it is rendering. Changes nothing else.
 */
export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-admin-path", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ["/admin/content/:path*", "/admin/analytics/:path*"] };

import { NextResponse, type NextRequest } from "next/server";

// Forward the request pathname (and method) onto the request headers so the
// root layout can read them via `headers()` in Server Components and log a
// page_viewed activity event. Server Actions arrive as POSTs — we still tag
// them so the analytics side can decide whether to count them.
export function middleware(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set("x-roamly-pathname", req.nextUrl.pathname);
  headers.set("x-roamly-method", req.method);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|.*\\..*).*)"],
};

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Skip middleware for API routes and static files
  if (
    request.nextUrl.pathname.startsWith("/api/") ||
    request.nextUrl.pathname.startsWith("/_next/") ||
    request.nextUrl.pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // Redirect /admin/login to /login to avoid conflicts
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // For now, let all requests through to debug the issue
  return NextResponse.next()
}

// Specify the paths this middleware should run on
export const config = {
  matcher: ["/admin/:path*", "/login"],
}

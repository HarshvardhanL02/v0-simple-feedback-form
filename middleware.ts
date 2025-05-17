import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

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

  // Create a response to modify
  const response = NextResponse.next()

  // Only check auth for admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    try {
      // Create a Supabase client
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })

      // Get the session from the cookie
      const authCookie =
        request.cookies.get("sb-access-token")?.value ||
        request.cookies.get("sb-refresh-token")?.value ||
        request.cookies.get("supabase-auth-token")?.value

      if (!authCookie) {
        console.log("No auth cookie found, redirecting to login")
        return NextResponse.redirect(new URL("/login", request.url))
      }

      // Let the client-side handle authentication
      return response
    } catch (error) {
      console.error("Middleware error:", error)
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return response
}

// Specify the paths this middleware should run on
export const config = {
  matcher: ["/admin/:path*", "/login"],
}

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
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        // Redirect to login page if not authenticated
        return NextResponse.redirect(new URL("/login", request.url))
      }

      // Check if user is an admin
      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", session.user.email)
        .single()

      if (error || !userData || !userData.is_admin) {
        // Redirect to login page if not admin
        return NextResponse.redirect(new URL("/login", request.url))
      }

      return NextResponse.next()
    } catch (error) {
      console.error("Middleware error:", error)
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}

// Specify the paths this middleware should run on
export const config = {
  matcher: ["/admin/:path*", "/login"],
}

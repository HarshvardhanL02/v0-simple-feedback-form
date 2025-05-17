"use client"

import type { ReactNode } from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { BarChart3, FileText, Home, LogOut, Moon, Sun, Monitor } from "lucide-react"

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createBrowserSupabaseClient()

        // Get the current session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        console.log("Session in admin layout:", session)

        if (!session) {
          console.log("No session found, redirecting to login")
          window.location.href = "/login"
          return
        }

        // Check if user is an admin
        const { data: userData, error } = await supabase
          .from("users")
          .select("*")
          .eq("email", session.user.email)
          .single()

        console.log("User data:", userData, "Error:", error)

        if (error || !userData || !userData.is_admin) {
          console.log("User is not admin, redirecting to login")
          await supabase.auth.signOut()
          window.location.href = "/login"
          return
        }

        setUser(userData)
        setIsLoading(false)
      } catch (error) {
        console.error("Auth check error:", error)
        window.location.href = "/login"
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    try {
      const supabase = createBrowserSupabaseClient()
      await supabase.auth.signOut()
      window.location.href = "/login"
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p>Loading admin dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-4 shadow-sm">
        <div className="flex items-center">
          <h1 className="text-xl font-bold">Feedback Dashboard</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 rounded-full bg-muted p-1">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Sun className="h-4 w-4" />
              <span className="sr-only">Light mode</span>
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Moon className="h-4 w-4" />
              <span className="sr-only">Dark mode</span>
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Monitor className="h-4 w-4" />
              <span className="sr-only">System mode</span>
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="flex items-center gap-1" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>
      </header>

      <div className="flex">
        <nav className="w-64 border-r bg-card p-4">
          <div className="space-y-1">
            <Link href="/admin" passHref>
              <Button
                variant="ghost"
                className={`w-full justify-start ${router.pathname === "/admin" ? "bg-accent" : ""}`}
              >
                <Home className="mr-2 h-4 w-4" />
                Overview
              </Button>
            </Link>
            <Link href="/admin/feedback" passHref>
              <Button
                variant="ghost"
                className={`w-full justify-start ${router.pathname === "/admin/feedback" ? "bg-accent" : ""}`}
              >
                <FileText className="mr-2 h-4 w-4" />
                Feedback
              </Button>
            </Link>
            <Link href="/admin/analytics" passHref>
              <Button
                variant="ghost"
                className={`w-full justify-start ${router.pathname === "/admin/analytics" ? "bg-accent" : ""}`}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            </Link>
          </div>
        </nav>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}

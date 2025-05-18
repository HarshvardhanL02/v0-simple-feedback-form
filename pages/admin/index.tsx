"use client"

import { useState, useEffect } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [sessionInfo, setSessionInfo] = useState<any>(null)

  useEffect(() => {
    async function checkAuth() {
      try {
        console.log("Checking auth in admin dashboard...")
        const supabase = createBrowserSupabaseClient()

        // Get session
        const { data: sessionData } = await supabase.auth.getSession()
        console.log("Session data:", sessionData)
        setSessionInfo(sessionData)

        if (!sessionData.session) {
          setError("No active session found. Please log in again.")
          setLoading(false)
          return
        }

        // Get user data
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("email", sessionData.session.user.email)
          .single()

        console.log("User data:", userData, "Error:", userError)

        if (userError) {
          setError(`Error fetching user data: ${userError.message}`)
          setLoading(false)
          return
        }

        if (!userData || !userData.is_admin) {
          setError("You don't have admin privileges")
          setLoading(false)
          return
        }

        setUser(userData)
        setLoading(false)
      } catch (err: any) {
        console.error("Error in admin dashboard:", err)
        setError(`An unexpected error occurred: ${err.message}`)
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleLogout = async () => {
    try {
      const supabase = createBrowserSupabaseClient()
      await supabase.auth.signOut()
      window.location.href = "/login"
    } catch (err) {
      console.error("Logout error:", err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Admin Dashboard...</h1>
          <p className="text-muted-foreground">Please wait while we load your dashboard</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full p-6 bg-card rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Dashboard</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-md">
              <h2 className="font-medium mb-2">Session Information</h2>
              <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(sessionInfo, null, 2)}</pre>
            </div>
            <div className="flex justify-between">
              <Button onClick={() => (window.location.href = "/login")}>Back to Login</Button>
              <Button variant="outline" onClick={() => (window.location.href = "/debug-auth")}>
                Debug Auth
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b p-4 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Welcome, {user.name || user.email}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You have successfully accessed the admin dashboard.</p>
            <p className="text-muted-foreground mt-2">User ID: {user.id}</p>
            <p className="text-muted-foreground">Admin Status: {user.is_admin ? "Admin" : "Not Admin"}</p>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Feedback Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">View and manage feedback submissions</p>
              <Button onClick={() => (window.location.href = "/admin/feedback")}>View Feedback</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">View feedback analytics and reports</p>
              <Button onClick={() => (window.location.href = "/admin/analytics")}>View Analytics</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Debug Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Tools to help diagnose issues</p>
              <Button onClick={() => (window.location.href = "/debug-auth")}>Debug Auth</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

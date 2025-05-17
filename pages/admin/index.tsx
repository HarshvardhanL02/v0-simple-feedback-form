"use client"

import { useState, useEffect } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createBrowserSupabaseClient()

        // Get session
        const { data } = await supabase.auth.getSession()

        if (!data.session) {
          window.location.href = "/login"
          return
        }

        // Get user data
        const { data: userData, error } = await supabase
          .from("users")
          .select("*")
          .eq("email", data.session.user.email)
          .single()

        if (error || !userData || !userData.is_admin) {
          window.location.href = "/login"
          return
        }

        setUser(userData)
        setLoading(false)
      } catch (err) {
        console.error("Error checking auth:", err)
        setError("Authentication error")
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
    return <div className="p-8">Loading...</div>
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      {user && (
        <div className="mb-4">
          <p>Welcome, {user.name || user.email}</p>
          <p>Email: {user.email}</p>
          <p>Admin: {user.is_admin ? "Yes" : "No"}</p>
        </div>
      )}

      <div className="flex gap-4 mb-8">
        <Button onClick={() => (window.location.href = "/admin/feedback")}>View Feedback</Button>
        <Button onClick={() => (window.location.href = "/admin/analytics")}>View Analytics</Button>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <div className="p-4 bg-gray-100 rounded">
        <p>This is a simplified admin dashboard.</p>
      </div>
    </div>
  )
}

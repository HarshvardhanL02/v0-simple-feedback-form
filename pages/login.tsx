"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

const directLogin = async (email: string, password: string) => {
  try {
    const response = await fetch("/api/direct-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()
    return data
  } catch (error: any) {
    console.error("Direct login error:", error)
    return { success: false, message: `Direct login failed: ${error.message}` }
  }
}

export default function AdminLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isCreatingTestUser, setIsCreatingTestUser] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // Check if user is already authenticated
  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createBrowserSupabaseClient()
        console.log("Checking auth in login page...")

        // Get the current session
        const { data: sessionData } = await supabase.auth.getSession()
        console.log("Session data:", sessionData)

        if (sessionData.session) {
          // Check if user is an admin
          const { data: userData, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", sessionData.session.user.email)
            .single()

          console.log("User data:", userData, "Error:", error)

          if (!error && userData && userData.is_admin) {
            console.log("User is admin, redirecting to admin dashboard")
            window.location.href = "/admin"
            return
          }
        }
      } catch (error) {
        console.error("Auth check error:", error)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")
    setDebugInfo(null)

    try {
      const formData = new FormData(e.currentTarget)
      const email = formData.get("email") as string
      const password = formData.get("password") as string

      console.log("Attempting login with:", email)
      const supabase = createBrowserSupabaseClient()

      // Sign out any existing session first
      await supabase.auth.signOut()

      // Try to sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("Auth response:", authData, authError)

      if (authError) {
        console.error("Client login failed, trying direct login API...")

        // Try the direct login API as a fallback
        const directResult = await directLogin(email, password)

        if (!directResult.success) {
          setError(directResult.message || "Login failed")
          setDebugInfo({ directLoginError: directResult })
          setIsLoading(false)
          return
        }

        setSuccess("Login successful via API! Redirecting...")

        // Redirect to admin after successful direct login
        setTimeout(() => {
          window.location.href = "/admin"
        }, 1000)

        return
      }

      // Check if user is an admin
      const { data: existingUser, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single()

      console.log("User data:", existingUser, "Error:", userError)

      if (userError) {
        console.error("User query error:", userError)
        setError(`Error fetching user data: ${userError.message}`)
        setDebugInfo({ authData, userError })
        setIsLoading(false)
        return
      }

      if (!existingUser || !existingUser.is_admin) {
        // Sign out if not an admin
        await supabase.auth.signOut()
        setError("You don't have admin privileges")
        setIsLoading(false)
        return
      }

      // Update auth_id if needed
      if (existingUser && (!existingUser.auth_id || existingUser.auth_id !== authData.user.id)) {
        await supabase.from("users").update({ auth_id: authData.user.id }).eq("email", email)
      }

      setSuccess("Login successful! Redirecting...")

      // Force a session refresh
      await supabase.auth.refreshSession()

      // Get the session again to verify
      const { data: sessionData } = await supabase.auth.getSession()
      console.log("Session after login:", sessionData)

      // Use window.location for a hard redirect
      setTimeout(() => {
        window.location.href = "/admin"
      }, 1000)
    } catch (error: any) {
      console.error("Login error:", error)
      setError(`An unexpected error occurred: ${error.message}`)
      setDebugInfo({ error: error.message, stack: error.stack })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTestUser = async () => {
    setIsCreatingTestUser(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/create-test-user", {
        method: "POST",
      })

      const result = await response.json()
      if (result.success) {
        setSuccess(result.message)
      } else {
        setError(result.message)
      }
    } catch (error: any) {
      console.error("Error creating test user:", error)
      setError(`Failed to create test user: ${error.message}`)
    } finally {
      setIsCreatingTestUser(false)
    }
  }

  const handleResetAdminPassword = async () => {
    setIsResettingPassword(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/reset-admin-password", {
        method: "POST",
      })

      const result = await response.json()
      if (result.success) {
        setSuccess("Admin password reset successfully to 'Admin123!'")
      } else {
        setError(result.message)
      }
    } catch (error: any) {
      console.error("Error resetting admin password:", error)
      setError(`Failed to reset admin password: ${error.message}`)
    } finally {
      setIsResettingPassword(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p>Checking authentication...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="mb-1 text-center text-2xl font-bold">Admin Login</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Enter your credentials to access the admin dashboard
        </p>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 text-green-800">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue="admin@example.com"
              placeholder="admin@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              defaultValue="Admin123!"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="mt-6">
          <Separator className="my-4" />
          <p className="text-center text-xs text-muted-foreground uppercase tracking-wider">Development Options</p>

          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={handleResetAdminPassword}
            disabled={isResettingPassword}
          >
            {isResettingPassword ? "Resetting..." : "Reset Admin Password"}
          </Button>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Reset admin@example.com password to "Admin123!"
          </p>

          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={handleCreateTestUser}
            disabled={isCreatingTestUser}
          >
            {isCreatingTestUser ? "Creating..." : "Create Test User"}
          </Button>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Create test@example.com with password "testpassword"
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-primary hover:underline">
            Back to Home
          </Link>
        </div>

        {debugInfo && (
          <div className="mt-6 p-4 bg-gray-100 rounded-md">
            <h3 className="text-sm font-medium mb-2">Debug Information</h3>
            <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

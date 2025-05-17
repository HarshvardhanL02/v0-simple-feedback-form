"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const email = e.target.email.value
      const password = e.target.password.value

      // Use fetch directly to the API
      const response = await fetch("/api/login-direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess("Login successful! Redirecting...")

        // Use a hard redirect with a delay
        setTimeout(() => {
          window.location.href = "/admin"
        }, 1000)
      } else {
        setError(data.message || "Login failed")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
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
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              defaultValue="Admin123!"
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button variant="link" onClick={() => (window.location.href = "/")}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
}

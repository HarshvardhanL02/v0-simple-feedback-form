"use client"

import { useEffect, useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugAuth() {
  const [authState, setAuthState] = useState<any>(null)
  const [userRecord, setUserRecord] = useState<any>(null)
  const [cookies, setCookies] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkAuth() {
      try {
        setLoading(true)
        const supabase = createBrowserSupabaseClient()

        // Get session
        const { data: sessionData } = await supabase.auth.getSession()
        setAuthState(sessionData)

        // Check cookies
        const cookieNames = ["sb-access-token", "sb-refresh-token", "supabase-auth-token", "sb-auth-token", "sb:token"]

        const foundCookies = cookieNames.filter((name) => document.cookie.includes(name))
        setCookies(foundCookies)

        // If we have a session, get the user record
        if (sessionData.session) {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("email", sessionData.session.user.email)
            .single()

          if (userError) {
            console.error("Error fetching user record:", userError)
            setError(`Error fetching user record: ${userError.message}`)
          } else {
            setUserRecord(userData)
          }
        }
      } catch (error: any) {
        console.error("Error checking auth:", error)
        setError(`Error checking auth: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleLogout = async () => {
    try {
      const supabase = createBrowserSupabaseClient()
      await supabase.auth.signOut()
      window.location.reload()
    } catch (error: any) {
      console.error("Error logging out:", error)
      setError(`Error logging out: ${error.message}`)
    }
  }

  const handleGoToAdmin = () => {
    window.location.href = "/admin"
  }

  const handleGoToLogin = () => {
    window.location.href = "/login"
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Debug</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading authentication state...</p>
            ) : error ? (
              <div className="bg-red-50 p-4 rounded-md text-red-800 mb-4">
                <p>{error}</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Authentication Cookies</h2>
                  {cookies.length > 0 ? (
                    <div className="bg-green-50 p-4 rounded-md">
                      <p className="text-green-800">Found authentication cookies: {cookies.join(", ")}</p>
                    </div>
                  ) : (
                    <div className="bg-red-50 p-4 rounded-md">
                      <p className="text-red-800">No authentication cookies found</p>
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-2">Authentication State</h2>
                  <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60">
                    <pre className="text-xs">{JSON.stringify(authState, null, 2)}</pre>
                  </div>
                </div>

                {userRecord && (
                  <div>
                    <h2 className="text-lg font-semibold mb-2">User Record</h2>
                    <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60">
                      <pre className="text-xs">{JSON.stringify(userRecord, null, 2)}</pre>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm">
                        <strong>Is Admin:</strong> {userRecord.is_admin ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button onClick={handleGoToAdmin}>Go to Admin Dashboard</Button>
                  <Button onClick={handleGoToLogin}>Go to Login Page</Button>
                  {authState?.session && (
                    <Button variant="outline" onClick={handleLogout}>
                      Logout
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

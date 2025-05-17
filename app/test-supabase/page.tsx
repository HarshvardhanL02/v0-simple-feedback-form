"use client"

import { useState, useEffect } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestSupabasePage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [projectInfo, setProjectInfo] = useState<any>(null)
  const [userCount, setUserCount] = useState<number | null>(null)
  const [feedbackCount, setFeedbackCount] = useState<number | null>(null)
  const [envVars, setEnvVars] = useState<string[]>([])

  useEffect(() => {
    async function testConnection() {
      try {
        setStatus("loading")
        const supabase = createBrowserSupabaseClient()

        // Check environment variables
        const vars = []
        if (process.env.NEXT_PUBLIC_SUPABASE_URL) vars.push("NEXT_PUBLIC_SUPABASE_URL")
        if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) vars.push("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        setEnvVars(vars)

        // Test basic connection
        const { data: healthData, error: healthError } = await supabase.from("users").select("count").limit(1)

        if (healthError) {
          throw new Error(`Connection error: ${healthError.message}`)
        }

        // Get project info
        try {
          const { data: projectData } = await supabase.rpc("get_project_info", {})
          setProjectInfo(projectData)
        } catch (e) {
          console.log("Could not get project info:", e)
        }

        // Get user count
        const { count: users, error: userError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })

        if (userError) {
          throw new Error(`User query error: ${userError.message}`)
        }
        setUserCount(users)

        // Get feedback count
        const { count: feedback, error: feedbackError } = await supabase
          .from("feedback")
          .select("*", { count: "exact", head: true })

        if (feedbackError) {
          throw new Error(`Feedback query error: ${feedbackError.message}`)
        }
        setFeedbackCount(feedback)

        setStatus("success")
      } catch (error) {
        console.error("Supabase connection test failed:", error)
        setStatus("error")
        setErrorMessage(error.message || "Unknown error")
      }
    }

    testConnection()
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Supabase Connection Test</CardTitle>
        </CardHeader>
        <CardContent>
          {status === "loading" && <p>Testing connection to Supabase...</p>}

          {status === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <h3 className="text-red-800 font-medium">Connection Error</h3>
              <p className="text-red-700 text-sm mt-1">{errorMessage}</p>

              <div className="mt-2">
                <h4 className="font-medium">Environment Variables:</h4>
                <p className="text-sm">
                  {envVars.length > 0 ? `Found: ${envVars.join(", ")}` : "No Supabase environment variables found"}
                </p>
              </div>

              <div className="mt-4">
                <h4 className="font-medium">Troubleshooting Steps:</h4>
                <ul className="list-disc pl-5 text-sm mt-2 space-y-1">
                  <li>Verify your environment variables in Vercel</li>
                  <li>Check if your Supabase project is active</li>
                  <li>Ensure your IP is not blocked by Supabase</li>
                  <li>Check for any RLS policies that might be blocking access</li>
                </ul>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-green-800 font-medium">✅ Connection Successful</p>
                <p className="text-green-700 text-sm mt-1">Your Supabase connection is working properly.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border rounded-md p-3">
                  <p className="text-sm text-gray-500">Users</p>
                  <p className="text-xl font-bold">{userCount !== null ? userCount : "..."}</p>
                </div>
                <div className="bg-white border rounded-md p-3">
                  <p className="text-sm text-gray-500">Feedback</p>
                  <p className="text-xl font-bold">{feedbackCount !== null ? feedbackCount : "..."}</p>
                </div>
              </div>

              {projectInfo && (
                <div className="bg-white border rounded-md p-4 mt-4">
                  <h3 className="font-medium mb-2">Project Info</h3>
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-gray-500">Project ID:</span> {projectInfo.project_id}
                    </p>
                    <p>
                      <span className="text-gray-500">Region:</span> {projectInfo.region}
                    </p>
                    <p>
                      <span className="text-gray-500">Version:</span> {projectInfo.version}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={() => (window.location.href = "/")}>
                  Back to Home
                </Button>
                <Button onClick={() => (window.location.href = "/login")}>Go to Admin Login</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

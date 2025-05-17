"use client"

import { useState, useEffect } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, BarChart3, MessageSquare } from "lucide-react"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, BarChart, Bar } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export default function AdminDashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalCount: 0,
    averageRating: 0,
    withCommentsCount: 0,
    withCommentsPercentage: 0,
    ratingDistribution: [0, 0, 0, 0, 0],
  })
  const [recentFeedback, setRecentFeedback] = useState([])
  const [chartData, setChartData] = useState([])

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

        // Fetch dashboard data
        await fetchDashboardData(supabase)
      } catch (err) {
        console.error("Error checking auth:", err)
        setError("Authentication error")
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  async function fetchDashboardData(supabase) {
    try {
      // Get total feedback count
      const { count: totalCount, error: countError } = await supabase
        .from("feedback")
        .select("*", { count: "exact", head: true })

      if (countError) throw countError

      // Get average rating
      const { data: ratingData, error: ratingError } = await supabase
        .from("feedback")
        .select("rating")
        .not("rating", "is", null)

      if (ratingError) throw ratingError

      const averageRating =
        ratingData.length > 0 ? ratingData.reduce((sum, item) => sum + item.rating, 0) / ratingData.length : 0

      // Get count of feedback with comments
      const { count: withCommentsCount, error: commentsError } = await supabase
        .from("feedback")
        .select("*", { count: "exact", head: true })
        .not("comments", "is", null)
        .not("comments", "eq", "")

      if (commentsError) throw commentsError

      // Get rating distribution
      const { data: ratingDistribution, error: distributionError } = await supabase
        .from("feedback")
        .select("rating")
        .not("rating", "is", null)

      if (distributionError) throw distributionError

      const distribution = [0, 0, 0, 0, 0]
      ratingDistribution.forEach((item) => {
        if (item.rating >= 1 && item.rating <= 5) {
          distribution[item.rating - 1]++
        }
      })

      setStats({
        totalCount: totalCount || 0,
        averageRating: Number.parseFloat(averageRating.toFixed(1)) || 0,
        withCommentsCount: withCommentsCount || 0,
        withCommentsPercentage: totalCount ? Math.round((withCommentsCount / totalCount) * 100) : 0,
        ratingDistribution: distribution,
      })

      // Get recent feedback with comments
      const { data: recent, error: recentError } = await supabase
        .from("feedback")
        .select("*")
        .not("comments", "is", null)
        .not("comments", "eq", "")
        .order("created_at", { ascending: false })
        .limit(5)

      if (recentError) throw recentError
      setRecentFeedback(recent || [])

      // Generate chart data for the last 7 days
      const now = new Date()
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now)
        date.setDate(now.getDate() - (6 - i))
        return date.toISOString().split("T")[0]
      })

      // Get feedback counts for the last 7 days
      const { data: dailyData, error: dailyError } = await supabase
        .from("feedback")
        .select("created_at")
        .gte("created_at", last7Days[0])

      if (dailyError) throw dailyError

      // Group by day
      const dailyCounts = {}
      last7Days.forEach((day) => {
        dailyCounts[day] = 0
      })

      dailyData.forEach((item) => {
        const day = item.created_at.split("T")[0]
        if (dailyCounts[day] !== undefined) {
          dailyCounts[day]++
        }
      })

      // Format for chart
      const formattedChartData = Object.keys(dailyCounts).map((date) => {
        return {
          date: date,
          count: dailyCounts[date],
        }
      })

      setChartData(formattedChartData)
      setLoading(false)
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
      setError("Error loading dashboard data")
      setLoading(false)
    }
  }

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
      <div className="min-h-screen bg-background p-8">
        <div className="flex items-center justify-center h-64">
          <p>Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="flex flex-col items-center justify-center h-64">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button className="mt-4" onClick={() => (window.location.href = "/login")}>
            Back to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b p-4 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => (window.location.href = "/admin/feedback")}>
              All Feedback
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/admin/analytics")}>
              Analytics
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Welcome, {user?.name || user?.email}</h2>
          <p className="text-muted-foreground">Here's an overview of your feedback data</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-3xl font-bold">{stats.averageRating}</div>
                <div className="ml-2 flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(stats.averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">With Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-3xl font-bold">{stats.withCommentsCount}</div>
                <div className="ml-2 text-sm text-gray-500">({stats.withCommentsPercentage}%)</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-10 items-end gap-1">
                {stats.ratingDistribution.map((count, index) => {
                  const total = stats.ratingDistribution.reduce((a, b) => a + b, 0)
                  const percentage = total > 0 ? (count / total) * 100 : 0
                  return (
                    <div
                      key={index}
                      className="flex-1 rounded-sm bg-gray-700"
                      style={{
                        height: `${Math.max(10, percentage)}%`,
                        backgroundColor: index === 4 ? "#1e293b" : "#64748b",
                        opacity: 0.6 + index * 0.1,
                      }}
                    />
                  )
                })}
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>1★</span>
                <span>2★</span>
                <span>3★</span>
                <span>4★</span>
                <span>5★</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Feedback Submissions</CardTitle>
              <CardDescription>Last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ChartContainer
                  config={{
                    count: {
                      label: "Submissions",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 12 }} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="var(--color-count)"
                        name="Submissions"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rating Distribution</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ChartContainer
                  config={{
                    count: {
                      label: "Count",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { rating: "1 Star", count: stats.ratingDistribution[0] },
                        { rating: "2 Stars", count: stats.ratingDistribution[1] },
                        { rating: "3 Stars", count: stats.ratingDistribution[2] },
                        { rating: "4 Stars", count: stats.ratingDistribution[3] },
                        { rating: "5 Stars", count: stats.ratingDistribution[4] },
                      ]}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rating" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--color-count)" name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Top Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {recentFeedback.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No comments found</p>
            ) : (
              <div className="space-y-4">
                {recentFeedback.map((feedback) => (
                  <div key={feedback.id} className="border-b pb-4 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{feedback.name || "Anonymous"}</p>
                        <p className="text-sm text-muted-foreground">{feedback.email || "No email provided"}</p>
                      </div>
                      <div className="flex">
                        {feedback.rating && (
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= feedback.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm">{feedback.comments || feedback.detailed_feedback}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(feedback.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

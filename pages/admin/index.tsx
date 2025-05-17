"use client"

import { useEffect, useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, ArrowRight } from "lucide-react"
import AdminLayout from "./_layout"

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<any>({
    totalCount: 0,
    averageRating: 0,
    withCommentsCount: 0,
    withCommentsPercentage: 0,
    ratingDistribution: [0, 0, 0, 0, 0],
  })
  const [recentFeedback, setRecentFeedback] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true)
        const supabase = createBrowserSupabaseClient()

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
          ratingData.length > 0
            ? ratingData.reduce((sum: number, item: any) => sum + item.rating, 0) / ratingData.length
            : 0

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
        ratingDistribution.forEach((item: any) => {
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

        // Get recent feedback
        const { data: recent, error: recentError } = await supabase
          .from("feedback")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5)

        if (recentError) throw recentError
        setRecentFeedback(recent || [])
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error)
        setError("Failed to load dashboard data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-6">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h2 className="text-red-800 font-medium">Error loading dashboard</h2>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p>Loading dashboard data...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Dashboard Overview</h1>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Show Filters
                </Button>
                <Button variant="outline" size="sm">
                  Export
                </Button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                            star <= Math.round(stats.averageRating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
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
                    {stats.ratingDistribution.map((count: number, index: number) => {
                      const total = stats.ratingDistribution.reduce((a: number, b: number) => a + b, 0)
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

            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Recent Feedback</h2>
                <Button variant="ghost" size="sm" className="gap-1" href="/admin/feedback">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {recentFeedback.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500">No feedback submissions yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {recentFeedback.map((feedback: any) => (
                    <Card key={feedback.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">{feedback.name || "Anonymous"}</div>
                            <div className="text-sm text-gray-500">{feedback.email || "No email provided"}</div>
                            <div className="mt-1 text-xs text-gray-400">
                              {new Date(feedback.created_at).toLocaleDateString()}
                            </div>
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
                        {feedback.comments ? (
                          <div className="mt-2 text-sm">{feedback.comments}</div>
                        ) : (
                          <div className="mt-2 text-sm italic text-gray-500">No comments provided</div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}

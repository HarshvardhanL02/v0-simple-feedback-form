"use client"

import { useEffect, useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, TrendingUp, TrendingDown, Minus, Download, Calendar } from "lucide-react"
import AdminLayout from "./_layout"
import dynamic from "next/dynamic"

// Dynamically import Chart.js components with no SSR
const DynamicChartComponent = dynamic(
  () => {
    import("chart.js").then(
      ({ Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler }) => {
        Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)
      },
    )
    return import("react-chartjs-2").then((mod) => mod.Line)
  },
  { ssr: false },
)

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<"week" | "month" | "quarter" | "year">("month")
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalyticsData() {
      try {
        setIsLoading(true)
        const supabase = createBrowserSupabaseClient()

        // Calculate date range based on period
        const now = new Date()
        const startDate = new Date()

        switch (period) {
          case "week":
            startDate.setDate(now.getDate() - 7)
            break
          case "month":
            startDate.setMonth(now.getMonth() - 1)
            break
          case "quarter":
            startDate.setMonth(now.getMonth() - 3)
            break
          case "year":
            startDate.setFullYear(now.getFullYear() - 1)
            break
        }

        // Get feedback for the period
        const { data, error } = await supabase
          .from("feedback")
          .select("*")
          .gte("created_at", startDate.toISOString())
          .order("created_at", { ascending: true })

        if (error) throw error

        // Process data for analytics
        const totalSubmissions = data.length

        // Calculate average rating
        const ratingData = data.filter((item) => item.rating !== null)
        const averageRating =
          ratingData.length > 0 ? ratingData.reduce((sum, item) => sum + item.rating, 0) / ratingData.length : 0

        // Count feedback with comments
        const withComments = data.filter(
          (item) =>
            (item.comments && item.comments.trim() !== "") ||
            (item.detailed_feedback && item.detailed_feedback.trim() !== ""),
        ).length
        const withCommentsPercentage = totalSubmissions ? Math.round((withComments / totalSubmissions) * 100) : 0

        // Group by date for daily counts
        const dailyCounts: Record<string, number> = {}
        data.forEach((item) => {
          const date = new Date(item.created_at).toISOString().split("T")[0]
          if (!dailyCounts[date]) {
            dailyCounts[date] = 0
          }
          dailyCounts[date]++
        })

        // Determine trend
        let trend = "stable"
        if (Object.keys(dailyCounts).length > 1) {
          const dates = Object.keys(dailyCounts).sort()
          const firstHalfDates = dates.slice(0, Math.floor(dates.length / 2))
          const secondHalfDates = dates.slice(Math.floor(dates.length / 2))

          const firstHalfAvg = firstHalfDates.reduce((sum, date) => sum + dailyCounts[date], 0) / firstHalfDates.length
          const secondHalfAvg =
            secondHalfDates.reduce((sum, date) => sum + dailyCounts[date], 0) / secondHalfDates.length

          if (secondHalfAvg > firstHalfAvg * 1.1) {
            trend = "increasing"
          } else if (secondHalfAvg < firstHalfAvg * 0.9) {
            trend = "decreasing"
          }
        }

        setAnalyticsData({
          totalSubmissions,
          averageRating: Number.parseFloat(averageRating.toFixed(1)),
          withCommentsCount: withComments,
          withCommentsPercentage,
          trend,
          dailyCounts,
          startDate: startDate.toISOString().split("T")[0],
          endDate: now.toISOString().split("T")[0],
        })
      } catch (error: any) {
        console.error("Error fetching analytics data:", error)
        setError("Failed to load analytics data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [period])

  // Prepare chart data
  const chartData = {
    labels: analyticsData?.dailyCounts ? Object.keys(analyticsData.dailyCounts) : [],
    datasets: [
      {
        label: "Submissions",
        data: analyticsData?.dailyCounts ? Object.values(analyticsData.dailyCounts) : [],
        borderColor: "#1e293b",
        backgroundColor: "rgba(30, 41, 59, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
    },
  }

  const getTrendIcon = () => {
    if (!analyticsData) return <Minus className="h-4 w-4" />

    switch (analyticsData.trend) {
      case "increasing":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "decreasing":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p>Loading analytics data...</p>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <h1 className="text-2xl font-bold">Error loading analytics</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            <p className="text-sm text-gray-500">View feedback trends and insights over time</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" />
            Export as PDF
          </Button>
        </div>

        <Tabs defaultValue="month" onValueChange={(value) => setPeriod(value as any)}>
          <TabsList>
            <TabsTrigger value="week">Last Week</TabsTrigger>
            <TabsTrigger value="month">Last Month</TabsTrigger>
            <TabsTrigger value="quarter">Last Quarter</TabsTrigger>
            <TabsTrigger value="year">Last Year</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">
              From: {analyticsData?.startDate} To: {analyticsData?.endDate}
            </span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Selected Period</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analyticsData?.totalSubmissions || 0} submissions</div>
              <div className="mt-1 text-xs text-gray-500">
                {analyticsData?.startDate} - {analyticsData?.endDate}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-3xl font-bold">{analyticsData?.averageRating || 0}</div>
                <div className="ml-2 flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(analyticsData?.averageRating || 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-1 text-xs text-gray-500">Excellent feedback!</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">With Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-3xl font-bold">{analyticsData?.withCommentsCount || 0}</div>
                <div className="ml-2 text-sm text-gray-500">({analyticsData?.withCommentsPercentage || 0}%)</div>
              </div>
              <div className="mt-1 text-xs text-gray-500">Average engagement</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-3xl font-bold capitalize">{analyticsData?.trend || "stable"}</div>
                <div className="ml-2">{getTrendIcon()}</div>
              </div>
              <div className="mt-1 text-xs text-gray-500">Based on submission volume</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="submission-volume">
          <TabsList>
            <TabsTrigger value="submission-volume">Submission Volume</TabsTrigger>
            <TabsTrigger value="rating-trends">Rating Trends</TabsTrigger>
            <TabsTrigger value="rating-distribution">Rating Distribution</TabsTrigger>
          </TabsList>
          <TabsContent value="submission-volume" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Feedback Submission Volume</CardTitle>
                <CardDescription>Number of feedback submissions over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {typeof window !== "undefined" && <DynamicChartComponent data={chartData} options={chartOptions} />}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}

"use client"

import { useEffect, useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Download, Filter } from "lucide-react"
import AdminLayout from "./_layout"

export default function FeedbackList() {
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFeedback() {
      try {
        setIsLoading(true)
        const supabase = createBrowserSupabaseClient()

        // Get all feedback
        const { data, error } = await supabase.from("feedback").select("*").order("created_at", { ascending: false })

        if (error) throw error

        setFeedback(data || [])
      } catch (error: any) {
        console.error("Error fetching feedback:", error)
        setError("Failed to load feedback data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeedback()
  }, [])

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p>Loading feedback...</p>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <h1 className="text-2xl font-bold">Error loading feedback</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Feedback</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1">
              <Filter className="h-4 w-4" />
              Show Filters
            </Button>
            <Button variant="outline" size="sm" className="gap-1">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          Showing {feedback.length} of {feedback.length} feedback submissions
        </div>

        <div className="flex gap-2 border-b pb-2">
          <Button variant="ghost" size="sm" className="text-sm font-medium">
            Date ↓
          </Button>
          <Button variant="ghost" size="sm" className="text-sm font-medium">
            Rating
          </Button>
          <Button variant="ghost" size="sm" className="text-sm font-medium">
            Name
          </Button>
        </div>

        {feedback.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No feedback submissions yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {feedback.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between border-b p-4">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.email}</div>
                    </div>
                    <div className="flex">
                      {item.rating && (
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= item.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="mb-2 text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</div>
                    {item.comments ? (
                      <div className="text-sm">{item.comments}</div>
                    ) : item.detailed_feedback ? (
                      <div className="text-sm">{item.detailed_feedback}</div>
                    ) : (
                      <div className="text-sm italic text-gray-500">No comments provided</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

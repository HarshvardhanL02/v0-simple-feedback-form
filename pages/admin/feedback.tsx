"use client"

import { useEffect, useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Download, Filter, Mail, MessageSquare } from "lucide-react"
import AdminLayout from "./_layout"
import { ReplyModal } from "@/components/reply-modal"

export default function FeedbackList() {
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [replyModalOpen, setReplyModalOpen] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null)
  const [replies, setReplies] = useState<Record<number, any[]>>({})

  useEffect(() => {
    async function fetchFeedback() {
      try {
        setIsLoading(true)
        const supabase = createBrowserSupabaseClient()

        // Get all feedback
        const { data, error } = await supabase.from("feedback").select("*").order("created_at", { ascending: false })

        if (error) throw error

        setFeedback(data || [])

        // Fetch replies for all feedback
        const feedbackIds = data?.map((item) => item.id) || []
        if (feedbackIds.length > 0) {
          const { data: repliesData, error: repliesError } = await supabase
            .from("feedback_replies")
            .select("*")
            .in("feedback_id", feedbackIds)
            .order("sent_at", { ascending: false })

          if (repliesError) throw repliesError

          // Group replies by feedback_id
          const repliesByFeedbackId: Record<number, any[]> = {}
          repliesData?.forEach((reply) => {
            if (!repliesByFeedbackId[reply.feedback_id]) {
              repliesByFeedbackId[reply.feedback_id] = []
            }
            repliesByFeedbackId[reply.feedback_id].push(reply)
          })

          setReplies(repliesByFeedbackId)
        }
      } catch (error: any) {
        console.error("Error fetching feedback:", error)
        setError("Failed to load feedback data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeedback()
  }, [])

  const handleReply = (item: any) => {
    setSelectedFeedback(item)
    setReplyModalOpen(true)
  }

  const closeReplyModal = () => {
    setReplyModalOpen(false)
    setSelectedFeedback(null)
  }

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
                      <div className="font-medium">{item.name || "Anonymous"}</div>
                      <div className="text-sm text-gray-500">{item.email || "No email"}</div>
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

                    {/* Show reply history if any */}
                    {replies[item.id] && replies[item.id].length > 0 && (
                      <div className="mt-4 border-t pt-3">
                        <div className="flex items-center gap-1 text-xs font-medium text-gray-500 mb-2">
                          <MessageSquare className="h-3 w-3" />
                          <span>Previous Replies ({replies[item.id].length})</span>
                        </div>
                        {replies[item.id].map((reply, index) => (
                          <div key={index} className="text-xs text-gray-600 mb-2 last:mb-0 bg-gray-50 p-2 rounded">
                            <div className="font-medium">{reply.subject}</div>
                            <div className="mt-1">{reply.message}</div>
                            <div className="mt-1 text-gray-400">
                              Sent by {reply.sent_by} on {new Date(reply.sent_at).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply button */}
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => handleReply(item)}
                        disabled={!item.email}
                        title={!item.email ? "No email address to reply to" : "Reply to this feedback"}
                      >
                        <Mail className="h-4 w-4" />
                        Reply
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {selectedFeedback && (
        <ReplyModal
          isOpen={replyModalOpen}
          onClose={closeReplyModal}
          feedbackId={selectedFeedback.id}
          recipientEmail={selectedFeedback.email}
          recipientName={selectedFeedback.name}
        />
      )}
    </AdminLayout>
  )
}

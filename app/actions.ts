"use server"

import { createServerSupabaseClient } from "@/lib/supabase"

type FeedbackData = {
  name: string
  email: string
  feedbackType: "quick" | "detailed"
  category?: string
  rating?: number
  satisfaction?: "satisfied" | "neutral" | "unsatisfied"
  comments?: string
  detailedFeedback?: string
  suggestions?: string
  contactConsent: boolean
}

export async function submitFeedback(formData: FormData) {
  try {
    const supabase = createServerSupabaseClient()

    const feedbackData: FeedbackData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      feedbackType: formData.get("feedbackType") as "quick" | "detailed",
      rating: Number.parseInt(formData.get("rating") as string) || null,
      comments: formData.get("comments") as string,
      contactConsent: formData.get("contactConsent") === "on",
    }

    // Add detailed feedback fields if applicable
    if (feedbackData.feedbackType === "detailed") {
      feedbackData.category = formData.get("category") as string
      feedbackData.satisfaction = formData.get("satisfaction") as "satisfied" | "neutral" | "unsatisfied"
      feedbackData.detailedFeedback = formData.get("detailedFeedback") as string
      feedbackData.suggestions = formData.get("suggestions") as string
    }

    const { data, error } = await supabase
      .from("feedback")
      .insert({
        name: feedbackData.name || null,
        email: feedbackData.email || null,
        feedback_type: feedbackData.feedbackType,
        category: feedbackData.category || null,
        rating: feedbackData.rating || null,
        satisfaction: feedbackData.satisfaction || null,
        comments: feedbackData.comments || null,
        detailed_feedback: feedbackData.detailedFeedback || null,
        suggestions: feedbackData.suggestions || null,
        contact_consent: feedbackData.contactConsent,
      })
      .select()

    if (error) {
      console.error("Error submitting feedback:", error)
      return { success: false, message: "Failed to submit feedback" }
    }

    return { success: true, message: "Feedback submitted successfully" }
  } catch (error) {
    console.error("Error submitting feedback:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function getAdminStats() {
  try {
    const supabase = createServerSupabaseClient()

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

    return {
      totalCount: totalCount || 0,
      averageRating: Number.parseFloat(averageRating.toFixed(1)),
      withCommentsCount: withCommentsCount || 0,
      withCommentsPercentage: totalCount ? Math.round((withCommentsCount / totalCount) * 100) : 0,
      ratingDistribution: distribution,
    }
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return null
  }
}

export async function getRecentFeedback(limit = 10) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error

    return data
  } catch (error) {
    console.error("Error fetching recent feedback:", error)
    return []
  }
}

export async function getAllFeedback() {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.from("feedback").select("*").order("created_at", { ascending: false })

    if (error) throw error

    return data
  } catch (error) {
    console.error("Error fetching all feedback:", error)
    return []
  }
}

export async function getAnalyticsData(period: "week" | "month" | "quarter" | "year" = "month") {
  try {
    const supabase = createServerSupabaseClient()

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

    // Get feedback analytics for the period
    const { data, error } = await supabase
      .from("feedback_analytics")
      .select("*")
      .gte("submission_date", startDate.toISOString())
      .order("submission_date", { ascending: true })

    if (error) throw error

    // Get daily submission counts
    const dailyCounts = {}
    data.forEach((item) => {
      const date = new Date(item.submission_date).toISOString().split("T")[0]
      if (!dailyCounts[date]) {
        dailyCounts[date] = 0
      }
      dailyCounts[date] += Number.parseInt(item.total_count)
    })

    // Calculate overall stats
    const totalSubmissions = data.reduce((sum, item) => sum + Number.parseInt(item.total_count), 0)
    const averageRating =
      data.reduce((sum, item) => {
        return sum + Number.parseFloat(item.average_rating) * Number.parseInt(item.total_count)
      }, 0) / totalSubmissions || 0

    const withComments = data.reduce((sum, item) => sum + Number.parseInt(item.with_comments_count), 0)
    const withCommentsPercentage = totalSubmissions ? Math.round((withComments / totalSubmissions) * 100) : 0

    // Determine trend (increasing, decreasing, stable)
    let trend = "stable"
    if (Object.keys(dailyCounts).length > 1) {
      const dates = Object.keys(dailyCounts).sort()
      const firstHalfDates = dates.slice(0, Math.floor(dates.length / 2))
      const secondHalfDates = dates.slice(Math.floor(dates.length / 2))

      const firstHalfAvg = firstHalfDates.reduce((sum, date) => sum + dailyCounts[date], 0) / firstHalfDates.length
      const secondHalfAvg = secondHalfDates.reduce((sum, date) => sum + dailyCounts[date], 0) / secondHalfDates.length

      if (secondHalfAvg > firstHalfAvg * 1.1) {
        trend = "increasing"
      } else if (secondHalfAvg < firstHalfAvg * 0.9) {
        trend = "decreasing"
      }
    }

    return {
      totalSubmissions,
      averageRating: Number.parseFloat(averageRating.toFixed(1)),
      withCommentsCount: withComments,
      withCommentsPercentage,
      trend,
      dailyCounts,
      startDate: startDate.toISOString().split("T")[0],
      endDate: now.toISOString().split("T")[0],
    }
  } catch (error) {
    console.error("Error fetching analytics data:", error)
    return null
  }
}

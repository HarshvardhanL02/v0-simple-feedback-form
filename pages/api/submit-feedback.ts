import type { NextApiRequest, NextApiResponse } from "next"
import { createClient } from "@supabase/supabase-js"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" })
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ success: false, message: "Missing Supabase environment variables" })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const {
      name,
      email,
      feedbackType,
      category,
      rating,
      satisfaction,
      comments,
      detailedFeedback,
      suggestions,
      contactConsent,
    } = req.body

    const { data, error } = await supabase
      .from("feedback")
      .insert({
        name: name || null,
        email: email || null,
        feedback_type: feedbackType,
        category: category || null,
        rating: rating || null,
        satisfaction: satisfaction || null,
        comments: comments || null,
        detailed_feedback: detailedFeedback || null,
        suggestions: suggestions || null,
        contact_consent: contactConsent,
      })
      .select()

    if (error) {
      console.error("Error submitting feedback:", error)
      return res.status(500).json({ success: false, message: "Failed to submit feedback" })
    }

    return res.status(200).json({ success: true, message: "Feedback submitted successfully" })
  } catch (error) {
    console.error("Error submitting feedback:", error)
    return res.status(500).json({ success: false, message: "An unexpected error occurred" })
  }
}

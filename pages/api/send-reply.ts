import type { NextApiRequest, NextApiResponse } from "next"
import { createClient } from "@supabase/supabase-js"
import nodemailer from "nodemailer"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" })
  }

  try {
    const { feedbackId, message, subject } = req.body

    if (!feedbackId || !message) {
      return res.status(400).json({ success: false, message: "Missing required fields" })
    }

    // Get Supabase client
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ success: false, message: "Missing Supabase environment variables" })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get feedback details
    const { data: feedback, error: feedbackError } = await supabase
      .from("feedback")
      .select("*")
      .eq("id", feedbackId)
      .single()

    if (feedbackError || !feedback) {
      return res.status(404).json({ success: false, message: "Feedback not found" })
    }

    // Check if the feedback has an email to reply to
    if (!feedback.email) {
      return res.status(400).json({ success: false, message: "Feedback has no email address to reply to" })
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      // You'll need to replace these with your actual SMTP settings
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number.parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "infonitiate@gmail.com",
        pass: process.env.SMTP_PASSWORD,
      },
    })

    // Send email
    const mailOptions = {
      from: `"Feedback System" <infonitiate@gmail.com>`,
      to: feedback.email,
      subject: subject || `Re: Your Feedback [#${feedbackId}]`,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Response to Your Feedback</h2>
          <p>Thank you for your feedback. Here is our response:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            ${message.replace(/\n/g, "<br>")}
          </div>
          <p style="color: #666; font-size: 14px;">This is in reference to the feedback you submitted on ${new Date(feedback.created_at).toLocaleDateString()}.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #888; font-size: 12px;">Please do not reply to this email. If you have additional feedback, please submit it through our feedback form.</p>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)

    // Store the reply in the database
    const { error: replyError } = await supabase.from("feedback_replies").insert({
      feedback_id: feedbackId,
      message: message,
      sent_at: new Date().toISOString(),
      sent_by: req.body.adminEmail || "admin",
      subject: subject || `Re: Your Feedback [#${feedbackId}]`,
    })

    if (replyError) {
      console.error("Error storing reply:", replyError)
      // We still return success since the email was sent
      return res.status(200).json({
        success: true,
        message: "Reply sent successfully, but there was an error storing the reply in the database",
      })
    }

    return res.status(200).json({ success: true, message: "Reply sent successfully" })
  } catch (error) {
    console.error("Error sending reply:", error)
    return res.status(500).json({ success: false, message: "An unexpected error occurred" })
  }
}

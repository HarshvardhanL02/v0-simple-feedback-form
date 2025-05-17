"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Star, SmileIcon, MehIcon, FrownIcon, Upload, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"

export default function FeedbackForm() {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [detailedStep, setDetailedStep] = useState(1)
  const [satisfaction, setSatisfaction] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [activeTab, setActiveTab] = useState("quick")
  const formRef = useRef<HTMLFormElement>(null)

  const handleNext = () => {
    setDetailedStep((prev) => prev + 1)
  }

  const handlePrevious = () => {
    setDetailedStep((prev) => prev - 1)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)

      // Create a data object from the form
      const data = {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        feedbackType: activeTab,
        rating: Number.parseInt(rating.toString()),
        comments: formData.get("comments") as string,
        contactConsent: formData.get("contactConsent") === "on",
      }

      // Add detailed feedback fields if applicable
      if (activeTab === "detailed") {
        Object.assign(data, {
          category: formData.get("category") as string,
          satisfaction: satisfaction,
          detailedFeedback: formData.get("detailedFeedback") as string,
          suggestions: formData.get("suggestions") as string,
        })
      }

      // Submit the feedback using the API route
      const response = await fetch("/api/submit-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        setIsSubmitted(true)
        if (formRef.current) {
          formRef.current.reset()
        }
      } else {
        alert(result.message || "Failed to submit feedback. Please try again.")
      }
    } catch (error) {
      console.error("Error submitting feedback:", error)
      alert("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    // Reset form state
    setRating(0)
    setSatisfaction(null)
    setDetailedStep(1)
    setIsSubmitted(false)
  }

  // If the form has been submitted, show the success confirmation
  if (isSubmitted) {
    return (
      <div className="w-full max-w-md mx-auto border rounded-md p-6 bg-card">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Feedback Form</h1>
          <p className="text-muted-foreground text-sm">We value your feedback. Please let us know how we're doing.</p>
        </div>

        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="bg-green-50 rounded-full p-3">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>

          <h2 className="text-xl font-semibold text-center">Thank You for Your Feedback!</h2>

          <p className="text-muted-foreground text-center max-w-xs">
            We appreciate you taking the time to share your thoughts with us. Your feedback helps us improve our
            services.
          </p>

          <div className="bg-muted rounded-md p-4 w-full mt-4">
            <p className="text-sm text-muted-foreground mb-2">What happens next?</p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Your feedback has been recorded in our system</li>
              <li>Our team will review your comments</li>
              {activeTab === "detailed" && (
                <li>If you provided consent, we may contact you for additional information</li>
              )}
            </ul>
          </div>

          <Button onClick={handleReset} className="mt-6">
            Submit Another Feedback
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto border rounded-md p-6 bg-card">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Feedback Form</h1>
        <p className="text-muted-foreground text-sm">We value your feedback. Please let us know how we're doing.</p>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Share Your Feedback</h2>
        <Tabs defaultValue="quick" className="w-full" onValueChange={(value) => setActiveTab(value)}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="quick">Quick Feedback</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Feedback</TabsTrigger>
          </TabsList>

          {/* Quick Feedback Tab */}
          <TabsContent value="quick">
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Name
                </label>
                <Input id="name" name="name" placeholder="" required />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <Input id="email" name="email" type="email" placeholder="" required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Rating</label>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "w-6 h-6 cursor-pointer",
                        hoveredRating >= star || rating >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300",
                      )}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="comments" className="block text-sm font-medium mb-1">
                  Comments (Optional)
                </label>
                <Textarea
                  id="comments"
                  name="comments"
                  placeholder="Tell us what you think..."
                  className="resize-none h-24"
                />
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox id="contactConsent" name="contactConsent" />
                <label htmlFor="contactConsent" className="text-sm text-muted-foreground leading-tight">
                  You can contact me about this feedback if needed.
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting || rating === 0}>
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </form>
          </TabsContent>

          {/* Detailed Feedback Tab */}
          <TabsContent value="detailed">
            <form ref={formRef} onSubmit={handleSubmit}>
              {/* Step 1: Basic Info and Category */}
              {detailedStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="detailed-name" className="block text-sm font-medium mb-1">
                      Name
                    </label>
                    <Input id="detailed-name" name="name" placeholder="" required />
                  </div>

                  <div>
                    <label htmlFor="detailed-email" className="block text-sm font-medium mb-1">
                      Email
                    </label>
                    <Input id="detailed-email" name="email" type="email" placeholder="" required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Feedback Category</label>
                    <select
                      name="category"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      defaultValue=""
                      required
                    >
                      <option value="" disabled>
                        Select a category
                      </option>
                      <option value="product">Product</option>
                      <option value="website">Website</option>
                      <option value="customer-service">Customer Service</option>
                      <option value="billing">Billing</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleNext} type="button">
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Satisfaction and Rating */}
              {detailedStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-3">Overall Satisfaction</label>
                    <div className="flex justify-between items-center">
                      <div
                        className={cn(
                          "flex flex-col items-center cursor-pointer p-2 rounded-md",
                          satisfaction === "satisfied" ? "bg-muted" : "",
                        )}
                        onClick={() => setSatisfaction("satisfied")}
                      >
                        <SmileIcon
                          className={cn("w-8 h-8", satisfaction === "satisfied" ? "text-green-500" : "text-gray-400")}
                        />
                        <span className="text-sm mt-1">Satisfied</span>
                      </div>

                      <div
                        className={cn(
                          "flex flex-col items-center cursor-pointer p-2 rounded-md",
                          satisfaction === "neutral" ? "bg-muted" : "",
                        )}
                        onClick={() => setSatisfaction("neutral")}
                      >
                        <MehIcon
                          className={cn("w-8 h-8", satisfaction === "neutral" ? "text-yellow-500" : "text-gray-400")}
                        />
                        <span className="text-sm mt-1">Neutral</span>
                      </div>

                      <div
                        className={cn(
                          "flex flex-col items-center cursor-pointer p-2 rounded-md",
                          satisfaction === "unsatisfied" ? "bg-muted" : "",
                        )}
                        onClick={() => setSatisfaction("unsatisfied")}
                      >
                        <FrownIcon
                          className={cn("w-8 h-8", satisfaction === "unsatisfied" ? "text-red-500" : "text-gray-400")}
                        />
                        <span className="text-sm mt-1">Unsatisfied</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Rating</label>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={`detailed-${star}`}
                          className={cn(
                            "w-6 h-6 cursor-pointer",
                            hoveredRating >= star || rating >= star
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300",
                          )}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => setRating(star)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={handlePrevious} type="button">
                      Previous
                    </Button>
                    <Button onClick={handleNext} type="button" disabled={!satisfaction || rating === 0}>
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Detailed Comments and Attachments */}
              {detailedStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Detailed Feedback</label>
                    <Textarea
                      name="detailedFeedback"
                      placeholder="Please share your thoughts in detail..."
                      className="resize-none h-32"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Suggestions for Improvement</label>
                    <Textarea
                      name="suggestions"
                      placeholder="How can we improve our service?"
                      className="resize-none h-24"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Attachments (Optional)</label>
                    <div className="border border-dashed border-input rounded-md p-6 text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">Drop files here or click to upload</p>
                      <p className="text-xs text-muted-foreground mt-1">(Max 3 files, 5MB each)</p>
                      <input type="file" className="hidden" id="file-upload" multiple />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => document.getElementById("file-upload")?.click()}
                      >
                        Browse Files
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox id="detailed-contact-consent" name="contactConsent" />
                    <label htmlFor="detailed-contact-consent" className="text-sm text-muted-foreground leading-tight">
                      You can contact me about this feedback if needed.
                    </label>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={handlePrevious} type="button">
                      Previous
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Submit Feedback"}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

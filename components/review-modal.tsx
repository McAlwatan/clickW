"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Star } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface ReviewModalProps {
  requestId: string
  providerName: string
  requestStatus: string
  onReviewSubmitted?: () => void
}

export function ReviewModal({ requestId, providerName, requestStatus, onReviewSubmitted }: ReviewModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [hoveredRating, setHoveredRating] = useState(0)
  const [hasReviewed, setHasReviewed] = useState(false)

  useEffect(() => {
    checkExistingReview()
  }, [requestId])

  const checkExistingReview = async () => {
    try {
      const { data } = await supabase.from("reviews").select("id").eq("request_id", requestId).single()

      setHasReviewed(!!data)
    } catch (error) {
      // No existing review found
      setHasReviewed(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0 || requestStatus !== "completed") return

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Get provider ID from the request
      const { data: request } = await supabase
        .from("service_requests")
        .select("provider_id")
        .eq("id", requestId)
        .single()

      if (!request) throw new Error("Request not found")

      const { error } = await supabase.from("reviews").insert({
        client_id: user.id,
        provider_id: request.provider_id,
        request_id: requestId,
        rating,
        comment: comment.trim() || null,
      })

      if (!provider) throw new Error("Provider not found")

      await supabase.from("reviews").insert({
        client_id: user.id,
        provider_id: provider.user_id, // 👈 now using users.id!
        request_id: requestId,
        rating,
        comment: comment.trim() || null,
      })

      if (error) throw error

      setOpen(false)
      setRating(0)
      setComment("")
      setHasReviewed(true)
      onReviewSubmitted?.()

      alert("Review submitted successfully!")
    } catch (error) {
      console.error("Error submitting review:", error)
      alert("Failed to submit review. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Only show review button if work is completed and not already reviewed
  if (requestStatus !== "completed" || hasReviewed) {
    return hasReviewed ? (
      <div className="text-green-400 text-sm">✅ Review submitted</div>
    ) : (
      <div className="text-gray-400 text-sm">Complete work to leave review</div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700">
          <Star className="mr-2 h-4 w-4" />
          Leave Review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">Review {providerName}</DialogTitle>
          <DialogDescription className="text-gray-400">
            Share your experience with this service provider.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-white">Rating</Label>
            <div className="flex space-x-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="comment" className="text-white">
              Comment (Optional)
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-gray-700">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || rating === 0}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
            >
              {loading ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

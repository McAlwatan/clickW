"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Send } from "lucide-react"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase"

interface RequestServiceModalProps {
  providerId: string
  providerName: string
  onRequestSent?: () => void
}

export function RequestServiceModal({ providerId, providerName, onRequestSent }: RequestServiceModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    location: "",
    deadline: undefined as Date | undefined,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!formData.title.trim() || !formData.description.trim() || !formData.budget) {
      alert("Please fill in all required fields")
      return
    }

    setLoading(true)

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) throw authError
      if (!user) {
        alert("Please log in to request services")
        return
      }

      const { error } = await supabase.from("service_requests").insert({
        client_id: user.id,
        provider_id: providerId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        budget: Number.parseFloat(formData.budget),
        location: formData.location.trim() || "Remote",
        deadline: formData.deadline
          ? formData.deadline.toISOString().split("T")[0]
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days from now
        status: "pending",
      })

      if (error) throw error

      alert("Service request sent successfully!")
      setOpen(false)
      onRequestSent?.()

      // Reset form
      setFormData({
        title: "",
        description: "",
        budget: "",
        location: "",
        deadline: undefined,
      })
    } catch (error) {
      console.error("Error sending request:", error)
      alert("Failed to send request. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
          <Send className="mr-2 h-4 w-4" />
          Request Service
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle>Request Service from {providerName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-white">
              Service Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Website Development"
              className="bg-gray-800 border-gray-700 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-white">
              Description *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what you need in detail..."
              className="bg-gray-800 border-gray-700 text-white"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget" className="text-white">
                Budget ($) *
              </Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="1000"
                className="bg-gray-800 border-gray-700 text-white"
                min="1"
                required
              />
            </div>

            <div>
              <Label htmlFor="location" className="text-white">
                Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Remote or City, Country"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-white">Deadline (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.deadline ? format(formData.deadline, "PPP") : "Pick a date (optional)"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700">
                <Calendar
                  mode="single"
                  selected={formData.deadline}
                  onSelect={(date) => setFormData({ ...formData, deadline: date })}
                  initialFocus
                  className="bg-gray-900 text-white"
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {loading ? "Sending..." : "Send Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sidebar } from "@/components/sidebar"
import { Search, MessageSquare, Send, Calendar, DollarSign, Clock, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ClientRequests() {
  const router = useRouter()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.documentElement.classList.add("dark")
    checkAuth()
    fetchRequests()
  }, [])

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
      return
    }
  }

  const fetchRequests = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("requests")
        .select(`
          *,
          service_providers!requests_provider_id_fkey(
            brand_name,
            users!service_providers_user_id_fkey(first_name, last_name)
          )
        `)
        .eq("client_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error("Error fetching requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsCompleted = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("requests")
        .update({ status: "client_completed" })
        .eq("id", requestId)
        .eq("status", "in_progress")

      if (error) throw error
      fetchRequests()
    } catch (error) {
      console.error("Error marking request as completed:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "accepted":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "in_progress":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "client_completed":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending"
      case "accepted":
        return "Accepted"
      case "rejected":
        return "Rejected"
      case "in_progress":
        return "In Progress"
      case "client_completed":
        return "Awaiting Provider Completion"
      case "completed":
        return "Completed"
      default:
        return status
    }
  }

  const sidebarItems = [
    { icon: Search, label: "Find Services", href: "/client/dashboard" },
    { icon: MessageSquare, label: "Messages", href: "/client/messages" },
    { icon: Send, label: "My Requests", href: "/client/requests" },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex">
      <Sidebar items={sidebarItems} userType="client" />

      <div className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">My Requests</h1>
            <p className="text-gray-400 text-lg">Track your project requests and their progress</p>
          </div>

          {/* Requests List */}
          <div className="space-y-6">
            {requests.length === 0 ? (
              <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
                <CardContent className="p-12 text-center">
                  <Send className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No requests yet</h3>
                  <p className="text-gray-400 mb-6">
                    Start by contacting service providers to create your first request
                  </p>
                  <Button
                    onClick={() => router.push("/client/dashboard")}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  >
                    Find Service Providers
                  </Button>
                </CardContent>
              </Card>
            ) : (
              requests.map((request) => (
                <Card
                  key={request.id}
                  className="bg-gray-900/50 border-gray-800 hover:border-orange-500/50 transition-all duration-300 shadow-dark"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white text-xl mb-2">{request.title}</CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>Created {new Date(request.created_at).toLocaleDateString()}</span>
                          </div>
                          {request.deadline && (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>Due {new Date(request.deadline).toLocaleDateString()}</span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            <span>${request.budget}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src="/placeholder.svg?height=32&width=32"
                              alt={request.service_providers?.users?.first_name}
                            />
                            <AvatarFallback className="bg-orange-500 text-white text-sm">
                              {request.service_providers?.users?.first_name?.[0]}
                              {request.service_providers?.users?.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-gray-300">
                            {request.service_providers?.users?.first_name} {request.service_providers?.users?.last_name}
                          </span>
                          <span className="text-orange-400">({request.service_providers?.brand_name})</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-3">
                        <Badge className={getStatusColor(request.status)}>{getStatusText(request.status)}</Badge>
                        {request.status === "in_progress" && (
                          <Button
                            onClick={() => markAsCompleted(request.id)}
                            size="sm"
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 leading-relaxed">{request.description}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ReviewModal } from "@/components/review-modal"
import { Search, MessageSquare, Send, Settings, User, Clock, DollarSign, MapPin, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

const sidebarItems = [
  { icon: Search, label: "Find Services", href: "/client/dashboard" },
  { icon: MessageSquare, label: "Messages", href: "/client/messages" },
  { icon: Send, label: "My Requests", href: "/client/requests" },
  { icon: User, label: "Profile", href: "/client/profile" },
  { icon: Settings, label: "Settings", href: "/client/settings" },
]

export default function ClientRequests() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRequests()

    // Set up real-time subscription
    const channelName = `client-requests-${Date.now()}-${Math.random()}`
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "service_requests" }, () => fetchRequests())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "service_requests" }, () => fetchRequests())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchRequests = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!user) return

      // Fetch requests for this client
      const { data: requestsData, error } = await supabase
        .from("service_requests")
        .select(`
          *,
          provider:service_providers!service_requests_provider_id_fkey(
            id,
            brand_name,
            user_id,
            users!service_providers_user_id_fkey(first_name, last_name, email)
          )
        `)
        .eq("client_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setRequests(requestsData || [])
    } catch (error) {
      console.error("Error fetching requests:", error)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  const updateRequestStatus = async (requestId: string, status: string) => {
    try {
      const { error } = await supabase.from("service_requests").update({ status }).eq("id", requestId)

      if (!error) {
        fetchRequests()
      }
    } catch (error) {
      console.error("Error updating request:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400"
      case "accepted":
        return "bg-green-500/20 text-green-400"
      case "rejected":
        return "bg-red-500/20 text-red-400"
      case "in_progress":
        return "bg-blue-500/20 text-blue-400"
      case "completed":
        return "bg-purple-500/20 text-purple-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Sidebar items={sidebarItems} userType="client" />

      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">My Service Requests</h1>
            <p className="text-gray-400 text-lg">Track your service requests and their progress</p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="text-white">Loading requests...</div>
            </div>
          ) : requests.length === 0 ? (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="text-center py-12">
                <Send className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Requests Yet</h3>
                <p className="text-gray-400">When you request services from providers, they'll appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {requests.map((request) => (
                <Card key={request.id} className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-orange-500 text-white">
                            {request.provider?.users?.first_name?.[0] || "P"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-white">{request.title}</CardTitle>
                          <CardDescription className="text-gray-400">
                            To: {request.provider?.users?.first_name} {request.provider?.users?.last_name} (
                            {request.provider?.brand_name})
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={getStatusColor(request.status)}>{request.status.replace("_", " ")}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-white font-medium mb-2">Request Details</h4>
                      <p className="text-gray-300">{request.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-green-400" />
                        <span className="text-gray-400">Budget:</span>
                        <span className="text-white">${request.budget}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-blue-400" />
                        <span className="text-gray-400">Deadline:</span>
                        <span className="text-white">{new Date(request.deadline).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-orange-400" />
                        <span className="text-gray-400">Location:</span>
                        <span className="text-white">{request.location || "Remote"}</span>
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-4">
                      {request.status === "in_progress" && (
                        <Button
                          onClick={() => updateRequestStatus(request.id, "completed")}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as Completed
                        </Button>
                      )}

                      {request.status === "completed" && (
                        <ReviewModal
                          requestId={request.id}
                          providerId={request.provider_id}
                          providerName={`${request.provider?.users?.first_name} ${request.provider?.users?.last_name}`}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

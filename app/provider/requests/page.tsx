"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Settings,
  User,
  Clock,
  DollarSign,
  MapPin,
  CheckCircle,
  XCircle,
  MessageCircle,
} from "lucide-react"
import { supabase, getCurrentUser } from "@/lib/supabase"

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/provider/dashboard" },
  { icon: MessageSquare, label: "Messages", href: "/provider/messages" },
  { icon: FileText, label: "Requests", href: "/provider/requests" },
  { icon: User, label: "Profile", href: "/provider/profile" },
  { icon: Settings, label: "Settings", href: "/provider/settings" },
]

export default function ProviderRequests() {
  const router = useRouter()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentProvider, setCurrentProvider] = useState<any>(null)

  useEffect(() => {
    initializePage()
  }, [])

  const initializePage = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push("/login")
        return
      }
      setCurrentUser(user)

      const { data: provider, error: providerError } = await supabase
        .from("service_providers")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (providerError || !provider) {
        console.error("Provider lookup error:", providerError)
        setError("Provider profile not found. Please complete your provider setup.")
        setLoading(false)
        return
      }

      setCurrentProvider(provider)
      await fetchRequests(provider.id)

      const channelName = `provider-requests-${provider.id}-${Date.now()}`
      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "service_requests", filter: `provider_id=eq.${provider.id}` },
          () => fetchRequests(provider.id),
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "service_requests", filter: `provider_id=eq.${provider.id}` },
          () => fetchRequests(provider.id),
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } catch (error) {
      console.error("Initialization error:", error)
      setError("Failed to initialize page")
      setLoading(false)
    }
  }

  const fetchRequests = async (providerId: string) => {
    try {
      const { data: requestsData, error: requestsError } = await supabase
        .from("service_requests")
        .select(`
          *,
          client:users!service_requests_client_id_fkey(id, first_name, last_name, email)
        `)
        .eq("provider_id", providerId)
        .order("created_at", { ascending: false })

      if (requestsError) {
        const { data: simpleRequests, error: simpleError } = await supabase
          .from("service_requests")
          .select("*")
          .eq("provider_id", providerId)
          .order("created_at", { ascending: false })

        if (simpleError) throw simpleError

        const requestsWithClients = await Promise.all(
          (simpleRequests || []).map(async (request) => {
            const { data: client } = await supabase
              .from("users")
              .select("id, first_name, last_name, email")
              .eq("id", request.client_id)
              .single()

            return { ...request, client }
          }),
        )

        setRequests(requestsWithClients)
      } else {
        setRequests(requestsData || [])
      }

      setError(null)
    } catch (error) {
      console.error("Error fetching requests:", error)
      setError("Failed to load requests")
    } finally {
      setLoading(false)
    }
  }

  const updateRequestStatus = async (requestId: string, status: string) => {
    try {
      const { error } = await supabase.from("service_requests").update({ status }).eq("id", requestId)

      if (error) throw error

      if (currentProvider) {
        await fetchRequests(currentProvider.id)
      }
    } catch (error) {
      console.error("Error updating request:", error)
      alert("Failed to update request status")
    }
  }

  const markProviderComplete = async (requestId: string) => {
    try {
      // Only allow if client has already marked as complete
      const { error } = await supabase
        .from("service_requests")
        .update({ status: "completed" })
        .eq("id", requestId)
        .eq("status", "client_completed")

      if (error) throw error

      if (currentProvider) {
        await fetchRequests(currentProvider.id)
      }
    } catch (error) {
      console.error("Error marking as complete:", error)
      alert("Failed to mark as complete")
    }
  }

  const handleMessageClient = (clientId: string) => {
    router.push(`/provider/messages?user=${clientId}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400"
      case "accepted":
        return "bg-green-500/20 text-green-400"
      case "rejected":
        return "bg-red-500/20 text-red-400"
      case "cancelled":
        return "bg-gray-500/20 text-gray-400"
      case "in_progress":
        return "bg-blue-500/20 text-blue-400"
      case "client_completed":
        return "bg-orange-500/20 text-orange-400"
      case "completed":
        return "bg-purple-500/20 text-purple-400"
      default:
        return "bg-gray-500/20 text-gray-400"
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
      case "cancelled":
        return "Cancelled"
      case "in_progress":
        return "In Progress"
      case "client_completed":
        return "Client Marked Done"
      case "completed":
        return "Completed"
      default:
        return status
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <Card className="bg-gray-900/50 border-gray-800 max-w-md">
          <CardContent className="text-center py-8">
            <h3 className="text-xl font-semibold text-white mb-2">Error Loading Requests</h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-orange-600 hover:bg-orange-700">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Sidebar items={sidebarItems} userType="provider" />

      <div className="lg:ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Service Requests</h1>
            <p className="text-gray-400 text-lg">
              Manage your client requests {currentProvider && `(${currentProvider.brand_name})`}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="text-white">Loading requests...</div>
            </div>
          ) : requests.length === 0 ? (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Requests Yet</h3>
                <p className="text-gray-400">When clients send you service requests, they'll appear here.</p>
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
                          <AvatarFallback className="bg-blue-500 text-white">
                            {request.client?.first_name?.[0] || "C"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-white">{request.title}</CardTitle>
                          <CardDescription className="text-gray-400">
                            From: {request.client?.first_name || "Unknown"} {request.client?.last_name || "Client"}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={getStatusColor(request.status)}>{getStatusText(request.status)}</Badge>
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

                    <div className="flex flex-wrap gap-3 pt-4">
                      <Button
                        onClick={() => handleMessageClient(request.client_id)}
                        variant="outline"
                        className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Message Client
                      </Button>

                      {request.status === "pending" && (
                        <>
                          <Button
                            onClick={() => updateRequestStatus(request.id, "accepted")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Accept Request
                          </Button>
                          <Button
                            onClick={() => updateRequestStatus(request.id, "cancelled")}
                            variant="outline"
                            className="border-gray-600 text-gray-400 hover:bg-gray-600/10"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel Request
                          </Button>
                        </>
                      )}

                      {request.status === "accepted" && (
                        <Button
                          onClick={() => updateRequestStatus(request.id, "in_progress")}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Start Work
                        </Button>
                      )}

                      {request.status === "client_completed" && (
                        <Button
                          onClick={() => markProviderComplete(request.id)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Confirm Completion
                        </Button>
                      )}

                      {request.status === "completed" && (
                        <div className="text-green-400 text-sm">✅ Work completed - Client can now leave review</div>
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

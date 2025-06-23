"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sidebar } from "@/components/sidebar"
import { RequestServiceModal } from "@/components/request-service-modal"
import { Search, Star, MapPin, Clock, DollarSign, MessageSquare, Send, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ClientDashboard() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedService, setSelectedService] = useState("")
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<any>(null)
  const [userRequests, setUserRequests] = useState<any[]>([])

  useEffect(() => {
    document.documentElement.classList.add("dark")
    checkAuth()
    fetchProviders()
    getUserLocation()
    fetchUserRequests()
  }, [])

  const checkAuth = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error) throw error
      if (!user) {
        router.push("/login")
        return
      }
    } catch (error) {
      console.error("Auth error:", error)
      router.push("/login")
    }
  }

  const getUserLocation = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from("users").select("location").eq("id", user.id).single()

        if (data?.location) {
          setUserLocation(data.location)
        }
      }
    } catch (error) {
      console.error("Error fetching user location:", error)
    }
  }

  const fetchUserRequests = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("service_requests")
        .select("provider_id, status")
        .eq("client_id", user.id)
        .in("status", ["pending", "accepted", "in_progress"])

      if (error) throw error
      setUserRequests(data || [])
    } catch (error) {
      console.error("Error fetching user requests:", error)
      setUserRequests([])
    }
  }

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from("service_providers")
        .select(`
          *,
          users!service_providers_user_id_fkey(first_name, last_name, email)
        `)
        .order("rating", { ascending: false })

      if (error) throw error
      setProviders(data || [])
    } catch (error) {
      console.error("Error fetching providers:", error)
      setProviders([])
    } finally {
      setLoading(false)
    }
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Radius of the Earth in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const hasActiveRequest = (providerId: string) => {
    return userRequests.some((req) => req.provider_id === providerId)
  }

  const filteredProviders = providers
    .filter((provider) => {
      const matchesSearch =
        provider.users?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.users?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.brand_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.services?.some((service: string) => service.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesService = !selectedService || provider.services?.includes(selectedService)

      return matchesSearch && matchesService
    })
    .sort((a, b) => {
      // First, sort by location proximity if user location is available
      if (userLocation && a.location && b.location) {
        const distanceA = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          a.location.latitude,
          a.location.longitude,
        )
        const distanceB = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          b.location.latitude,
          b.location.longitude,
        )

        // If distances are significantly different (more than 10km), sort by distance
        if (Math.abs(distanceA - distanceB) > 10) {
          return distanceA - distanceB
        }
      }

      // If locations are similar or not available, sort by rating (higher first)
      if (Math.abs(b.rating - a.rating) > 0.5) {
        return b.rating - a.rating
      }

      // If ratings are similar, sort by total reviews
      return b.total_reviews - a.total_reviews
    })

  const handleContactProvider = async (providerId: string) => {
    router.push(`/client/messages?provider=${providerId}`)
  }

  const handleViewProfile = (providerId: string) => {
    router.push(`/provider/profile/${providerId}`)
  }

  const handleRequestSent = () => {
    fetchUserRequests() // Refresh the requests to update UI
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
            <h1 className="text-4xl font-bold text-white mb-2">Find Service Providers</h1>
            <p className="text-gray-400 text-lg">Discover talented professionals for your next project</p>
            {userLocation && (
              <p className="text-orange-400 text-sm mt-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Showing results near {userLocation.city}, {userLocation.country}
              </p>
            )}
          </div>

          {/* Search and Filters */}
          <Card className="mb-8 bg-gray-900/50 border-gray-800 shadow-dark">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      placeholder="Search by name, service, or keyword..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 bg-gray-800 border-gray-700 text-white text-lg py-3"
                    />
                  </div>
                </div>

                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="w-full md:w-64 bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Service Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">All Services</SelectItem>
                    <SelectItem value="Web Development">Web Development</SelectItem>
                    <SelectItem value="UI/UX Design">UI/UX Design</SelectItem>
                    <SelectItem value="Graphic Design">Graphic Design</SelectItem>
                    <SelectItem value="Content Writing">Content Writing</SelectItem>
                    <SelectItem value="Digital Marketing">Digital Marketing</SelectItem>
                    <SelectItem value="Mobile App Development">Mobile App Development</SelectItem>
                    <SelectItem value="SEO Services">SEO Services</SelectItem>
                    <SelectItem value="Social Media Management">Social Media Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-white">
                {filteredProviders.length} Service Provider{filteredProviders.length !== 1 ? "s" : ""} Found
              </h2>
            </div>

            <div className="grid gap-6">
              {filteredProviders.map((provider) => (
                <Card
                  key={provider.id}
                  className="bg-gray-900/50 border-gray-800 hover:border-orange-500/50 transition-all duration-300 shadow-dark hover:shadow-glow"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex items-start space-x-4 flex-1">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src="/placeholder.svg?height=80&width=80" alt={provider.users?.first_name} />
                          <AvatarFallback className="bg-orange-500 text-white text-lg">
                            {provider.users?.first_name?.[0] || "U"}
                            {provider.users?.last_name?.[0] || ""}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-semibold text-white">
                              {provider.users?.first_name} {provider.users?.last_name}
                            </h3>
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Available</Badge>
                            {hasActiveRequest(provider.id) && (
                              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Requested</Badge>
                            )}
                          </div>
                          <p className="text-orange-400 font-medium text-lg mb-3">{provider.brand_name}</p>
                          <p className="text-gray-300 mb-4 leading-relaxed">{provider.description}</p>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {provider.services?.slice(0, 3).map((service: string) => (
                              <Badge key={service} variant="outline" className="border-gray-600 text-gray-300">
                                {service}
                              </Badge>
                            ))}
                            {provider.services?.length > 3 && (
                              <Badge variant="outline" className="border-gray-600 text-gray-400">
                                +{provider.services.length - 3} more
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-6 text-sm text-gray-400">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 mr-1" />
                              <span className="font-medium text-white">
                                {provider.rating > 0 ? provider.rating.toFixed(1) : "New"}
                              </span>
                              {provider.total_reviews > 0 && (
                                <span className="ml-1">({provider.total_reviews} reviews)</span>
                              )}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>
                                {provider.city}, {provider.country}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{provider.years_experience} experience</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="md:text-right space-y-4">
                        <div className="flex items-center justify-end">
                          <DollarSign className="h-6 w-6 text-orange-400" />
                          <span className="text-3xl font-bold text-white">{provider.hourly_rate}</span>
                          <span className="text-gray-400 ml-1">/hr</span>
                        </div>
                        <div className="space-y-3">
                          <Button
                            onClick={() => handleContactProvider(provider.id)}
                            className="w-full md:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-glow"
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Contact Provider
                          </Button>

                          {hasActiveRequest(provider.id) ? (
                            <Button disabled className="w-full md:w-auto bg-gray-600 cursor-not-allowed">
                              <Send className="mr-2 h-4 w-4" />
                              Request Sent
                            </Button>
                          ) : (
                            <RequestServiceModal
                              providerId={provider.id}
                              providerName={`${provider.users?.first_name} ${provider.users?.last_name}`}
                              onRequestSent={handleRequestSent}
                            />
                          )}

                          <Button
                            onClick={() => handleViewProfile(provider.id)}
                            variant="outline"
                            className="w-full md:w-auto border-gray-700 text-gray-300 hover:bg-gray-800"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredProviders.length === 0 && (
              <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
                <CardContent className="p-12 text-center">
                  <Search className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No providers found</h3>
                  <p className="text-gray-400">Try adjusting your search criteria or browse all services</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

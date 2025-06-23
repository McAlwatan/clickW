"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Star, MapPin, Clock, DollarSign, MessageSquare, Globe, Phone, Mail } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { RequestServiceModal } from "@/components/request-service-modal"

export default function ProviderProfileView() {
  const router = useRouter()
  const params = useParams()
  const [provider, setProvider] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hasExistingRequest, setHasExistingRequest] = useState(false)

  useEffect(() => {
    document.documentElement.classList.add("dark")
    if (params.id) {
      fetchProviderData(params.id as string)
      fetchReviews(params.id as string)
      checkExistingRequest(params.id as string)
    }
  }, [params.id])

  const fetchProviderData = async (providerId: string) => {
    try {
      const { data, error } = await supabase
        .from("service_providers")
        .select(`
          *,
          users!service_providers_user_id_fkey(first_name, last_name, email)
        `)
        .eq("id", providerId)
        .single()

      if (error) throw error
      setProvider(data)
    } catch (error) {
      console.error("Error fetching provider data:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkExistingRequest = async (providerId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("service_requests")
        .select("id, status")
        .eq("provider_id", providerId)
        .eq("client_id", user.id)
        .in("status", ["pending", "accepted", "in_progress"])
        .limit(1)

      if (error) throw error
      setHasExistingRequest(data && data.length > 0)
    } catch (error) {
      console.error("Error checking existing request:", error)
    }
  }

  const fetchReviews = async (providerId: string) => {
    try {
      console.log("Fetching reviews for provider:", providerId)

      // Step 1: Get all service requests for this provider
      const { data: requests, error: requestsError } = await supabase
        .from("service_requests")
        .select("id")
        .eq("provider_id", providerId)

      if (requestsError) {
        console.error("Error fetching requests:", requestsError)
        setReviews([])
        return
      }

      if (!requests || requests.length === 0) {
        console.log("No requests found for provider")
        setReviews([])
        return
      }

      const requestIds = requests.map((req) => req.id)
      console.log("Found request IDs:", requestIds)

      // Step 2: Get reviews for those requests
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("*")
        .in("request_id", requestIds)
        .order("created_at", { ascending: false })

      if (reviewsError) {
        console.error("Error fetching reviews:", reviewsError)
        setReviews([])
        return
      }

      console.log("Reviews found:", reviewsData)

      // Step 3: Get user details for each review
      if (reviewsData && reviewsData.length > 0) {
        const clientIds = reviewsData.map((review) => review.client_id)
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, first_name, last_name")
          .in("id", clientIds)

        if (usersError) {
          console.error("Error fetching user data:", usersError)
          // Still show reviews without user names
          setReviews(reviewsData)
          return
        }

        // Step 4: Get request details
        const { data: requestsData, error: requestsDetailError } = await supabase
          .from("service_requests")
          .select("id, title")
          .in("id", requestIds)

        if (requestsDetailError) {
          console.error("Error fetching request details:", requestsDetailError)
        }

        // Combine the data
        const enrichedReviews = reviewsData.map((review) => ({
          ...review,
          client: usersData?.find((user) => user.id === review.client_id),
          service_request: requestsData?.find((req) => req.id === review.request_id),
        }))

        console.log("Enriched reviews:", enrichedReviews)
        setReviews(enrichedReviews)
      } else {
        setReviews([])
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
      setReviews([])
    }
  }

  const handleContactProvider = () => {
    router.push(`/client/messages?provider=${provider.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Provider not found</h2>
          <Button onClick={() => router.back()} variant="outline" className="border-gray-700 text-gray-300">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-8 ml-64">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="mb-4 border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
          <h1 className="text-4xl font-bold text-white">Service Provider Profile</h1>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-8">
                <div className="flex items-start space-x-6">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src="/placeholder.svg?height=128&width=128" alt={provider.users?.first_name} />
                    <AvatarFallback className="bg-orange-500 text-white text-3xl">
                      {provider.users?.first_name?.[0]}
                      {provider.users?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {provider.users?.first_name} {provider.users?.last_name}
                    </h2>
                    <p className="text-orange-400 font-medium text-xl mb-4">{provider.brand_name}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-400 mb-4">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="font-medium text-white">
                          {provider.rating > 0 ? provider.rating.toFixed(1) : "New"}
                        </span>
                        {provider.total_reviews > 0 && <span className="ml-1">({provider.total_reviews} reviews)</span>}
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
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Available</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed">{provider.description}</p>
              </CardContent>
            </Card>

            {/* Services */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Services Offered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {provider.services?.map((service: string) => (
                    <Badge key={service} variant="outline" className="border-gray-600 text-gray-300 px-3 py-1">
                      {service}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Client Reviews ({reviews.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <p className="text-gray-400">No reviews yet. Be the first to leave a review!</p>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-700 pb-4 last:border-b-0">
                        <div className="flex items-start space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-blue-500 text-white">
                              {review.client?.first_name?.[0] || "C"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-white font-medium">
                                {review.client?.first_name || "Anonymous"} {review.client?.last_name || ""}
                              </span>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-gray-400 text-sm">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {review.service_request?.title && (
                              <p className="text-gray-300 text-sm mb-1">Service: {review.service_request.title}</p>
                            )}
                            {review.comment && <p className="text-gray-300">{review.comment}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing & Contact */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="h-8 w-8 text-orange-400" />
                    <span className="text-4xl font-bold text-white">{provider.hourly_rate}</span>
                    <span className="text-gray-400 ml-1">/hr</span>
                  </div>
                  <p className="text-gray-400">Starting rate</p>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleContactProvider}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Contact Provider
                  </Button>

                  {hasExistingRequest ? (
                    <Button disabled className="w-full bg-gray-600 text-gray-300 cursor-not-allowed">
                      Request Sent
                    </Button>
                  ) : (
                    <RequestServiceModal
                      providerId={provider.id}
                      providerName={`${provider.users?.first_name} ${provider.users?.last_name}`}
                      onRequestSent={() => setHasExistingRequest(true)}
                    />
                  )}
                </div>

                <div className="space-y-3 text-sm mt-6">
                  <div className="flex items-center text-gray-300">
                    <Mail className="h-4 w-4 mr-3 text-gray-400" />
                    <span>{provider.users?.email}</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Phone className="h-4 w-4 mr-3 text-gray-400" />
                    <span>{provider.phone}</span>
                  </div>
                  {provider.website && (
                    <div className="flex items-center text-gray-300">
                      <Globe className="h-4 w-4 mr-3 text-gray-400" />
                      <a
                        href={provider.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-400 hover:text-orange-300 transition-colors"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Business Type</span>
                  <span className="text-white capitalize">{provider.business_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Availability</span>
                  <span className="text-white">{provider.availability || "Not specified"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Response Rate</span>
                  <span className="text-white">98%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Member Since</span>
                  <span className="text-white">{new Date(provider.created_at).getFullYear()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

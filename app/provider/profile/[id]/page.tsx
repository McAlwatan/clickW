"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Star, MapPin, Clock, DollarSign, MessageSquare, Globe, Phone, Mail } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ProviderProfileView() {
  const router = useRouter()
  const params = useParams()
  const [provider, setProvider] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.documentElement.classList.add("dark")
    if (params.id) {
      fetchProviderData(params.id as string)
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
      <div className="container mx-auto px-4 py-8">
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
            <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
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
            <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
              <CardHeader>
                <CardTitle className="text-white">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed">{provider.description}</p>
              </CardContent>
            </Card>

            {/* Services */}
            <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
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

            {/* Portfolio */}
            {provider.portfolio_links && provider.portfolio_links.length > 0 && (
              <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
                <CardHeader>
                  <CardTitle className="text-white">Portfolio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {provider.portfolio_links.map((link: string, index: number) => (
                      <a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-orange-400 hover:text-orange-300 transition-colors"
                      >
                        <Globe className="h-4 w-4 mr-2" />
                        {link}
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certifications */}
            {provider.certifications && (
              <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
                <CardHeader>
                  <CardTitle className="text-white">Certifications & Qualifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">{provider.certifications}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing & Contact */}
            <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="h-8 w-8 text-orange-400" />
                    <span className="text-4xl font-bold text-white">{provider.hourly_rate}</span>
                    <span className="text-gray-400 ml-1">/hr</span>
                  </div>
                  <p className="text-gray-400">Starting rate</p>
                </div>

                <Button
                  onClick={handleContactProvider}
                  className="w-full mb-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-glow"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contact Provider
                </Button>

                <div className="space-y-3 text-sm">
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
            <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
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

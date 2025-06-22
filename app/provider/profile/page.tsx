"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Settings,
  User,
  Star,
  MapPin,
  Globe,
  Phone,
  Mail,
  Edit,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/provider/dashboard" },
  { icon: MessageSquare, label: "Messages", href: "/provider/messages" },
  { icon: FileText, label: "Requests", href: "/provider/requests" },
  { icon: User, label: "Profile", href: "/provider/profile" },
  { icon: Settings, label: "Settings", href: "/provider/settings" },
]

export default function ProviderProfile() {
  const [userData, setUserData] = useState<any>(null)
  const [providerData, setProviderData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Get user data
      const { data: userRecord } = await supabase.from("users").select("*").eq("id", user.id).single()

      // Get provider data
      const { data: providerRecord } = await supabase
        .from("service_providers")
        .select("*")
        .eq("user_id", user.id)
        .single()

      setUserData(userRecord)
      setProviderData(providerRecord)
    } catch (error) {
      console.error("Error fetching profile data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Sidebar items={sidebarItems} userType="provider" />

      <div className="lg:ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">My Profile</h1>
              <p className="text-gray-400 text-lg">Your public service provider profile</p>
            </div>
            <Link href="/provider/setup">
              <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </Link>
          </div>

          <div className="space-y-6">
            {/* Profile Header */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-8">
                <div className="flex items-start space-x-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={userData?.profile_photo || "/placeholder.svg"} alt="Profile" />
                    <AvatarFallback className="bg-orange-500 text-white text-2xl">
                      {userData?.first_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {providerData?.brand_name || `${userData?.first_name} ${userData?.last_name}`}
                    </h2>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center space-x-1">
                        <Star className="h-5 w-5 text-yellow-400 fill-current" />
                        <span className="text-white font-medium">{providerData?.rating || 0}/5</span>
                        <span className="text-gray-400">({providerData?.total_reviews || 0} reviews)</span>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400">
                        {providerData?.business_type === "individual" ? "Individual" : "Team/Agency"}
                      </Badge>
                    </div>
                    <p className="text-gray-300 mb-4">{providerData?.description}</p>
                    <div className="flex items-center space-x-6 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {providerData?.city}, {providerData?.country}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="font-medium text-white">${providerData?.hourly_rate}/hr</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Services */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Services</CardTitle>
                <CardDescription className="text-gray-400">What I can help you with</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {providerData?.services?.map((service: string, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-orange-500/20 text-orange-400">
                      {service}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Experience & Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Experience</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-gray-400">Years of Experience:</span>
                    <span className="text-white ml-2">{providerData?.years_experience}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Availability:</span>
                    <span className="text-white ml-2">{providerData?.availability}</span>
                  </div>
                  {providerData?.certifications && (
                    <div>
                      <span className="text-gray-400">Certifications:</span>
                      <p className="text-white mt-1">{providerData.certifications}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-white">{userData?.email}</span>
                  </div>
                  {providerData?.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-white">{providerData.phone}</span>
                    </div>
                  )}
                  {providerData?.website && (
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <a
                        href={providerData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-400 hover:text-orange-300"
                      >
                        {providerData.website}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Portfolio */}
            {providerData?.portfolio_links && providerData.portfolio_links.length > 0 && (
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Portfolio</CardTitle>
                  <CardDescription className="text-gray-400">Examples of my work</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {providerData.portfolio_links.map((link: string, index: number) => (
                      <a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-orange-400 hover:text-orange-300 underline"
                      >
                        Portfolio Link {index + 1}
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

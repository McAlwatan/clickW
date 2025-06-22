"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/sidebar"
import { Search, MessageSquare, Send, MapPin, Mail, Calendar, Edit } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ClientProfile() {
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.documentElement.classList.add("dark")
    checkAuth()
    fetchUserData()
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

  const fetchUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single()

      if (error) throw error
      setUserData(data)
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setLoading(false)
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

      <div className="flex-1 lg:ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">My Profile</h1>
            <p className="text-gray-400 text-lg">View and manage your profile information</p>
          </div>

          <div className="space-y-6">
            {/* Profile Overview */}
            <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Profile Information</CardTitle>
                  <Button
                    onClick={() => router.push("/client/settings")}
                    variant="outline"
                    size="sm"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="/placeholder.svg?height=96&width=96" alt="Profile" />
                    <AvatarFallback className="bg-orange-500 text-white text-2xl">
                      {userData?.first_name?.[0] || "U"}
                      {userData?.last_name?.[0] || ""}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {userData?.first_name} {userData?.last_name}
                    </h3>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 mb-4">Client</Badge>

                    <div className="space-y-3">
                      <div className="flex items-center text-gray-300">
                        <Mail className="h-4 w-4 mr-3 text-gray-400" />
                        <span>{userData?.email}</span>
                      </div>

                      {userData?.location && (
                        <div className="flex items-center text-gray-300">
                          <MapPin className="h-4 w-4 mr-3 text-gray-400" />
                          <span>
                            {userData.location.city}, {userData.location.country}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center text-gray-300">
                        <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                        <span>Member since {new Date(userData?.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-orange-400 mb-2">0</div>
                  <div className="text-gray-400">Active Projects</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">0</div>
                  <div className="text-gray-400">Completed Projects</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">$0</div>
                  <div className="text-gray-400">Total Spent</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <CardDescription className="text-gray-400">Your latest actions on ClickWork</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No recent activity</p>
                  <p className="text-gray-500 text-sm mt-2">Start by finding and contacting service providers</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

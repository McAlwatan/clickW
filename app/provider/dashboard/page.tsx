"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Sidebar } from "@/components/sidebar"
import { Star, DollarSign, Clock, MessageSquare, TrendingUp, CheckCircle, Users, Settings } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ProviderDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [providerData, setProviderData] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [stats, setStats] = useState({
    totalEarnings: 0,
    activeProjects: 0,
    completedProjects: 0,
    rating: 0,
    profileViews: 0,
    responseRate: 98,
  })

  useEffect(() => {
    document.documentElement.classList.add("dark")
    checkAuth()
    fetchProviderData()
  }, [])

  const checkAuth = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
    } catch (error) {
      console.error("Auth check error:", error)
      router.push("/login")
    }
  }

  const fetchProviderData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Get user data first
      const { data: userRecord, error: userError } = await supabase.from("users").select("*").eq("id", user.id).single()

      if (userError) {
        console.error("User fetch error:", userError)
        router.push("/login")
        return
      }

      setUserData(userRecord)

      // Check if provider profile exists
      const { data: provider, error: providerError } = await supabase
        .from("service_providers")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (providerError || !provider) {
        // Provider hasn't completed setup - redirect to setup
        console.log("No provider profile found, redirecting to setup")
        router.push("/provider/setup")
        return
      }

      setProviderData(provider)

      // Fetch requests and calculate stats
      const { data: requests } = await supabase.from("requests").select("*").eq("provider_id", provider.id)

      if (requests) {
        const activeProjects = requests.filter((r) => r.status === "accepted" || r.status === "in_progress").length
        const completedProjects = requests.filter((r) => r.status === "completed").length
        const totalEarnings = requests.filter((r) => r.status === "completed").reduce((sum, r) => sum + r.budget, 0)

        setStats((prev) => ({
          ...prev,
          activeProjects,
          completedProjects,
          totalEarnings,
          rating: provider.rating || 0,
        }))
      }
    } catch (error) {
      console.error("Error fetching provider data:", error)
      router.push("/provider/setup")
    } finally {
      setLoading(false)
    }
  }

  const sidebarItems = [
    { icon: TrendingUp, label: "Dashboard", href: "/provider/dashboard" },
    { icon: MessageSquare, label: "Messages", href: "/provider/messages" },
    { icon: CheckCircle, label: "Requests", href: "/provider/requests" },
    { icon: Users, label: "Profile", href: "/provider/profile" },
    { icon: Settings, label: "Settings", href: "/provider/settings" },
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
      <Sidebar items={sidebarItems} userType="provider" />

      <div className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Welcome back, {userData?.first_name || "Provider"}!
                </h1>
                <p className="text-gray-400 text-lg">Here's what's happening with your freelance business</p>
              </div>
              <Avatar className="h-20 w-20">
                <AvatarImage src="/placeholder.svg?height=80&width=80" alt="Profile" />
                <AvatarFallback className="bg-orange-500 text-white text-xl">
                  {userData?.first_name?.[0] || "P"}
                  {userData?.last_name?.[0] || ""}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Total Earnings</p>
                    <p className="text-3xl font-bold text-white">Tsh{stats.totalEarnings.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-10 w-10 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Active Projects</p>
                    <p className="text-3xl font-bold text-white">{stats.activeProjects}</p>
                  </div>
                  <Clock className="h-10 w-10 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Rating</p>
                    <div className="flex items-center">
                      <p className="text-3xl font-bold text-white mr-2">{stats.rating || "New"}</p>
                      <Star className="h-6 w-6 text-yellow-400" />
                    </div>
                  </div>
                  <TrendingUp className="h-10 w-10 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Completed Projects</p>
                    <p className="text-3xl font-bold text-white">{stats.completedProjects}</p>
                  </div>
                  <CheckCircle className="h-10 w-10 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-gray-900/50 border-gray-800">
              <TabsTrigger value="overview" className="data-[state=active]:bg-orange-500">
                Overview
              </TabsTrigger>
              <TabsTrigger value="performance" className="data-[state=active]:bg-orange-500">
                Performance
              </TabsTrigger>
              <TabsTrigger value="profile" className="data-[state=active]:bg-orange-500">
                Profile
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Activity</CardTitle>
                    <CardDescription className="text-gray-400">Your latest business activities</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4 p-4 border border-gray-800 rounded-lg">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-white font-medium">Profile created successfully</p>
                        <p className="text-gray-400 text-sm">Welcome to ClickWork!</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
                  <CardHeader>
                    <CardTitle className="text-white">Quick Actions</CardTitle>
                    <CardDescription className="text-gray-400">Manage your freelance business</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        onClick={() => router.push("/provider/messages")}
                        className="p-4 border border-gray-800 rounded-lg hover:border-orange-500/50 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="h-8 w-8 text-orange-400 mb-2" />
                        <p className="text-white font-medium">Messages</p>
                        <p className="text-gray-400 text-sm">0 unread</p>
                      </div>
                      <div
                        onClick={() => router.push("/provider/requests")}
                        className="p-4 border border-gray-800 rounded-lg hover:border-orange-500/50 transition-colors cursor-pointer"
                      >
                        <CheckCircle className="h-8 w-8 text-green-400 mb-2" />
                        <p className="text-white font-medium">Requests</p>
                        <p className="text-gray-400 text-sm">0 pending</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
                  <CardHeader>
                    <CardTitle className="text-white">Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Response Rate</span>
                        <span className="font-semibold text-white">{stats.responseRate}%</span>
                      </div>
                      <Progress value={stats.responseRate} className="bg-gray-800" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Project Completion Rate</span>
                        <span className="font-semibold text-white">100%</span>
                      </div>
                      <Progress value={100} className="bg-gray-800" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Client Satisfaction</span>
                        <span className="font-semibold text-white">
                          {stats.rating > 0 ? `${stats.rating}/5` : "N/A"}
                        </span>
                      </div>
                      <Progress value={stats.rating > 0 ? (stats.rating / 5) * 100 : 0} className="bg-gray-800" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
                  <CardHeader>
                    <CardTitle className="text-white">Monthly Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Projects Completed</span>
                      <span className="font-semibold text-white">{stats.completedProjects}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">New Clients</span>
                      <span className="font-semibold text-white">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Revenue This Month</span>
                      <span className="font-semibold text-white">${stats.totalEarnings}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Profile Views</span>
                      <span className="font-semibold text-white">0</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
                <CardHeader>
                  <CardTitle className="text-white">Profile Information</CardTitle>
                  <CardDescription className="text-gray-400">Your public profile details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start space-x-6">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src="/placeholder.svg?height=96&width=96" alt="Profile" />
                      <AvatarFallback className="bg-orange-500 text-white text-2xl">
                        {userData?.first_name?.[0] || "P"}
                        {userData?.last_name?.[0] || ""}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {userData?.first_name || ""} {userData?.last_name || ""}
                      </h3>
                      <p className="text-orange-400 font-medium text-lg mb-3">
                        {providerData?.brand_name || "Brand Name"}
                      </p>
                      <p className="text-gray-300 mb-4">{providerData?.description || "No description available"}</p>
                      <div className="flex flex-wrap gap-2">
                        {providerData?.services?.map((service: string) => (
                          <Badge key={service} variant="outline" className="border-gray-600 text-gray-300">
                            {service}
                          </Badge>
                        )) || (
                          <Badge variant="outline" className="border-gray-600 text-gray-300">
                            No services listed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

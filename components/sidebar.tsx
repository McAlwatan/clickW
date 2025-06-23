"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Settings, LogOut, User } from "lucide-react"
import { supabase, getCurrentUser } from "@/lib/supabase"
import { ThemeToggle } from "@/components/theme-toggle"

interface SidebarItem {
  icon: any
  label: string
  href: string
  active?: boolean
}

interface SidebarProps {
  items: SidebarItem[]
  userType: "client" | "provider"
}

export function Sidebar({ items, userType }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [userData, setUserData] = useState<any>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [requestCount, setRequestCount] = useState(0)

  useEffect(() => {
    initializeSidebar()

    // Set up real-time subscriptions with error handling
    const channelName = `sidebar-${Date.now()}-${Math.random()}`
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => fetchUnreadMessages())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, () => fetchUnreadMessages())

    if (userType === "provider") {
      channel
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "service_requests" }, () =>
          fetchPendingRequests(),
        )
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "service_requests" }, () =>
          fetchPendingRequests(),
        )
    }

    channel.subscribe()

    // Update online status periodically
    const interval = setInterval(() => updateOnlineStatus(true), 30000)

    // Set offline when leaving
    const handleBeforeUnload = () => updateOnlineStatus(false)
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      updateOnlineStatus(false)
    }
  }, [userType])

  const initializeSidebar = async () => {
    try {
      await fetchUserData()
      await fetchUnreadMessages()
      if (userType === "provider") {
        await fetchPendingRequests()
      }
      await updateOnlineStatus(true)
    } catch (error) {
      console.error("Sidebar initialization error:", error)
    }
  }

  const updateOnlineStatus = async (isOnline: boolean) => {
    try {
      const user = await getCurrentUser()
      if (!user) return

      await supabase
        .from("users")
        .update({ is_online: isOnline, last_seen: new Date().toISOString() })
        .eq("id", user.id)
    } catch (error) {
      console.error("Error updating online status:", error)
    }
  }

  const fetchUserData = async () => {
    try {
      const user = await getCurrentUser()
      if (user) {
        const { data } = await supabase.from("users").select("*").eq("id", user.id).single()
        setUserData(data)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const fetchUnreadMessages = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) return

      const { data, error } = await supabase.from("messages").select("id").eq("receiver_id", user.id).eq("read", false)

      if (!error && data) {
        setUnreadCount(data.length)
      }
    } catch (error) {
      console.error("Error fetching unread messages:", error)
    }
  }

  const fetchPendingRequests = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) return

      // Get provider ID
      const { data: provider } = await supabase.from("service_providers").select("id").eq("user_id", user.id).single()

      if (!provider) return

      const { data, error } = await supabase
        .from("service_requests")
        .select("id")
        .eq("provider_id", provider.id)
        .eq("status", "pending")

      if (!error && data) {
        setRequestCount(data.length)
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error)
    }
  }

  const handleLogout = async () => {
    try {
      await updateOnlineStatus(false)
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/")
    }
  }

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gray-900/95 backdrop-blur-sm border-r border-gray-800">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">CW</span>
            </div>
            <span className="text-xl font-bold text-white">ClickWork</span>
          </Link>
          <Badge
            className={`mt-3 ${userType === "client" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-orange-500/20 text-orange-400 border-orange-500/30"}`}
          >
            {userType === "client" ? "Client" : "Service Provider"}
          </Badge>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {items.map((item, index) => {
              const isActive = pathname === item.href
              const isMessagesPage = item.href.includes("/messages")
              const isRequestsPage = item.href.includes("/requests")

              return (
                <li key={index}>
                  <Link href={item.href}>
                    <div
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 relative ${
                        isActive
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                          : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>

                      {/* Unread message notification dot */}
                      {isMessagesPage && unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{unreadCount > 9 ? "9+" : unreadCount}</span>
                        </div>
                      )}

                      {/* Pending requests notification dot */}
                      {isRequestsPage && userType === "provider" && requestCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{requestCount > 9 ? "9+" : requestCount}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center space-x-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
              <AvatarFallback className="bg-orange-500 text-white">
                {userData?.first_name?.[0] || "U"}
                {userData?.last_name?.[0] || ""}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">
                {userData ? `${userData.first_name} ${userData.last_name}` : "Loading..."}
              </p>
              <p className="text-gray-400 text-sm truncate">{userData?.email || ""}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-center mb-2">
              <ThemeToggle />
            </div>
            <Link href={`/${userType}/profile`}>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </Button>
            </Link>
            <Link href={`/${userType}/settings`}>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start border-gray-700 text-gray-300 hover:bg-gray-800"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/sidebar"
import { Search, MessageSquare, SendIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ClientMessages() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const channelRef = useRef<any>(null)

  useEffect(() => {
    document.documentElement.classList.add("dark")
    checkAuth()
    fetchConversations()
    fetchOnlineUsers()

    // Check if we need to start a conversation with a specific provider
    const providerId = searchParams.get("provider")
    if (providerId) {
      startConversationWithProvider(providerId)
    }

    // Create a unique channel name to avoid conflicts
    const channelName = `client-messages-${Date.now()}-${Math.random()}`

    // Clean up any existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    // Create new channel
    channelRef.current = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        fetchConversations()
        if (selectedConversation) {
          fetchMessages(selectedConversation.id)
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "users" }, () => {
        fetchOnlineUsers()
      })
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [searchParams])

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
      return
    }
    setCurrentUser(user)
  }

  const fetchOnlineUsers = async () => {
    try {
      const { data } = await supabase.from("users").select("id").eq("is_online", true)
      if (data) {
        setOnlineUsers(new Set(data.map((user) => user.id)))
      }
    } catch (error) {
      console.error("Error fetching online users:", error)
    }
  }

  const startConversationWithProvider = async (providerId: string) => {
    try {
      // Get provider details
      const { data: provider } = await supabase
        .from("service_providers")
        .select(`
          *,
          users!service_providers_user_id_fkey(first_name, last_name, email)
        `)
        .eq("id", providerId)
        .single()

      if (provider) {
        setSelectedConversation({
          id: provider.user_id,
          first_name: provider.users.first_name,
          last_name: provider.users.last_name,
          email: provider.users.email,
          provider_id: providerId,
        })
        fetchMessages(provider.user_id)
      }
    } catch (error) {
      console.error("Error starting conversation:", error)
    }
  }

  const fetchConversations = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Get all messages for this user
      const { data: messageData } = await supabase
        .from("messages")
        .select(`
          *,
          sender:users!messages_sender_id_fkey(first_name, last_name, email),
          receiver:users!messages_receiver_id_fkey(first_name, last_name, email)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false })

      if (messageData) {
        // Group messages by conversation partner
        const conversationMap = new Map()

        messageData.forEach((message) => {
          const partnerId = message.sender_id === user.id ? message.receiver_id : message.sender_id
          const partner = message.sender_id === user.id ? message.receiver : message.sender

          if (!conversationMap.has(partnerId)) {
            conversationMap.set(partnerId, {
              id: partnerId,
              first_name: partner?.first_name || "Unknown",
              last_name: partner?.last_name || "User",
              email: partner?.email || "",
              lastMessage: message.content,
              lastMessageTime: message.created_at,
              unreadCount: 0,
              messages: [],
            })
          }

          // Add message to conversation
          const conversation = conversationMap.get(partnerId)
          conversation.messages.push(message)

          // Count unread messages
          if (message.receiver_id === user.id && !message.read) {
            conversation.unreadCount++
          }

          // Update last message if this is more recent
          if (new Date(message.created_at) > new Date(conversation.lastMessageTime)) {
            conversation.lastMessage = message.content
            conversation.lastMessageTime = message.created_at
          }
        })

        // Convert to array and sort by last message time
        const conversationsArray = Array.from(conversationMap.values()).sort(
          (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime(),
        )

        setConversations(conversationsArray)
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (partnerId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("messages")
        .select(`
          *,
          sender:users!messages_sender_id_fkey(first_name, last_name),
          receiver:users!messages_receiver_id_fkey(first_name, last_name)
        `)
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`,
        )
        .order("created_at", { ascending: true })

      setMessages(data || [])

      // Mark messages as read
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("sender_id", partnerId)
        .eq("receiver_id", user.id)
        .eq("read", false)

      // Refresh conversations to update unread counts
      fetchConversations()
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser) return

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: currentUser.id,
        receiver_id: selectedConversation.id,
        content: newMessage.trim(),
        read: false,
      })

      if (error) throw error

      setNewMessage("")
      fetchMessages(selectedConversation.id)
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const sidebarItems = [
    { icon: Search, label: "Find Services", href: "/client/dashboard" },
    { icon: MessageSquare, label: "Messages", href: "/client/messages" },
    { icon: SendIcon, label: "My Requests", href: "/client/requests" },
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

      <div className="flex-1 lg:ml-64 flex">
        {/* Conversations List */}
        <div className="w-80 border-r border-gray-800 bg-gray-900/50">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-4">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Search conversations..." className="pl-10 bg-gray-800 border-gray-700 text-white" />
            </div>
          </div>

          <div className="overflow-y-auto h-full">
            {conversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No conversations yet</p>
                <p className="text-gray-500 text-sm mt-2">
                  Start messaging service providers to see conversations here
                </p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => {
                    setSelectedConversation(conversation)
                    fetchMessages(conversation.id)
                  }}
                  className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-gray-800/50 transition-colors relative ${
                    selectedConversation?.id === conversation.id ? "bg-gray-800/50 border-l-4 border-orange-500" : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src="/placeholder.svg?height=40&width=40" alt={conversation.first_name} />
                        <AvatarFallback className="bg-orange-500 text-white">
                          {conversation.first_name?.[0]}
                          {conversation.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online status indicator */}
                      {onlineUsers.has(conversation.id) && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-white font-medium truncate">
                          {conversation.first_name} {conversation.last_name}
                        </p>
                        {onlineUsers.has(conversation.id) && (
                          <Badge className="bg-green-500/20 text-green-400 text-xs">Online</Badge>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm truncate">{conversation.lastMessage}</p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-gray-800 bg-gray-900/50">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src="/placeholder.svg?height=40&width=40" alt={selectedConversation.first_name} />
                      <AvatarFallback className="bg-orange-500 text-white">
                        {selectedConversation.first_name?.[0]}
                        {selectedConversation.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    {onlineUsers.has(selectedConversation.id) && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      {selectedConversation.first_name} {selectedConversation.last_name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {onlineUsers.has(selectedConversation.id) ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === currentUser?.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_id === currentUser?.id ? "bg-orange-500 text-white" : "bg-gray-800 text-gray-100"
                      }`}
                    >
                      <p>{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender_id === currentUser?.id ? "text-orange-100" : "text-gray-400"
                        }`}
                      >
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-6 border-t border-gray-800 bg-gray-900/50">
                <div className="flex space-x-4">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-gray-800 border-gray-700 text-white"
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <Button
                    onClick={sendMessage}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  >
                    <SendIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Select a conversation</h3>
                <p className="text-gray-400">Choose a conversation from the sidebar to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LayoutDashboard, MessageSquare, FileText, Settings, User, Send, Search } from "lucide-react"
import { supabase } from "@/lib/supabase"

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/provider/dashboard" },
  { icon: MessageSquare, label: "Messages", href: "/provider/messages" },
  { icon: FileText, label: "Requests", href: "/provider/requests" },
  { icon: User, label: "Profile", href: "/provider/profile" },
  { icon: Settings, label: "Settings", href: "/provider/settings" },
]

export default function ProviderMessages() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    checkAuth()
    fetchConversations()

    // Create a unique channel name to avoid conflicts
    const channelName = `provider-messages-${Date.now()}-${Math.random()}`

    // Clean up any existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    // Create new channel
    channelRef.current = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchConversations()
          if (selectedConversation) {
            fetchMessages(selectedConversation.id)
          }
        },
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

  const checkAuth = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUser(user)
    } catch (error) {
      console.error("Error checking auth:", error)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Sidebar items={sidebarItems} userType="provider" />

      <div className="lg:ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Messages</h1>
            <p className="text-gray-400 text-lg">Communicate with your clients</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* Conversations List */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Conversations</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search conversations..."
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-center text-gray-500">Loading...</div>
                  ) : conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No messages yet</div>
                  ) : (
                    conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`p-4 cursor-pointer hover:bg-gray-800/50 transition-colors relative ${
                          selectedConversation?.id === conversation.id ? "bg-gray-800/50" : ""
                        }`}
                        onClick={() => {
                          setSelectedConversation(conversation)
                          fetchMessages(conversation.id)
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-orange-500 text-white">
                              {conversation.first_name?.[0] || "U"}
                              {conversation.last_name?.[0] || ""}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">
                              {conversation.first_name} {conversation.last_name}
                            </p>
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
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="lg:col-span-2 bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">
                  {selectedConversation
                    ? `${selectedConversation.first_name} ${selectedConversation.last_name}`
                    : "Select a conversation"}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col h-96">
                {selectedConversation ? (
                  <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_id === currentUser?.id ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender_id === currentUser?.id
                                ? "bg-orange-500 text-white"
                                : "bg-gray-800 text-gray-100"
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
                    <div className="flex space-x-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="bg-gray-800 border-gray-700 text-white"
                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      />
                      <Button
                        onClick={sendMessage}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500">Select a conversation to start messaging</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

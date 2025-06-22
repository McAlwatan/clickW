"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { LayoutDashboard, MessageSquare, FileText, Settings, User, Upload, Save } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { ThemeToggle } from "@/components/theme-toggle"

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/provider/dashboard" },
  { icon: MessageSquare, label: "Messages", href: "/provider/messages" },
  { icon: FileText, label: "Requests", href: "/provider/requests" },
  { icon: User, label: "Profile", href: "/provider/profile" },
  { icon: Settings, label: "Settings", href: "/provider/settings" },
]

export default function ProviderSettings() {
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [profilePhoto, setProfilePhoto] = useState<string>("")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
    notifications: {
      email: true,
      push: true,
      marketing: false,
    },
  })

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase.from("users").select("*").eq("id", user.id).single()

      if (data) {
        setUserData(data)
        setFormData({
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          bio: data.bio || "",
          notifications: {
            email: data.email_notifications ?? true,
            push: data.push_notifications ?? true,
            marketing: data.marketing_notifications ?? false,
          },
        })
        setProfilePhoto(data.profile_photo || "")
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}.${fileExt}`
      const filePath = `profile-photos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-photos").getPublicUrl(filePath)

      setProfilePhoto(publicUrl)

      // Update user record
      await supabase.from("users").update({ profile_photo: publicUrl }).eq("id", user.id)
    } catch (error) {
      console.error("Error uploading photo:", error)
      alert("Error uploading photo. Please try again.")
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from("users")
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          bio: formData.bio,
          email_notifications: formData.notifications.email,
          push_notifications: formData.notifications.push,
          marketing_notifications: formData.notifications.marketing,
        })
        .eq("id", user.id)

      if (error) throw error

      alert("Settings saved successfully!")
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("Error saving settings. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Sidebar items={sidebarItems} userType="provider" />

      <div className="lg:ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
            <p className="text-gray-400 text-lg">Manage your account preferences</p>
          </div>

          <div className="space-y-6">
            {/* Profile Photo */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Profile Photo</CardTitle>
                <CardDescription className="text-gray-400">
                  Upload a professional photo to help clients recognize you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profilePhoto || "/placeholder.svg"} alt="Profile" />
                    <AvatarFallback className="bg-orange-500 text-white text-2xl">
                      {userData?.first_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Label htmlFor="photo-upload" className="cursor-pointer">
                      <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Photo
                      </Button>
                    </Label>
                    <Input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    <p className="text-gray-500 text-sm mt-2">JPG, PNG or GIF. Max size 5MB.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Personal Information</CardTitle>
                <CardDescription className="text-gray-400">Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-gray-300">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-gray-300">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={formData.email}
                    disabled
                    className="bg-gray-800 border-gray-700 text-gray-400"
                  />
                  <p className="text-gray-500 text-sm">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-300">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-gray-300">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                    placeholder="Tell clients about yourself..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Notifications</CardTitle>
                <CardDescription className="text-gray-400">Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Email Notifications</Label>
                    <p className="text-gray-500 text-sm">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={formData.notifications.email}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, email: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Push Notifications</Label>
                    <p className="text-gray-500 text-sm">Receive push notifications</p>
                  </div>
                  <Switch
                    checked={formData.notifications.push}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, push: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Marketing Emails</Label>
                    <p className="text-gray-500 text-sm">Receive marketing and promotional emails</p>
                  </div>
                  <Switch
                    checked={formData.notifications.marketing}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, marketing: checked },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Theme */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Appearance</CardTitle>
                <CardDescription className="text-gray-400">Customize your interface appearance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Theme</Label>
                    <p className="text-gray-500 text-sm">Switch between light and dark mode</p>
                  </div>
                  <ThemeToggle />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

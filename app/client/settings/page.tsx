"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sidebar } from "@/components/sidebar"
import { Search, MessageSquare, Send, Save, AlertCircle, CheckCircle, MapPin, Mail, User, Camera } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ClientSettings() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [userData, setUserData] = useState<any>(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [profilePhoto, setProfilePhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>("")

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
      setFormData({
        firstName: data.first_name || "",
        lastName: data.last_name || "",
        email: data.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const updateProfile = async () => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Update user data in our users table
      const { error: updateError } = await supabase
        .from("users")
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
        })
        .eq("id", user.id)

      if (updateError) throw updateError

      // Update email in auth if changed
      if (formData.email !== userData.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email,
        })
        if (emailError) throw emailError
      }

      setSuccess("Profile updated successfully!")
      fetchUserData()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords don't match!")
      return
    }

    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters long!")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword,
      })

      if (error) throw error

      setSuccess("Password updated successfully!")
      setFormData({
        ...formData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const requestLocationUpdate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords

          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
            )
            const data = await response.json()

            const {
              data: { user },
            } = await supabase.auth.getUser()
            if (user) {
              await supabase
                .from("users")
                .update({
                  location: {
                    latitude,
                    longitude,
                    city: data.city || data.locality,
                    country: data.countryName,
                  },
                })
                .eq("id", user.id)

              setSuccess("Location updated successfully!")
              fetchUserData()
            }
          } catch (error) {
            setError("Failed to update location")
          }
        },
        (error) => {
          setError("Location access denied")
        },
      )
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfilePhoto(file)
      const reader = new FileReader()
      reader.onload = (e) => setPhotoPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const sidebarItems = [
    { icon: Search, label: "Find Services", href: "/client/dashboard" },
    { icon: MessageSquare, label: "Messages", href: "/client/messages" },
    { icon: Send, label: "My Requests", href: "/client/requests" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex">
      <Sidebar items={sidebarItems} userType="client" />

      <div className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
            <p className="text-gray-400 text-lg">Manage your account settings and preferences</p>
          </div>

          {error && (
            <Alert className="mb-6 bg-red-500/10 border-red-500/20 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 bg-green-500/10 border-green-500/20 text-green-400">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {/* Profile Information */}
            <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
              <CardHeader>
                <CardTitle className="text-white">Profile Information</CardTitle>
                <CardDescription className="text-gray-400">Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-gray-300">
                      First Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="firstName"
                        className="pl-10 bg-gray-800 border-gray-700 text-white"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-gray-300">
                      Last Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="lastName"
                        className="pl-10 bg-gray-800 border-gray-700 text-white"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10 bg-gray-800 border-gray-700 text-white"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <Button
                  onClick={updateProfile}
                  disabled={loading}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? "Saving..." : "Save Profile"}
                </Button>
              </CardContent>
            </Card>

            {/* Profile Photo */}
            <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
              <CardHeader>
                <CardTitle className="text-white">Profile Photo</CardTitle>
                <CardDescription className="text-gray-400">Upload your profile picture</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                    {photoPreview || userData?.profile_photo ? (
                      <img
                        src={photoPreview || userData?.profile_photo}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <input type="file" id="photo" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    <Button
                      onClick={() => document.getElementById("photo")?.click()}
                      variant="outline"
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Upload Photo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location Settings */}
            <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
              <CardHeader>
                <CardTitle className="text-white">Location Settings</CardTitle>
                <CardDescription className="text-gray-400">
                  Update your location to find nearby service providers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Current Location</p>
                    <p className="text-gray-400 text-sm">
                      {userData?.location
                        ? `${userData.location.city}, ${userData.location.country}`
                        : "No location set"}
                    </p>
                  </div>
                  <Button
                    onClick={requestLocationUpdate}
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Update Location
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Password Settings */}
            <Card className="bg-gray-900/50 border-gray-800 shadow-dark">
              <CardHeader>
                <CardTitle className="text-white">Change Password</CardTitle>
                <CardDescription className="text-gray-400">Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-gray-300">
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-300">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    className="bg-gray-800 border-gray-700 text-white"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                </div>

                <Button
                  onClick={updatePassword}
                  disabled={loading || !formData.newPassword || !formData.confirmPassword}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

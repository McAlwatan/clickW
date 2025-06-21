"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Mail, Lock, MapPin, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [showLocationPrompt, setShowLocationPrompt] = useState(false)
  const [userType, setUserType] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [message, setMessage] = useState<string>("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })

  useEffect(() => {
    document.documentElement.classList.add("dark")
    const urlMessage = searchParams.get("message")
    if (urlMessage) {
      setMessage(urlMessage)
    }
  }, [searchParams])

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords

          // Get city name from coordinates
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
            )
            const data = await response.json()

            // Update user location in database
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
            }

            // Redirect to appropriate dashboard
            if (userType === "client") {
              router.push("/client/dashboard")
            } else {
              router.push("/provider/dashboard")
            }
          } catch (error) {
            console.error("Error getting location:", error)
            // Redirect anyway
            if (userType === "client") {
              router.push("/client/dashboard")
            } else {
              router.push("/provider/dashboard")
            }
          }
        },
        (error) => {
          console.error("Location error:", error)
          // Redirect without location
          if (userType === "client") {
            router.push("/client/dashboard")
          } else {
            router.push("/provider/dashboard")
          }
        },
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // First, try to sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        console.error("Auth error:", authError)

        // Provide more specific error messages
        if (authError.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please check your credentials and try again.")
        } else if (authError.message.includes("Email not confirmed")) {
          setError("Please check your email and confirm your account before signing in.")
        } else {
          setError(authError.message)
        }
        return
      }

      if (authData.user) {
        // Wait a moment for the session to be established
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Check if user exists in our users table
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("user_type, first_name, last_name")
          .eq("id", authData.user.id)

        if (userError) {
          console.error("User lookup error:", userError)
          setError("Error accessing user data. Please try again.")
          return
        }

        // Handle multiple or no rows
        if (!userData || userData.length === 0) {
          setError("Account not found in our system. Please complete your registration first.")
          await supabase.auth.signOut()
          return
        }

        if (userData.length > 1) {
          console.error("Multiple user records found for:", authData.user.id)
          setError("Multiple accounts found. Please contact support.")
          await supabase.auth.signOut()
          return
        }

        const user = userData[0]
        if (user) {
          setUserType(user.user_type)

          // Show location prompt for clients
          if (user.user_type === "client") {
            setShowLocationPrompt(true)
          } else {
            router.push("/provider/dashboard")
          }
        }
      }
    } catch (error: any) {
      console.error("Login error:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (showLocationPrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900/50 border-gray-800 shadow-dark">
          <CardHeader className="text-center">
            <MapPin className="h-16 w-16 text-orange-400 mx-auto mb-4" />
            <CardTitle className="text-2xl text-white">Share Your Location</CardTitle>
            <CardDescription className="text-gray-400">
              Help us find the best service providers near you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={requestLocation}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              <MapPin className="mr-2 h-4 w-4" />
              Allow Location Access
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/client/dashboard")}
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Skip for Now
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900/50 border-gray-800 shadow-dark">
        <CardHeader className="text-center">
          <Link
            href="/"
            className="inline-flex items-center text-orange-400 hover:text-orange-300 mb-4 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
          <CardTitle className="text-3xl text-white mb-2">Welcome Back</CardTitle>
          <CardDescription className="text-gray-400 text-lg">Sign in to your FreelanceHub account</CardDescription>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className="mb-6 bg-green-500/10 border-green-500/20 text-green-400">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-6 bg-red-500/10 border-red-500/20 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="password"
                  type="password"
                  className="pl-10 bg-gray-800 border-gray-700 text-white"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  className="rounded bg-gray-800 border-gray-700"
                />
                <Label htmlFor="remember" className="text-sm text-gray-400">
                  Remember me
                </Label>
              </div>
              <Link href="/forgot-password" className="text-sm text-orange-400 hover:text-orange-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-glow"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-400">
              {"Don't have an account? "}
              <Link href="/register" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </div>

          {/* Debug Info - Remove in production */}
          <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">Debug Info:</p>
            <p className="text-xs text-gray-400">
              If you just registered, make sure you completed the registration process successfully.
            </p>
            <p className="text-xs text-gray-400 mt-1">Try registering again if you're having issues.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
